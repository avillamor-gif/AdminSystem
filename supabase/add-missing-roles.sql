-- ============================================================
-- Insert missing roles that exist as enum values but not in
-- the roles table (Intern, Volunteer, Consultant, Board of Trustees).
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
-- ============================================================

INSERT INTO roles (name, description, is_system_role, status) VALUES
  ('Intern',           'Intern access — limited to assigned modules',       false, 'active'),
  ('Volunteer',        'Volunteer access — limited to assigned modules',     false, 'active'),
  ('Consultant',       'Consultant access — limited to assigned modules',    false, 'active'),
  ('Board of Trustees','Board of Trustees read-only access',                 false, 'active')
ON CONFLICT (name) DO NOTHING;

-- Confirm
SELECT name, status FROM roles ORDER BY name;
