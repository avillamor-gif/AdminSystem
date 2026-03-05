-- Additional Admin Tables Migration
-- Run this ONLY if you get "type already exists" errors from main schema.sql
-- This script safely adds only the missing tables

-- Check if employment_types table exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'employment_types') THEN
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

        -- Indexes
        CREATE INDEX idx_employment_types_category ON employment_types(category);
        CREATE INDEX idx_employment_types_active ON employment_types(is_active);

        -- RLS
        ALTER TABLE employment_types ENABLE ROW LEVEL SECURITY;

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

        -- Insert default data
        INSERT INTO employment_types (name, code, description, category, is_active) VALUES
          ('Full-Time Permanent', 'FTP', 'Full-time permanent employment with complete benefits', 'permanent', true),
          ('Part-Time Permanent', 'PTP', 'Part-time permanent employment with pro-rated benefits', 'permanent', true),
          ('Fixed-Term Contract', 'FTC', 'Fixed-term contract employment', 'contract', true),
          ('Consultant', 'CNS', 'Independent consultant arrangement', 'consultant', true),
          ('Intern', 'INT', 'Internship program participant', 'intern', true),
          ('Volunteer', 'VOL', 'Volunteer service arrangement', 'volunteer', true);
    END IF;
END $$;

-- Job Categories (only if not exists)  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' AND table_name = 'job_categories') THEN
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
        CREATE INDEX idx_job_categories_parent ON job_categories(parent_id);
        CREATE INDEX idx_job_categories_active ON job_categories(is_active);

        -- RLS
        ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

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

        -- Insert default data
        INSERT INTO job_categories (name, code, description, is_active) VALUES
          ('Management', 'MGT', 'Management and leadership positions', true),
          ('Technical', 'TECH', 'Technical and engineering roles', true),
          ('Administrative', 'ADMIN', 'Administrative and support roles', true),
          ('Field Operations', 'FIELD', 'Field-based operational roles', true),
          ('Program Management', 'PROG', 'Program and project management roles', true);
          
        -- Add subcategories with parent references
        INSERT INTO job_categories (name, code, description, parent_id, is_active) 
        SELECT 'Senior Management', 'SMGT', 'Senior management positions', id, true
        FROM job_categories WHERE code = 'MGT';
        
        INSERT INTO job_categories (name, code, description, parent_id, is_active)
        SELECT 'Software Development', 'SDEV', 'Software development roles', id, true  
        FROM job_categories WHERE code = 'TECH';
        
        INSERT INTO job_categories (name, code, description, parent_id, is_active)
        SELECT 'Human Resources', 'HR', 'HR and people operations', id, true
        FROM job_categories WHERE code = 'ADMIN';
    END IF;
END $$;

-- Add missing management policies for existing tables
DO $$
BEGIN
    -- Add admin management policy for job_titles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'job_titles' 
        AND policyname = 'Admins can manage job titles'
    ) THEN
        CREATE POLICY "Admins can manage job titles"
          ON job_titles FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid()
              AND user_roles.role IN ('admin', 'hr')
            )
          );
    END IF;

    -- Add admin management policy for leave_types if it doesn't exist  
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'leave_types' 
        AND policyname = 'Admins can manage leave types'
    ) THEN
        CREATE POLICY "Admins can manage leave types"
          ON leave_types FOR ALL
          TO authenticated
          USING (
            EXISTS (
              SELECT 1 FROM user_roles
              WHERE user_roles.user_id = auth.uid()
              AND user_roles.role IN ('admin', 'hr')
            )
          );
    END IF;
END $$;