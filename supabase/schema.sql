-- HRM System Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types if they exist
DROP TYPE IF EXISTS employee_status CASCADE;
DROP TYPE IF EXISTS leave_status CASCADE;
DROP TYPE IF EXISTS attendance_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS vacancy_status CASCADE;
DROP TYPE IF EXISTS candidate_status CASCADE;
DROP TYPE IF EXISTS review_status CASCADE;
DROP TYPE IF EXISTS goal_status CASCADE;
DROP TYPE IF EXISTS goal_priority CASCADE;

-- Enums
CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'half_day', 'on_leave');
CREATE TYPE user_role AS ENUM ('admin', 'hr', 'manager', 'employee');

-- Drop existing tables if they exist
DROP TABLE IF EXISTS kpis CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS performance_reviews CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS candidates CASCADE;
DROP TABLE IF EXISTS vacancies CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS job_categories CASCADE;
DROP TABLE IF EXISTS employment_types CASCADE;
DROP TABLE IF EXISTS job_titles CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Location Types
CREATE TABLE location_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Locations
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  location_type VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  state VARCHAR(100),
  address TEXT,
  address_line_2 TEXT,
  postal_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  is_headquarters BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Titles
CREATE TABLE job_titles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  min_salary DECIMAL(12, 2),
  max_salary DECIMAL(12, 2),
  employment_type VARCHAR(50),
  experience_level VARCHAR(50),
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  date_of_birth DATE,
  hire_date DATE NOT NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL,
  job_specification_id UUID REFERENCES job_descriptions(id) ON DELETE SET NULL,
  employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL,
  manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  work_location_type VARCHAR(20) CHECK (work_location_type IN ('office', 'remote', 'hybrid', 'field')),
  remote_location TEXT,
  status employee_status DEFAULT 'active',
  avatar_url TEXT,
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles (links Supabase auth users to employees)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Leave Types
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  days_allowed INTEGER NOT NULL DEFAULT 0,
  carry_forward BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leave Requests
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4,2) NOT NULL,
  status leave_status DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_days CHECK (total_days > 0)
);

-- Attendance Records
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  status attendance_status DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Indexes for performance
CREATE INDEX idx_locations_country ON locations(country);
CREATE INDEX idx_locations_status ON locations(status);
CREATE INDEX idx_locations_type ON locations(location_type);
CREATE INDEX idx_location_types_code ON location_types(code);
CREATE INDEX idx_location_types_status ON location_types(status);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_manager ON employees(manager_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);

-- Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users (basic - customize as needed)
CREATE POLICY "Authenticated users can read employees"
  ON employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage employees"
  ON employees FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Authenticated users can read departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Authenticated users can read job titles"
  ON job_titles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read leave types"
  ON leave_types FOR SELECT
  TO authenticated
  USING (true);

-- Leave Requests Policies (Simplified - allow all authenticated users for now)
CREATE POLICY "Allow authenticated users to read leave requests"
  ON leave_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete leave requests"
  ON leave_requests FOR DELETE
  TO authenticated
  USING (true);

-- Locations Policies
CREATE POLICY "Authenticated users can read locations"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Location Types Policies
CREATE POLICY "Authenticated users can read location types"
  ON location_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage location types"
  ON location_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- User Roles Policies (CRITICAL - allows users to read their own role)
-- Simple policy: all authenticated users can read user_roles table
-- This is safe because users need to know their role to use the app
CREATE POLICY "Users can read user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Only admins and HR can insert/update/delete roles
CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Users can view their own leave requests"
  ON leave_requests FOR SELECT
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

CREATE POLICY "Users can create their own leave requests"
  ON leave_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own attendance"
  ON attendance_records FOR SELECT
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

-- Insert default data
INSERT INTO leave_types (name, days_allowed, carry_forward, description) VALUES
  ('Annual Leave', 20, true, 'Standard annual vacation days'),
  ('Sick Leave', 10, false, 'Medical leave'),
  ('Maternity Leave', 90, false, 'Maternity leave for new mothers'),
  ('Paternity Leave', 14, false, 'Paternity leave for new fathers'),
  ('Unpaid Leave', 0, false, 'Unpaid time off');

INSERT INTO departments (name, description) VALUES
  ('Engineering', 'Software development and engineering'),
  ('Human Resources', 'HR and people operations'),
  ('Marketing', 'Marketing and communications'),
  ('Sales', 'Sales and business development'),
  ('Finance', 'Finance and accounting');

INSERT INTO job_titles (title, description, min_salary, max_salary) VALUES
  ('Software Engineer', 'Develops and maintains software', 60000, 120000),
  ('Senior Software Engineer', 'Senior development role', 100000, 180000),
  ('Product Manager', 'Manages product development', 90000, 160000),
  ('HR Manager', 'Manages HR operations', 70000, 130000),
  ('Sales Representative', 'Handles sales activities', 50000, 100000);

-- ============================================
-- RECRUITMENT MODULE TABLES
-- ============================================

-- Enums for Recruitment
CREATE TYPE vacancy_status AS ENUM ('open', 'closed', 'on_hold', 'filled');
CREATE TYPE candidate_status AS ENUM ('application_initiated', 'shortlisted', 'interview_scheduled', 'hired', 'rejected');

-- Vacancies
CREATE TABLE vacancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL,
  hiring_manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  description TEXT,
  requirements TEXT,
  num_positions INTEGER DEFAULT 1,
  status vacancy_status DEFAULT 'open',
  published_date DATE,
  closing_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Candidates
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacancy_id UUID REFERENCES vacancies(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  resume_url TEXT,
  cover_letter TEXT,
  status candidate_status DEFAULT 'application_initiated',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Interviews
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  interview_type VARCHAR(50), -- 'phone', 'video', 'in_person', 'panel'
  location TEXT,
  notes TEXT,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PERFORMANCE MODULE TABLES
-- ============================================

-- Enums for Performance
CREATE TYPE review_status AS ENUM ('draft', 'pending', 'in_progress', 'completed');
CREATE TYPE goal_status AS ENUM ('not_started', 'in_progress', 'achieved', 'cancelled');
CREATE TYPE goal_priority AS ENUM ('low', 'medium', 'high');

-- Performance Reviews
CREATE TABLE performance_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  review_period VARCHAR(50), -- e.g., 'Q1 2024', '2024 Annual'
  due_date DATE,
  completed_date DATE,
  status review_status DEFAULT 'pending',
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  employee_comments TEXT,
  reviewer_comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority goal_priority DEFAULT 'medium',
  status goal_status DEFAULT 'not_started',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  review_id UUID REFERENCES performance_reviews(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPIs (Key Performance Indicators)
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_value DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  unit VARCHAR(50), -- e.g., '%', 'count', 'currency'
  period VARCHAR(50), -- e.g., 'monthly', 'quarterly', 'annual'
  review_id UUID REFERENCES performance_reviews(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR NEW TABLES
-- ============================================
CREATE INDEX idx_vacancies_status ON vacancies(status);
CREATE INDEX idx_vacancies_department ON vacancies(department_id);
CREATE INDEX idx_candidates_vacancy ON candidates(vacancy_id);
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_interviews_candidate ON interviews(candidate_id);
CREATE INDEX idx_interviews_scheduled ON interviews(scheduled_at);
CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id);
CREATE INDEX idx_performance_reviews_status ON performance_reviews(status);
CREATE INDEX idx_goals_employee ON goals(employee_id);
CREATE INDEX idx_goals_status ON goals(status);

-- ============================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================
ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vacancies"
  ON vacancies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR can manage vacancies"
  ON vacancies FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Authenticated users can read candidates"
  ON candidates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "HR can manage candidates"
  ON candidates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Employment Types
CREATE TABLE employment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('permanent', 'temporary', 'contract', 'intern', 'volunteer', 'consultant')),
  is_active BOOLEAN DEFAULT TRUE,
  benefits JSONB DEFAULT '{}',
  working_conditions JSONB DEFAULT '{}',
  contract_details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Categories
CREATE TABLE job_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES job_categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_employment_types_category ON employment_types(category);
CREATE INDEX idx_employment_types_active ON employment_types(is_active);
CREATE INDEX idx_job_categories_parent ON job_categories(parent_id);
CREATE INDEX idx_job_categories_active ON job_categories(is_active);

-- RLS Policies
ALTER TABLE employment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read employment types"
  ON employment_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage employment types"
  ON employment_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Authenticated users can read job categories"
  ON job_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage job categories"
  ON job_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Users can view their own performance reviews"
  ON performance_reviews FOR SELECT
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

CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
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

CREATE POLICY "Users can manage their own goals"
  ON goals FOR ALL
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Job & Position Management Tables
-- ============================================

-- Pay Grades Table
CREATE TABLE pay_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  level INTEGER NOT NULL,
  min_salary DECIMAL(12, 2) NOT NULL,
  max_salary DECIMAL(12, 2) NOT NULL,
  mid_point DECIMAL(12, 2) GENERATED ALWAYS AS ((min_salary + max_salary) / 2) STORED,
  currency VARCHAR(3) DEFAULT 'USD',
  employee_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Descriptions Table
CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title_id UUID REFERENCES job_titles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(255),
  summary TEXT,
  responsibilities JSONB DEFAULT '[]',
  qualifications JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  experience_required VARCHAR(100),
  education_required VARCHAR(255),
  employment_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Salary Structures Table
CREATE TABLE salary_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  pay_grade_id UUID REFERENCES pay_grades(id) ON DELETE SET NULL,
  base_salary DECIMAL(12, 2) NOT NULL,
  components JSONB DEFAULT '[]',
  total_compensation DECIMAL(12, 2) NOT NULL,
  effective_date DATE NOT NULL,
  end_date DATE,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Paths Table
CREATE TABLE career_paths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  levels JSONB DEFAULT '[]',
  total_duration VARCHAR(100),
  employees_on_path INTEGER DEFAULT 0,
  skills_required JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Job Management Tables
CREATE INDEX idx_pay_grades_level ON pay_grades(level);
CREATE INDEX idx_pay_grades_status ON pay_grades(status);
CREATE INDEX idx_job_descriptions_title ON job_descriptions(job_title_id);
CREATE INDEX idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX idx_salary_structures_pay_grade ON salary_structures(pay_grade_id);
CREATE INDEX idx_salary_structures_effective_date ON salary_structures(effective_date);
CREATE INDEX idx_salary_structures_status ON salary_structures(status);
CREATE INDEX idx_career_paths_category ON career_paths(category);
CREATE INDEX idx_career_paths_status ON career_paths(status);

-- RLS Policies for Job Management Tables
ALTER TABLE pay_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_paths ENABLE ROW LEVEL SECURITY;

-- Pay Grades Policies
CREATE POLICY "Authenticated users can read pay grades"
  ON pay_grades FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage pay grades"
  ON pay_grades FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Job Descriptions Policies
CREATE POLICY "Authenticated users can read job descriptions"
  ON job_descriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage job descriptions"
  ON job_descriptions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Salary Structures Policies
CREATE POLICY "Admins can read salary structures"
  ON salary_structures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins can manage salary structures"
  ON salary_structures FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Career Paths Policies
CREATE POLICY "Authenticated users can read career paths"
  ON career_paths FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage career paths"
  ON career_paths FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pay_grades_updated_at BEFORE UPDATE ON pay_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_descriptions_updated_at BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_structures_updated_at BEFORE UPDATE ON salary_structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_paths_updated_at BEFORE UPDATE ON career_paths
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- EMPLOYEE DATA MANAGEMENT TABLES
-- ============================================

-- Employee Attachments/Documents
CREATE TABLE employee_attachments (
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
CREATE TABLE employee_custom_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_name VARCHAR(255) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'email', 'phone', 'date', 'number', 'select', 'multi_select', 'textarea', 'checkbox', 'url')),
  category VARCHAR(100) CHECK (category IN ('personal', 'contact', 'job', 'emergency', 'education', 'certification', 'custom')),
  options JSONB DEFAULT '[]', -- For select/multi_select types
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
CREATE TABLE employee_custom_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES employee_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, field_id)
);

-- PIM (Personal Information Management) Field Configuration
CREATE TABLE pim_field_config (
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
CREATE TABLE employee_data_imports (
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
CREATE TABLE termination_requests (
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
CREATE TABLE exit_interviews (
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

-- Indexes for Employee Data Management
CREATE INDEX idx_employee_attachments_employee ON employee_attachments(employee_id);
CREATE INDEX idx_employee_attachments_type ON employee_attachments(document_type);
CREATE INDEX idx_employee_attachments_archived ON employee_attachments(is_archived);
CREATE INDEX idx_custom_fields_category ON employee_custom_fields(category);
CREATE INDEX idx_custom_fields_active ON employee_custom_fields(is_active);
CREATE INDEX idx_custom_field_values_employee ON employee_custom_field_values(employee_id);
CREATE INDEX idx_custom_field_values_field ON employee_custom_field_values(field_id);
CREATE INDEX idx_pim_field_config_group ON pim_field_config(field_group);
CREATE INDEX idx_data_imports_status ON employee_data_imports(status);
CREATE INDEX idx_data_imports_date ON employee_data_imports(created_at);
CREATE INDEX idx_termination_requests_employee ON termination_requests(employee_id);
CREATE INDEX idx_termination_requests_status ON termination_requests(status);
CREATE INDEX idx_termination_requests_date ON termination_requests(proposed_last_working_date);
CREATE INDEX idx_exit_interviews_termination ON exit_interviews(termination_request_id);
CREATE INDEX idx_exit_interviews_status ON exit_interviews(status);

-- RLS Policies for Employee Data Management
ALTER TABLE employee_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE pim_field_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_data_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE termination_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exit_interviews ENABLE ROW LEVEL SECURITY;

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

-- PIM Field Config Policies
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

-- Triggers for updated_at timestamps
CREATE TRIGGER update_employee_attachments_updated_at BEFORE UPDATE ON employee_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_custom_fields_updated_at BEFORE UPDATE ON employee_custom_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_custom_field_values_updated_at BEFORE UPDATE ON employee_custom_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pim_field_config_updated_at BEFORE UPDATE ON pim_field_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_termination_requests_updated_at BEFORE UPDATE ON termination_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exit_interviews_updated_at BEFORE UPDATE ON exit_interviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default PIM field configurations
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
