-- Board of Trustees - Step 2: Add table changes and data
-- Run this AFTER Step 1 has been committed

-- Step 1: Add employment_type_id to employees table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'employees' AND column_name = 'employment_type_id'
  ) THEN
    ALTER TABLE employees 
    ADD COLUMN employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 2: Update employment_types category enum to include board_member
ALTER TABLE employment_types 
DROP CONSTRAINT IF EXISTS employment_types_category_check;

ALTER TABLE employment_types
ADD CONSTRAINT employment_types_category_check 
CHECK (category IN ('permanent', 'temporary', 'contract', 'intern', 'volunteer', 'consultant', 'board_member'));

-- Step 3: Insert Board of Trustees employment type
INSERT INTO employment_types (
  id,
  name,
  code,
  description,
  category,
  is_active,
  benefits,
  working_conditions,
  contract_details
) VALUES (
  uuid_generate_v4(),
  'Board of Trustees',
  'BOARD_TRUSTEE',
  'Member of the Board of Trustees - governance and oversight role, not involved in day-to-day operations',
  'board_member',
  true,
  '{"type": "governance", "attendance_fees": true, "insurance": true}',
  '{"meetings": "quarterly", "term_length": "3 years", "voting_rights": true}',
  '{"role": "trustee", "responsibilities": ["governance", "strategic oversight", "fiduciary duty"], "time_commitment": "quarterly meetings plus committee work"}'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  benefits = EXCLUDED.benefits,
  working_conditions = EXCLUDED.working_conditions,
  contract_details = EXCLUDED.contract_details;

-- Step 4: Create a view for Board members for easy access
CREATE OR REPLACE VIEW board_members AS
SELECT 
  e.*,
  et.name as employment_type_name,
  d.name as department_name,
  jt.title as job_title
FROM employees e
LEFT JOIN employment_types et ON e.employment_type_id = et.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN job_titles jt ON e.job_title_id = jt.id
WHERE et.category = 'board_member'
AND e.status = 'active';

-- Step 5: Add RLS policy for Board members (view-only access to their own profile)
CREATE POLICY "Board members can view own profile" ON employees FOR SELECT TO authenticated
USING (
  id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid() AND role = 'board_member')
);

COMMENT ON TABLE employment_types IS 'Employment type categories including Board of Trustees for governance roles';
COMMENT ON VIEW board_members IS 'Active Board of Trustees members for quick reference';
