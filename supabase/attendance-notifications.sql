-- ============================================================
-- Attendance Late Entry Notifications
-- Run ONCE in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_notifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id     UUID NOT NULL,
  type                  VARCHAR(50) NOT NULL,        -- 'late_entry'
  title                 VARCHAR(255) NOT NULL,
  message               TEXT NOT NULL,
  attendance_record_id  UUID REFERENCES attendance_records(id) ON DELETE CASCADE,
  requester_name        VARCHAR(255),
  entry_date            DATE,                        -- the date of the late entry for quick display
  is_read               BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_notif_select" ON attendance_notifications;
DROP POLICY IF EXISTS "attendance_notif_insert" ON attendance_notifications;
DROP POLICY IF EXISTS "attendance_notif_update" ON attendance_notifications;

CREATE POLICY "attendance_notif_select" ON attendance_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());

CREATE POLICY "attendance_notif_insert" ON attendance_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "attendance_notif_update" ON attendance_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_attendance_notif_recipient
  ON attendance_notifications (recipient_user_id, is_read, created_at DESC);
