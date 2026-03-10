-- =====================================================
-- Employee Immigration Documents Table
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_immigration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('passport', 'visa')),
  document_number TEXT NOT NULL,
  issued_date DATE,
  expiry_date DATE,
  eligible_status TEXT,
  issued_by TEXT,
  eligible_review_date DATE,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast employee lookup
CREATE INDEX IF NOT EXISTS idx_employee_immigration_employee_id ON employee_immigration(employee_id);

-- RLS
ALTER TABLE employee_immigration ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all (HR/admin access)
CREATE POLICY "immigration_select" ON employee_immigration
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert
CREATE POLICY "immigration_insert" ON employee_immigration
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "immigration_update" ON employee_immigration
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "immigration_delete" ON employee_immigration
  FOR DELETE USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_employee_immigration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employee_immigration_updated_at
  BEFORE UPDATE ON employee_immigration
  FOR EACH ROW EXECUTE FUNCTION update_employee_immigration_updated_at();
