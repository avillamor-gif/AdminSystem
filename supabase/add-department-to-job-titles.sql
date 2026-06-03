-- Add department_id to job_titles table
-- Run this in your Supabase SQL Editor

ALTER TABLE job_titles
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_job_titles_department ON job_titles(department_id);
