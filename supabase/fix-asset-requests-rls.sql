-- Fix RLS on asset_requests so super admin / ed / hr roles can see all records
-- Run this in the Supabase SQL Editor

-- Drop the restrictive original admin policy
DROP POLICY IF EXISTS "Admins can manage all asset requests" ON asset_requests;

-- Recreate it covering all elevated roles
CREATE POLICY "Admins can manage all asset requests"
  ON asset_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'hr', 'manager', 'super admin', 'ed')
    )
  );

-- Also fix the SELECT policy so managers / super admins can read
DROP POLICY IF EXISTS "Employees can view their own requests" ON asset_requests;

CREATE POLICY "Employees can view their own requests"
  ON asset_requests FOR SELECT
  TO authenticated
  USING (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'hr', 'manager', 'super admin', 'ed')
    )
  );

-- Also fix the INSERT policy so external-borrower records (employee_id = NULL) can be created by admins
DROP POLICY IF EXISTS "Employees can create their own requests" ON asset_requests;

CREATE POLICY "Employees can create their own requests"
  ON asset_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    employee_id IN (
      SELECT employee_id FROM user_roles WHERE user_id = auth.uid()
    )
    OR employee_id IS NULL  -- external borrower records
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'hr', 'manager', 'super admin', 'ed')
    )
  );
