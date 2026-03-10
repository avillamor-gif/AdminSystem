-- Payroll Deductions Table
CREATE TABLE IF NOT EXISTS deductions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('government', 'company', 'other')),
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  recurring boolean NOT NULL DEFAULT false,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE deductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read deductions"
  ON deductions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage deductions"
  ON deductions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'super admin'))
  );

-- Bonus Structures Table
CREATE TABLE IF NOT EXISTS bonus_structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('statutory', 'performance', 'other')),
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  schedule text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bonus_structures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read bonus_structures"
  ON bonus_structures FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage bonus_structures"
  ON bonus_structures FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'super admin'))
  );

-- Reimbursements Table
CREATE TABLE IF NOT EXISTS reimbursements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('transport', 'representation', 'other')),
  amount numeric(12, 2) NOT NULL DEFAULT 0,
  taxable boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reimbursements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read reimbursements"
  ON reimbursements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admins to manage reimbursements"
  ON reimbursements FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'super admin'))
  );
