-- ============================================================
-- Add missing submenu permissions that exist in nav layouts
-- but were never inserted into the permissions table.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

-- Employee Data Management — missing entries
INSERT INTO permissions (name, code, category, description) VALUES
  ('Workforce Analytics',    'admin.employee_data.workforce_analytics',    'Admin Modules', 'Access Workforce Analytics submenu'),
  ('Generate ID',            'admin.employee_data.generate_id',            'Admin Modules', 'Access Generate ID submenu'),
-- Organization Structure — missing entries
  ('Committees',             'admin.organization.committees',              'Admin Modules', 'Access Committees submenu'),
-- System Configuration — missing entries
  ('Organization Profile',   'admin.system_config.organization_profile',   'Admin Modules', 'Access Organization Profile submenu'),
  ('Organization Documents', 'admin.system_config.org_documents',          'Admin Modules', 'Access Organization Documents submenu')
ON CONFLICT (code) DO NOTHING;

-- Grant to Super Admin, Admin, HR Manager, Executive Director
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'HR Manager', 'Executive Director')
  AND p.code IN (
    'admin.employee_data.workforce_analytics',
    'admin.employee_data.generate_id',
    'admin.organization.committees',
    'admin.system_config.organization_profile',
    'admin.system_config.org_documents'
  )
ON CONFLICT DO NOTHING;

-- Verify all missing ones are now present
SELECT code, name FROM permissions
WHERE code IN (
  'admin.employee_data.workforce_analytics',
  'admin.employee_data.generate_id',
  'admin.organization.committees',
  'admin.system_config.organization_profile',
  'admin.system_config.org_documents'
)
ORDER BY code;
