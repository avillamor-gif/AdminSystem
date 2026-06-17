-- ============================================================
-- Governance & Membership RBAC Permissions
-- Run in: Supabase SQL Editor
-- ============================================================

-- 0. First, check what roles exist in your database
-- Run this query first to see the actual role names:
-- SELECT id, name FROM roles ORDER BY name;
-- Then update the role names below to match your database exactly.

-- 1. Insert permission codes for Governance module
INSERT INTO permissions (name, code, category, description)
VALUES
  ('Governance View', 'governance.view', 'governance', 'View governance dashboard, board members, and assemblies'),
  ('Governance Manage', 'governance.manage', 'governance', 'Manage board trustees, terms, and general assemblies'),
  ('Board Trustees Manage', 'governance.board.manage', 'governance', 'Create, edit, delete board trustees'),
  ('Assemblies Manage', 'governance.assemblies.manage', 'governance', 'Create and manage general assemblies'),
  ('Governance Export', 'governance.export', 'governance', 'Export governance data')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert permission codes for Membership module
INSERT INTO permissions (name, code, category, description)
VALUES
  ('Membership View', 'membership.view', 'membership', 'View membership registry and applications'),
  ('Membership Manage', 'membership.manage', 'membership', 'Create, edit, delete members'),
  ('Applications Review', 'membership.applications.review', 'membership', 'Review and approve/reject membership applications'),
  ('Dues Manage', 'membership.dues.manage', 'membership', 'Manage member dues and payments'),
  ('Campaigns Manage', 'membership.campaigns.manage', 'membership', 'Create and send member campaigns'),
  ('Membership Export', 'membership.export', 'membership', 'Export membership data')
ON CONFLICT (code) DO NOTHING;

-- 2b. Add navigation permissions for governance
INSERT INTO permissions (name, code, category, description)
VALUES
  ('Nav Governance', 'nav.governance', 'navigation', 'Access governance module in navigation'),
  ('Nav Membership', 'nav.membership', 'navigation', 'Access membership module in navigation')
ON CONFLICT (code) DO NOTHING;

-- 3. Assign governance permissions to admin role (adjust role name if needed)
WITH admin_role AS (
  SELECT id FROM roles WHERE LOWER(name) LIKE '%admin%' LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT admin_role.id, p.id
FROM admin_role, permissions p
WHERE p.code IN (
  'governance.view', 'governance.manage', 'governance.board.manage',
  'governance.assemblies.manage', 'governance.export',
  'membership.view', 'membership.manage', 'membership.applications.review',
  'membership.dues.manage', 'membership.campaigns.manage', 'membership.export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 4. Assign governance & membership permissions to HR role
WITH hr_role AS (
  SELECT id FROM roles WHERE LOWER(name) LIKE '%hr%' LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr_role.id, p.id
FROM hr_role, permissions p
WHERE p.code IN (
  'governance.view', 'governance.manage',
  'membership.view', 'membership.manage', 'membership.applications.review',
  'membership.dues.manage', 'membership.export'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 5. Assign governance permissions to Executive Director (if exists)
WITH exec_role AS (
  SELECT id FROM roles WHERE LOWER(name) LIKE '%execu%director%' LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT exec_role.id, p.id
FROM exec_role, permissions p
WHERE p.code IN (
  'governance.view', 'governance.manage', 'governance.board.manage',
  'governance.assemblies.manage', 'governance.export',
  'membership.view', 'membership.manage', 'membership.applications.review',
  'membership.dues.manage', 'membership.campaigns.manage', 'membership.export'
)
AND exec_role.id IS NOT NULL
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 6. Add navigation permissions for governance to admin
WITH admin_role AS (
  SELECT id FROM roles WHERE LOWER(name) LIKE '%admin%' LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT admin_role.id, p.id
FROM admin_role, permissions p
WHERE p.code IN ('nav.governance', 'nav.membership')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 7. Add navigation permissions for governance to HR
WITH hr_role AS (
  SELECT id FROM roles WHERE LOWER(name) LIKE '%hr%' LIMIT 1
)
INSERT INTO role_permissions (role_id, permission_id)
SELECT hr_role.id, p.id
FROM hr_role, permissions p
WHERE p.code IN ('nav.governance', 'nav.membership')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 8. Verify the permissions were created and assigned
SELECT COUNT(*) as governance_permissions_count FROM permissions WHERE category = 'governance';
SELECT COUNT(*) as membership_permissions_count FROM permissions WHERE category = 'membership';
SELECT COUNT(*) as nav_permissions_count FROM permissions WHERE category = 'navigation' AND code LIKE 'nav.%';

-- 9. Show all roles (so you can verify assignments)
SELECT id, name, description FROM roles ORDER BY name;

-- 10. Show governance & membership permission assignments
SELECT 
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM role_permissions rp
JOIN roles r ON rp.role_id = r.id
JOIN permissions p ON rp.permission_id = p.id
WHERE p.code LIKE 'governance.%' OR p.code LIKE 'membership.%' OR p.code LIKE 'nav.%governance%' OR p.code LIKE 'nav.%membership%'
ORDER BY r.name, p.code;
