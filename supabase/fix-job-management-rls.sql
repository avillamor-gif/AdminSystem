-- Fix RLS write policies for all Job Management tables
-- Adds explicit INSERT (WITH CHECK), UPDATE, DELETE policies
-- Safe to run multiple times — drops existing policies first

-- ─────────────────────────────────────────────────────────────
-- JOB TITLES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can create job titles" ON job_titles;
DROP POLICY IF EXISTS "Admins can update job titles" ON job_titles;
DROP POLICY IF EXISTS "Admins can delete job titles" ON job_titles;

CREATE POLICY "Admins can create job titles"
  ON job_titles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can update job titles"
  ON job_titles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can delete job titles"
  ON job_titles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- EMPLOYMENT TYPES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage employment types" ON employment_types;

CREATE POLICY "Admins can create employment types"
  ON employment_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can update employment types"
  ON employment_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can delete employment types"
  ON employment_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- JOB CATEGORIES
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage job categories" ON job_categories;

CREATE POLICY "Admins can create job categories"
  ON job_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can update job categories"
  ON job_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can delete job categories"
  ON job_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- JOB DESCRIPTIONS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read job descriptions" ON job_descriptions;
DROP POLICY IF EXISTS "Admins can manage job descriptions" ON job_descriptions;
DROP POLICY IF EXISTS "Admins can create job descriptions" ON job_descriptions;
DROP POLICY IF EXISTS "Admins can update job descriptions" ON job_descriptions;
DROP POLICY IF EXISTS "Admins can delete job descriptions" ON job_descriptions;

CREATE POLICY "Authenticated users can read job descriptions"
  ON job_descriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create job descriptions"
  ON job_descriptions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can update job descriptions"
  ON job_descriptions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );

CREATE POLICY "Admins can delete job descriptions"
  ON job_descriptions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'hr_manager', 'hr_staff')
    )
  );
