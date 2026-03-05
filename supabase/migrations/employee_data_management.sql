-- Migration: Add Employee Data Management Tables
-- Run this in your Supabase SQL Editor

-- Employee Attachments/Documents
CREATE TABLE IF NOT EXISTS employee_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  mime_type VARCHAR(100),
  description TEXT,
  document_type VARCHAR(100), -- 'contract', 'certificate', 'performance_review', 'disciplinary', etc.
  uploaded_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  retention_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Fields Configuration
CREATE TABLE IF NOT EXISTS employee_custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_name VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'date', 'number', 'select', 'multi_select', 'textarea', 'checkbox', 'url')),
  category VARCHAR(100) CHECK (category IN ('personal', 'contact', 'job', 'emergency', 'education', 'certification', 'custom')),
  options JSONB DEFAULT '[]',
  validation_rules JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT FALSE,
  is_searchable BOOLEAN DEFAULT TRUE,
  show_in_profile BOOLEAN DEFAULT TRUE,
  show_in_list BOOLEAN DEFAULT FALSE,
  show_in_reports BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Field Values
CREATE TABLE IF NOT EXISTS employee_custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES employee_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, field_id)
);

-- PIM Field Configuration
CREATE TABLE IF NOT EXISTS pim_field_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_name VARCHAR(255) NOT NULL UNIQUE,
  field_label VARCHAR(255) NOT NULL,
  field_group VARCHAR(100) NOT NULL CHECK (field_group IN ('basic', 'contact', 'job', 'personal', 'emergency', 'documents')),
  is_visible BOOLEAN DEFAULT TRUE,
  is_required BOOLEAN DEFAULT FALSE,
  is_editable BOOLEAN DEFAULT TRUE,
  is_sensitive BOOLEAN DEFAULT FALSE,
  access_level VARCHAR(50) DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'restricted', 'confidential')),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Import History
CREATE TABLE IF NOT EXISTS employee_data_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT,
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed', 'cancelled')),
  error_log JSONB DEFAULT '[]',
  imported_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Termination Requests
CREATE TABLE IF NOT EXISTS termination_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  termination_type VARCHAR(100) CHECK (termination_type IN ('voluntary_resignation', 'retirement', 'contract_end', 'termination_with_cause', 'termination_without_cause', 'layoff', 'mutual_agreement')),
  termination_reason TEXT NOT NULL,
  proposed_last_working_date DATE NOT NULL,
  actual_last_working_date DATE,
  notice_period_days INTEGER,
  notice_date DATE,
  initiated_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  exit_interview_scheduled BOOLEAN DEFAULT FALSE,
  exit_interview_completed BOOLEAN DEFAULT FALSE,
  clearance_completed BOOLEAN DEFAULT FALSE,
  final_settlement_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exit Interviews
CREATE TABLE IF NOT EXISTS exit_interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  termination_request_id UUID NOT NULL REFERENCES termination_requests(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  scheduled_date DATE,
  completed_date DATE,
  interviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  would_recommend_company BOOLEAN,
  reason_for_leaving TEXT,
  likes_about_company TEXT,
  dislikes_about_company TEXT,
  suggestions_for_improvement TEXT,
  career_goals TEXT,
  additional_comments TEXT,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_attachments_employee ON employee_attachments(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_attachments_type ON employee_attachments(document_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_category ON employee_custom_fields(category);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_employee ON employee_custom_field_values(employee_id);
CREATE INDEX IF NOT EXISTS idx_custom_field_values_field ON employee_custom_field_values(field_id);
CREATE INDEX IF NOT EXISTS idx_pim_field_config_group ON pim_field_config(field_group);
CREATE INDEX IF NOT EXISTS idx_data_imports_status ON employee_data_imports(status);
CREATE INDEX IF NOT EXISTS idx_data_imports_date ON employee_data_imports(created_at);
CREATE INDEX IF NOT EXISTS idx_termination_requests_employee ON termination_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_termination_requests_status ON termination_requests(status);
CREATE INDEX IF NOT EXISTS idx_termination_requests_date ON termination_requests(proposed_last_working_date);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_termination ON exit_interviews(termination_request_id);
CREATE INDEX IF NOT EXISTS idx_exit_interviews_status ON exit_interviews(status);

-- RLS Policies
ALTER TABLE employee_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE pim_field_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own attachments" ON employee_attachments;
DROP POLICY IF EXISTS "Users can upload their own attachments" ON employee_attachments;
DROP POLICY IF EXISTS "HR can manage all attachments" ON employee_attachments;
DROP POLICY IF EXISTS "Authenticated users can read custom fields" ON employee_custom_fields;
DROP POLICY IF EXISTS "HR can manage custom fields" ON employee_custom_fields;
DROP POLICY IF EXISTS "Users can view their own custom field values" ON employee_custom_field_values;
DROP POLICY IF EXISTS "HR can manage custom field values" ON employee_custom_field_values;
DROP POLICY IF EXISTS "Authenticated users can read PIM config" ON pim_field_config;
DROP POLICY IF EXISTS "HR can manage PIM config" ON pim_field_config;
DROP POLICY IF EXISTS "HR can view data imports" ON employee_data_imports;
DROP POLICY IF EXISTS "HR can manage data imports" ON employee_data_imports;
DROP POLICY IF EXISTS "Users can view their own termination requests" ON termination_requests;
DROP POLICY IF EXISTS "HR can manage termination requests" ON termination_requests;
DROP POLICY IF EXISTS "Users can view their own exit interviews" ON exit_interviews;
DROP POLICY IF EXISTS "HR can manage exit interviews" ON exit_interviews;

-- Employee Attachments Policies
CREATE POLICY "Users can view their own attachments"
  ON employee_attachments FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "Users can upload their own attachments"
  ON employee_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "HR can manage all attachments"
  ON employee_attachments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Custom Fields Policies
CREATE POLICY "Authenticated users can read custom fields"
  ON employee_custom_fields FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR can manage custom fields"
  ON employee_custom_fields FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Custom Field Values Policies
CREATE POLICY "Users can view their own custom field values"
  ON employee_custom_field_values FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "HR can manage custom field values"
  ON employee_custom_field_values FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- PIM Config Policies
CREATE POLICY "Authenticated users can read PIM config"
  ON pim_field_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR can manage PIM config"
  ON pim_field_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Data Imports Policies
CREATE POLICY "HR can view data imports"
  ON employee_data_imports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "HR can manage data imports"
  ON employee_data_imports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Termination Requests Policies
CREATE POLICY "Users can view their own termination requests"
  ON termination_requests FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "HR can manage termination requests"
  ON termination_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Exit Interviews Policies
CREATE POLICY "Users can view their own exit interviews"
  ON exit_interviews FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "HR can manage exit interviews"
  ON exit_interviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Triggers (reuse existing function)
DROP TRIGGER IF EXISTS update_employee_attachments_updated_at ON employee_attachments;
CREATE TRIGGER update_employee_attachments_updated_at BEFORE UPDATE ON employee_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_custom_fields_updated_at ON employee_custom_fields;
CREATE TRIGGER update_employee_custom_fields_updated_at BEFORE UPDATE ON employee_custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employee_custom_field_values_updated_at ON employee_custom_field_values;
CREATE TRIGGER update_employee_custom_field_values_updated_at BEFORE UPDATE ON employee_custom_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pim_field_config_updated_at ON pim_field_config;
CREATE TRIGGER update_pim_field_config_updated_at BEFORE UPDATE ON pim_field_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_termination_requests_updated_at ON termination_requests;
CREATE TRIGGER update_termination_requests_updated_at BEFORE UPDATE ON termination_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exit_interviews_updated_at ON exit_interviews;
CREATE TRIGGER update_exit_interviews_updated_at BEFORE UPDATE ON exit_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default PIM configurations (only if table is empty and columns match)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pim_field_config LIMIT 1) AND 
     EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pim_field_config' AND column_name = 'field_label') THEN
    INSERT INTO pim_field_config (field_name, field_label, field_group, is_visible, is_required, is_editable, is_sensitive, access_level, display_order) VALUES
      ('employee_id', 'Employee ID', 'basic', true, true, false, false, 'internal', 1),
      ('first_name', 'First Name', 'basic', true, true, true, false, 'internal', 2),
      ('last_name', 'Last Name', 'basic', true, true, true, false, 'internal', 3),
      ('email', 'Email Address', 'contact', true, true, true, false, 'internal', 4),
      ('phone', 'Phone Number', 'contact', true, false, true, false, 'internal', 5),
      ('date_of_birth', 'Date of Birth', 'personal', true, false, true, true, 'restricted', 6),
      ('hire_date', 'Hire Date', 'job', true, true, true, false, 'internal', 7),
      ('department', 'Department', 'job', true, true, true, false, 'internal', 8),
      ('job_title', 'Job Title', 'job', true, true, true, false, 'internal', 9),
      ('manager', 'Manager', 'job', true, false, true, false, 'internal', 10),
      ('location', 'Office Location', 'job', true, false, true, false, 'internal', 11),
      ('address', 'Home Address', 'personal', true, false, true, true, 'restricted', 12),
      ('city', 'City', 'personal', true, false, true, false, 'internal', 13),
      ('country', 'Country', 'personal', true, false, true, false, 'internal', 14),
      ('emergency_contact_name', 'Emergency Contact Name', 'emergency', true, false, true, true, 'confidential', 15),
      ('emergency_contact_phone', 'Emergency Contact Phone', 'emergency', true, false, true, true, 'confidential', 16);
  END IF;
END $$;
