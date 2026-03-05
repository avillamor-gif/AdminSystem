-- Quick Check: Verify Termination Workflow Setup

-- 1. Check if tables exist
SELECT 
  'employee_assets' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'employee_assets'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING - Run employee-assets-table.sql' END as status
UNION ALL
SELECT 
  'exit_interviews' as table_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'exit_interviews'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING - Run exit-interviews-table.sql' END as status;

-- 2. Check active employees (potential candidates for termination)
SELECT 
  id,
  employee_id,
  first_name || ' ' || last_name as full_name,
  email,
  department_id,
  status
FROM employees 
WHERE status = 'active'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if any employees have assets assigned
SELECT 
  e.first_name || ' ' || e.last_name as employee_name,
  COUNT(ea.id) as total_assets,
  SUM(CASE WHEN ea.status = 'assigned' THEN 1 ELSE 0 END) as unreturned_assets
FROM employees e
LEFT JOIN employee_assets ea ON ea.employee_id = e.id
WHERE e.status = 'active'
GROUP BY e.id, e.first_name, e.last_name
HAVING COUNT(ea.id) > 0
ORDER BY unreturned_assets DESC;

-- 4. Check termination requests and their requirements
SELECT 
  tr.request_number,
  e.first_name || ' ' || e.last_name as employee_name,
  tr.status,
  tr.asset_return_required,
  tr.exit_interview_required,
  tr.proposed_last_working_date,
  tr.created_at
FROM termination_requests tr
JOIN employees e ON e.id = tr.employee_id
ORDER BY tr.created_at DESC
LIMIT 10;

-- 5. Check workflow completion status for approved terminations
SELECT 
  tr.request_number,
  e.first_name || ' ' || e.last_name as employee_name,
  tr.status,
  tr.asset_return_required as assets_required,
  COALESCE((
    SELECT COUNT(*) FROM employee_assets 
    WHERE employee_id = tr.employee_id 
    AND status = 'assigned'
  ), 0) as unreturned_assets,
  tr.exit_interview_required as interview_required,
  COALESCE(ei.status, 'not_scheduled') as interview_status,
  CASE 
    WHEN tr.status != 'approved' THEN '⏸️ Pending approval'
    WHEN tr.asset_return_required AND (
      SELECT COUNT(*) FROM employee_assets 
      WHERE employee_id = tr.employee_id AND status = 'assigned'
    ) > 0 THEN '❌ Waiting for asset return'
    WHEN tr.exit_interview_required AND COALESCE(ei.status, 'not_scheduled') != 'completed' THEN '❌ Waiting for exit interview'
    ELSE '✅ Ready to process'
  END as workflow_status
FROM termination_requests tr
JOIN employees e ON e.id = tr.employee_id
LEFT JOIN exit_interviews ei ON ei.termination_request_id = tr.id
WHERE tr.status IN ('approved', 'pending')
ORDER BY tr.created_at DESC;

-- 6. Show detailed workflow blockers
SELECT 
  tr.request_number,
  e.first_name || ' ' || e.last_name as employee_name,
  CASE 
    WHEN tr.asset_return_required AND (
      SELECT COUNT(*) FROM employee_assets 
      WHERE employee_id = tr.employee_id AND status = 'assigned'
    ) > 0 THEN '🔴 HAS UNRETURNED ASSETS: ' || (
      SELECT string_agg(asset_name, ', ')
      FROM employee_assets 
      WHERE employee_id = tr.employee_id AND status = 'assigned'
    )
    WHEN tr.asset_return_required THEN '✅ All assets returned'
    ELSE '➖ Asset return not required'
  END as asset_status,
  CASE 
    WHEN tr.exit_interview_required AND NOT EXISTS (
      SELECT 1 FROM exit_interviews 
      WHERE termination_request_id = tr.id
    ) THEN '🔴 NOT SCHEDULED - Click "Exit Interview" tab → "Schedule Interview"'
    WHEN tr.exit_interview_required AND EXISTS (
      SELECT 1 FROM exit_interviews 
      WHERE termination_request_id = tr.id AND status != 'completed'
    ) THEN '🟡 SCHEDULED BUT NOT COMPLETED - Click "Exit Interview" tab → "Mark Complete"'
    WHEN tr.exit_interview_required THEN '✅ Interview completed'
    ELSE '➖ Exit interview not required'
  END as interview_status
FROM termination_requests tr
JOIN employees e ON e.id = tr.employee_id
WHERE tr.status = 'approved'
ORDER BY tr.created_at DESC;
