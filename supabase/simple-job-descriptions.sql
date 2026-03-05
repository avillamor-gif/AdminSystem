-- Simple Job Descriptions Table Creation
-- Copy and paste this directly into Supabase SQL Editor

-- Create job descriptions table
CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_code VARCHAR(50) UNIQUE NOT NULL,
  job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL,
  summary TEXT,
  responsibilities TEXT,
  qualifications TEXT,
  skills_required TEXT,
  reports_to VARCHAR(255),
  supervises TEXT,
  working_conditions TEXT,
  physical_requirements TEXT,
  version VARCHAR(10) DEFAULT '1.0',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'under_review', 'archived')),
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  effective_date DATE,
  review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_descriptions_job_title ON job_descriptions(job_title_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_department ON job_descriptions(department_id);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_status ON job_descriptions(status);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_employment_type ON job_descriptions(employment_type_id);

-- Enable RLS and policies
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can read job descriptions" ON job_descriptions;
DROP POLICY IF EXISTS "Admins can manage job descriptions" ON job_descriptions;

-- Create policies
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

-- Insert sample data
INSERT INTO job_descriptions (
  job_code, 
  summary, 
  responsibilities, 
  qualifications,
  skills_required,
  reports_to,
  status,
  version,
  effective_date
) VALUES
  (
    'JD-001',
    'Lead and coordinate software development projects, ensuring quality and timely delivery.',
    E'• Oversee development team and project timelines\n• Review code and ensure best practices\n• Coordinate with stakeholders and clients\n• Mentor junior developers\n• Manage technical documentation',
    E'• Bachelor\'s degree in Computer Science or related field\n• 5+ years of software development experience\n• 3+ years of team leadership experience\n• Strong problem-solving skills',
    E'• Proficiency in multiple programming languages\n• Project management experience\n• Communication and leadership skills\n• Agile/Scrum methodology knowledge',
    'CTO',
    'active',
    '1.0',
    CURRENT_DATE
  ),
  (
    'JD-002',
    'Manage human resources operations and employee relations.',
    E'• Oversee recruitment and onboarding processes\n• Handle employee relations and conflict resolution\n• Manage performance review processes\n• Ensure compliance with labor laws\n• Develop HR policies and procedures',
    E'• Bachelor\'s degree in HR, Business, or related field\n• 3+ years of HR experience\n• Knowledge of employment law\n• Strong interpersonal skills',
    E'• HRIS system proficiency\n• Conflict resolution skills\n• Policy development experience\n• Communication and organizational skills',
    'HR Director',
    'active',
    '1.0',
    CURRENT_DATE
  ),
  (
    'JD-003',
    'Coordinate field operations and ensure project delivery standards.',
    E'• Manage field operations and logistics\n• Coordinate with local teams and stakeholders\n• Ensure quality standards and safety protocols\n• Report on project progress and challenges\n• Train and supervise field staff',
    E'• Bachelor\'s degree in relevant field\n• 3+ years of field operations experience\n• Strong organizational and communication skills\n• Ability to work in challenging environments',
    E'• Project coordination experience\n• Cross-cultural communication skills\n• Problem-solving and adaptability\n• Basic knowledge of safety protocols',
    'Operations Manager',
    'draft',
    '1.0',
    CURRENT_DATE
  )
ON CONFLICT (job_code) DO NOTHING;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_job_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS update_job_descriptions_updated_at ON job_descriptions;
CREATE TRIGGER update_job_descriptions_updated_at
    BEFORE UPDATE ON job_descriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_job_descriptions_updated_at();