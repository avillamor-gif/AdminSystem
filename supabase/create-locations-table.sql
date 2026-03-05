-- Create locations table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  location_type VARCHAR(50) NOT NULL DEFAULT 'branch_office' CHECK (location_type IN ('headquarters', 'branch_office', 'regional_office', 'warehouse', 'retail_store', 'remote', 'other')),
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  state_province VARCHAR(100),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(50),
  fax VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  employee_capacity INTEGER,
  operational_hours TEXT,
  timezone VARCHAR(100) DEFAULT 'UTC',
  established_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  is_headquarters BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_manager ON locations(manager_id);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can read locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Insert some sample locations
INSERT INTO locations (name, code, location_type, country, city, state_province, address_line1, status, is_headquarters) VALUES
  ('Headquarters', 'HQ-001', 'headquarters', 'United States', 'San Francisco', 'California', '123 Main St', 'active', true),
  ('New York Office', 'NY-001', 'branch_office', 'United States', 'New York', 'New York', '456 Broadway', 'active', false),
  ('London Office', 'LON-001', 'regional_office', 'United Kingdom', 'London', 'England', '789 Oxford Street', 'active', false);
