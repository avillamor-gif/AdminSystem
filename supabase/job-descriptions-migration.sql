-- Job Descriptions Table Migration
-- Run this in Supabase SQL Editor to add job descriptions functionality

-- Create job descriptions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'job_descriptions') THEN
        CREATE TABLE job_descriptions (
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

        -- Indexes for better performance
        CREATE INDEX idx_job_descriptions_job_title ON job_descriptions(job_title_id);
        CREATE INDEX idx_job_descriptions_department ON job_descriptions(department_id);
        CREATE INDEX idx_job_descriptions_status ON job_descriptions(status);
        CREATE INDEX idx_job_descriptions_employment_type ON job_descriptions(employment_type_id);
        CREATE UNIQUE INDEX idx_job_descriptions_code ON job_descriptions(job_code);

        -- Enable RLS
        ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

        -- RLS Policies
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

        -- Insert sample job descriptions
        INSERT INTO job_descriptions (
          job_code, 
          job_title_id, 
          department_id, 
          summary, 
          responsibilities, 
          qualifications,
          skills_required,
          reports_to,
          status,
          version,
          effective_date
        ) 
        SELECT 
          'JD-001',
          jt.id,
          d.id,
          'Lead and coordinate software development projects, ensuring quality and timely delivery.',
          '• Oversee development team and project timelines
• Review code and ensure best practices
• Coordinate with stakeholders and clients
• Mentor junior developers
• Manage technical documentation',
          '• Bachelor''s degree in Computer Science or related field
• 5+ years of software development experience
• 3+ years of team leadership experience
• Strong problem-solving skills',
          '• Proficiency in multiple programming languages
• Project management experience
• Communication and leadership skills
• Agile/Scrum methodology knowledge',
          'CTO',
          'active',
          '1.0',
          CURRENT_DATE
        FROM job_titles jt
        CROSS JOIN departments d
        WHERE jt.title ILIKE '%developer%' OR jt.title ILIKE '%engineer%'
        AND d.name ILIKE '%tech%' OR d.name ILIKE '%development%'
        LIMIT 1;

        -- Insert additional sample if no matching records found
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
        ) 
        SELECT 
          'JD-002',
          'Manage human resources operations and employee relations.',
          '• Oversee recruitment and onboarding processes
• Handle employee relations and conflict resolution
• Manage performance review processes
• Ensure compliance with labor laws
• Develop HR policies and procedures',
          '• Bachelor''s degree in HR, Business, or related field
• 3+ years of HR experience
• Knowledge of employment law
• Strong interpersonal skills',
          '• HRIS system proficiency
• Conflict resolution skills
• Policy development experience
• Communication and organizational skills',
          'HR Director',
          'active',
          '1.0',
          CURRENT_DATE
        WHERE NOT EXISTS (SELECT 1 FROM job_descriptions LIMIT 1);
        
    END IF;
END $$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_job_descriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_job_descriptions_updated_at' AND tgrelid = 'job_descriptions'::regclass) THEN
        CREATE TRIGGER update_job_descriptions_updated_at
            BEFORE UPDATE ON job_descriptions
            FOR EACH ROW
            EXECUTE FUNCTION update_job_descriptions_updated_at();
    END IF;
END $$;