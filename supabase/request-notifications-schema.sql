-- ============================================================
-- Request Notifications Tables (Travel, Publication, Equipment)
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ── Travel ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,   -- 'new_request' | 'approved' | 'rejected' | 'cancelled'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES travel_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE travel_request_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "travel_notif_select" ON travel_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "travel_notif_insert" ON travel_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "travel_notif_update" ON travel_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_travel_notif_recipient
  ON travel_request_notifications (recipient_user_id, is_read, created_at DESC);

-- ── Publication ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publication_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,   -- 'new_request' | 'approved' | 'rejected' | 'fulfilled'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES publication_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE publication_request_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pub_notif_select" ON publication_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "pub_notif_insert" ON publication_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pub_notif_update" ON publication_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_pub_notif_recipient
  ON publication_request_notifications (recipient_user_id, is_read, created_at DESC);

-- ── Equipment (Asset Requests) ────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_request_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,   -- 'new_request' | 'approved' | 'rejected' | 'fulfilled'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES asset_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  request_number VARCHAR(50),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE equipment_request_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip_notif_select" ON equipment_request_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "equip_notif_insert" ON equipment_request_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "equip_notif_update" ON equipment_request_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_equip_notif_recipient
  ON equipment_request_notifications (recipient_user_id, is_read, created_at DESC);
