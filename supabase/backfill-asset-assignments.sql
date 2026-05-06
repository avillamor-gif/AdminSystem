-- ============================================================
-- Back-fill asset_assignments from assets.assigned_to
--
-- Problem: Assets assigned directly (via bulk setup or Edit Asset
-- modal) set assets.assigned_to/assigned_date but never inserted
-- a row into asset_assignments. This script creates the missing
-- history rows so the Assignments page shows complete history.
-- ============================================================

-- Step 1: Insert a missing active assignment for every asset
--         that has assigned_to set but no active assignment row.
INSERT INTO asset_assignments (
  asset_id,
  employee_id,
  assigned_date,
  condition_on_assignment,
  created_at
)
SELECT
  a.id                                        AS asset_id,
  a.assigned_to                               AS employee_id,
  COALESCE(a.assigned_date::date, CURRENT_DATE) AS assigned_date,
  'good'                                      AS condition_on_assignment,
  NOW()                                       AS created_at
FROM assets a
WHERE a.status    = 'assigned'
  AND a.assigned_to IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM asset_assignments aa
    WHERE aa.asset_id      = a.id
      AND aa.returned_date IS NULL   -- active assignment already exists
  );

-- ============================================================
-- Verification
-- ============================================================

-- Should list all active assignments after the backfill:
SELECT
  a.asset_tag,
  a.name          AS asset_name,
  a.status,
  a.assigned_to,
  a.assigned_date AS asset_assigned_date,
  aa.id           AS assignment_id,
  aa.assigned_date AS assignment_record_date,
  aa.employee_id
FROM assets a
LEFT JOIN asset_assignments aa
       ON aa.asset_id = a.id AND aa.returned_date IS NULL
WHERE a.status = 'assigned'
ORDER BY a.name;
