-- Role-Based Access Control (RBAC) Tables

-- Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted if true
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'user.create', 'employee.view'
  category VARCHAR(50) NOT NULL, -- 'User Management', 'Employee', 'Leave', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role Permissions Junction Table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Security Policies Table
CREATE TABLE IF NOT EXISTS security_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'Authentication', 'Session Management', 'Data Protection', etc.
  description TEXT,
  policy_type VARCHAR(50) NOT NULL, -- 'boolean', 'numeric', 'text'
  enabled BOOLEAN DEFAULT true,
  value_boolean BOOLEAN,
  value_numeric INTEGER,
  value_text TEXT,
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Active Sessions Table (tracking user sessions)
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  location VARCHAR(200),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Two-Factor Authentication Table
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  method VARCHAR(20) NOT NULL, -- 'app', 'sms', 'email'
  enabled BOOLEAN DEFAULT false,
  secret_key TEXT, -- For TOTP/app-based 2FA
  phone_number VARCHAR(20), -- For SMS
  backup_codes TEXT[], -- Array of backup codes
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Insert default roles
INSERT INTO roles (name, description, is_system_role, status) VALUES
('Super Admin', 'Full system access with all administrative privileges', true, 'active'),
('Admin', 'System administrator with most privileges', true, 'active'),
('HR Manager', 'Human resources management capabilities', true, 'active'),
('Manager', 'Department/team management capabilities', true, 'active'),
('Employee', 'Standard employee access to personal information', true, 'active')
ON CONFLICT (name) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, code, category, description) VALUES
-- User Management
('Create User', 'user.create', 'User Management', 'Create new system users'),
('View User', 'user.view', 'User Management', 'View user information'),
('Edit User', 'user.edit', 'User Management', 'Edit user information'),
('Delete User', 'user.delete', 'User Management', 'Delete users from system'),
('Manage Roles', 'role.manage', 'User Management', 'Create and manage user roles'),

-- Employee Management
('View Employee', 'employee.view', 'Employee Management', 'View employee information'),
('Create Employee', 'employee.create', 'Employee Management', 'Add new employees'),
('Edit Employee', 'employee.edit', 'Employee Management', 'Edit employee information'),
('Delete Employee', 'employee.delete', 'Employee Management', 'Remove employees'),

-- Leave Management
('View Leave', 'leave.view', 'Leave Management', 'View leave requests'),
('Apply Leave', 'leave.apply', 'Leave Management', 'Submit leave requests'),
('Approve Leave', 'leave.approve', 'Leave Management', 'Approve/reject leave requests'),
('Manage Leave Types', 'leave.manage_types', 'Leave Management', 'Configure leave types'),

-- Performance Management
('View Performance', 'performance.view', 'Performance Management', 'View performance reviews'),
('Conduct Review', 'performance.conduct', 'Performance Management', 'Conduct performance reviews'),
('Manage Goals', 'performance.manage_goals', 'Performance Management', 'Set and manage goals'),

-- System Configuration
('System Settings', 'system.config', 'System', 'Configure system settings'),
('View Logs', 'system.logs', 'System', 'View system audit logs'),
('Manage Security', 'system.security', 'System', 'Manage security policies')
ON CONFLICT (code) DO NOTHING;

-- Assign all permissions to Super Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin'
ON CONFLICT DO NOTHING;

-- Assign common permissions to Admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Admin'
AND p.code IN ('user.view', 'user.edit', 'employee.view', 'employee.create', 'employee.edit', 'leave.view', 'leave.approve', 'performance.view', 'performance.conduct')
ON CONFLICT DO NOTHING;

-- Assign HR Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'HR Manager'
AND p.code IN ('employee.view', 'employee.create', 'employee.edit', 'leave.view', 'leave.approve', 'performance.view', 'performance.conduct', 'leave.manage_types')
ON CONFLICT DO NOTHING;

-- Assign Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Manager'
AND p.code IN ('employee.view', 'leave.view', 'leave.approve', 'performance.view', 'performance.conduct', 'performance.manage_goals')
ON CONFLICT DO NOTHING;

-- Assign Employee permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Employee'
AND p.code IN ('employee.view', 'leave.view', 'leave.apply', 'performance.view')
ON CONFLICT DO NOTHING;

-- Insert default security policies
INSERT INTO security_policies (name, category, description, policy_type, enabled, value_numeric, value_boolean, severity) VALUES
('Session Timeout', 'Session Management', 'Automatic session timeout duration in minutes', 'numeric', true, 30, null, 'medium'),
('Max Concurrent Sessions', 'Session Management', 'Maximum concurrent sessions per user', 'numeric', true, 3, null, 'medium'),
('Require 2FA for Admins', 'Authentication', 'Require two-factor authentication for admin users', 'boolean', true, null, true, 'high'),
('Password Expiry Warning', 'Authentication', 'Days before password expiry to show warning', 'numeric', true, 7, null, 'low'),
('Failed Login Attempts', 'Authentication', 'Maximum failed login attempts before lockout', 'numeric', true, 5, null, 'high'),
('Account Lockout Duration', 'Authentication', 'Account lockout duration in minutes', 'numeric', true, 30, null, 'high'),
('Require Strong Passwords', 'Authentication', 'Enforce strong password requirements', 'boolean', true, null, true, 'critical'),
('Enable IP Whitelisting', 'Data Protection', 'Enable IP address whitelisting', 'boolean', false, null, false, 'medium'),
('Enable Data Encryption', 'Data Protection', 'Encrypt sensitive data at rest', 'boolean', true, null, true, 'critical'),
('Enable Audit Logging', 'Compliance', 'Log all user activities', 'boolean', true, null, true, 'high'),
('Data Retention Period', 'Compliance', 'Data retention period in days', 'numeric', true, 365, null, 'medium'),
('Enable Session Recording', 'Session Management', 'Record user session activities', 'boolean', false, null, false, 'low')
ON CONFLICT (name) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_category ON permissions(category);
CREATE INDEX IF NOT EXISTS idx_security_policies_category ON security_policies(category);

-- Disable RLS for development
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_policies DISABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_auth DISABLE ROW LEVEL SECURITY;
