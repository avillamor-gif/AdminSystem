-- Migration: Add external borrower support to asset_requests
-- Run this in the Supabase SQL Editor

ALTER TABLE asset_requests
  ADD COLUMN IF NOT EXISTS borrower_type TEXT NOT NULL DEFAULT 'employee' CHECK (borrower_type IN ('employee', 'external')),
  ADD COLUMN IF NOT EXISTS external_borrower_name TEXT,
  ADD COLUMN IF NOT EXISTS external_borrower_org TEXT,
  ADD COLUMN IF NOT EXISTS external_borrower_contact TEXT,
  ADD COLUMN IF NOT EXISTS external_borrower_position TEXT;

-- For external requests, employee_id is not required — relax the NOT NULL if it exists
-- (asset_requests.employee_id is likely already nullable, but just in case)
ALTER TABLE asset_requests
  ALTER COLUMN employee_id DROP NOT NULL;

COMMENT ON COLUMN asset_requests.borrower_type IS 'employee = internal staff; external = partner org / visitor';
COMMENT ON COLUMN asset_requests.external_borrower_name IS 'Full name of the external borrower';
COMMENT ON COLUMN asset_requests.external_borrower_org IS 'Organization or institution of the external borrower';
COMMENT ON COLUMN asset_requests.external_borrower_contact IS 'Phone or email of the external borrower';
COMMENT ON COLUMN asset_requests.external_borrower_position IS 'Role or position of the external borrower';
