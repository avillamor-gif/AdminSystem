-- ============================================================
-- Back-fill asset_requests: add missing columns + populate data
-- ============================================================

-- Step 0: Add borrow date columns if they don't exist yet
ALTER TABLE asset_requests
  ADD COLUMN IF NOT EXISTS borrow_start_date DATE,
  ADD COLUMN IF NOT EXISTS borrow_end_date   DATE;

-- Step 1: Fill assigned_asset_id for ALL non-returned active requests
--         where item_description matches an asset name
UPDATE asset_requests ar
SET    assigned_asset_id = a.id
FROM   assets a
WHERE  ar.assigned_asset_id IS NULL
  AND  LOWER(ar.item_description) = LOWER(a.name)
  AND  ar.status IN ('pending', 'approved', 'fulfilled');

-- Step 2: Back-fill borrow_end_date from the "Expected return: YYYY-MM-DD" text
--         stored in the notes field (written by old checkout form)
UPDATE asset_requests
SET    borrow_end_date = (
         regexp_match(notes, 'Expected return:\s*(\d{4}-\d{2}-\d{2})')
       )[1]::date
WHERE  borrow_end_date IS NULL
  AND  returned_date IS NULL
  AND  notes ~ 'Expected return:\s*\d{4}-\d{2}-\d{2}'
  AND  status IN ('pending', 'approved', 'fulfilled');

-- Step 2b: Directly set May 18 for the 3 known items with no end date
UPDATE asset_requests ar
SET    borrow_end_date = '2026-05-18'
FROM   assets a
WHERE  ar.assigned_asset_id = a.id
  AND  ar.borrow_end_date IS NULL
  AND  ar.returned_date IS NULL
  AND  ar.status = 'fulfilled'
  AND  a.name IN ('DJI Pocket 3', 'Sony EV E10-II', 'LCD Projector');

-- Step 3: Back-fill borrow_start_date from requested_date where still missing
UPDATE asset_requests
SET    borrow_start_date = requested_date::date
WHERE  borrow_start_date IS NULL
  AND  requested_date IS NOT NULL
  AND  status IN ('pending', 'approved', 'fulfilled');

-- Step 4: Mark the physical asset as 'assigned' for every item
--         that has an active (non-returned) fulfilled borrow
UPDATE assets a
SET    status = 'assigned'
WHERE  EXISTS (
    SELECT 1
    FROM   asset_requests ar
    WHERE  ar.assigned_asset_id = a.id
      AND  ar.status = 'fulfilled'
      AND  ar.returned_date IS NULL
)
  AND  a.status = 'available';

-- ============================================================
-- Verification queries
-- ============================================================

-- Should show 0 rows (no active fulfilled borrows missing the asset link):
SELECT ar.id, ar.item_description, ar.status, ar.assigned_asset_id
FROM   asset_requests ar
WHERE  ar.status = 'fulfilled'
  AND  ar.returned_date IS NULL
  AND  ar.assigned_asset_id IS NULL;

-- Should list the now-assigned items with their borrow_end_date:
SELECT a.name, a.asset_tag, a.status, ar.borrow_start_date, ar.borrow_end_date, ar.notes
FROM   assets a
JOIN   asset_requests ar ON ar.assigned_asset_id = a.id
WHERE  ar.status = 'fulfilled'
  AND  ar.returned_date IS NULL
ORDER  BY a.name;
