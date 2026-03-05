-- Add personal detail fields to employees table

-- Add middle_name field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);

-- Add gender field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Add marital_status field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50);

-- Add nationality field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);

-- Add national_id field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS national_id VARCHAR(100);

-- Add voters_id field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS voters_id VARCHAR(100);

-- Add social_security_number field
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS social_security_number VARCHAR(100);

-- Add Philippine government ID fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS pagibig_number VARCHAR(50);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS philhealth_number VARCHAR(50);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS sss_number VARCHAR(50);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS tin_number VARCHAR(50);

-- Add driver's license fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS drivers_license_number VARCHAR(50);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS license_expiry_date DATE;

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_employees_middle_name ON employees(middle_name);
CREATE INDEX IF NOT EXISTS idx_employees_gender ON employees(gender);
CREATE INDEX IF NOT EXISTS idx_employees_nationality ON employees(nationality);
CREATE INDEX IF NOT EXISTS idx_employees_voters_id ON employees(voters_id);
CREATE INDEX IF NOT EXISTS idx_employees_pagibig_number ON employees(pagibig_number);
CREATE INDEX IF NOT EXISTS idx_employees_sss_number ON employees(sss_number);
CREATE INDEX IF NOT EXISTS idx_employees_tin_number ON employees(tin_number);

-- Create employee_attachments table
CREATE TABLE IF NOT EXISTS employee_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  description TEXT,
  uploaded_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for employee_attachments
CREATE INDEX IF NOT EXISTS idx_employee_attachments_employee_id ON employee_attachments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attachments_uploaded_by ON employee_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_employee_attachments_created_at ON employee_attachments(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_attachments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_attachments_updated_at
  BEFORE UPDATE ON employee_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_attachments_updated_at();
