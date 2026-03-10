-- ============================================================
-- Payroll Runs & Payslips
-- Philippine NGO (IBON International)
-- ============================================================

-- Employee → Salary Structure assignment
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS salary_structure_id uuid REFERENCES salary_structures(id) ON DELETE SET NULL;

-- Payroll Runs (one per pay period)
CREATE TABLE IF NOT EXISTS payroll_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                                      -- e.g. "March 2026 – Semi-Monthly 1"
  period_type   text NOT NULL CHECK (period_type IN ('monthly', 'semi_monthly', 'weekly')),
  pay_date      date NOT NULL,
  period_start  date NOT NULL,
  period_end    date NOT NULL,
  status        text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'processing', 'for_approval', 'approved', 'paid', 'cancelled')),
  notes         text,
  created_by    uuid REFERENCES auth.users(id),
  approved_by   uuid REFERENCES auth.users(id),
  approved_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read payroll_runs"
  ON payroll_runs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins/HR can manage payroll_runs"
  ON payroll_runs FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
  ));

-- Payslips (one per employee per payroll run)
CREATE TABLE IF NOT EXISTS payslips (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id        uuid NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id           uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  -- Gross
  basic_salary          numeric(14,2) NOT NULL DEFAULT 0,
  allowances            numeric(14,2) NOT NULL DEFAULT 0,
  gross_pay             numeric(14,2) NOT NULL DEFAULT 0,

  -- Mandatory Government Deductions (PH)
  sss_ee                numeric(14,2) NOT NULL DEFAULT 0,   -- Employee share
  philhealth_ee         numeric(14,2) NOT NULL DEFAULT 0,
  pagibig_ee            numeric(14,2) NOT NULL DEFAULT 0,
  withholding_tax       numeric(14,2) NOT NULL DEFAULT 0,

  -- Employer Shares (for records/costs)
  sss_er                numeric(14,2) NOT NULL DEFAULT 0,
  philhealth_er         numeric(14,2) NOT NULL DEFAULT 0,
  pagibig_er            numeric(14,2) NOT NULL DEFAULT 0,

  -- Other
  other_deductions      numeric(14,2) NOT NULL DEFAULT 0,
  total_deductions      numeric(14,2) NOT NULL DEFAULT 0,
  net_pay               numeric(14,2) NOT NULL DEFAULT 0,

  -- Breakdown snapshots (JSON arrays saved at generation time)
  earnings_breakdown    jsonb,   -- [{name, amount}]
  deductions_breakdown  jsonb,   -- [{name, amount}]

  -- Override / adjustment
  adjustment_amount     numeric(14,2) NOT NULL DEFAULT 0,
  adjustment_note       text,

  status                text NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'approved', 'paid')),
  remarks               text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (payroll_run_id, employee_id)
);

ALTER TABLE payslips ENABLE ROW LEVEL SECURITY;

-- Admins/HR can see all payslips
CREATE POLICY "Admins/HR can manage payslips"
  ON payslips FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
  ));

-- Employees can view their own payslips
CREATE POLICY "Employees can view own payslips"
  ON payslips FOR SELECT TO authenticated
  USING (
    employee_id IN (
      SELECT id FROM employees
      WHERE email = auth.email()
         OR id IN (SELECT employee_id FROM user_roles WHERE user_id = auth.uid())
    )
  );

-- Trigger: keep updated_at current
CREATE OR REPLACE FUNCTION update_payroll_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_payroll_runs_updated_at ON payroll_runs;
CREATE TRIGGER trg_payroll_runs_updated_at
  BEFORE UPDATE ON payroll_runs
  FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

DROP TRIGGER IF EXISTS trg_payslips_updated_at ON payslips;
CREATE TRIGGER trg_payslips_updated_at
  BEFORE UPDATE ON payslips
  FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();
