-- Create contract documents table for employee contracts
CREATE TABLE IF NOT EXISTS contract_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contract_documents_employee ON contract_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_created ON contract_documents(created_at DESC);

-- Enable RLS
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read contract documents"
  ON contract_documents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert contract documents"
  ON contract_documents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update contract documents"
  ON contract_documents FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete contract documents"
  ON contract_documents FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_contract_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_documents_updated_at
  BEFORE UPDATE ON contract_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_documents_updated_at();

-- Verify table creation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'contract_documents'
  ) THEN
    RAISE NOTICE 'Table contract_documents created successfully';
  ELSE
    RAISE EXCEPTION 'Failed to create contract_documents table';
  END IF;
END $$;
