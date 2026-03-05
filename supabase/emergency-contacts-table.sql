-- Create emergency_contacts table

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  home_phone VARCHAR(50),
  mobile_phone VARCHAR(50) NOT NULL,
  work_phone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_employee ON emergency_contacts(employee_id);

-- Enable RLS
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to emergency_contacts"
  ON emergency_contacts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access to emergency_contacts"
  ON emergency_contacts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
