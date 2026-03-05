-- Link user_roles to employees by email
-- This updates all user_roles entries that have NULL employee_id
-- Since we can't directly query auth.users, we need to manually link them

-- First, let's see what we have:
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.employee_id
FROM user_roles ur
WHERE ur.employee_id IS NULL;

-- MANUAL LINKING INSTRUCTIONS:
-- You need to link users manually by running queries like this for each user:
-- 
-- 1. Find the auth user's email in Supabase Dashboard > Authentication > Users
-- 2. Find the matching employee in the employees table
-- 3. Run:
--    UPDATE user_roles 
--    SET employee_id = (SELECT id FROM employees WHERE email = 'user@example.com')
--    WHERE user_id = 'auth-user-uuid';
--
-- Or use the User Management page in the admin panel to edit users and select their employee record.

-- Example for Mary Jane Malaki (if you know her UUID):
-- UPDATE user_roles 
-- SET employee_id = (SELECT id FROM employees WHERE email = 'mjmalaki@iboninternational.org')
-- WHERE user_id = 'PASTE_MARYJANE_USER_UUID_HERE';
