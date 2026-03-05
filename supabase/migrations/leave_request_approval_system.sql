-- Create leave request and approval tracking tables

-- First, check if required tables exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_approval_workflows') THEN
    RAISE EXCEPTION 'Table leave_approval_workflows does not exist. Please run leave_absence_management.sql first.';
  END IF;
END $$;

-- =============================================
-- LEAVE REQUESTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(4,2) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'escalated')),
  current_approval_step INTEGER DEFAULT 1,
  workflow_id UUID,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_days CHECK (total_days > 0)
);

-- =============================================
-- LEAVE APPROVALS TABLE (Tracks each approval step)
-- =============================================
CREATE TABLE IF NOT EXISTS leave_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  approver_role VARCHAR(100) NOT NULL,
  approver_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'escalated', 'skipped')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  is_optional BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(leave_request_id, step_number)
);

-- =============================================
-- LEAVE BALANCES TABLE (Track employee leave balances)
-- =============================================
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_allocated DECIMAL(5,2) DEFAULT 0,
  used_days DECIMAL(5,2) DEFAULT 0,
  pending_days DECIMAL(5,2) DEFAULT 0,
  available_days DECIMAL(5,2) GENERATED ALWAYS AS (total_allocated - used_days - pending_days) STORED,
  carried_over DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, leave_type_id, year),
  CONSTRAINT valid_balance CHECK (used_days >= 0 AND pending_days >= 0 AND total_allocated >= 0)
);

-- =============================================
-- ADD FOREIGN KEY CONSTRAINTS
-- =============================================
-- First, ensure workflow_id column exists in leave_requests
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' AND column_name = 'workflow_id'
  ) THEN
    ALTER TABLE leave_requests ADD COLUMN workflow_id UUID;
  END IF;
END $$;

-- Ensure year column exists in leave_balances
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_balances' AND column_name = 'year'
  ) THEN
    ALTER TABLE leave_balances ADD COLUMN year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW());
  END IF;
END $$;

-- Then add foreign key for workflow_id after tables are created
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'leave_requests_workflow_id_fkey'
  ) THEN
    ALTER TABLE leave_requests 
    ADD CONSTRAINT leave_requests_workflow_id_fkey 
    FOREIGN KEY (workflow_id) REFERENCES leave_approval_workflows(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_workflow ON leave_requests(workflow_id);

CREATE INDEX IF NOT EXISTS idx_leave_approvals_request ON leave_approvals(leave_request_id);
CREATE INDEX IF NOT EXISTS idx_leave_approvals_approver ON leave_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_leave_approvals_status ON leave_approvals(status);
CREATE INDEX IF NOT EXISTS idx_leave_approvals_pending ON leave_approvals(status, due_date) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON leave_balances(year);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Employees can view their own requests
CREATE POLICY "Employees can view own leave requests" ON leave_requests FOR SELECT TO authenticated
USING (
  employee_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
);

-- Employees can create their own requests
CREATE POLICY "Employees can create leave requests" ON leave_requests FOR INSERT TO authenticated
WITH CHECK (
  employee_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
);

-- Employees can update their own pending requests
CREATE POLICY "Employees can update own pending requests" ON leave_requests FOR UPDATE TO authenticated
USING (
  employee_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid()) AND status = 'pending'
);

-- HR admins can view all requests
CREATE POLICY "HR admins can view all leave requests" ON leave_requests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- Managers can view their team's requests
CREATE POLICY "Managers can view team leave requests" ON leave_requests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = leave_requests.employee_id 
    AND e.manager_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
  )
);

-- Approvers can view requests assigned to them
CREATE POLICY "Approvers can view assigned requests" ON leave_approvals FOR SELECT TO authenticated
USING (
  approver_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- Approvers can update approvals assigned to them
CREATE POLICY "Approvers can update assigned approvals" ON leave_approvals FOR UPDATE TO authenticated
USING (
  (approver_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid()) AND status = 'pending')
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Employees can view their own balances
CREATE POLICY "Employees can view own balances" ON leave_balances FOR SELECT TO authenticated
USING (
  employee_id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- HR admins can manage all balances
CREATE POLICY "HR admins can manage balances" ON leave_balances FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
  )
);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_approvals_updated_at BEFORE UPDATE ON leave_approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to auto-assign approvers based on workflow
CREATE OR REPLACE FUNCTION assign_leave_approvers()
RETURNS TRIGGER AS $$
DECLARE
  workflow_rec RECORD;
  step_rec RECORD;
  step_data JSONB;
  approver_employee_id UUID;
  step_num INTEGER := 1;
BEGIN
  -- Get the workflow for this leave request
  SELECT * INTO workflow_rec FROM leave_approval_workflows 
  WHERE id = NEW.workflow_id AND is_active = TRUE;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Parse workflow steps and create approval records
  FOR step_data IN SELECT * FROM jsonb_array_elements(workflow_rec.workflow_steps) LOOP
    -- Find approver based on role
    IF (step_data->>'approver_role')::text = 'Manager' THEN
      SELECT manager_id INTO approver_employee_id FROM employees WHERE id = NEW.employee_id;
    ELSIF (step_data->>'approver_role')::text = 'HR' THEN
      SELECT e.id INTO approver_employee_id FROM employees e
      JOIN user_roles ur ON e.id = ur.employee_id
      WHERE ur.role = 'hr' LIMIT 1;
    ELSE
      approver_employee_id := NULL;
    END IF;
    
    -- Insert approval record
    INSERT INTO leave_approvals (
      leave_request_id,
      step_number,
      approver_role,
      approver_id,
      is_optional,
      due_date
    ) VALUES (
      NEW.id,
      step_num,
      (step_data->>'approver_role')::text,
      approver_employee_id,
      COALESCE((step_data->>'is_optional')::boolean, false),
      CASE 
        WHEN workflow_rec.escalation_enabled THEN 
          NOW() + INTERVAL '1 day' * workflow_rec.escalation_days
        ELSE NULL
      END
    );
    
    step_num := step_num + 1;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to assign approvers when leave request is created
CREATE TRIGGER trigger_assign_leave_approvers
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  WHEN (NEW.workflow_id IS NOT NULL)
  EXECUTE FUNCTION assign_leave_approvers();

-- Function to update leave balance when request is approved/rejected
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- When request is approved, move from pending to used
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET 
      pending_days = pending_days - NEW.total_days,
      used_days = used_days + NEW.total_days
    WHERE employee_id = NEW.employee_id 
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
      
    UPDATE leave_requests SET resolved_at = NOW() WHERE id = NEW.id;
  END IF;
  
  -- When request is rejected or cancelled, remove from pending
  IF NEW.status IN ('rejected', 'cancelled') AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET pending_days = pending_days - NEW.total_days
    WHERE employee_id = NEW.employee_id 
      AND leave_type_id = NEW.leave_type_id
      AND year = EXTRACT(YEAR FROM NEW.start_date);
      
    UPDATE leave_requests SET resolved_at = NOW() WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update balance when request status changes
CREATE TRIGGER trigger_update_leave_balance
  AFTER UPDATE OF status ON leave_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_leave_balance();

-- Function to reserve leave balance when request is created
CREATE OR REPLACE FUNCTION reserve_leave_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to pending days when request is created
  UPDATE leave_balances
  SET pending_days = pending_days + NEW.total_days
  WHERE employee_id = NEW.employee_id 
    AND leave_type_id = NEW.leave_type_id
    AND year = EXTRACT(YEAR FROM NEW.start_date);
  
  -- Create balance record if it doesn't exist
  IF NOT FOUND THEN
    INSERT INTO leave_balances (employee_id, leave_type_id, year, total_allocated, pending_days)
    VALUES (NEW.employee_id, NEW.leave_type_id, EXTRACT(YEAR FROM NEW.start_date), 0, NEW.total_days);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reserve balance when request is created
CREATE TRIGGER trigger_reserve_leave_balance
  AFTER INSERT ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION reserve_leave_balance();
