-- =====================================================
-- Asset Locations Table
-- Room/area locations for asset tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS asset_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE asset_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asset_locations_select" ON asset_locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "asset_locations_insert" ON asset_locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "asset_locations_update" ON asset_locations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "asset_locations_delete" ON asset_locations
  FOR DELETE USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_asset_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER asset_locations_updated_at
  BEFORE UPDATE ON asset_locations
  FOR EACH ROW EXECUTE FUNCTION update_asset_locations_updated_at();

-- Add location_id FK to assets table (keeps existing text location column for backward compat)
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES asset_locations(id) ON DELETE SET NULL;
