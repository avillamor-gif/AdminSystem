-- Ensure leave approval permissions exist in the database
-- These permissions are used by the RBAC system for leave approval access control

BEGIN;

-- Insert leave approval permissions if they don't exist
INSERT INTO permissions (name, code, category, description, created_at, updated_at)
VALUES
  ('Approve Leave Requests', 'leave.approve', 'Leave Management', 'Allow user to approve leave requests', NOW(), NOW()),
  ('Reject Leave Requests', 'leave.reject', 'Leave Management', 'Allow user to reject leave requests', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  updated_at = NOW();

-- Assign leave.approve and leave.reject permissions to Admin role
-- First, get the Admin role ID
WITH admin_role AS (
  SELECT id FROM roles WHERE LOWER(name) = 'admin'
),
leave_perms AS (
  SELECT id FROM permissions WHERE code IN ('leave.approve', 'leave.reject')
)
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT admin_role.id, leave_perms.id, NOW(), NOW()
FROM admin_role, leave_perms
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  updated_at = NOW();

-- Assign leave.approve and leave.reject permissions to HR Manager role
WITH hr_role AS (
  SELECT id FROM roles WHERE LOWER(name) = 'hr manager'
),
leave_perms AS (
  SELECT id FROM permissions WHERE code IN ('leave.approve', 'leave.reject')
)
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT hr_role.id, leave_perms.id, NOW(), NOW()
FROM hr_role, leave_perms
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  updated_at = NOW();

-- Assign leave.approve permission to Manager role
-- (Managers should be able to approve, but may not reject)
WITH manager_role AS (
  SELECT id FROM roles WHERE LOWER(name) = 'manager'
),
approve_perm AS (
  SELECT id FROM permissions WHERE code = 'leave.approve'
)
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT manager_role.id, approve_perm.id, NOW(), NOW()
FROM manager_role, approve_perm
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  updated_at = NOW();

-- Assign leave.apply permission to Employee role
WITH employee_role AS (
  SELECT id FROM roles WHERE LOWER(name) = 'employee'
),
apply_perm AS (
  SELECT id FROM permissions WHERE code = 'leave.apply'
)
INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
SELECT employee_role.id, apply_perm.id, NOW(), NOW()
FROM employee_role, apply_perm
ON CONFLICT (role_id, permission_id) DO UPDATE SET
  updated_at = NOW();

COMMIT;
