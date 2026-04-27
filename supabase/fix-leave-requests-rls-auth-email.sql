-- Fix RLS policies that reference auth.users (permission denied for browser clients)
-- Replace with auth.email() built-in function which is always accessible

DROP POLICY IF EXISTS "Employees can create leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can view own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can update own pending requests" ON leave_requests;

-- Recreate using auth.email() instead of subquery on auth.users
CREATE POLICY "Employees can create leave requests" ON leave_requests FOR INSERT TO authenticated
WITH CHECK (
  employee_id IN (
    SELECT employee_id FROM user_roles
    WHERE user_id = auth.uid() AND employee_id IS NOT NULL
  )
  OR
  employee_id IN (
    SELECT id FROM employees
    WHERE email = auth.email()
  )
);

CREATE POLICY "Employees can view own leave requests" ON leave_requests FOR SELECT TO authenticated
USING (
  employee_id IN (
    SELECT employee_id FROM user_roles
    WHERE user_id = auth.uid() AND employee_id IS NOT NULL
  )
  OR
  employee_id IN (
    SELECT id FROM employees
    WHERE email = auth.email()
  )
);

CREATE POLICY "Employees can update own pending requests" ON leave_requests FOR UPDATE TO authenticated
USING (
  status = 'pending' AND (
    employee_id IN (
      SELECT employee_id FROM user_roles
      WHERE user_id = auth.uid() AND employee_id IS NOT NULL
    )
    OR
    employee_id IN (
      SELECT id FROM employees
      WHERE email = auth.email()
    )
  )
);
