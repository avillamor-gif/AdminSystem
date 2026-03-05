-- Add employment contract fields to employees table

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS contract_start_date DATE;

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS contract_end_date DATE;

-- Add indexes for contract date queries
CREATE INDEX IF NOT EXISTS idx_employees_contract_start ON employees(contract_start_date);
CREATE INDEX IF NOT EXISTS idx_employees_contract_end ON employees(contract_end_date);

-- Verify the columns were added
DO $$
BEGIN
  -- Check contract_start_date
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'contract_start_date'
  ) THEN
    RAISE NOTICE 'Column contract_start_date exists in employees table';
  ELSE
    RAISE EXCEPTION 'Column contract_start_date was not added to employees table';
  END IF;

  -- Check contract_end_date
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'employees' 
    AND column_name = 'contract_end_date'
  ) THEN
    RAISE NOTICE 'Column contract_end_date exists in employees table';
  ELSE
    RAISE EXCEPTION 'Column contract_end_date was not added to employees table';
  END IF;
END $$;
