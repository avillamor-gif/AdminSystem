-- ============================================================
-- Navigation Sidebar Permissions
-- Controls which sidebar links are visible per role.
-- Run this in the Supabase SQL Editor.
-- ============================================================

INSERT INTO permissions (name, code, category, description) VALUES
  ('Leave Menu',            'nav.leave',       'Navigation', 'Show Leave link in sidebar'),
  ('Attendance Menu',       'nav.attendance',  'Navigation', 'Show Attendance Tracker link in sidebar'),
  ('Travel Menu',           'nav.travel',      'Navigation', 'Show Travel link in sidebar'),
  ('Publications Menu',     'nav.publications','Navigation', 'Show Publications link in sidebar'),
  ('Office Equipment Menu', 'nav.equipment',   'Navigation', 'Show Office Equipment link in sidebar'),
  ('Office Supplies Menu',  'nav.supplies',    'Navigation', 'Show Office Supplies link in sidebar'),
  ('My Info Menu',          'nav.my_info',     'Navigation', 'Show My Info link in sidebar'),
  ('Performance Menu',      'nav.performance', 'Navigation', 'Show Performance link in sidebar'),
  ('Directory Menu',        'nav.directory',   'Navigation', 'Show Directory link in sidebar')
ON CONFLICT (code) DO NOTHING;

-- ── Grant ALL nav.* to privileged roles ──────────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Executive Director', 'HR Manager', 'Manager')
  AND p.category = 'Navigation'
ON CONFLICT DO NOTHING;

-- ── Grant employee-level nav.* (no Employees list, no Performance) ────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Employee'
  AND p.code IN (
    'nav.leave', 'nav.attendance', 'nav.travel',
    'nav.publications', 'nav.equipment', 'nav.supplies',
    'nav.my_info', 'nav.directory'
  )
ON CONFLICT DO NOTHING;

-- ── Intern / Volunteer / Consultant — minimal nav ─────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('Intern', 'Volunteer', 'Consultant')
  AND p.code IN ('nav.leave', 'nav.attendance', 'nav.my_info')
ON CONFLICT DO NOTHING;

-- ── Board of Trustees — read-only nav ────────────────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Board of Trustees'
  AND p.code IN ('nav.my_info', 'nav.directory', 'nav.performance')
ON CONFLICT DO NOTHING;
