-- Add 'ed' (Executive Director) to the user_role enum
-- Run in Supabase SQL Editor

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ed';
