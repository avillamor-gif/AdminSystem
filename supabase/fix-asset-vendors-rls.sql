-- Fix RLS policies for asset setup tables (categories, brands, vendors, locations)
-- Adds 'ed' role to write policies and ensures WITH CHECK is present for INSERT/UPDATE

-- ── asset_vendors ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage asset vendors" ON asset_vendors;
CREATE POLICY "Admins can manage asset vendors"
  ON asset_vendors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  );

-- ── asset_categories ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage asset categories" ON asset_categories;
CREATE POLICY "Admins can manage asset categories"
  ON asset_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  );

-- ── asset_brands ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage asset brands" ON asset_brands;
CREATE POLICY "Admins can manage asset brands"
  ON asset_brands FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  );

-- ── asset_locations ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage asset locations" ON asset_locations;
CREATE POLICY "Admins can manage asset locations"
  ON asset_locations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  );

-- ── assets ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage assets" ON assets;
CREATE POLICY "Admins can manage assets"
  ON assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  );

-- ── asset_maintenance ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage asset maintenance" ON asset_maintenance;
CREATE POLICY "Admins can manage asset maintenance"
  ON asset_maintenance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  );

-- ── asset_assignments ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage asset assignments" ON asset_assignments;
CREATE POLICY "Admins can manage asset assignments"
  ON asset_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'hr', 'ed')
    )
  );
