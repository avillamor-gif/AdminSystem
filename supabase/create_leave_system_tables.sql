-- Complete Leave Management System Tables and Policies
-- This script creates leave_policies and leave_balances tables with full RLS

-- =============================================================================
-- 1. LEAVE POLICIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  employment_type_id UUID REFERENCES employment_types(id) ON DELETE CASCADE,
  
  -- Leave entitlement rules
  annual_leave_days INTEGER DEFAULT 0,
  sick_leave_days INTEGER DEFAULT 0,
  personal_leave_days INTEGER DEFAULT 0,
  
  -- Request rules (stored as JSONB for flexibility)
  advance_notice_days INTEGER DEFAULT 7,
  max_consecutive_days INTEGER DEFAULT 14,
  min_request_days INTEGER DEFAULT 1,
  blackout_periods JSONB DEFAULT '[]'::jsonb, -- Array of date ranges
  allow_half_days BOOLEAN DEFAULT false,
  allow_negative_balance BOOLEAN DEFAULT false,
  
  -- Carry-over rules
  allow_carryover BOOLEAN DEFAULT false,
  max_carryover_days INTEGER DEFAULT 0,
  carryover_expiry_months INTEGER DEFAULT 3,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  approval_levels INTEGER DEFAULT 1,
  auto_approve_threshold INTEGER, -- Auto-approve if days <= this value
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  applies_to_all BOOLEAN DEFAULT false, -- If true, applies to all employees
  priority INTEGER DEFAULT 0, -- Higher priority policies override lower ones
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 2. LEAVE BALANCES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  leave_policy_id UUID REFERENCES leave_policies(id) ON DELETE SET NULL,
  
  -- Balance tracking
  allocated_days DECIMAL(5,2) DEFAULT 0,
  used_days DECIMAL(5,2) DEFAULT 0,
  pending_days DECIMAL(5,2) DEFAULT 0, -- Days in pending requests
  available_days DECIMAL(5,2) GENERATED ALWAYS AS (allocated_days - used_days - pending_days) STORED,
  
  -- Carry-over tracking
  carried_over_days DECIMAL(5,2) DEFAULT 0,
  carryover_expiry_date DATE,
  
  -- Period tracking
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one balance per employee per leave type per period
  UNIQUE(employee_id, leave_type_id, period_start)
);

-- =============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_leave_policies_active ON leave_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_leave_policies_department ON leave_policies(department_id);
CREATE INDEX IF NOT EXISTS idx_leave_policies_employment_type ON leave_policies(employment_type_id);

CREATE INDEX IF NOT EXISTS idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_leave_type ON leave_balances(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_period ON leave_balances(period_start, period_end);

-- =============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on new tables
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Leave Policies Policies
DROP POLICY IF EXISTS "Users can read active leave policies" ON leave_policies;
CREATE POLICY "Users can read active leave policies"
  ON leave_policies FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can create leave policies" ON leave_policies;
CREATE POLICY "Admins can create leave policies"
  ON leave_policies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

DROP POLICY IF EXISTS "Admins can update leave policies" ON leave_policies;
CREATE POLICY "Admins can update leave policies"
  ON leave_policies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

DROP POLICY IF EXISTS "Admins can delete leave policies" ON leave_policies;
CREATE POLICY "Admins can delete leave policies"
  ON leave_policies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Leave Balances Policies
DROP POLICY IF EXISTS "Users can view their own leave balances" ON leave_balances;
CREATE POLICY "Users can view their own leave balances"
  ON leave_balances FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins can manage leave balances" ON leave_balances;
CREATE POLICY "Admins can manage leave balances"
  ON leave_balances FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- =============================================================================
-- 5. ADD MISSING RLS POLICIES FOR LEAVE_REQUESTS
-- =============================================================================

-- Update policy for leave requests
DROP POLICY IF EXISTS "Admins can update leave requests" ON leave_requests;
CREATE POLICY "Admins can update leave requests"
  ON leave_requests FOR UPDATE
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr', 'manager')
    )
  );

-- Delete policy for leave requests
DROP POLICY IF EXISTS "Admins can delete leave requests" ON leave_requests;
CREATE POLICY "Admins can delete leave requests"
  ON leave_requests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- =============================================================================
-- 6. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Update updated_at timestamp on leave_policies
CREATE OR REPLACE FUNCTION update_leave_policies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leave_policies_updated_at ON leave_policies;
CREATE TRIGGER trigger_update_leave_policies_updated_at
  BEFORE UPDATE ON leave_policies
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_policies_updated_at();

-- Update updated_at timestamp on leave_balances
CREATE OR REPLACE FUNCTION update_leave_balances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leave_balances_updated_at ON leave_balances;
CREATE TRIGGER trigger_update_leave_balances_updated_at
  BEFORE UPDATE ON leave_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balances_updated_at();

-- =============================================================================
-- 7. SAMPLE DATA (OPTIONAL - UNCOMMENT TO USE)
-- =============================================================================

-- Insert default leave policy
INSERT INTO leave_policies (name, description, annual_leave_days, sick_leave_days, personal_leave_days, applies_to_all, is_active)
VALUES 
  ('Standard Leave Policy', 'Default leave policy for all employees', 15, 10, 5, true, true),
  ('Executive Leave Policy', 'Enhanced leave policy for executives', 25, 15, 10, false, true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 8. VERIFICATION QUERIES
-- =============================================================================

-- Verify tables created
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('leave_policies', 'leave_balances')
ORDER BY tablename;

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('leave_policies', 'leave_balances', 'leave_requests')
ORDER BY tablename, cmd;

-- Check leave_requests policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'leave_requests'
ORDER BY cmd;
