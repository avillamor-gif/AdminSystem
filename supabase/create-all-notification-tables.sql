-- ============================================================
-- Run this ONCE in the Supabase SQL Editor
-- Creates all notification tables needed for the bell icon
-- ============================================================

-- Leave Request Notifications
CREATE TABLE IF NOT EXISTS leave_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE leave_request_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leave_notif_select" ON leave_request_notifications;
DROP POLICY IF EXISTS "leave_notif_insert" ON leave_request_notifications;
DROP POLICY IF EXISTS "leave_notif_update" ON leave_request_notifications;
CREATE POLICY "leave_notif_select" ON leave_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "leave_notif_insert" ON leave_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leave_notif_update" ON leave_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_leave_notif_recipient
  ON leave_request_notifications (recipient_user_id, is_read, created_at DESC);

-- Travel Request Notifications
CREATE TABLE IF NOT EXISTS travel_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES travel_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE travel_request_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "travel_notif_select" ON travel_request_notifications;
DROP POLICY IF EXISTS "travel_notif_insert" ON travel_request_notifications;
DROP POLICY IF EXISTS "travel_notif_update" ON travel_request_notifications;
CREATE POLICY "travel_notif_select" ON travel_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "travel_notif_insert" ON travel_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "travel_notif_update" ON travel_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_travel_notif_recipient
  ON travel_request_notifications (recipient_user_id, is_read, created_at DESC);

-- Publication Request Notifications
CREATE TABLE IF NOT EXISTS publication_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES publication_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE publication_request_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pub_notif_select" ON publication_request_notifications;
DROP POLICY IF EXISTS "pub_notif_insert" ON publication_request_notifications;
DROP POLICY IF EXISTS "pub_notif_update" ON publication_request_notifications;
CREATE POLICY "pub_notif_select" ON publication_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "pub_notif_insert" ON publication_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pub_notif_update" ON publication_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_pub_notif_recipient
  ON publication_request_notifications (recipient_user_id, is_read, created_at DESC);

-- Equipment (Asset) Request Notifications
CREATE TABLE IF NOT EXISTS equipment_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES asset_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE equipment_request_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "equip_notif_select" ON equipment_request_notifications;
DROP POLICY IF EXISTS "equip_notif_insert" ON equipment_request_notifications;
DROP POLICY IF EXISTS "equip_notif_update" ON equipment_request_notifications;
CREATE POLICY "equip_notif_select" ON equipment_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "equip_notif_insert" ON equipment_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "equip_notif_update" ON equipment_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_equip_notif_recipient
  ON equipment_request_notifications (recipient_user_id, is_read, created_at DESC);

-- Supply Request Notifications
CREATE TABLE IF NOT EXISTS supply_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES supply_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE supply_request_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supply_notif_select" ON supply_request_notifications;
DROP POLICY IF EXISTS "supply_notif_insert" ON supply_request_notifications;
DROP POLICY IF EXISTS "supply_notif_update" ON supply_request_notifications;
CREATE POLICY "supply_notif_select" ON supply_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "supply_notif_insert" ON supply_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "supply_notif_update" ON supply_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_supply_notif_recipient
  ON supply_request_notifications (recipient_user_id, is_read, created_at DESC);
