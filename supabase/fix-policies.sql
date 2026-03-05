-- Additional RLS Policies for Admin Tables
-- Run this to add missing policies for job_titles management

-- Add management policies for job_titles if they don't exist
DO $$
BEGIN
    -- Check if the admin policy exists for job_titles
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

    -- Check if the admin policy exists for departments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'departments' 
        AND policyname = 'Admins can manage departments'
    ) THEN
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
    END IF;

    -- Add management policy for leave_types
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