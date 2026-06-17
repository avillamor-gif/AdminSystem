-- ============================================================
-- Final Permission Category Consolidation
-- Fix remaining duplicates and inconsistencies
-- Run in: Supabase SQL Editor
-- ============================================================

-- 1. Fix lowercase 'internship' → 'Internship'
UPDATE permissions SET category = 'Internship' WHERE category = 'internship';

-- 2. Consolidate duplicate Office categories
-- Office Equipment → Equipment
UPDATE permissions SET category = 'Equipment' WHERE category = 'Office Equipment';
-- Office Supplies → Supplies  
UPDATE permissions SET category = 'Supplies' WHERE category = 'Office Supplies';

-- 3. Consolidate Employee/User Management
UPDATE permissions SET category = 'User Management' WHERE category = 'Employee Management';

-- 4. Standardize Organization
UPDATE permissions SET category = 'Organization' WHERE category = 'Organization Structure';

-- 5. Standardize Performance
UPDATE permissions SET category = 'Performance' WHERE category = 'Performance Management';

-- 6. Consolidate System
UPDATE permissions SET category = 'System' WHERE category = 'System Configuration' OR category = 'system';

-- 7. Verify final consolidated categories
SELECT 
  category,
  COUNT(*) as permission_count
FROM permissions
GROUP BY category
ORDER BY category;

-- 8. Show breakdown of key categories
SELECT 
  category,
  COUNT(*) as count,
  STRING_AGG(DISTINCT code, ' | ' ORDER BY code) as all_codes
FROM permissions
WHERE category IN ('Navigation', 'Internship', 'Governance', 'Membership', 'Supplies', 'Equipment', 'User Management')
GROUP BY category
ORDER BY category;
