-- ============================================================
-- Add missing submenu permissions that exist in nav layouts
-- but were never inserted into the permissions table.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

-- Employee Data Management — missing entries
INSERT INTO permissions (name, code, category, description) VALUES
  ('Workforce Analytics',    'admin.employee_data.workforce_analytics', 'Admin Modules', 'Access Workforce Analytics submenu'),
  ('Generate ID',            'admin.employee_data.generate_id',         'Admin Modules', 'Access Generate ID submenu')
ON CONFLICT (code) DO NOTHING;

-- Grant to Super Admin, Admin, HR Manager, Executive Director
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'HR Manager', 'Executive Director')
  AND p.code IN (
    'admin.employee_data.workforce_analytics',
    'admin.employee_data.generate_id'
  )
ON CONFLICT DO NOTHING;

-- Verify
SELECT code, name FROM permissions WHERE code LIKE 'admin.employee_data.%' ORDER BY code;
