-- Seed script to sync existing Supabase auth users with HRM system
-- Run this AFTER running schema.sql

-- Step 1: View all existing Supabase auth users
-- This will show you all users that need to be linked to employees
SELECT 
  id as user_id,
  email,
  created_at,
  raw_user_meta_data
FROM auth.users
ORDER BY created_at;

-- Step 2: Create employee records for all existing auth users
-- This will create employee records matching your auth users
-- Adjust first_name, last_name based on your users
INSERT INTO employees (
  employee_id,
  first_name,
  last_name,
  email,
  hire_date,
  status
)
SELECT 
  'EMP' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0'),
  COALESCE(raw_user_meta_data->>'first_name', SPLIT_PART(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'last_name', 'User'),
  email,
  created_at::DATE,
  'active'
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

-- Step 3: Link all auth users to their employee records
-- Give the first user admin role, others get 'employee' role
WITH ranked_users AS (
  SELECT 
    id as user_id,
    email,
    ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM auth.users
)
INSERT INTO user_roles (user_id, role, employee_id)
SELECT 
  u.user_id,
  CASE 
    WHEN u.rn = 1 THEN 'admin'::user_role
    ELSE 'employee'::user_role
  END as role,
  e.id as employee_id
FROM ranked_users u
JOIN employees e ON e.email = (SELECT email FROM auth.users WHERE id = u.user_id)
ON CONFLICT (user_id) DO UPDATE 
  SET employee_id = EXCLUDED.employee_id,
      role = EXCLUDED.role;

-- Step 4: Verify the sync
SELECT 
  'Summary' as status,
  COUNT(*) as total_users_synced
FROM user_roles;

SELECT 
  'Details' as status,
  u.email,
  ur.role,
  e.employee_id,
  e.first_name,
  e.last_name
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN employees e ON e.id = ur.employee_id
ORDER BY u.created_at;
