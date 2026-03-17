-- =====================================================
-- Add internship.manage permission to RBAC
-- Run in Supabase SQL Editor
-- =====================================================

-- 1. Insert the permission
INSERT INTO permissions (name, code, category, description)
VALUES ('Manage Internship & Volunteer', 'internship.manage', 'Internship & Volunteer', 'Manage partner institutions, enrollments, hours, and certificates')
ON CONFLICT (code) DO NOTHING;

-- 2. Assign to Super Admin, Executive Director (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Executive Director')
  AND p.code = 'internship.manage'
ON CONFLICT DO NOTHING;

-- 3. Assign to Admin, HR Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Admin', 'HR Manager')
  AND p.code = 'internship.manage'
ON CONFLICT DO NOTHING;

-- 4. Verify
SELECT r.name AS role, p.code AS permission
FROM role_permissions rp
JOIN roles r ON r.id = rp.role_id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.code = 'internship.manage'
ORDER BY r.name;
