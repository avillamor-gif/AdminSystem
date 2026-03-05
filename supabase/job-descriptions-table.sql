-- Job Descriptions Table Migration
-- Run this to add job_descriptions table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'job_descriptions') THEN
        CREATE TABLE job_descriptions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          job_title_id UUID REFERENCES job_titles(id) ON DELETE SET NULL,
          job_code VARCHAR(50) UNIQUE NOT NULL,
          department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
          reports_to VARCHAR(255),
          status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'under_review', 'archived')),
          version VARCHAR(20) DEFAULT '1.0',
          summary TEXT,
          purpose_statement TEXT,
          key_responsibilities JSONB DEFAULT '[]',
          required_qualifications JSONB DEFAULT '{}',
          preferred_qualifications JSONB DEFAULT '{}',
          working_conditions JSONB DEFAULT '{}',
          competencies JSONB DEFAULT '[]',
          salary_grade VARCHAR(50),
          flsa_status VARCHAR(20) CHECK (flsa_status IN ('exempt', 'non_exempt')),
          employment_type_id UUID REFERENCES employment_types(id) ON DELETE SET NULL,
          approved_by VARCHAR(255),
          effective_date DATE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Indexes
        CREATE INDEX idx_job_descriptions_job_title ON job_descriptions(job_title_id);
        CREATE INDEX idx_job_descriptions_department ON job_descriptions(department_id);
        CREATE INDEX idx_job_descriptions_status ON job_descriptions(status);
        CREATE INDEX idx_job_descriptions_employment_type ON job_descriptions(employment_type_id);

        -- RLS
        ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

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
        INSERT INTO job_descriptions (job_code, reports_to, status, summary, purpose_statement, salary_grade, flsa_status) VALUES
          ('ED-001', 'Board of Directors', 'active', 'Executive Director responsible for organizational leadership', 'Provide strategic direction and organizational leadership', 'Grade A', 'exempt'),
          ('PM-001', 'Executive Director', 'active', 'Program Manager overseeing development programs', 'Manage program implementation and evaluation', 'Grade B', 'exempt'),
          ('HR-001', 'Executive Director', 'draft', 'Human Resources Manager handling people operations', 'Manage HR functions and employee relations', 'Grade B', 'exempt');
    END IF;
END $$;