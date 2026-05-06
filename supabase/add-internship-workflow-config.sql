-- ============================================================
-- Internship Enrollment Workflow Config & Notification Table
-- Run in Supabase SQL Editor
-- Safe to run multiple times (IF NOT EXISTS / ON CONFLICT)
-- ============================================================

-- 1. Create the internship_request_notifications table
CREATE TABLE IF NOT EXISTS internship_request_notifications (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID        NOT NULL,
  type              VARCHAR(50) NOT NULL,        -- 'new_request' | 'approved' | 'rejected'
  title             VARCHAR(255) NOT NULL,
  message           TEXT        NOT NULL,
  request_id        UUID,                        -- references program_enrollments.id
  requester_name    VARCHAR(255),
  is_read           BOOLEAN     DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE internship_request_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "internship_notif_select" ON internship_request_notifications;
DROP POLICY IF EXISTS "internship_notif_insert" ON internship_request_notifications;
DROP POLICY IF EXISTS "internship_notif_update" ON internship_request_notifications;

CREATE POLICY "internship_notif_select" ON internship_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());

CREATE POLICY "internship_notif_insert" ON internship_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "internship_notif_update" ON internship_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_internship_notif_recipient
  ON internship_request_notifications (recipient_user_id, is_read, created_at DESC);

-- 2. Add the workflow config row for internship enrollments
INSERT INTO workflow_configs
  (request_type, display_name, description, notification_table, notify_on_submit, notify_on_decision, approval_steps)
VALUES
  (
    'internship',
    'Internship / Volunteer Enrollment',
    'New intern or volunteer program enrollments submitted by HR',
    'internship_request_notifications',
    '["hr","ed"]',
    '[]',
    '[{"level":1,"approver_role":"hr","label":"HR Manager","timeout_days":3}]'
  )
ON CONFLICT (request_type) DO NOTHING;

-- 3. Verify
SELECT request_type, display_name, notify_on_submit, approval_steps
FROM workflow_configs
WHERE request_type = 'internship';
