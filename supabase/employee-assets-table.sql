-- Create employee_assets table for tracking company assets assigned to employees
CREATE TABLE IF NOT EXISTS employee_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('laptop', 'desktop', 'phone', 'tablet', 'monitor', 'keyboard', 'mouse', 'headset', 'access_card', 'parking_pass', 'keys', 'uniform', 'tools', 'vehicle', 'other')),
  asset_name VARCHAR(255) NOT NULL,
  asset_number VARCHAR(100),
  serial_number VARCHAR(100),
  description TEXT,
  
  -- Assignment details
  assigned_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'returned', 'lost', 'damaged', 'retired')),
  condition_on_assignment VARCHAR(50) DEFAULT 'good' CHECK (condition_on_assignment IN ('new', 'good', 'fair', 'poor')),
  condition_on_return VARCHAR(50) CHECK (condition_on_return IN ('new', 'good', 'fair', 'poor', 'damaged', 'lost')),
  
  -- Financial
  purchase_value DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  
  -- Return tracking
  returned_to UUID REFERENCES employees(id),
  return_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_employee_assets_employee ON employee_assets(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_assets_status ON employee_assets(status);
CREATE INDEX IF NOT EXISTS idx_employee_assets_type ON employee_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_employee_assets_assigned_date ON employee_assets(assigned_date);

-- Enable RLS
ALTER TABLE employee_assets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read employee assets" ON employee_assets;
DROP POLICY IF EXISTS "Allow authenticated users to insert employee assets" ON employee_assets;
DROP POLICY IF EXISTS "Allow authenticated users to update employee assets" ON employee_assets;
DROP POLICY IF EXISTS "Allow authenticated users to delete employee assets" ON employee_assets;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read employee assets"
  ON employee_assets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert employee assets"
  ON employee_assets FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update employee assets"
  ON employee_assets FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete employee assets"
  ON employee_assets FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employee_assets_updated_at ON employee_assets;

CREATE TRIGGER update_employee_assets_updated_at
  BEFORE UPDATE ON employee_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_assets_updated_at();

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'employee_assets'
  ) THEN
    RAISE NOTICE 'Table employee_assets created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create employee_assets table';
  END IF;
END $$;
