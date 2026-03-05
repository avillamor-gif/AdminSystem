-- Job Descriptions Table for Admin Module
-- Run this in your Supabase SQL Editor

-- Create job descriptions table
CREATE TABLE job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_code VARCHAR(50) UNIQUE NOT NULL,
  job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL,
  summary TEXT,
  purpose_statement TEXT,
  responsibilities TEXT[],
  qualifications TEXT[],
  skills TEXT[],
  reports_to VARCHAR(255),
  salary_grade VARCHAR(50),
  flsa_status VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft', -- draft, active, under_review, archived
  version VARCHAR(20) DEFAULT '1.0',
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_descriptions_updated_at 
  BEFORE UPDATE ON job_descriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing
INSERT INTO job_descriptions (
  job_code, 
  job_title_id,
  department_id,
  summary,
  status,
  version
) 
SELECT 
  'JD-' || LPAD(ROW_NUMBER() OVER ()::text, 3, '0'),
  jt.id,
  (SELECT id FROM departments LIMIT 1),
  'Sample job description for ' || jt.title,
  'active',
  '1.0'
FROM job_titles jt
LIMIT 5;