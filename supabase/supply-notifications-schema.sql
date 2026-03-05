-- ============================================================
-- Supply Request Notifications Table
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS supply_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,          -- auth.users.id of who should see it
  type VARCHAR(50) NOT NULL,                -- 'new_request' | 'approved' | 'rejected' | 'fulfilled' | 'pending_fulfillment'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES supply_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE supply_request_notifications ENABLE ROW LEVEL SECURITY;

-- Each user can only read their own notifications
CREATE POLICY "supply_notif_select" ON supply_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());

-- Authenticated users can insert notifications
CREATE POLICY "supply_notif_insert" ON supply_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Users can mark their own as read
CREATE POLICY "supply_notif_update" ON supply_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());

CREATE INDEX idx_supply_notif_recipient ON supply_request_notifications(recipient_user_id, is_read, created_at DESC);
