-- Employee Data Management - Custom Fields & PIM Configuration
-- This schema supports custom employee fields, PIM configuration, and data management

-- =====================================================
-- 1. CUSTOM EMPLOYEE FIELDS
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  field_key VARCHAR(100) UNIQUE NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'date', 'number', 'select', 'multi_select', 'textarea', 'checkbox', 'url', 'file')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('personal', 'contact', 'job', 'emergency', 'education', 'certification', 'custom', 'dependents', 'immigration', 'assets', 'qualifications', 'security')),
  description TEXT,
  required BOOLEAN DEFAULT FALSE,
  visible BOOLEAN DEFAULT TRUE,
  editable BOOLEAN DEFAULT TRUE,
  searchable BOOLEAN DEFAULT FALSE,
  show_in_profile BOOLEAN DEFAULT TRUE,
  show_in_list BOOLEAN DEFAULT FALSE,
  field_order INTEGER DEFAULT 0,
  options JSONB, -- For select/multi_select types
  validation_rules JSONB, -- Min/max length, regex, etc.
  default_value TEXT,
  help_text TEXT,
  placeholder TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_category ON employee_custom_fields(category);
CREATE INDEX IF NOT EXISTS idx_custom_fields_status ON employee_custom_fields(status);
CREATE INDEX IF NOT EXISTS idx_custom_fields_order ON employee_custom_fields(field_order);

-- =====================================================
-- 2. EMPLOYEE CUSTOM FIELD VALUES
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES employee_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  value_array TEXT[], -- For multi_select
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_values_employee ON employee_custom_field_values(employee_id);
CREATE INDEX IF NOT EXISTS idx_custom_values_field ON employee_custom_field_values(field_id);

-- =====================================================
-- 3. PIM FIELD CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS pim_field_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'first_name', 'email', 'phone'
  display_name VARCHAR(255) NOT NULL,
  field_group VARCHAR(50) NOT NULL CHECK (field_group IN ('basic', 'contact', 'job', 'personal', 'emergency', 'documents', 'salary', 'benefits', 'dependents', 'immigration', 'assets', 'qualifications', 'security')),
  is_required BOOLEAN DEFAULT FALSE,
  is_visible BOOLEAN DEFAULT TRUE,
  is_editable BOOLEAN DEFAULT TRUE,
  is_sensitive BOOLEAN DEFAULT FALSE, -- Requires special permissions to view
  show_in_employee_list BOOLEAN DEFAULT TRUE,
  show_in_employee_profile BOOLEAN DEFAULT TRUE,
  show_in_reports BOOLEAN DEFAULT TRUE,
  field_order INTEGER DEFAULT 0,
  access_level VARCHAR(20) DEFAULT 'public' CHECK (access_level IN ('public', 'internal', 'restricted', 'confidential')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pim_config_group ON pim_field_config(field_group);
CREATE INDEX IF NOT EXISTS idx_pim_config_order ON pim_field_config(field_order);

-- =====================================================
-- 4. DATA IMPORT/EXPORT LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('bulk_create', 'bulk_update', 'csv_import', 'excel_import', 'api_sync')),
  file_name VARCHAR(255),
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_log JSONB,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partially_completed')),
  imported_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imports_status ON employee_data_imports(status);
CREATE INDEX IF NOT EXISTS idx_imports_date ON employee_data_imports(created_at);

-- =====================================================
-- 5. EMPLOYEE REPORTING FIELDS
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_reporting_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(255) NOT NULL,
  field_mapping JSONB NOT NULL, -- Map of field names to display labels
  filters JSONB, -- Saved filter configurations
  sort_order JSONB, -- Saved sort configurations
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. EMPLOYEE PROFILE TEMPLATES
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_profile_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('onboarding', 'contractor', 'intern', 'executive', 'custom')),
  required_fields TEXT[] NOT NULL,
  optional_fields TEXT[],
  default_values JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. VIEWS
-- =====================================================

-- Employee Full Profile View with Custom Fields
CREATE OR REPLACE VIEW employee_full_profiles AS
SELECT 
  e.*,
  d.name as department_name,
  jt.title as job_title_name,
  m.first_name || ' ' || m.last_name as manager_name,
  (
    SELECT jsonb_object_agg(
      cf.field_key,
      jsonb_build_object(
        'value', cfv.value,
        'field_name', cf.name,
        'field_type', cf.field_type,
        'category', cf.category
      )
    )
    FROM employee_custom_field_values cfv
    JOIN employee_custom_fields cf ON cfv.field_id = cf.id
    WHERE cfv.employee_id = e.id AND cf.status = 'active'
  ) as custom_fields
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN job_titles jt ON e.job_title_id = jt.id
LEFT JOIN employees m ON e.manager_id = m.id;

-- =====================================================
-- 8. SAMPLE DATA
-- =====================================================

-- Insert default PIM field configurations
INSERT INTO pim_field_config (field_name, display_name, field_group, is_required, is_sensitive, field_order) VALUES
  ('first_name', 'First Name', 'basic', true, false, 1),
  ('last_name', 'Last Name', 'basic', true, false, 2),
  ('email', 'Email Address', 'contact', true, false, 3),
  ('phone', 'Phone Number', 'contact', false, false, 4),
  ('date_of_birth', 'Date of Birth', 'personal', false, true, 5),
  ('hire_date', 'Hire Date', 'job', true, false, 6),
  ('salary', 'Salary', 'salary', false, true, 7),
  ('emergency_contact_name', 'Emergency Contact Name', 'emergency', false, false, 8),
  ('emergency_contact_phone', 'Emergency Contact Phone', 'emergency', false, false, 9)
ON CONFLICT (field_name) DO NOTHING;

-- Insert sample custom field
INSERT INTO employee_custom_fields (name, field_key, field_type, category, description, options) VALUES
  ('T-Shirt Size', 'tshirt_size', 'select', 'custom', 'Employee t-shirt size for company events', 
   '{"options": ["XS", "S", "M", "L", "XL", "XXL"]}'::jsonb),
  ('LinkedIn Profile', 'linkedin_url', 'url', 'contact', 'Employee LinkedIn profile URL', null),
  ('Preferred Name', 'preferred_name', 'text', 'personal', 'Name employee prefers to be called', null)
ON CONFLICT (field_key) DO NOTHING;

-- =====================================================
-- 9. DISABLE RLS FOR DEVELOPMENT
-- =====================================================

ALTER TABLE employee_custom_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_custom_field_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE pim_field_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_data_imports DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_reporting_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_profile_templates DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE employee_custom_fields IS 'Custom fields definition for employee profiles';
COMMENT ON TABLE employee_custom_field_values IS 'Values for custom employee fields';
COMMENT ON TABLE pim_field_config IS 'PIM field visibility and access configuration';
COMMENT ON TABLE employee_data_imports IS 'Log of employee data imports and bulk operations';
