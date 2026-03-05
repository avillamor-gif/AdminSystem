-- Job Categories Table
CREATE TABLE IF NOT EXISTS job_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  parent_id UUID REFERENCES job_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_job_categories_parent_id ON job_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_job_categories_is_active ON job_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_job_categories_code ON job_categories(code);

-- Insert default job categories
INSERT INTO job_categories (name, code, description, parent_id, is_active) VALUES
  ('Executive Leadership', 'EXEC', 'Senior executive positions including CEO, COO, CFO', NULL, true),
  ('Program Management', 'PROG', 'Program managers and coordinators', NULL, true),
  ('Technical & Specialized', 'TECH', 'Technical advisors, specialists, and consultants', NULL, true),
  ('Administrative Support', 'ADMIN', 'Administrative assistants, coordinators, and support staff', NULL, true),
  ('Finance & Accounting', 'FIN', 'Finance managers, accountants, and financial analysts', NULL, true),
  ('Human Resources', 'HR', 'HR managers, recruiters, and HR specialists', NULL, true),
  ('Operations', 'OPS', 'Operations managers and coordinators', NULL, true),
  ('Marketing & Communications', 'MKTG', 'Marketing managers and communications specialists', NULL, true)
ON CONFLICT (code) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_categories_updated_at
  BEFORE UPDATE ON job_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_job_categories_updated_at();
