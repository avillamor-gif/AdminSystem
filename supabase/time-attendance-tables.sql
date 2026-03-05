-- =====================================================
-- TIME & ATTENDANCE MANAGEMENT SYSTEM
-- Complete schema for work schedules, shifts, overtime, breaks, and policies
-- =====================================================

-- =====================================================
-- 1. WORK SCHEDULES
-- =====================================================
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(20) CHECK (schedule_type IN ('fixed', 'flexible', 'rotating', 'compressed')),
  hours_per_week DECIMAL(5,2) DEFAULT 40.00,
  days_per_week INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  updated_by UUID REFERENCES employees(id)
);

-- Work schedule days (defines working days and hours)
CREATE TABLE IF NOT EXISTS work_schedule_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  is_working_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  break_minutes INTEGER DEFAULT 60,
  total_hours DECIMAL(4,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employee schedule assignments
CREATE TABLE IF NOT EXISTS employee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  assigned_by UUID REFERENCES employees(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(employee_id, effective_from)
);

-- =====================================================
-- 2. SHIFT PATTERNS
-- =====================================================
CREATE TABLE IF NOT EXISTS shift_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  shift_code VARCHAR(20) UNIQUE,
  shift_type VARCHAR(20) CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night', 'rotating', 'split')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(4,2),
  break_minutes INTEGER DEFAULT 60,
  color_code VARCHAR(7), -- Hex color for calendar display
  is_active BOOLEAN DEFAULT true,
  overnight BOOLEAN DEFAULT false, -- True if shift crosses midnight
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shift assignments
CREATE TABLE IF NOT EXISTS employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shift_patterns(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) CHECK (status IN ('scheduled', 'in_progress', 'completed', 'missed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, shift_date, shift_id)
);

-- =====================================================
-- 3. OVERTIME RULES
-- =====================================================
CREATE TABLE IF NOT EXISTS overtime_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  rule_type VARCHAR(30) CHECK (rule_type IN ('daily', 'weekly', 'monthly', 'holiday', 'weekend')),
  threshold_hours DECIMAL(5,2), -- Hours after which overtime applies
  multiplier DECIMAL(4,2) DEFAULT 1.5, -- Pay multiplier (1.5x, 2.0x, etc.)
  applies_to VARCHAR(20) CHECK (applies_to IN ('all', 'non_exempt', 'hourly')),
  requires_approval BOOLEAN DEFAULT true,
  auto_calculate BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- For rule precedence
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Overtime records
CREATE TABLE IF NOT EXISTS overtime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES overtime_rules(id),
  overtime_date DATE NOT NULL,
  regular_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2),
  multiplier DECIMAL(4,2),
  reason TEXT,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. BREAK POLICIES
-- =====================================================
CREATE TABLE IF NOT EXISTS break_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  break_type VARCHAR(20) CHECK (break_type IN ('meal', 'rest', 'prayer', 'smoking', 'custom')),
  duration_minutes INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  is_mandatory BOOLEAN DEFAULT true,
  minimum_shift_hours DECIMAL(4,2), -- Minimum hours worked to qualify
  applies_after_hours DECIMAL(4,2), -- Break applies after X hours
  max_breaks_per_day INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Break records
CREATE TABLE IF NOT EXISTS break_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES break_policies(id),
  break_date DATE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  break_type VARCHAR(20),
  location VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TIME TRACKING METHODS
-- =====================================================
CREATE TABLE IF NOT EXISTS time_tracking_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  method_type VARCHAR(30) CHECK (method_type IN ('biometric', 'rfid', 'mobile_app', 'web_portal', 'manual', 'geofence', 'qr_code')),
  requires_photo BOOLEAN DEFAULT false,
  requires_location BOOLEAN DEFAULT false,
  geofence_radius_meters INTEGER,
  geofence_latitude DECIMAL(10,8),
  geofence_longitude DECIMAL(11,8),
  allowed_ip_addresses TEXT[], -- Array of allowed IPs
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Time tracking logs (detailed punch records)
CREATE TABLE IF NOT EXISTS time_tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  method_id UUID REFERENCES time_tracking_methods(id),
  punch_type VARCHAR(20) CHECK (punch_type IN ('clock_in', 'clock_out', 'break_start', 'break_end')),
  punch_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  location_latitude DECIMAL(10,8),
  location_longitude DECIMAL(11,8),
  ip_address VARCHAR(45),
  device_info TEXT,
  photo_url TEXT,
  notes TEXT,
  is_manual BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES employees(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. ATTENDANCE POLICIES
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  policy_type VARCHAR(30) CHECK (policy_type IN ('punctuality', 'absence', 'tardiness', 'early_departure', 'general')),
  
  -- Tardiness rules
  late_threshold_minutes INTEGER DEFAULT 15,
  late_action VARCHAR(30) CHECK (late_action IN ('warning', 'deduction', 'half_day', 'nothing')),
  grace_period_minutes INTEGER DEFAULT 5,
  
  -- Absence rules
  max_consecutive_absences INTEGER DEFAULT 3,
  absence_requires_proof BOOLEAN DEFAULT true,
  proof_required_after_days INTEGER DEFAULT 1,
  
  -- Early departure rules
  early_departure_threshold_minutes INTEGER DEFAULT 30,
  requires_manager_approval BOOLEAN DEFAULT true,
  
  -- General settings
  min_hours_for_full_day DECIMAL(4,2) DEFAULT 8.00,
  min_hours_for_half_day DECIMAL(4,2) DEFAULT 4.00,
  auto_mark_absent_if_no_punch BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy assignments
CREATE TABLE IF NOT EXISTS employee_attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES attendance_policies(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  assigned_by UUID REFERENCES employees(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, policy_id, effective_from)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_work_schedules_active ON work_schedules(is_active, is_default);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee ON employee_schedules(employee_id, effective_from);
CREATE INDEX IF NOT EXISTS idx_shift_patterns_active ON shift_patterns(is_active, shift_type);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_date ON employee_shifts(employee_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_overtime_rules_active ON overtime_rules(is_active, rule_type);
CREATE INDEX IF NOT EXISTS idx_overtime_records_employee ON overtime_records(employee_id, overtime_date);
CREATE INDEX IF NOT EXISTS idx_break_policies_active ON break_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_break_records_employee ON break_records(employee_id, break_date);
CREATE INDEX IF NOT EXISTS idx_time_tracking_methods_active ON time_tracking_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_time_tracking_logs_employee ON time_tracking_logs(employee_id, punch_time);
CREATE INDEX IF NOT EXISTS idx_attendance_policies_active ON attendance_policies(is_active);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedule_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_tracking_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_attendance_policies ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Sample work schedules
INSERT INTO work_schedules (name, description, schedule_type, hours_per_week, days_per_week, is_default) VALUES
  ('Standard 40-Hour Week', 'Monday to Friday, 9 AM - 5 PM', 'fixed', 40.00, 5, true),
  ('Flexible 4-Day Week', 'Monday to Thursday, 10 hours per day', 'compressed', 40.00, 4, false),
  ('Part-Time 20 Hours', 'Monday to Friday, 4 hours per day', 'flexible', 20.00, 5, false)
ON CONFLICT DO NOTHING;

-- Sample shift patterns
INSERT INTO shift_patterns (name, description, shift_code, shift_type, start_time, end_time, duration_hours, color_code) VALUES
  ('Morning Shift', '6 AM - 2 PM', 'MOR', 'morning', '06:00:00', '14:00:00', 8.00, '#3B82F6'),
  ('Afternoon Shift', '2 PM - 10 PM', 'AFT', 'afternoon', '14:00:00', '22:00:00', 8.00, '#F59E0B'),
  ('Night Shift', '10 PM - 6 AM', 'NGT', 'night', '22:00:00', '06:00:00', 8.00, '#6366F1'),
  ('Standard Day', '9 AM - 5 PM', 'STD', 'morning', '09:00:00', '17:00:00', 8.00, '#10B981')
ON CONFLICT (shift_code) DO NOTHING;

-- Sample overtime rules
INSERT INTO overtime_rules (name, description, rule_type, threshold_hours, multiplier, applies_to) VALUES
  ('Daily Overtime', 'Overtime after 8 hours in a day', 'daily', 8.00, 1.5, 'all'),
  ('Weekend Overtime', 'Double pay for weekend work', 'weekend', 0.00, 2.0, 'all'),
  ('Holiday Overtime', 'Triple pay for holiday work', 'holiday', 0.00, 3.0, 'all'),
  ('Weekly Overtime', 'Overtime after 40 hours in a week', 'weekly', 40.00, 1.5, 'non_exempt')
ON CONFLICT DO NOTHING;

-- Sample break policies
INSERT INTO break_policies (name, description, break_type, duration_minutes, is_paid, minimum_shift_hours) VALUES
  ('Lunch Break', '1 hour unpaid lunch break', 'meal', 60, false, 6.00),
  ('Morning Coffee Break', '15 minute paid break', 'rest', 15, true, 4.00),
  ('Afternoon Coffee Break', '15 minute paid break', 'rest', 15, true, 6.00),
  ('Prayer Break', 'Religious observance break', 'prayer', 15, true, 4.00)
ON CONFLICT DO NOTHING;

-- Sample time tracking methods
INSERT INTO time_tracking_methods (name, description, method_type, requires_location) VALUES
  ('Mobile App Check-In', 'Check in via mobile application', 'mobile_app', true),
  ('Web Portal', 'Check in via company website', 'web_portal', false),
  ('Biometric Scanner', 'Fingerprint or facial recognition', 'biometric', false),
  ('RFID Badge', 'RFID card scanner at entrance', 'rfid', false)
ON CONFLICT DO NOTHING;

-- Sample attendance policy
INSERT INTO attendance_policies (name, description, policy_type, late_threshold_minutes, grace_period_minutes) VALUES
  ('Standard Attendance Policy', 'Default policy for all employees', 'general', 15, 5),
  ('Strict Punctuality Policy', 'Zero tolerance for tardiness', 'punctuality', 1, 0),
  ('Flexible Policy', 'Lenient policy for remote workers', 'general', 30, 15)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE work_schedules IS 'Defines standard work schedules (e.g., 9-5, 4-day week)';
COMMENT ON TABLE shift_patterns IS 'Defines shift types and timings';
COMMENT ON TABLE overtime_rules IS 'Rules for calculating overtime pay';
COMMENT ON TABLE break_policies IS 'Break/meal period policies';
COMMENT ON TABLE time_tracking_methods IS 'Available methods for time tracking';
COMMENT ON TABLE attendance_policies IS 'Attendance and punctuality policies';
