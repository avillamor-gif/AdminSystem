-- ============================================================
-- Governance & Membership RBAC Permissions
-- Run in: Supabase SQL Editor
-- ============================================================

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

-- 3. Assign governance permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
  id
FROM permissions
WHERE code IN (
  'governance.view', 'governance.manage', 'governance.board.manage',
  'governance.assemblies.manage', 'governance.export',
  'membership.view', 'membership.manage', 'membership.applications.review',
  'membership.dues.manage', 'membership.campaigns.manage', 'membership.export'
)
ON CONFLICT DO NOTHING;

-- 4. Assign governance & membership permissions to HR role
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'hr' LIMIT 1),
  id
FROM permissions
WHERE code IN (
  'governance.view', 'governance.manage',
  'membership.view', 'membership.manage', 'membership.applications.review',
  'membership.dues.manage', 'membership.export'
)
ON CONFLICT DO NOTHING;

-- 5. Assign governance permissions to Executive Director
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'executive director' LIMIT 1),
  id
FROM permissions
WHERE code IN (
  'governance.view', 'governance.manage', 'governance.board.manage',
  'governance.assemblies.manage', 'governance.export',
  'membership.view', 'membership.manage', 'membership.applications.review',
  'membership.dues.manage', 'membership.campaigns.manage', 'membership.export'
)
ON CONFLICT DO NOTHING;

-- 6. Add navigation permissions for governance
INSERT INTO permissions (name, code, category, description)
VALUES
  ('Nav Governance', 'nav.governance', 'navigation', 'Access governance module in navigation'),
  ('Nav Membership', 'nav.membership', 'navigation', 'Access membership module in navigation')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'admin' LIMIT 1),
  id
FROM permissions
WHERE code IN ('nav.governance', 'nav.membership')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE name = 'hr' LIMIT 1),
  id
FROM permissions
WHERE code IN ('nav.governance', 'nav.membership')
ON CONFLICT DO NOTHING;

-- Verify the permissions were created
SELECT COUNT(*) as governance_permissions_count FROM permissions WHERE category = 'governance';
SELECT COUNT(*) as membership_permissions_count FROM permissions WHERE category = 'membership';
