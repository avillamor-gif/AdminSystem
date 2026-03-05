-- Board of Trustees - Step 1: Add enum value
-- This must be run first and committed before Step 2

-- Add board_member to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'board_member';
