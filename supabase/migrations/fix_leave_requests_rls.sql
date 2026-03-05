-- Fix Leave Requests RLS Policies
-- Issue: user_roles entries may have NULL employee_id, preventing leave request creation
-- Solution: Check employee_id from user_roles, and if NULL, match by email

-- Drop existing policies
DROP POLICY IF EXISTS "Employees can create leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can view own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can update own pending requests" ON leave_requests;

-- Allow employees to create leave requests
-- Checks if employee_id matches the one from user_roles, or if employee_id is NULL in user_roles,
-- allows matching by email between employees and auth.users
CREATE POLICY "Employees can create leave requests" ON leave_requests FOR INSERT TO authenticated
WITH CHECK (
  -- Check if employee_id matches user_roles.employee_id (when not null)
  employee_id IN (
    SELECT employee_id FROM user_roles 
    WHERE user_id = auth.uid() AND employee_id IS NOT NULL
  )
  OR
  -- If user_roles.employee_id is null, match by email
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND employee_id IS NULL
    )
    AND
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Allow employees to view their own leave requests
CREATE POLICY "Employees can view own leave requests" ON leave_requests FOR SELECT TO authenticated
USING (
  employee_id IN (
    SELECT employee_id FROM user_roles 
    WHERE user_id = auth.uid() AND employee_id IS NOT NULL
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND employee_id IS NULL
    )
    AND
    employee_id IN (
      SELECT e.id FROM employees e
      WHERE e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
);

-- Allow employees to update their own pending requests
CREATE POLICY "Employees can update own pending requests" ON leave_requests FOR UPDATE TO authenticated
USING (
  status = 'pending' AND (
    employee_id IN (
      SELECT employee_id FROM user_roles 
      WHERE user_id = auth.uid() AND employee_id IS NOT NULL
    )
    OR
    (
      EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = auth.uid() AND employee_id IS NULL
      )
      AND
      employee_id IN (
        SELECT e.id FROM employees e
        WHERE e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  )
);

-- RECOMMENDATION: Update user_roles to set employee_id for all users
-- Run this after applying the above policies:
-- UPDATE user_roles 
-- SET employee_id = (SELECT id FROM employees WHERE employees.email = user_roles.email)
-- WHERE employee_id IS NULL;
