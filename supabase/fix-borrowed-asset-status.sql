-- Fix assets whose status is still 'available' even though they have an active
-- fulfilled borrow record (no returned_date). This corrects records created by
-- the old manual-log flow that bypassed the fulfill() pipeline.
--
-- Run once in Supabase SQL Editor.

UPDATE assets
SET
  status       = 'assigned',
  assigned_date = COALESCE(assigned_date, now()::date)
WHERE id IN (
  SELECT DISTINCT COALESCE(assigned_asset_id, asset_id)
  FROM asset_requests
  WHERE status        = 'fulfilled'
    AND returned_date IS NULL
    AND COALESCE(assigned_asset_id, asset_id) IS NOT NULL
)
AND status = 'available';
