-- ============================================================
-- Organization Profile & General Settings Tables
-- Run in Supabase SQL Editor
-- Safe to run multiple times
-- ============================================================

-- ── 1. Organization Profile (single-row settings table) ──────────────────────
CREATE TABLE IF NOT EXISTS org_profile (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Identity
  name             VARCHAR(255),
  short_name       VARCHAR(100),
  tagline          TEXT,
  description      TEXT,
  logo_url         TEXT,
  -- Registration
  registration_no  VARCHAR(100),
  tax_id           VARCHAR(100),
  date_established DATE,
  org_type         VARCHAR(100),  -- e.g. 'Non-profit NGO', 'Corporation', etc.
  -- Contact
  email            VARCHAR(255),
  phone            VARCHAR(50),
  fax              VARCHAR(50),
  website          VARCHAR(255),
  -- Address
  address          TEXT,
  city             VARCHAR(100),
  province         VARCHAR(100),
  postal_code      VARCHAR(20),
  country          VARCHAR(100) DEFAULT 'Philippines',
  -- Social
  facebook_url     TEXT,
  twitter_url      TEXT,
  linkedin_url     TEXT,
  -- Timestamps
  updated_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_org_profile_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_org_profile_updated_at ON org_profile;
CREATE TRIGGER trg_org_profile_updated_at
  BEFORE UPDATE ON org_profile
  FOR EACH ROW EXECUTE FUNCTION set_org_profile_updated_at();

ALTER TABLE org_profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_profile_select" ON org_profile;
DROP POLICY IF EXISTS "org_profile_all_service" ON org_profile;
CREATE POLICY "org_profile_select" ON org_profile FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_profile_all_service" ON org_profile FOR ALL USING (auth.role() = 'service_role');

-- Seed one blank row (single-row pattern)
INSERT INTO org_profile (id) VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ── 2. General Settings (key-value store for system preferences) ──────────────
CREATE TABLE IF NOT EXISTS general_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT,
  label       VARCHAR(255),
  description TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE general_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "general_settings_select" ON general_settings;
DROP POLICY IF EXISTS "general_settings_all_service" ON general_settings;
CREATE POLICY "general_settings_select" ON general_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "general_settings_all_service" ON general_settings FOR ALL USING (auth.role() = 'service_role');

-- Seed default values
INSERT INTO general_settings (key, value, label, description) VALUES
  ('timezone',          'Asia/Manila',  'Timezone',           'Default timezone for dates and times'),
  ('date_format',       'MM/DD/YYYY',   'Date Format',        'How dates are displayed across the system'),
  ('time_format',       '12h',          'Time Format',        '12-hour or 24-hour clock'),
  ('fiscal_year_start', '01',           'Fiscal Year Start',  'Month the fiscal year begins (01 = January)'),
  ('currency',          'PHP',          'Currency',           'Default currency code'),
  ('currency_symbol',   '₱',           'Currency Symbol',    'Symbol shown before amounts'),
  ('language',          'en',           'Language',           'Default interface language'),
  ('leave_year_basis',  'calendar',     'Leave Year Basis',   'calendar or anniversary'),
  ('max_upload_mb',     '10',           'Max Upload Size (MB)','Maximum file upload size in megabytes')
ON CONFLICT (key) DO NOTHING;

-- ── 3. Seed permissions ───────────────────────────────────────────────────────
INSERT INTO permissions (name, code, category, description) VALUES
  ('Access General Settings',      'admin.system_config.general_settings',      'Admin Modules', 'Access General Settings'),
  ('Access Organization Profile',  'admin.system_config.organization_profile',  'Admin Modules', 'Access Organization Profile')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Executive Director')
  AND p.code IN ('admin.system_config.general_settings', 'admin.system_config.organization_profile')
ON CONFLICT DO NOTHING;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
  WHERE table_name IN ('org_profile', 'general_settings');
SELECT key, value FROM general_settings ORDER BY key;
