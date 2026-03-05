-- Add employment detail fields to employees table

-- Employment Status field (text field for Active, On Leave, Terminated, etc.)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);

-- Job Specification field (foreign key to job_titles table)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS job_specification_id UUID REFERENCES job_titles(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_job_specification_id ON employees(job_specification_id);

-- Note: employment_type_id, location_id, and job_title_id should already exist in employees table
-- If not, add them:
-- ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type_id UUID REFERENCES employment_types(id);
-- ALTER TABLE employees ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);
-- ALTER TABLE employees ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES job_titles(id);
