-- ============================================================
-- Reset borrowable_by = 'none' for all assets
-- EXCEPT assets currently borrowed (active fulfilled requests)
-- ============================================================

UPDATE public.assets
SET borrowable_by = 'none'
WHERE id NOT IN (
  SELECT assigned_asset_id
  FROM   public.asset_requests
  WHERE  status        = 'fulfilled'
    AND  returned_date IS NULL
    AND  assigned_asset_id IS NOT NULL
);

-- Verification: should list only the 3 currently borrowed items as non-'none'
SELECT name, asset_tag, borrowable_by
FROM   public.assets
WHERE  borrowable_by != 'none'
ORDER  BY name;
