-- ============================================================
-- Admin Module Permissions + Multi-Role Support
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Insert per-module admin permissions ───────────────────────────────
INSERT INTO permissions (name, code, category, description) VALUES
-- Admin module access permissions (controls which cards appear)
('Access User & Security Admin',      'admin.user_access',       'Admin Modules', 'Access User Access & Security administration'),
('Access Organization Admin',         'admin.organization',      'Admin Modules', 'Access Organization Structure administration'),
('Access Job Management Admin',       'admin.job_management',    'Admin Modules', 'Access Job & Position Management administration'),
('Access Employee Data Admin',        'admin.employee_data',     'Admin Modules', 'Access Employee Data Management administration'),
('Access Time & Attendance Admin',    'admin.time_attendance',   'Admin Modules', 'Access Time & Attendance administration'),
('Access Leave Management Admin',     'admin.leave_management',  'Admin Modules', 'Access Leave & Absence Management administration'),
('Access Payroll & Benefits Admin',   'admin.payroll_benefits',  'Admin Modules', 'Access Payroll & Benefits administration'),
('Access Performance Admin',          'admin.performance',       'Admin Modules', 'Access Performance Management administration'),
('Access Learning & Development Admin','admin.learning',         'Admin Modules', 'Access Learning & Development administration'),
('Access Recruitment Admin',          'admin.recruitment',       'Admin Modules', 'Access Recruitment Management administration'),
('Access Compliance & Audit Admin',   'admin.compliance',        'Admin Modules', 'Access Compliance & Audit administration'),
('Access Analytics & Reports Admin',  'admin.analytics',         'Admin Modules', 'Access Analytics & Reporting administration'),
('Access System Config Admin',        'admin.system_config',     'Admin Modules', 'Access System Configuration administration'),
('Access Travel Admin',               'admin.travel',            'Admin Modules', 'Access Travel Management administration'),
('Access Asset Management Admin',     'admin.assets',            'Admin Modules', 'Access Asset Management administration'),
('Access Office Supplies Admin',      'admin.supplies',          'Admin Modules', 'Access Office Supplies administration'),
('Access Publications Admin',         'admin.publications',      'Admin Modules', 'Access Publications administration'),
('Access Internship & Volunteer Admin','admin.internship',       'Admin Modules', 'Access Internship & Volunteer administration')
ON CONFLICT (code) DO NOTHING;

-- ── 2. Create user_role_assignments for multi-role support ───────────────
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role_id)
);

-- Enable RLS
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role manages user_role_assignments"
  ON user_role_assignments FOR ALL
  USING (auth.role() = 'service_role');

-- Admins/HR can view
CREATE POLICY "Admins can view user_role_assignments"
  ON user_role_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'hr', 'super admin', 'ed')
    )
  );

-- Users can view their own assignments
CREATE POLICY "Users can view own role assignments"
  ON user_role_assignments FOR SELECT
  USING (user_id = auth.uid());

-- ── 3. Backfill user_role_assignments from existing user_roles ───────────
-- Links each existing user_roles.role to the matching roles table entry
INSERT INTO user_role_assignments (user_id, role_id)
SELECT ur.user_id, r.id
FROM user_roles ur
JOIN roles r ON (
  (ur.role = 'admin'        AND r.name = 'Admin') OR
  (ur.role = 'hr'           AND r.name = 'HR Manager') OR
  (ur.role = 'manager'      AND r.name = 'Manager') OR
  (ur.role = 'employee'     AND r.name = 'Employee') OR
  (ur.role = 'ed'           AND r.name = 'Executive Director') OR
  (ur.role = 'super admin'  AND r.name = 'Super Admin') OR
  (ur.role = 'board_member' AND r.name = 'Board of Trustees') OR
  (ur.role = 'intern'       AND r.name = 'Intern') OR
  (ur.role = 'volunteer'    AND r.name = 'Volunteer') OR
  (ur.role = 'consultant'   AND r.name = 'Consultant')
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ── 4. Grant all Admin Module permissions to Super Admin, Admin, ED ───────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Executive Director')
  AND p.category = 'Admin Modules'
ON CONFLICT DO NOTHING;

-- ── 5. Grant Leave Management admin module permission to HR Manager ───────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'HR Manager'
  AND p.code IN (
    'admin.user_access', 'admin.organization', 'admin.job_management',
    'admin.employee_data', 'admin.time_attendance', 'admin.leave_management',
    'admin.performance', 'admin.recruitment', 'admin.analytics'
  )
ON CONFLICT DO NOTHING;

-- ── 6. Verify ─────────────────────────────────────────────────────────────
SELECT r.name AS role, COUNT(p.id) AS admin_module_permissions
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE p.category = 'Admin Modules'
GROUP BY r.name
ORDER BY r.name;
