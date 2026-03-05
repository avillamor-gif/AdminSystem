-- Employee Audit Logs Table
-- Tracks all changes made to employee records
CREATE TABLE IF NOT EXISTS employee_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  action VARCHAR(255) NOT NULL,
  changed_by VARCHAR(255) NOT NULL DEFAULT 'System',
  changed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_audit_logs_employee_id ON employee_audit_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_audit_logs_created_at ON employee_audit_logs(created_at DESC);

-- RLS
ALTER TABLE employee_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage audit logs" ON employee_audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr', 'manager')
    )
  );

CREATE POLICY "Employees can view their own audit logs" ON employee_audit_logs
  FOR SELECT USING (
    employee_id IN (
      SELECT id FROM employees WHERE id = (
        SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
      )
    )
  );

-- Employee Compliance Items Table
-- Tracks compliance checklist items per employee
CREATE TABLE IF NOT EXISTS employee_compliance_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  is_complete BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_compliance_items_employee_id ON employee_compliance_items(employee_id);

-- RLS
ALTER TABLE employee_compliance_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage compliance items" ON employee_compliance_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'hr', 'manager')
    )
  );

-- Function to auto-create default compliance items when a new employee is added
CREATE OR REPLACE FUNCTION create_default_compliance_items()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO employee_compliance_items (employee_id, label, is_complete) VALUES
    (NEW.id, 'Employment Contract', FALSE),
    (NEW.id, 'Tax Forms (BIR 2305/1902)', FALSE),
    (NEW.id, 'Direct Deposit / Payroll Form', FALSE),
    (NEW.id, 'Emergency Contact Submitted', FALSE),
    (NEW.id, 'Background Check', FALSE),
    (NEW.id, 'Employee Handbook Acknowledgment', FALSE),
    (NEW.id, 'SSS Registration', FALSE),
    (NEW.id, 'PhilHealth Registration', FALSE),
    (NEW.id, 'Pag-IBIG Registration', FALSE),
    (NEW.id, 'TIN Number Submitted', FALSE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_compliance_items
  AFTER INSERT ON employees
  FOR EACH ROW
  EXECUTE FUNCTION create_default_compliance_items();

-- Seed compliance items for all existing employees that don't have any yet
INSERT INTO employee_compliance_items (employee_id, label, is_complete)
SELECT e.id, items.label, FALSE
FROM employees e
CROSS JOIN (
  VALUES
    ('Employment Contract'),
    ('Tax Forms (BIR 2305/1902)'),
    ('Direct Deposit / Payroll Form'),
    ('Emergency Contact Submitted'),
    ('Background Check'),
    ('Employee Handbook Acknowledgment'),
    ('SSS Registration'),
    ('PhilHealth Registration'),
    ('Pag-IBIG Registration'),
    ('TIN Number Submitted')
) AS items(label)
WHERE NOT EXISTS (
  SELECT 1 FROM employee_compliance_items eci
  WHERE eci.employee_id = e.id
);
