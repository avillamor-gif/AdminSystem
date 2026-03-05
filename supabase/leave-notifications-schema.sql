-- ============================================================
-- Leave Request Notifications Table
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,          -- auth.users.id of who should see it
  type VARCHAR(50) NOT NULL,                -- 'new_request' | 'approved' | 'rejected' | 'cancelled'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),              -- name of the employee who submitted
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leave_request_notifications ENABLE ROW LEVEL SECURITY;

-- Each user can only read their own notifications
CREATE POLICY "leave_notif_select" ON leave_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());

-- Authenticated users can insert notifications
CREATE POLICY "leave_notif_insert" ON leave_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Users can update (mark as read) only their own notifications
CREATE POLICY "leave_notif_update" ON leave_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());

-- Index for fast unread lookups
CREATE INDEX IF NOT EXISTS idx_leave_notif_recipient
  ON leave_request_notifications (recipient_user_id, is_read, created_at DESC);
