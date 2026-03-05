-- Clean database and setup auto-generated employee IDs based on hire date
-- Pattern: hire_date October 1, 2019 = employee_id 20191001

-- Step 1: Delete all employees except avillamor (admin)
DELETE FROM employees 
WHERE email != 'avillamor@iboninternational.org';

-- Step 2: Delete user_roles for deleted employees
DELETE FROM user_roles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'avillamor@iboninternational.org'
);

-- Step 3: Delete Supabase Auth users except avillamor
-- Note: This requires admin access to auth.users table
-- You may need to do this manually in Supabase Dashboard > Authentication > Users

-- Step 4: Update avillamor's employee_id to use the new pattern
UPDATE employees 
SET employee_id = TO_CHAR(hire_date, 'YYYYMMDD')
WHERE email = 'avillamor@iboninternational.org';

-- Step 5: Create a function to auto-generate employee_id based on hire_date
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TRIGGER AS $$
DECLARE
  base_id TEXT;
  sequence_num INTEGER := 1;
  new_id TEXT;
BEGIN
  -- Generate base ID from hire date (YYYYMMDD format)
  base_id := TO_CHAR(NEW.hire_date, 'YYYYMMDD');
  
  -- Check if this ID already exists and add sequence number if needed
  LOOP
    IF sequence_num = 1 THEN
      new_id := base_id;
    ELSE
      new_id := base_id || LPAD(sequence_num::TEXT, 2, '0');
    END IF;
    
    -- Check if this ID exists
    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = new_id AND id != NEW.id) THEN
      EXIT;
    END IF;
    
    sequence_num := sequence_num + 1;
  END LOOP;
  
  NEW.employee_id := new_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-generate employee_id on insert
DROP TRIGGER IF EXISTS auto_generate_employee_id ON employees;
CREATE TRIGGER auto_generate_employee_id
  BEFORE INSERT ON employees
  FOR EACH ROW
  WHEN (NEW.employee_id IS NULL OR NEW.employee_id = '')
  EXECUTE FUNCTION generate_employee_id();

-- Step 7: Also update on hire_date change
DROP TRIGGER IF EXISTS update_employee_id_on_hire_date_change ON employees;
CREATE TRIGGER update_employee_id_on_hire_date_change
  BEFORE UPDATE OF hire_date ON employees
  FOR EACH ROW
  WHEN (OLD.hire_date IS DISTINCT FROM NEW.hire_date)
  EXECUTE FUNCTION generate_employee_id();

-- Verification: Show remaining employees
SELECT 
  employee_id,
  first_name,
  last_name,
  email,
  hire_date,
  status
FROM employees
ORDER BY employee_id;

-- Show remaining auth users
SELECT 
  id,
  email,
  created_at
FROM auth.users
ORDER BY email;

-- Show remaining user_roles
SELECT 
  ur.user_id,
  ur.role,
  ur.employee_id,
  e.employee_id as emp_employee_id,
  au.email
FROM user_roles ur
LEFT JOIN employees e ON ur.employee_id = e.id
LEFT JOIN auth.users au ON ur.user_id = au.id;
