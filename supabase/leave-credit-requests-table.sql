-- ============================================================
-- Leave Credit Requests Table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Leave credit request types: working on weekends, holidays, travel, etc.
CREATE TABLE IF NOT EXISTS leave_credit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- What earned the credit
  credit_type VARCHAR(50) NOT NULL CHECK (credit_type IN ('travel', 'weekend_work', 'holiday_work', 'other')),
  work_date_from DATE NOT NULL,
  work_date_to DATE NOT NULL,

  -- Days
  days_requested DECIMAL(5,2) NOT NULL CHECK (days_requested > 0),
  days_approved DECIMAL(5,2),           -- ED can adjust before approving

  -- Details
  reason TEXT NOT NULL,
  destination TEXT,                     -- for travel credits
  is_international BOOLEAN DEFAULT false,
  notes TEXT,                           -- Appendix 19 ref, etc.

  -- Leave type to credit (defaults to Vacation Leave)
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE SET NULL,

  -- Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_leave_credit_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leave_credit_requests_updated_at ON leave_credit_requests;
CREATE TRIGGER trg_leave_credit_requests_updated_at
  BEFORE UPDATE ON leave_credit_requests
  FOR EACH ROW EXECUTE FUNCTION update_leave_credit_requests_updated_at();

-- RLS
ALTER TABLE leave_credit_requests ENABLE ROW LEVEL SECURITY;

-- Employees can see their own requests
CREATE POLICY "lcr_select_own" ON leave_credit_requests
  FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr', 'manager')
    )
  );

-- Employees can insert their own requests
CREATE POLICY "lcr_insert_own" ON leave_credit_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
  );

-- Employees can update their own pending requests; admins can update any
CREATE POLICY "lcr_update" ON leave_credit_requests
  FOR UPDATE TO authenticated
  USING (
    (
      employee_id IN (
        SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
      )
      AND status = 'pending'
    )
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr', 'manager')
    )
  );

-- Only admins can delete
CREATE POLICY "lcr_delete" ON leave_credit_requests
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr')
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lcr_employee ON leave_credit_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_lcr_status ON leave_credit_requests (status);
CREATE INDEX IF NOT EXISTS idx_lcr_created ON leave_credit_requests (created_at DESC);

-- ── Leave Credit Notifications Table ─────────────────────
CREATE TABLE IF NOT EXISTS leave_credit_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,   -- 'new_request' | 'approved' | 'rejected'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID REFERENCES leave_credit_requests(id) ON DELETE CASCADE,
  requester_name VARCHAR(255),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leave_credit_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lcn_select" ON leave_credit_notifications
  FOR SELECT TO authenticated USING (recipient_user_id = auth.uid());
CREATE POLICY "lcn_insert" ON leave_credit_notifications
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "lcn_update" ON leave_credit_notifications
  FOR UPDATE TO authenticated USING (recipient_user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_lcn_recipient
  ON leave_credit_notifications (recipient_user_id, is_read, created_at DESC);
