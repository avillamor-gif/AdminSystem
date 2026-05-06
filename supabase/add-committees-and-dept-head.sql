-- ============================================================
-- Committees + Department Head
-- Run in Supabase SQL Editor
-- Safe to run multiple times
-- ============================================================

-- ── 1. Add head_id to departments ────────────────────────────────────────────
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS head_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- ── 2. Committees table ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS committees (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  type        VARCHAR(50)  NOT NULL DEFAULT 'standing', -- 'standing' | 'ad_hoc' | 'technical' | 'advisory'
  formed_at   DATE,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_committees_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_committees_updated_at ON committees;
CREATE TRIGGER trg_committees_updated_at
  BEFORE UPDATE ON committees
  FOR EACH ROW EXECUTE FUNCTION set_committees_updated_at();

ALTER TABLE committees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "committees_select" ON committees;
DROP POLICY IF EXISTS "committees_all_service" ON committees;
CREATE POLICY "committees_select" ON committees FOR SELECT TO authenticated USING (true);
CREATE POLICY "committees_all_service" ON committees FOR ALL USING (auth.role() = 'service_role');

-- ── 3. Committee members table ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS committee_members (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  committee_id  UUID        NOT NULL REFERENCES committees(id) ON DELETE CASCADE,
  employee_id   UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  role          VARCHAR(50)  NOT NULL DEFAULT 'member', -- 'chair' | 'secretary' | 'member'
  joined_at     DATE,
  UNIQUE (committee_id, employee_id)
);

ALTER TABLE committee_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "committee_members_select" ON committee_members;
DROP POLICY IF EXISTS "committee_members_all_service" ON committee_members;
CREATE POLICY "committee_members_select" ON committee_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "committee_members_all_service" ON committee_members FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_committee_members_committee ON committee_members (committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_members_employee  ON committee_members (employee_id);

-- ── 4. Seed admin.organization.committees permission ─────────────────────────
INSERT INTO permissions (name, code, category, description) VALUES
  ('Access Committees', 'admin.organization.committees', 'Admin Modules', 'Access Committees management submenu')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Executive Director', 'HR Manager')
  AND p.code = 'admin.organization.committees'
ON CONFLICT DO NOTHING;

-- ── 5. Sample: PME committee ──────────────────────────────────────────────────
-- INSERT INTO committees (name, description, type, is_active) VALUES
--   ('PME', 'Personnel Management and Evaluation Committee', 'standing', true);

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'departments' AND column_name = 'head_id';
SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('committees', 'committee_members');
