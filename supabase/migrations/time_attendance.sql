-- Time & Attendance Module Schema
-- This migration creates all tables for Time & Attendance management

-- =============================================
-- 1. WORK SCHEDULES
-- =============================================
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_name VARCHAR(100) NOT NULL,
  schedule_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('fixed', 'flexible', 'rotating', 'compressed', 'custom')),
  work_days JSONB NOT NULL DEFAULT '[]', -- Array of work days: [{day: 'monday', start_time: '09:00', end_time: '17:00', break_duration: 60}]
  weekly_hours DECIMAL(5,2) NOT NULL DEFAULT 40.00,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  CONSTRAINT valid_hours CHECK (weekly_hours >= 0 AND weekly_hours <= 168)
);

-- =============================================
-- 2. SHIFT PATTERNS
-- =============================================
CREATE TABLE IF NOT EXISTS shift_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_name VARCHAR(100) NOT NULL,
  shift_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'rotating', 'split')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  is_overnight BOOLEAN DEFAULT FALSE,
  color_code VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for UI display
  premium_rate DECIMAL(5,2) DEFAULT 1.00, -- Multiplier for shift differential pay
  min_staff_required INTEGER DEFAULT 1,
  max_staff_allowed INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  CONSTRAINT valid_staff CHECK (min_staff_required > 0 AND (max_staff_allowed IS NULL OR max_staff_allowed >= min_staff_required))
);

-- =============================================
-- 3. OVERTIME RULES
-- =============================================
CREATE TABLE IF NOT EXISTS overtime_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(100) NOT NULL,
  rule_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN ('daily', 'weekly', 'holiday', 'weekend', 'custom')),
  threshold_hours DECIMAL(5,2) NOT NULL, -- Hours before overtime kicks in
  calculation_method VARCHAR(20) NOT NULL CHECK (calculation_method IN ('hourly', 'daily', 'weekly', 'monthly')),
  rate_multiplier DECIMAL(5,2) NOT NULL DEFAULT 1.5, -- e.g., 1.5 = time and a half
  max_overtime_hours DECIMAL(5,2), -- Maximum OT allowed per period
  requires_approval BOOLEAN DEFAULT TRUE,
  auto_apply BOOLEAN DEFAULT FALSE,
  applicable_days JSONB DEFAULT '["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]',
  employee_groups JSONB DEFAULT '[]', -- Array of department/location IDs
  priority INTEGER DEFAULT 0, -- For rule ordering
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  CONSTRAINT valid_threshold CHECK (threshold_hours >= 0),
  CONSTRAINT valid_multiplier CHECK (rate_multiplier >= 1.0)
);

-- =============================================
-- 4. BREAK POLICIES
-- =============================================
CREATE TABLE IF NOT EXISTS break_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_name VARCHAR(100) NOT NULL,
  policy_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  break_type VARCHAR(20) NOT NULL CHECK (break_type IN ('meal', 'rest', 'paid', 'unpaid', 'mandatory')),
  duration_minutes INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  is_mandatory BOOLEAN DEFAULT TRUE,
  min_shift_duration_minutes INTEGER, -- Minimum shift length to qualify for this break
  occurs_after_minutes INTEGER, -- Break should occur after X minutes of work
  can_be_split BOOLEAN DEFAULT FALSE,
  max_splits INTEGER DEFAULT 1,
  requires_clock_out BOOLEAN DEFAULT FALSE,
  applicable_schedules JSONB DEFAULT '[]', -- Array of work_schedule IDs
  applicable_shifts JSONB DEFAULT '[]', -- Array of shift_pattern IDs
  compliance_requirement TEXT, -- Legal requirement reference
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 240)
);

-- =============================================
-- 5. TIME TRACKING METHODS
-- =============================================
CREATE TABLE IF NOT EXISTS time_tracking_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method_name VARCHAR(100) NOT NULL,
  method_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  tracking_type VARCHAR(30) NOT NULL CHECK (tracking_type IN ('biometric', 'web_clock', 'mobile_app', 'rfid_card', 'manual', 'geofence', 'kiosk')),
  requires_device BOOLEAN DEFAULT FALSE,
  device_requirements JSONB, -- {type: 'fingerprint', models: ['...'], min_version: '1.0'}
  allows_remote_clock_in BOOLEAN DEFAULT FALSE,
  geofence_enabled BOOLEAN DEFAULT FALSE,
  geofence_radius_meters INTEGER,
  geofence_locations JSONB DEFAULT '[]', -- [{lat, lng, radius, name}]
  requires_photo BOOLEAN DEFAULT FALSE,
  requires_location BOOLEAN DEFAULT FALSE,
  ip_restrictions JSONB DEFAULT '[]', -- Array of allowed IP addresses/ranges
  grace_period_minutes INTEGER DEFAULT 0, -- Late clock-in tolerance
  auto_clock_out BOOLEAN DEFAULT FALSE,
  auto_clock_out_after_hours INTEGER DEFAULT 12,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  cost_per_device DECIMAL(10,2),
  monthly_cost DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

-- =============================================
-- 6. ATTENDANCE POLICIES
-- =============================================
CREATE TABLE IF NOT EXISTS attendance_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_name VARCHAR(100) NOT NULL,
  policy_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  policy_type VARCHAR(30) NOT NULL CHECK (policy_type IN ('punctuality', 'absence', 'tardiness', 'early_departure', 'comprehensive')),
  
  -- Tardiness Rules
  late_arrival_threshold_minutes INTEGER DEFAULT 15,
  late_arrival_penalty VARCHAR(20) CHECK (late_arrival_penalty IN ('none', 'warning', 'deduction', 'disciplinary')),
  max_late_arrivals_per_month INTEGER DEFAULT 3,
  
  -- Early Departure Rules
  early_departure_threshold_minutes INTEGER DEFAULT 15,
  early_departure_penalty VARCHAR(20) CHECK (early_departure_penalty IN ('none', 'warning', 'deduction', 'disciplinary')),
  max_early_departures_per_month INTEGER DEFAULT 2,
  
  -- Absence Rules
  max_unexcused_absences_per_month INTEGER DEFAULT 2,
  max_unexcused_absences_per_year INTEGER DEFAULT 10,
  consecutive_absence_limit INTEGER DEFAULT 3,
  requires_medical_certificate_after_days INTEGER DEFAULT 3,
  
  -- Calculation Settings
  rounding_method VARCHAR(20) CHECK (rounding_method IN ('none', 'nearest_15', 'nearest_30', 'up', 'down')) DEFAULT 'nearest_15',
  min_clock_in_time TIME, -- Earliest allowed clock-in
  max_clock_out_time TIME, -- Latest allowed clock-out
  
  -- Notifications
  notify_on_late_clock_in BOOLEAN DEFAULT TRUE,
  notify_on_early_clock_out BOOLEAN DEFAULT TRUE,
  notify_on_missed_clock_out BOOLEAN DEFAULT TRUE,
  notification_recipients JSONB DEFAULT '[]', -- Array of user IDs or 'manager', 'hr'
  
  -- Enforcement
  auto_deduct_pay BOOLEAN DEFAULT FALSE,
  requires_justification BOOLEAN DEFAULT TRUE,
  allow_manual_override BOOLEAN DEFAULT TRUE,
  
  -- Applicability
  applicable_departments JSONB DEFAULT '[]',
  applicable_locations JSONB DEFAULT '[]',
  applicable_employee_types JSONB DEFAULT '[]',
  
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id)
);

-- =============================================
-- 7. EMPLOYEE SCHEDULE ASSIGNMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS employee_schedule_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_schedule_id UUID REFERENCES work_schedules(id) ON DELETE SET NULL,
  shift_pattern_id UUID REFERENCES shift_patterns(id) ON DELETE SET NULL,
  attendance_policy_id UUID REFERENCES attendance_policies(id) ON DELETE SET NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_temporary BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES employees(id),
  CONSTRAINT valid_assignment CHECK (work_schedule_id IS NOT NULL OR shift_pattern_id IS NOT NULL)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_work_schedules_active ON work_schedules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_work_schedules_code ON work_schedules(schedule_code);
CREATE INDEX IF NOT EXISTS idx_work_schedules_type ON work_schedules(schedule_type);

CREATE INDEX IF NOT EXISTS idx_shift_patterns_active ON shift_patterns(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_shift_patterns_code ON shift_patterns(shift_code);
CREATE INDEX IF NOT EXISTS idx_shift_patterns_type ON shift_patterns(shift_type);

CREATE INDEX IF NOT EXISTS idx_overtime_rules_active ON overtime_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_overtime_rules_type ON overtime_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_overtime_rules_priority ON overtime_rules(priority DESC);

CREATE INDEX IF NOT EXISTS idx_break_policies_active ON break_policies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_break_policies_type ON break_policies(break_type);

CREATE INDEX IF NOT EXISTS idx_time_tracking_methods_active ON time_tracking_methods(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_time_tracking_methods_type ON time_tracking_methods(tracking_type);

CREATE INDEX IF NOT EXISTS idx_attendance_policies_active ON attendance_policies(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_attendance_policies_type ON attendance_policies(policy_type);

CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee ON employee_schedule_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_dates ON employee_schedule_assignments(effective_from, effective_to);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedule_assignments ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read, HR admins to manage
CREATE POLICY "Allow read access to authenticated users" ON work_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage work schedules" ON work_schedules FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Allow read access to authenticated users" ON shift_patterns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage shift patterns" ON shift_patterns FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Allow read access to authenticated users" ON overtime_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage overtime rules" ON overtime_rules FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Allow read access to authenticated users" ON break_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage break policies" ON break_policies FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Allow read access to authenticated users" ON time_tracking_methods FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage time tracking methods" ON time_tracking_methods FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Allow read access to authenticated users" ON attendance_policies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow HR admins to manage attendance policies" ON attendance_policies FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);

CREATE POLICY "Allow employees to view own schedule" ON employee_schedule_assignments FOR SELECT TO authenticated USING (
  employee_id = (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);
CREATE POLICY "Allow HR admins to manage employee schedules" ON employee_schedule_assignments FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'hr')
  )
);

-- =============================================
-- TRIGGERS FOR updated_at
-- =============================================
DROP TRIGGER IF EXISTS update_work_schedules_updated_at ON work_schedules;
CREATE TRIGGER update_work_schedules_updated_at BEFORE UPDATE ON work_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shift_patterns_updated_at ON shift_patterns;
CREATE TRIGGER update_shift_patterns_updated_at BEFORE UPDATE ON shift_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_overtime_rules_updated_at ON overtime_rules;
CREATE TRIGGER update_overtime_rules_updated_at BEFORE UPDATE ON overtime_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_break_policies_updated_at ON break_policies;
CREATE TRIGGER update_break_policies_updated_at BEFORE UPDATE ON break_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_time_tracking_methods_updated_at ON time_tracking_methods;
CREATE TRIGGER update_time_tracking_methods_updated_at BEFORE UPDATE ON time_tracking_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_policies_updated_at ON attendance_policies;
CREATE TRIGGER update_attendance_policies_updated_at BEFORE UPDATE ON attendance_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_schedule_assignments_updated_at ON employee_schedule_assignments;
CREATE TRIGGER update_employee_schedule_assignments_updated_at BEFORE UPDATE ON employee_schedule_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================
-- Insert default work schedule
INSERT INTO work_schedules (schedule_name, schedule_code, description, schedule_type, work_days, weekly_hours, is_default, is_active, effective_from) VALUES
('Standard 40-Hour Week', 'STD-40', 'Standard Monday-Friday 9-5 schedule', 'fixed', 
  '[
    {"day": "monday", "start_time": "09:00", "end_time": "17:00", "break_duration": 60},
    {"day": "tuesday", "start_time": "09:00", "end_time": "17:00", "break_duration": 60},
    {"day": "wednesday", "start_time": "09:00", "end_time": "17:00", "break_duration": 60},
    {"day": "thursday", "start_time": "09:00", "end_time": "17:00", "break_duration": 60},
    {"day": "friday", "start_time": "09:00", "end_time": "17:00", "break_duration": 60}
  ]'::jsonb, 
  40.00, true, true, CURRENT_DATE)
ON CONFLICT (schedule_code) DO NOTHING;

-- Insert default shift patterns
INSERT INTO shift_patterns (shift_name, shift_code, description, shift_type, start_time, end_time, duration_minutes, break_duration_minutes, is_active, color_code) VALUES
('Morning Shift', 'SHIFT-MORNING', 'Standard morning shift', 'morning', '06:00', '14:00', 480, 30, true, '#F59E0B'),
('Day Shift', 'SHIFT-DAY', 'Standard day shift', 'morning', '09:00', '17:00', 480, 60, true, '#3B82F6'),
('Evening Shift', 'SHIFT-EVENING', 'Standard evening shift', 'evening', '14:00', '22:00', 480, 30, true, '#8B5CF6'),
('Night Shift', 'SHIFT-NIGHT', 'Standard night shift', 'night', '22:00', '06:00', 480, 30, true, '#1F2937')
ON CONFLICT (shift_code) DO NOTHING;

-- Insert default overtime rule
INSERT INTO overtime_rules (rule_name, rule_code, description, rule_type, threshold_hours, calculation_method, rate_multiplier, requires_approval, is_active, effective_from) VALUES
('Standard Daily OT', 'OT-DAILY-STD', 'Overtime after 8 hours per day', 'daily', 8.00, 'daily', 1.5, true, true, CURRENT_DATE)
ON CONFLICT (rule_code) DO NOTHING;

-- Insert default break policy
INSERT INTO break_policies (policy_name, policy_code, description, break_type, duration_minutes, is_paid, is_mandatory, min_shift_duration_minutes, is_active) VALUES
('Standard Lunch Break', 'BREAK-LUNCH', 'Standard 1-hour lunch break', 'meal', 60, false, true, 360, true),
('15-Minute Rest Break', 'BREAK-REST-15', 'Short paid rest break', 'rest', 15, true, false, 240, true)
ON CONFLICT (policy_code) DO NOTHING;

-- Insert default time tracking method
INSERT INTO time_tracking_methods (method_name, method_code, description, tracking_type, requires_device, allows_remote_clock_in, is_default, is_active) VALUES
('Web Clock', 'TRACK-WEB', 'Clock in/out via web browser', 'web_clock', false, true, true, true)
ON CONFLICT (method_code) DO NOTHING;

-- Insert default attendance policy
INSERT INTO attendance_policies (policy_name, policy_code, description, policy_type, late_arrival_threshold_minutes, max_late_arrivals_per_month, early_departure_threshold_minutes, max_unexcused_absences_per_month, is_default, is_active, effective_from) VALUES
('Standard Attendance Policy', 'ATTEND-STD', 'Default attendance policy for all employees', 'comprehensive', 15, 3, 15, 2, true, true, CURRENT_DATE)
ON CONFLICT (policy_code) DO NOTHING;
