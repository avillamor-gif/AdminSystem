-- Fix existing user_roles rows that have a role string but no role_id
-- This ensures the user_permissions view returns data for all users

UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role_id IS NULL
  AND ur.role = 'admin'
  AND r.name = 'Admin';

UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role_id IS NULL
  AND ur.role = 'hr'
  AND r.name = 'HR Manager';

UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role_id IS NULL
  AND ur.role = 'manager'
  AND r.name = 'Manager';

UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role_id IS NULL
  AND ur.role = 'employee'
  AND r.name = 'Employee';

UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role_id IS NULL
  AND ur.role = 'super_admin'
  AND r.name = 'Super Admin';
