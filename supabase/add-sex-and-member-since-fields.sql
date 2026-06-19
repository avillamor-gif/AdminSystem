-- Add sex/gender and enhance member analytics fields
-- Run this in Supabase SQL Editor

-- Add sex column to member_applications
ALTER TABLE IF EXISTS member_applications
ADD COLUMN IF NOT EXISTS sex VARCHAR(50)
  CHECK (sex IS NULL OR sex IN ('Male', 'Female', 'Other', 'Prefer not to say'));

-- Add sex column to members table (for direct member records)
ALTER TABLE IF EXISTS members
ADD COLUMN IF NOT EXISTS sex VARCHAR(50)
  CHECK (sex IS NULL OR sex IN ('Male', 'Female', 'Other', 'Prefer not to say'));

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_member_applications_sex ON member_applications(sex);
CREATE INDEX IF NOT EXISTS idx_members_sex ON members(sex);
CREATE INDEX IF NOT EXISTS idx_members_date_admitted ON members(date_admitted);
