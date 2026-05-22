-- Fix 1: Update holidays table CHECK constraint to Philippine holiday types
ALTER TABLE holidays DROP CONSTRAINT IF EXISTS holidays_holiday_type_check;
ALTER TABLE holidays ADD CONSTRAINT holidays_holiday_type_check
  CHECK (holiday_type IN ('regular', 'special_non_working', 'special_working'));

-- Fix 2: Update RLS policies to allow all admin-level roles to manage holidays
DROP POLICY IF EXISTS "Allow HR admins to manage holidays" ON holidays;
CREATE POLICY "Allow admins to manage holidays" ON holidays
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'hr', 'ed', 'manager', 'super admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'hr', 'ed', 'manager', 'super admin')
    )
  );
