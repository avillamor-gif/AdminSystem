-- Fix Leave Request Notifications
-- Ensures admins are notified when leave requests are submitted
-- 
-- Current issue: workflow_configs for 'leave' only notifies direct_manager
-- Fix: Add 'admin' to notify_on_submit array
-- 
-- This allows:
-- 1. Direct supervisor receives notification (bell + email)
-- 2. All admin users receive notification (bell + email)
-- 3. Both can approve/reject leave requests

-- Update the leave workflow config to notify both manager and admins
UPDATE workflow_configs
SET 
  notify_on_submit = '["direct_manager", "admin"]'::jsonb,
  notify_on_decision = '["admin"]'::jsonb,
  description = 'Standard employee leave requests (vacation, sick, etc.). Notifies direct manager and admin users.'
WHERE request_type = 'leave'
  AND is_active = true;

-- Verify the update
SELECT 
  request_type,
  display_name,
  notify_on_submit,
  notify_on_decision,
  is_active
FROM workflow_configs
WHERE request_type = 'leave';
