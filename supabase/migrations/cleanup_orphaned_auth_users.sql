-- Clean up auth users that don't have user_roles entries
-- This will show auth users that exist but don't have corresponding user_roles entries

-- STEP 1: First, let's see which auth users exist without user_roles
-- (This is a query to review before deleting)
-- NOTE: You need to run this in Supabase SQL Editor with proper permissions

-- Show all auth users that DON'T have a user_roles entry
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id
)
ORDER BY au.email;

-- STEP 2: After reviewing the list above, delete those orphaned auth users
-- UNCOMMENT the line below to actually delete them:

-- DELETE FROM auth.users
-- WHERE id IN (
--   SELECT au.id
--   FROM auth.users au
--   WHERE NOT EXISTS (
--     SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id
--   )
-- );

-- STEP 3: Verify - This should show only 3 users after cleanup
SELECT 
  COUNT(*) as total_auth_users
FROM auth.users;

-- STEP 4: Show remaining users with their roles
SELECT 
  au.email,
  ur.role,
  CASE 
    WHEN ur.employee_id IS NOT NULL THEN 'Linked'
    ELSE 'Not Linked'
  END as employee_status
FROM auth.users au
LEFT JOIN user_roles ur ON ur.user_id = au.id
ORDER BY au.email;
