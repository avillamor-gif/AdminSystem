-- Add missing values to the user_role enum
-- Run in Supabase SQL Editor

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'intern';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'volunteer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'consultant';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'board_member';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super admin';

-- Rename 'Board Member' role display name to 'Board of Trustees'
UPDATE roles SET name = 'Board of Trustees' WHERE name = 'Board Member';

