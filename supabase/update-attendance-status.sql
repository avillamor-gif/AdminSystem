-- Migration: Update attendance_status enum to support detailed attendance types
-- Run this in Supabase SQL Editor

-- Step 1: Remove the default value first
ALTER TABLE attendance_records ALTER COLUMN status DROP DEFAULT;

-- Step 2: Convert column to TEXT temporarily
ALTER TABLE attendance_records ALTER COLUMN status TYPE TEXT;

-- Step 3: Drop the old enum type with CASCADE
DROP TYPE IF EXISTS attendance_status CASCADE;

-- Step 4: Create new enum with all attendance types
CREATE TYPE attendance_status AS ENUM (
  'present',
  'absent', 
  'late',
  'half_day',
  'on_leave',
  'work-onsite',
  'work-home',
  'work-offsite',
  'work-travel',
  'vacation',
  'sick',
  'days-off',
  'rest-day',
  'holiday'
);

-- Step 5: Update the column to use the new enum
ALTER TABLE attendance_records 
  ALTER COLUMN status TYPE attendance_status 
  USING status::attendance_status;

-- Step 6: Set default value back
ALTER TABLE attendance_records 
  ALTER COLUMN status SET DEFAULT 'present'::attendance_status;

-- Verify the change
COMMENT ON TYPE attendance_status IS 'Attendance status types: present, absent, late, half_day, on_leave, work-onsite, work-home, work-offsite, work-travel, vacation, sick, days-off, rest-day, holiday';
