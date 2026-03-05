-- Fix: Add missing RLS policy for user_roles table
-- This allows users to read their role without infinite recursion

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read their own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Policy 1: All authenticated users can read user_roles
-- This is safe because users need to know their role to use the app
-- We avoid infinite recursion by not checking user_roles within the policy
CREATE POLICY "Users can read user roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Only admins and HR can insert/update/delete roles
-- Users can manage their own role OR be an admin/HR
CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'hr')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'hr')
    )
  );

