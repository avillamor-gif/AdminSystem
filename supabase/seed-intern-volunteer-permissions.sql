-- ============================================================
-- Seed permissions for Intern and Volunteer roles
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (INSERT ... ON CONFLICT DO NOTHING)
-- ============================================================

-- 1. Ensure the permission codes exist in the permissions table
INSERT INTO permissions (code, name, category, description) VALUES
  ('internship.view', 'View Internship',   'Internship',  'View own internship enrollment, hours and certificate'),
  ('my_info.view',    'View My Info',      'My Info',     'View own profile / personal info'),
  ('my_info.edit',    'Edit My Info',      'My Info',     'Edit own profile / personal info'),
  ('nav.my_info',     'Nav: My Info',      'Navigation',  'Show My Info link in sidebar'),
  ('nav.directory',   'Nav: Directory',    'Navigation',  'Show Directory link in sidebar')
ON CONFLICT (code) DO NOTHING;

-- 2. Ensure the roles exist
INSERT INTO roles (name, description, is_system_role, status) VALUES
  ('Intern',    'Intern access — My Info and own hours/certificate only', false, 'active'),
  ('Volunteer', 'Volunteer access — My Info and own hours/certificate only', false, 'active'),
  ('Consultant','Consultant access — My Info and Directory', false, 'active')
ON CONFLICT (name) DO NOTHING;

-- 3. Assign permissions to Intern role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Intern'
  AND p.code IN ('my_info.view', 'nav.my_info', 'internship.view')
ON CONFLICT DO NOTHING;

-- 4. Assign permissions to Volunteer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Volunteer'
  AND p.code IN ('my_info.view', 'nav.my_info', 'internship.view')
ON CONFLICT DO NOTHING;

-- 5. Assign permissions to Consultant role (slightly broader: My Info + Directory)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Consultant'
  AND p.code IN ('my_info.view', 'my_info.edit', 'nav.my_info', 'directory.view', 'nav.directory')
ON CONFLICT DO NOTHING;

-- Verify
SELECT r.name AS role, p.code AS permission
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name IN ('Intern', 'Volunteer', 'Consultant')
ORDER BY r.name, p.code;
