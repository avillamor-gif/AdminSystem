-- Safely sync Supabase Auth users to employee records
-- Only creates employee records for auth users who don't have one yet
-- Preserves existing employee data and IDs

-- Step 1: Check which auth users don't have employee records yet
SELECT 
  au.id as user_id,
  au.email,
  CASE WHEN e.id IS NULL THEN 'MISSING EMPLOYEE' ELSE 'HAS EMPLOYEE' END as status
FROM auth.users au
LEFT JOIN employees e ON au.email = e.email
ORDER BY au.email;

-- Step 2: Get the next available employee ID number
SELECT 
  COALESCE(
    MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)) + 1,
    1
  ) as next_employee_number
FROM employees
WHERE employee_id ~ '^EMP[0-9]+$';

-- Step 3: Insert missing employees with auto-incremented IDs
-- This will only create records for auth users without employees
WITH next_id AS (
  SELECT COALESCE(
    MAX(CAST(SUBSTRING(employee_id FROM 4) AS INTEGER)),
    0
  ) as current_max
  FROM employees
  WHERE employee_id ~ '^EMP[0-9]+$'
),
missing_users AS (
  SELECT 
    au.id as user_id,
    au.email,
    au.raw_user_meta_data->>'display_name' as display_name,
    ROW_NUMBER() OVER (ORDER BY au.created_at) as row_num
  FROM auth.users au
  LEFT JOIN employees e ON au.email = e.email
  WHERE e.id IS NULL
)
INSERT INTO employees (
  employee_id,
  first_name,
  last_name,
  email,
  hire_date,
  status,
  work_location_type
)
SELECT 
  'EMP' || LPAD((next_id.current_max + mu.row_num)::text, 3, '0'),
  COALESCE(
    SPLIT_PART(mu.display_name, ' ', 1),
    SPLIT_PART(SPLIT_PART(mu.email, '@', 1), '.', 1)
  ),
  COALESCE(
    SPLIT_PART(mu.display_name, ' ', 2),
    SPLIT_PART(SPLIT_PART(mu.email, '@', 1), '.', 2)
  ),
  mu.email,
  CURRENT_DATE,
  'active',
  'office'
FROM missing_users mu
CROSS JOIN next_id;

-- Step 4: Link all auth users to their employee records via user_roles
-- Only creates user_roles for users who don't have one yet
INSERT INTO user_roles (user_id, role, employee_id)
SELECT 
  au.id as user_id,
  CASE 
    WHEN au.email = 'avillamor@iboninternational.org' THEN 'admin'::user_role
    WHEN au.email LIKE '%@iboninternational.org' THEN 'employee'::user_role
    ELSE 'employee'::user_role
  END as role,
  e.id as employee_id
FROM auth.users au
JOIN employees e ON au.email = e.email
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id
);

-- Step 5: Verify the results - show all users with their employee records
SELECT 
  au.email as auth_email,
  e.employee_id,
  e.first_name,
  e.last_name,
  e.email as employee_email,
  e.hire_date,
  e.status,
  ur.role,
  CASE WHEN ur.id IS NULL THEN 'NO ROLE' ELSE 'HAS ROLE' END as role_status
FROM auth.users au
LEFT JOIN employees e ON au.email = e.email
LEFT JOIN user_roles ur ON au.id = ur.user_id
ORDER BY e.employee_id NULLS LAST;
