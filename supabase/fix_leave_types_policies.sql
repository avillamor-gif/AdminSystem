-- Add missing RLS policies for leave_types table
-- This allows admins to create, update, and delete leave types

-- Policy for INSERT
CREATE POLICY "Admins can create leave types"
  ON leave_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Policy for UPDATE
CREATE POLICY "Admins can update leave types"
  ON leave_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Policy for DELETE
CREATE POLICY "Admins can delete leave types"
  ON leave_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'leave_types'
ORDER BY cmd;
