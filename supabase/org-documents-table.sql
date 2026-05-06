-- ============================================================
-- Organization Documents Table
-- Run in Supabase SQL Editor
-- Safe to run multiple times
-- ============================================================

CREATE TABLE IF NOT EXISTS org_documents (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  description  TEXT,
  category     VARCHAR(100) NOT NULL DEFAULT 'General',
  file_url     TEXT        NOT NULL,
  file_name    VARCHAR(255),
  file_size    BIGINT,
  file_type    VARCHAR(100),
  uploaded_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION set_org_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_org_documents_updated_at ON org_documents;
CREATE TRIGGER trg_org_documents_updated_at
  BEFORE UPDATE ON org_documents
  FOR EACH ROW EXECUTE FUNCTION set_org_documents_updated_at();

ALTER TABLE org_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "org_documents_select" ON org_documents;
DROP POLICY IF EXISTS "org_documents_all_service" ON org_documents;
CREATE POLICY "org_documents_select" ON org_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_documents_all_service" ON org_documents FOR ALL USING (auth.role() = 'service_role');

-- ── Storage bucket ────────────────────────────────────────────────────────────
-- Run this in Supabase Dashboard > Storage > New Bucket:
--   Name: org-documents
--   Public: false (private — use signed URLs)
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-documents', 'org-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "org_documents_upload" ON storage.objects;
DROP POLICY IF EXISTS "org_documents_read"   ON storage.objects;
DROP POLICY IF EXISTS "org_documents_delete" ON storage.objects;

CREATE POLICY "org_documents_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'org-documents');

CREATE POLICY "org_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'org-documents');

CREATE POLICY "org_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'org-documents');

-- ── Permissions ───────────────────────────────────────────────────────────────
INSERT INTO permissions (name, code, category, description) VALUES
  ('Manage Organization Documents', 'admin.system_config.org_documents', 'Admin Modules', 'Upload and manage organization documents')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'Executive Director')
  AND p.code = 'admin.system_config.org_documents'
ON CONFLICT DO NOTHING;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables WHERE table_name = 'org_documents';
