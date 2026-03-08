-- ============================================================
-- Seed complete permission sets for every role.
-- Safe to re-run: uses ON CONFLICT DO NOTHING.
-- Run this ONCE in Supabase SQL Editor, then use the RBAC
-- admin panel to add/remove individual permissions per role.
-- ============================================================

-- ── 1. Ensure all permission codes exist ─────────────────────────────────
INSERT INTO permissions (name, code, category, description) VALUES
('Create User',           'user.create',           'User Management',     'Create new system users'),
('View User',             'user.view',              'User Management',     'View user information'),
('Edit User',             'user.edit',              'User Management',     'Edit user information'),
('Delete User',           'user.delete',            'User Management',     'Delete users from the system'),
('Manage Roles',          'role.manage',            'User Management',     'Create and manage user roles'),
('View Employees',        'employees.view',         'Employee Management', 'View employee profiles'),
('Create Employee',       'employees.create',       'Employee Management', 'Add new employees'),
('Edit Employee',         'employees.edit',         'Employee Management', 'Edit employee information'),
('Delete Employee',       'employees.delete',       'Employee Management', 'Remove employees'),
('View Leave',            'leave.view',             'Leave Management',    'View own and team leave requests'),
('Apply Leave',           'leave.apply',            'Leave Management',    'Submit leave requests'),
('Approve Leave',         'leave.approve',          'Leave Management',    'Approve or reject leave requests'),
('Reject Leave',          'leave.reject',           'Leave Management',    'Reject leave requests'),
('Manage Leave Types',    'leave.manage_types',     'Leave Management',    'Configure leave types and policies'),
('Manage Leave Balance',  'leave.manage_balance',   'Leave Management',    'Allocate and adjust leave balances'),
('View Leave Credits',    'leave.credits.view',     'Leave Management',    'View leave credit requests'),
('Apply Leave Credit',    'leave.credits.apply',    'Leave Management',    'Submit leave credit requests'),
('Approve Leave Credit',  'leave.credits.approve',  'Leave Management',    'Approve or reject leave credit requests'),
('View Attendance',       'attendance.view',        'Attendance',          'View own attendance records'),
('Edit Attendance',       'attendance.edit',        'Attendance',          'Edit attendance entries'),
('View All Attendance',   'attendance.view_all',    'Attendance',          'View all employees'' attendance'),
('Export Attendance',     'attendance.export',      'Attendance',          'Export attendance reports'),
('View Travel',           'travel.view',            'Travel',              'View own travel requests'),
('Apply Travel',          'travel.apply',           'Travel',              'Submit travel requests'),
('Approve Travel',        'travel.approve',         'Travel',              'Approve or reject travel requests'),
('Manage Travel',         'travel.manage',          'Travel',              'Manage all travel requests and settings'),
('View Equipment',        'equipment.view',         'Equipment',           'View available equipment'),
('Request Equipment',     'equipment.request',      'Equipment',           'Request equipment checkout'),
('Approve Equipment',     'equipment.approve',      'Equipment',           'Approve or reject equipment requests'),
('Manage Assets',         'assets.manage',          'Equipment',           'Manage asset inventory and assignments'),
('View Supplies',         'supplies.view',          'Office Supplies',     'View office supply inventory'),
('Request Supplies',      'supplies.request',       'Office Supplies',     'Request office supplies'),
('Approve Supplies',      'supplies.approve',       'Office Supplies',     'Approve supply requests'),
('Manage Supplies',       'supplies.manage',        'Office Supplies',     'Manage supply inventory and vendors'),
('View Publications',     'publications.view',      'Publications',        'Browse the publication library'),
('Request Publication',   'publications.request',   'Publications',        'Request a publication'),
('Manage Publications',   'publications.manage',    'Publications',        'Manage publications and printing presses'),
('View Performance',      'performance.view',       'Performance',         'View performance reviews'),
('Conduct Review',        'performance.conduct',    'Performance',         'Conduct performance reviews'),
('Manage Goals',          'performance.manage_goals','Performance',        'Set and manage performance goals'),
('View Recruitment',      'recruitment.view',       'Recruitment',         'View job postings and applicants'),
('Manage Recruitment',    'recruitment.manage',     'Recruitment',         'Manage job postings and hiring process'),
('View Reports',          'reports.view',           'Reports',             'View system reports'),
('Export Reports',        'reports.export',         'Reports',             'Export reports to CSV/PDF'),
('System Settings',       'system.config',          'System',              'Configure system settings'),
('View Logs',             'system.logs',            'System',              'View system audit logs'),
('Manage Security',       'system.security',        'System',              'Manage security policies and 2FA'),
('Manage Admin',          'admin.manage',           'System',              'Access all admin sections')
ON CONFLICT (code) DO NOTHING;

-- ── 2. Ensure all standard roles exist ────────────────────────────────────
INSERT INTO roles (name, description, is_system_role, status) VALUES
('Super Admin',        'Full system access',                          true,  'active'),
('Admin',              'Administrative access',                       true,  'active'),
('HR Manager',         'Human resources management',                  true,  'active'),
('Executive Director', 'Executive director access',                   false, 'active'),
('Manager',            'Team manager access',                         false, 'active'),
('Employee',           'Standard employee access',                    true,  'active'),
('Board Member',       'Board member read-only access',               false, 'active')
ON CONFLICT (name) DO NOTHING;

-- ── 3. Ensure user_roles.role_id is linked for all known role strings ─────
UPDATE user_roles ur SET role_id = r.id FROM roles r
WHERE ur.role_id IS NULL AND ur.role = 'admin'        AND r.name = 'Admin';
UPDATE user_roles ur SET role_id = r.id FROM roles r
WHERE ur.role_id IS NULL AND ur.role = 'hr'           AND r.name = 'HR Manager';
UPDATE user_roles ur SET role_id = r.id FROM roles r
WHERE ur.role_id IS NULL AND ur.role = 'manager'      AND r.name = 'Manager';
UPDATE user_roles ur SET role_id = r.id FROM roles r
WHERE ur.role_id IS NULL AND ur.role = 'employee'     AND r.name = 'Employee';
UPDATE user_roles ur SET role_id = r.id FROM roles r
WHERE ur.role_id IS NULL AND ur.role = 'ed'           AND r.name = 'Executive Director';
UPDATE user_roles ur SET role_id = r.id FROM roles r
WHERE ur.role_id IS NULL AND ur.role IN ('super admin','super_admin') AND r.name = 'Super Admin';
UPDATE user_roles ur SET role_id = r.id FROM roles r
WHERE ur.role_id IS NULL AND ur.role = 'board_member' AND r.name = 'Board Member';

-- ── 4. Seed default role_permissions (skips any already set) ──────────────

-- Super Admin — everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Executive Director — everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'Executive Director'
ON CONFLICT DO NOTHING;

-- Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Admin' AND p.code IN (
  'user.view','user.create','user.edit','user.delete','role.manage',
  'employees.view','employees.create','employees.edit','employees.delete',
  'leave.view','leave.apply','leave.approve','leave.reject','leave.manage_types','leave.manage_balance',
  'leave.credits.view','leave.credits.approve',
  'attendance.view','attendance.edit','attendance.view_all','attendance.export',
  'travel.view','travel.apply','travel.approve','travel.manage',
  'equipment.view','equipment.request','equipment.approve','assets.manage',
  'supplies.view','supplies.request','supplies.approve','supplies.manage',
  'publications.view','publications.request','publications.manage',
  'performance.view','performance.conduct','performance.manage_goals',
  'recruitment.view','recruitment.manage',
  'reports.view','reports.export',
  'system.config','system.logs','system.security','admin.manage'
) ON CONFLICT DO NOTHING;

-- HR Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'HR Manager' AND p.code IN (
  'user.view','user.create','user.edit',
  'employees.view','employees.create','employees.edit',
  'leave.view','leave.apply','leave.approve','leave.reject','leave.manage_types','leave.manage_balance',
  'leave.credits.view','leave.credits.approve',
  'attendance.view','attendance.view_all','attendance.export',
  'travel.view','travel.approve',
  'equipment.view','equipment.approve',
  'supplies.view','supplies.approve',
  'publications.view','publications.manage',
  'performance.view','performance.conduct','performance.manage_goals',
  'recruitment.view','recruitment.manage',
  'reports.view','reports.export',
  'admin.manage'
) ON CONFLICT DO NOTHING;

-- Manager
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Manager' AND p.code IN (
  'employees.view','employees.edit',
  'leave.view','leave.apply','leave.approve','leave.reject',
  'leave.credits.view','leave.credits.apply',
  'attendance.view','attendance.view_all',
  'travel.view','travel.apply','travel.approve',
  'equipment.view','equipment.request',
  'supplies.view','supplies.request',
  'publications.view','publications.request',
  'performance.view','performance.conduct','performance.manage_goals',
  'reports.view'
) ON CONFLICT DO NOTHING;

-- Employee
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Employee' AND p.code IN (
  'employees.view',
  'leave.view','leave.apply',
  'leave.credits.view','leave.credits.apply',
  'attendance.view',
  'travel.view','travel.apply',
  'equipment.view','equipment.request',
  'supplies.view','supplies.request',
  'publications.view','publications.request',
  'performance.view'
) ON CONFLICT DO NOTHING;

-- Board Member — read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name = 'Board Member' AND p.code IN (
  'employees.view',
  'leave.view',
  'reports.view',
  'performance.view'
) ON CONFLICT DO NOTHING;

-- ── 5. Verify ─────────────────────────────────────────────────────────────
SELECT r.name AS role, COUNT(rp.permission_id) AS permission_count
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
GROUP BY r.name
ORDER BY r.name;
