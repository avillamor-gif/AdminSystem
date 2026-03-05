-- Add contact information fields to employees table

-- Address fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS address_line_1 VARCHAR(255);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS state_province VARCHAR(100);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Telephone fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS work_phone VARCHAR(50);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(50);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS home_phone VARCHAR(50);

-- Email fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS work_email VARCHAR(255);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS personal_email VARCHAR(255);

-- Add indexes for commonly searched fields
CREATE INDEX IF NOT EXISTS idx_employees_city ON employees(city);
CREATE INDEX IF NOT EXISTS idx_employees_postal_code ON employees(postal_code);
CREATE INDEX IF NOT EXISTS idx_employees_work_email ON employees(work_email);
CREATE INDEX IF NOT EXISTS idx_employees_mobile_phone ON employees(mobile_phone);
