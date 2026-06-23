-- Fix: assign_leave_approvers trigger function must use SECURITY DEFINER
-- so it can INSERT into leave_approvals even when triggered by a regular employee.
-- Without SECURITY DEFINER the function runs as the authenticated user, who has
-- no INSERT policy on leave_approvals, causing the RLS violation.

CREATE OR REPLACE FUNCTION assign_leave_approvers()
RETURNS TRIGGER AS $$
DECLARE
  workflow_rec       RECORD;
  step_data          JSONB;
  approver_emp_id    UUID;
  step_num           INTEGER := 1;
BEGIN
  SELECT * INTO workflow_rec
  FROM leave_approval_workflows
  WHERE id = NEW.workflow_id AND is_active = TRUE;

  IF NOT FOUND THEN RETURN NEW; END IF;

  FOR step_data IN SELECT * FROM jsonb_array_elements(workflow_rec.workflow_steps) LOOP
    IF (step_data->>'approver_role') = 'Manager' THEN
      SELECT manager_id INTO approver_emp_id FROM employees WHERE id = NEW.employee_id;
    ELSIF (step_data->>'approver_role') = 'HR' THEN
      SELECT e.id INTO approver_emp_id
      FROM employees e JOIN user_roles ur ON e.id = ur.employee_id
      WHERE ur.role = 'hr' LIMIT 1;
    ELSE
      approver_emp_id := NULL;
    END IF;

    INSERT INTO leave_approvals (
      leave_request_id, step_number, approver_role, approver_id, is_optional, due_date
    ) VALUES (
      NEW.id,
      step_num,
      (step_data->>'approver_role'),
      approver_emp_id,
      COALESCE((step_data->>'is_optional')::boolean, false),
      CASE WHEN workflow_rec.escalation_enabled
           THEN NOW() + INTERVAL '1 day' * workflow_rec.escalation_days
           ELSE NULL END
    );
    step_num := step_num + 1;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
