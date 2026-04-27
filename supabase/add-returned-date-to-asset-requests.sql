-- Add return tracking fields to asset_requests
ALTER TABLE asset_requests
  ADD COLUMN IF NOT EXISTS returned_date DATE,
  ADD COLUMN IF NOT EXISTS return_notes TEXT;
