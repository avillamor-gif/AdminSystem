-- Create leave_balances table matching the leaveRequest.service.ts schema
-- Uses year-based tracking (not period_start/period_end)

CREATE TABLE IF NOT EXISTS leave_balances (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id    UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year             INTEGER NOT NULL,
  total_allocated  DECIMAL(5,2) NOT NULL DEFAULT 0,
  used_days        DECIMAL(5,2) NOT NULL DEFAULT 0,
  pending_days     DECIMAL(5,2) NOT NULL DEFAULT 0,
  available_days   DECIMAL(5,2) GENERATED ALWAYS AS (total_allocated - used_days - pending_days) STORED,
  carried_over     DECIMAL(5,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(employee_id, leave_type_id, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee   ON leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_leave_type ON leave_balances(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year       ON leave_balances(year);

-- RLS
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own leave balances" ON leave_balances;
CREATE POLICY "Users can view their own leave balances"
  ON leave_balances FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles
      WHERE user_id = auth.uid() AND employee_id IS NOT NULL
    )
    OR employee_id IN (
      SELECT id FROM employees WHERE email = auth.email()
    )
  );

DROP POLICY IF EXISTS "Admins can manage leave balances" ON leave_balances;
CREATE POLICY "Admins can manage leave balances"
  ON leave_balances FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr')
    )
  );

-- updated_at trigger
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
