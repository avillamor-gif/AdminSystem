-- Add missing employment-related columns to employees table

-- Add employment_type_id column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL;

-- Add employment_status column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS employment_status VARCHAR(50);

-- Add job_specification_id column if it doesn't exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS job_specification_id UUID REFERENCES job_titles(id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type_id);
CREATE INDEX IF NOT EXISTS idx_employees_employment_status ON employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_job_specification ON employees(job_specification_id);

-- Verify the columns were added
DO $$
BEGIN
  -- Check employment_type_id
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'employment_type_id'
  ) THEN
    RAISE NOTICE 'Column employment_type_id exists in employees table';
  ELSE
    RAISE EXCEPTION 'Column employment_type_id was not added to employees table';
  END IF;

  -- Check employment_status
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'employment_status'
  ) THEN
    RAISE NOTICE 'Column employment_status exists in employees table';
  ELSE
    RAISE EXCEPTION 'Column employment_status was not added to employees table';
  END IF;

  -- Check job_specification_id
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'job_specification_id'
  ) THEN
    RAISE NOTICE 'Column job_specification_id exists in employees table';
  ELSE
    RAISE EXCEPTION 'Column job_specification_id was not added to employees table';
  END IF;
END $$;
