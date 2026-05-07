-- ============================================================
-- Governance Nodes Table
-- Stores editable governance tiers (e.g. General Assembly,
-- Board of Trustees) that appear above the employee tree in
-- the Organizational Chart.
-- Run in Supabase SQL Editor — safe to run multiple times.
-- ============================================================

CREATE TABLE IF NOT EXISTS governance_nodes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id   UUID        REFERENCES governance_nodes(id) ON DELETE SET NULL,
  sort_order  INT         NOT NULL DEFAULT 0,
  color       VARCHAR(20) NOT NULL DEFAULT '#1e3a5f',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_governance_nodes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_governance_nodes_updated_at ON governance_nodes;
CREATE TRIGGER trg_governance_nodes_updated_at
  BEFORE UPDATE ON governance_nodes
  FOR EACH ROW EXECUTE FUNCTION set_governance_nodes_updated_at();

ALTER TABLE governance_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "governance_nodes_select" ON governance_nodes;
DROP POLICY IF EXISTS "governance_nodes_write" ON governance_nodes;

CREATE POLICY "governance_nodes_select" ON governance_nodes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "governance_nodes_write" ON governance_nodes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default governance tiers
INSERT INTO governance_nodes (id, name, description, parent_id, sort_order, color) VALUES
  ('00000000-0000-0000-0001-000000000001', 'General Assembly',   'Highest governing body of the organization', NULL,                                     0, '#1e3a5f'),
  ('00000000-0000-0000-0001-000000000002', 'Board of Trustees',  'Elected board responsible for governance and policy',  '00000000-0000-0000-0001-000000000001', 1, '#1d4ed8')
ON CONFLICT (id) DO NOTHING;

-- Permissions
INSERT INTO permissions (name, code, category, description) VALUES
  ('Manage Governance Nodes', 'admin.organization.governance_nodes', 'Admin Modules', 'Add/edit/delete governance tiers in organizational chart')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Executive Director')
  AND p.code = 'admin.organization.governance_nodes'
ON CONFLICT DO NOTHING;

-- Verify
SELECT id, name, parent_id, sort_order, color FROM governance_nodes ORDER BY sort_order;
