-- Drop table if exists to start fresh
DROP TABLE IF EXISTS employee_attachments CASCADE;

-- Create employee_attachments table for personal documents
CREATE TABLE employee_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- File details
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  mime_type VARCHAR(100),
  
  -- Metadata
  description TEXT,
  document_type VARCHAR(100), -- 'resume', 'certificate', 'id_document', 'medical', 'other'
  
  -- Tracking
  uploaded_by UUID REFERENCES employees(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_employee_attachments_employee ON employee_attachments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attachments_type ON employee_attachments(document_type);
CREATE INDEX IF NOT EXISTS idx_employee_attachments_uploaded ON employee_attachments(uploaded_at);

-- Enable RLS
ALTER TABLE employee_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read employee attachments" ON employee_attachments;
DROP POLICY IF EXISTS "Allow authenticated users to insert employee attachments" ON employee_attachments;
DROP POLICY IF EXISTS "Allow authenticated users to update employee attachments" ON employee_attachments;
DROP POLICY IF EXISTS "Allow authenticated users to delete employee attachments" ON employee_attachments;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read employee attachments"
  ON employee_attachments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert employee attachments"
  ON employee_attachments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update employee attachments"
  ON employee_attachments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete employee attachments"
  ON employee_attachments FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_employee_attachments_updated_at ON employee_attachments;

CREATE TRIGGER update_employee_attachments_updated_at
  BEFORE UPDATE ON employee_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_attachments_updated_at();

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'employee_attachments'
  ) THEN
    RAISE NOTICE 'Table employee_attachments created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create employee_attachments table';
  END IF;
END $$;
