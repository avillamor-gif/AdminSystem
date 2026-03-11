-- Migration: Update attendance_status enum to support all detailed attendance types
-- including work-travel, which is auto-seeded when a travel request is approved.
-- Run ONCE in the Supabase SQL Editor.
-- Safe to re-run: all steps are idempotent.

-- ── How attendance types work ────────────────────────────────────────────────
--
--  The `status` column stores only the 5 DB-level values below.
--  The actual UI attendance type (work-onsite, work-travel, vacation, etc.)
--  is stored as plain-text in the `notes` column:
--
--    notes: "work-travel: Work on Travel – Manila [travel_request_id:<uuid>]"
--
--  mapAttendanceTypeToStatus() in usePunchInOut.ts maps UI → DB:
--    work-onsite | work-home | work-offsite | work-travel  →  'present'
--    vacation | sick | days-off | rest-day                 →  'on_leave'
--
--  parseSessions() in the attendance calendar reads the notes column and
--  renders the correct label and colour for each UI type.
--
-- ────────────────────────────────────────────────────────────────────────────

-- ── Step 1: Drop the default so the column can be altered ────────────────────
ALTER TABLE attendance_records ALTER COLUMN status DROP DEFAULT;

-- ── Step 2: Cast column to TEXT so we can drop the old enum ──────────────────
ALTER TABLE attendance_records ALTER COLUMN status TYPE TEXT;

-- ── Step 3: Drop the old enum (CASCADE drops any dependent objects) ───────────
DROP TYPE IF EXISTS attendance_status CASCADE;

-- ── Step 4: Re-create enum with only the 5 real DB-level values ──────────────
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent',
  'late',
  'half_day',
  'on_leave'
);

-- ── Step 5: Normalise any rows where a UI type was mistakenly stored in status ─
-- (guards against old data where 'work-travel', 'vacation', etc. were stored directly)
UPDATE attendance_records SET status = 'present'
  WHERE status IN ('work-onsite','work-home','work-offsite','work-travel','holiday');
UPDATE attendance_records SET status = 'on_leave'
  WHERE status IN ('vacation','sick','days-off','rest-day');

-- ── Step 6: Re-apply the enum type ────────────────────────────────────────────
ALTER TABLE attendance_records
  ALTER COLUMN status TYPE attendance_status
  USING status::attendance_status;

-- ── Step 7: Restore default ────────────────────────────────────────────────────
ALTER TABLE attendance_records
  ALTER COLUMN status SET DEFAULT 'present'::attendance_status;

-- ── Step 8: Ensure UNIQUE(employee_id, date) exists ───────────────────────────
-- Required for upsert ON CONFLICT used by the travel seed-attendance API route.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'attendance_records'::regclass
      AND contype = 'u'
      AND conname = 'attendance_records_employee_id_date_key'
  ) THEN
    ALTER TABLE attendance_records
      ADD CONSTRAINT attendance_records_employee_id_date_key UNIQUE (employee_id, date);
  END IF;
END $$;

COMMENT ON TYPE attendance_status IS
  'DB-level attendance status. UI type (work-travel, vacation, etc.) is stored '
  'in the notes column and parsed by parseSessions() in the attendance calendar.';
