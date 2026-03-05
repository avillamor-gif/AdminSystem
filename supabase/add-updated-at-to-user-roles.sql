-- Add missing updated_at column to user_roles table
-- Run this in your Supabase SQL Editor

ALTER TABLE user_roles 
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing records
UPDATE user_roles SET updated_at = created_at WHERE updated_at IS NULL;