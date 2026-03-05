-- Run this SQL in your Supabase SQL Editor to fix RLS issues

-- Option 1: Add policy to allow service role to manage user_roles
CREATE POLICY "Service role can manage user_roles"
  ON user_roles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Option 2: Add policy for authenticated users to insert into user_roles (less secure but works for setup)
CREATE POLICY "Allow authenticated users to insert user_roles"
  ON user_roles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Option 3: Temporarily disable RLS on user_roles (easiest for development)
-- ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Also, let's make sure the employees table allows inserts for admin/hr
-- First drop the existing policy that might be causing issues
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;

-- Create separate policies for each operation
CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Admins can delete employees"
  ON employees FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'hr')
    )
  );

-- Insert admin role for your user (replace with your actual user ID)
-- First, let's see what users exist:
-- SELECT id, email FROM auth.users;

-- Then run (replace YOUR_USER_ID):
-- INSERT INTO user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin');
