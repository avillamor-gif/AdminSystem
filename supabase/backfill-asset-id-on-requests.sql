-- ============================================================
-- Back-fill assigned_asset_id on asset_requests that were
-- submitted before the checkout form started saving it.
--
-- Matches by item_description = assets.name (case-insensitive).
-- ============================================================

-- Step 1: Fill assigned_asset_id for ALL non-returned active requests
--         where item_description matches an asset name
UPDATE asset_requests ar
SET    assigned_asset_id = a.id
FROM   assets a
WHERE  ar.assigned_asset_id IS NULL
  AND  LOWER(ar.item_description) = LOWER(a.name)
  AND  ar.status IN ('pending', 'approved', 'fulfilled');

-- Step 2: Mark the physical asset as 'assigned' for every item
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
-- Verification queries — run these after to confirm the fix
-- ============================================================

-- Should show 0 rows (no active fulfilled borrows missing the asset link):
SELECT ar.id, ar.item_description, ar.status, ar.assigned_asset_id
FROM   asset_requests ar
WHERE  ar.status = 'fulfilled'
  AND  ar.returned_date IS NULL
  AND  ar.assigned_asset_id IS NULL;

-- Should list the now-assigned items:
SELECT a.name, a.asset_tag, a.status, ar.status AS request_status, ar.returned_date
FROM   assets a
JOIN   asset_requests ar ON ar.assigned_asset_id = a.id
WHERE  ar.status = 'fulfilled'
  AND  ar.returned_date IS NULL
ORDER  BY a.name;
