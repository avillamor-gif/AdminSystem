-- ============================================================
-- Fix Permission Categories & Grouping
-- Consolidate all nav.* permissions under "Navigation"
-- Consolidate all internship.* permissions under "Internship"
-- Capitalize all category names for consistent UI grouping
-- Run in: Supabase SQL Editor
-- ============================================================

-- 1. Ensure ALL navigation permissions exist with proper categories
-- Update existing nav.* permissions to use 'Navigation' category
UPDATE permissions
SET category = 'Navigation'
WHERE code LIKE 'nav.%' AND category != 'Navigation';

-- 2. Create any missing navigation permissions with proper names
INSERT INTO permissions (name, code, category, description)
VALUES
  ('Navigation: Attendance', 'nav.attendance', 'Navigation', 'Show Attendance Tracker link in sidebar'),
  ('Navigation: Directory', 'nav.directory', 'Navigation', 'Show Directory link in sidebar'),
  ('Navigation: Equipment', 'nav.equipment', 'Navigation', 'Show Office Equipment link in sidebar'),
  ('Navigation: Governance', 'nav.governance', 'Navigation', 'Show Governance link in sidebar'),
  ('Navigation: Leave', 'nav.leave', 'Navigation', 'Show Leave link in sidebar'),
  ('Navigation: Membership', 'nav.membership', 'Navigation', 'Show Membership link in sidebar'),
  ('Navigation: My Info', 'nav.my_info', 'Navigation', 'Show My Info link in sidebar'),
  ('Navigation: Performance', 'nav.performance', 'Navigation', 'Show Performance link in sidebar'),
  ('Navigation: Publications', 'nav.publications', 'Navigation', 'Show Publications link in sidebar'),
  ('Navigation: Supplies', 'nav.supplies', 'Navigation', 'Show Office Supplies link in sidebar'),
  ('Navigation: Travel', 'nav.travel', 'Navigation', 'Show Travel link in sidebar')
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  category = 'Navigation',
  description = EXCLUDED.description;

-- 3. Consolidate all internship permissions under 'Internship' category
-- Fix existing internship permissions
UPDATE permissions
SET category = 'Internship'
WHERE code LIKE 'internship.%' OR code = 'admin.internship.analytics';

-- 4. Ensure proper Internship permission names
INSERT INTO permissions (name, code, category, description)
VALUES
  ('Internship: View', 'internship.view', 'Internship', 'View internship and OJT programs'),
  ('Internship: Manage', 'internship.manage', 'Internship', 'Create, edit, delete internship programs'),
  ('Internship Analytics', 'admin.internship.analytics', 'Internship', 'View internship and OJT program analytics')
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  category = 'Internship',
  description = EXCLUDED.description;

-- 5. Capitalize all other category names for consistency
UPDATE permissions SET category = 'Governance' WHERE category = 'governance';
UPDATE permissions SET category = 'Membership' WHERE category = 'membership';
UPDATE permissions SET category = 'Leave Management' WHERE category = 'leave';
UPDATE permissions SET category = 'Attendance' WHERE category = 'attendance';
UPDATE permissions SET category = 'Travel' WHERE category = 'travel';
UPDATE permissions SET category = 'Publications' WHERE category = 'publications';
UPDATE permissions SET category = 'Equipment' WHERE category = 'equipment';
UPDATE permissions SET category = 'Supplies' WHERE category = 'supplies';
UPDATE permissions SET category = 'Learning & Development' WHERE category = 'learning';
UPDATE permissions SET category = 'Compliance & Audit' WHERE category = 'compliance';
UPDATE permissions SET category = 'Admin' WHERE category = 'admin' AND category != 'Admin';
UPDATE permissions SET category = 'User & Security' WHERE category = 'user' OR category = 'security';

-- 6. Verify the changes
SELECT 
  category,
  COUNT(*) as permission_count,
  STRING_AGG(DISTINCT code, ', ' ORDER BY code) as codes
FROM permissions
WHERE category IN ('Navigation', 'Internship', 'Governance', 'Membership')
GROUP BY category
ORDER BY category;

-- 7. Show all unique categories to verify consistency
SELECT DISTINCT category, COUNT(*) as count
FROM permissions
GROUP BY category
ORDER BY category;
