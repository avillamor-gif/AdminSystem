-- Migration: Link user_roles table to new RBAC roles table

-- Step 1: Add role_id column to user_roles (nullable for migration)
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id) ON DELETE SET NULL;

-- Step 2: Map old role enum values to new RBAC roles
-- Update user_roles to link to the new roles table based on their current role enum

-- Map 'admin' to 'Admin' role
UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role = 'admin' AND r.name = 'Admin';

-- Map 'hr' to 'HR Manager' role
UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role = 'hr' AND r.name = 'HR Manager';

-- Map 'manager' to 'Manager' role
UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role = 'manager' AND r.name = 'Manager';

-- Map 'employee' to 'Employee' role
UPDATE user_roles ur
SET role_id = r.id
FROM roles r
WHERE ur.role = 'employee' AND r.name = 'Employee';

-- Step 3: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Step 4: Make role_id NOT NULL after migration (optional - uncomment if you want to enforce it)
-- ALTER TABLE user_roles ALTER COLUMN role_id SET NOT NULL;

-- Step 5: Add a view to easily get user permissions
CREATE OR REPLACE VIEW user_permissions AS
SELECT 
  ur.user_id,
  ur.employee_id,
  r.id as role_id,
  r.name as role_name,
  r.description as role_description,
  p.id as permission_id,
  p.name as permission_name,
  p.code as permission_code,
  p.category as permission_category
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.status = 'active';

-- Disable RLS on the view for development
ALTER VIEW user_permissions SET (security_invoker = off);
