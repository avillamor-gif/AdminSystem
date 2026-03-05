-- Create location_types table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS location_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_location_types_code ON location_types(code);
CREATE INDEX IF NOT EXISTS idx_location_types_active ON location_types(is_active);

-- Enable RLS
ALTER TABLE location_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read location types"
  ON location_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage location types"
  ON location_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Insert default location types
INSERT INTO location_types (name, code, description, is_active) VALUES
  ('Headquarters', 'headquarters', 'Main corporate headquarters location', true),
  ('Branch Office', 'branch_office', 'Branch office location', true),
  ('Regional Office', 'regional_office', 'Regional office serving multiple areas', true),
  ('Warehouse', 'warehouse', 'Storage and distribution facility', true),
  ('Retail Store', 'retail_store', 'Customer-facing retail location', true),
  ('Remote', 'remote', 'Remote work location', true),
  ('Other', 'other', 'Other type of location', true);
