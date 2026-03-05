-- Leave & Absence Management Module Schema
-- This migration creates all tables for Leave & Absence management

-- Drop existing tables if they exist (in reverse order due to foreign keys)
DROP TABLE IF EXISTS leave_approval_workflows CASCADE;
DROP TABLE IF EXISTS absence_categories CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS leave_policy_configs CASCADE;
DROP TABLE IF EXISTS accrual_rules CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;

-- =============================================
-- 1. LEAVE TYPES
-- =============================================
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_type_name VARCHAR(100) NOT NULL,
  leave_type_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(30) NOT NULL CHECK (category IN ('vacation', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'other')),
  is_paid BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT TRUE,
  color_code VARCHAR(7) DEFAULT '#3B82F6',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 2. ACCRUAL RULES
-- =============================================
CREATE TABLE accrual_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(100) NOT NULL,
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  accrual_frequency VARCHAR(20) NOT NULL CHECK (accrual_frequency IN ('monthly', 'annually', 'per_pay_period', 'on_hire')),
  accrual_rate DECIMAL(5,2) NOT NULL,
  max_balance DECIMAL(6,2),
  carry_over_enabled BOOLEAN DEFAULT TRUE,
  max_carry_over DECIMAL(6,2),
  waiting_period_days INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 3. LEAVE POLICIES
-- =============================================
CREATE TABLE leave_policy_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_name VARCHAR(100) NOT NULL,
  policy_code VARCHAR(50) UNIQUE NOT NULL,
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  eligibility_criteria TEXT,
  min_service_months INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT TRUE,
  max_consecutive_days INTEGER,
  min_notice_days INTEGER DEFAULT 0,
  blackout_period_enabled BOOLEAN DEFAULT FALSE,
  can_split_leave BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. HOLIDAY CALENDAR
-- =============================================
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  holiday_name VARCHAR(100) NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_type VARCHAR(30) NOT NULL CHECK (holiday_type IN ('public', 'national', 'company', 'optional', 'religious')),
  description TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  is_paid BOOLEAN DEFAULT TRUE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 5. ABSENCE CATEGORIES
-- =============================================
CREATE TABLE absence_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_name VARCHAR(100) NOT NULL,
  category_code VARCHAR(50) UNIQUE NOT NULL,
  category_type VARCHAR(30) NOT NULL CHECK (category_type IN ('unauthorized', 'lateness', 'early_departure', 'medical', 'emergency', 'other')),
  severity_level VARCHAR(20) CHECK (severity_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  affects_pay BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  max_occurrences_per_month INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 6. APPROVAL WORKFLOWS
-- =============================================
CREATE TABLE leave_approval_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_name VARCHAR(100) NOT NULL,
  workflow_code VARCHAR(50) UNIQUE NOT NULL,
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  workflow_steps JSONB NOT NULL DEFAULT '[]',
  is_sequential BOOLEAN DEFAULT TRUE,
  escalation_enabled BOOLEAN DEFAULT FALSE,
  escalation_days INTEGER,
  priority INTEGER DEFAULT 1,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_leave_types_code ON leave_types(leave_type_code);
CREATE INDEX IF NOT EXISTS idx_leave_types_category ON leave_types(category);

CREATE INDEX IF NOT EXISTS idx_accrual_rules_active ON accrual_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_accrual_rules_leave_type ON accrual_rules(leave_type_id);

CREATE INDEX IF NOT EXISTS idx_leave_policies_active ON leave_policy_configs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_leave_policies_leave_type ON leave_policy_configs(leave_type_id);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON holidays(year);
CREATE INDEX IF NOT EXISTS idx_holidays_type ON holidays(holiday_type);

CREATE INDEX IF NOT EXISTS idx_absence_categories_active ON absence_categories(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_absence_categories_type ON absence_categories(category_type);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_active ON leave_approval_workflows(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_approval_workflows_leave_type ON leave_approval_workflows(leave_type_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE accrual_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policy_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_approval_workflows ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read, HR admins to manage
CREATE POLICY "Allow read access to authenticated users" ON leave_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage leave types" ON leave_types FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr'))
);

CREATE POLICY "Allow read access to authenticated users" ON accrual_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage accrual rules" ON accrual_rules FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr'))
);

CREATE POLICY "Allow read access to authenticated users" ON leave_policy_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage leave policies" ON leave_policy_configs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr'))
);

CREATE POLICY "Allow read access to authenticated users" ON holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage holidays" ON holidays FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr'))
);

CREATE POLICY "Allow read access to authenticated users" ON absence_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage absence categories" ON absence_categories FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr'))
);

CREATE POLICY "Allow read access to authenticated users" ON leave_approval_workflows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage approval workflows" ON leave_approval_workflows FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr'))
);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
DROP TRIGGER IF EXISTS update_leave_types_updated_at ON leave_types;
CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON leave_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_accrual_rules_updated_at ON accrual_rules;
CREATE TRIGGER update_accrual_rules_updated_at BEFORE UPDATE ON accrual_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_policy_configs_updated_at ON leave_policy_configs;
CREATE TRIGGER update_leave_policy_configs_updated_at BEFORE UPDATE ON leave_policy_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_holidays_updated_at ON holidays;
CREATE TRIGGER update_holidays_updated_at BEFORE UPDATE ON holidays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_absence_categories_updated_at ON absence_categories;
CREATE TRIGGER update_absence_categories_updated_at BEFORE UPDATE ON absence_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_approval_workflows_updated_at ON leave_approval_workflows;
CREATE TRIGGER update_leave_approval_workflows_updated_at BEFORE UPDATE ON leave_approval_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA
-- =============================================
-- Insert default leave types
INSERT INTO leave_types (leave_type_name, leave_type_code, description, category, is_paid, color_code, display_order) VALUES
('Annual Leave', 'ANNUAL', 'Standard annual vacation leave', 'vacation', true, '#10B981', 1),
('Sick Leave', 'SICK', 'Medical and health-related leave', 'sick', true, '#EF4444', 2),
('Personal Leave', 'PERSONAL', 'Personal time off', 'personal', true, '#8B5CF6', 3),
('Maternity Leave', 'MATERNITY', 'Maternity leave for mothers', 'maternity', true, '#EC4899', 4),
('Paternity Leave', 'PATERNITY', 'Paternity leave for fathers', 'paternity', true, '#3B82F6', 5),
('Bereavement Leave', 'BEREAVEMENT', 'Leave for family loss', 'bereavement', true, '#6B7280', 6)
ON CONFLICT (leave_type_code) DO NOTHING;

-- Insert sample accrual rules
INSERT INTO accrual_rules (rule_name, rule_code, leave_type_id, accrual_frequency, accrual_rate, max_balance) VALUES
('Annual Leave Accrual', 'ANNUAL-MONTHLY', 
  (SELECT id FROM leave_types WHERE leave_type_code = 'ANNUAL' LIMIT 1),
  'monthly', 1.67, 20)
ON CONFLICT (rule_code) DO NOTHING;

-- Insert sample holidays
INSERT INTO holidays (holiday_name, holiday_date, holiday_type, year, is_recurring) VALUES
('New Year''s Day', '2026-01-01', 'public', 2026, true),
('Independence Day', '2026-07-04', 'national', 2026, true),
('Christmas Day', '2026-12-25', 'public', 2026, true);

-- Insert sample absence categories
INSERT INTO absence_categories (category_name, category_code, category_type, affects_pay, severity_level) VALUES
('Unexcused Absence', 'UNEXCUSED', 'unauthorized', true, 'high'),
('Medical Emergency', 'MEDICAL-EMERGENCY', 'medical', false, 'low'),
('Personal Emergency', 'PERSONAL-EMERGENCY', 'emergency', false, 'medium')
ON CONFLICT (category_code) DO NOTHING;
