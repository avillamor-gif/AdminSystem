-- Add borrow period dates to asset_requests for availability / conflict detection
-- Run in: Supabase SQL Editor

ALTER TABLE asset_requests
  ADD COLUMN IF NOT EXISTS borrow_start_date DATE,
  ADD COLUMN IF NOT EXISTS borrow_end_date   DATE;

-- Back-fill existing rows: use requested_date as start, returned_date or NULL as end
UPDATE asset_requests
SET
  borrow_start_date = requested_date::date,
  borrow_end_date   = returned_date::date
WHERE borrow_start_date IS NULL
  AND requested_date IS NOT NULL;

-- Optional index to speed up conflict queries
CREATE INDEX IF NOT EXISTS idx_asset_requests_availability
  ON asset_requests (assigned_asset_id, borrow_start_date, borrow_end_date)
  WHERE status IN ('approved', 'fulfilled') AND returned_date IS NULL;
