-- Add missing columns to job_titles table
-- Run this in your Supabase SQL Editor

ALTER TABLE job_titles 
ADD COLUMN IF NOT EXISTS code VARCHAR(50),
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records to have is_active = true if null
UPDATE job_titles SET is_active = TRUE WHERE is_active IS NULL;

-- Update existing records to have updated_at = created_at if null
UPDATE job_titles SET updated_at = created_at WHERE updated_at IS NULL;
