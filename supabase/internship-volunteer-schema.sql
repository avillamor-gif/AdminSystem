-- =====================================================
-- INTERNSHIP & VOLUNTEER PROGRAM MODULE
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add 'volunteer' to employment_types category CHECK constraint
ALTER TABLE employment_types
  DROP CONSTRAINT IF EXISTS employment_types_category_check;

ALTER TABLE employment_types
  ADD CONSTRAINT employment_types_category_check
  CHECK (category IN ('permanent','contract','temporary','intern','volunteer','consultant','board_member'));

-- =====================================================
-- 2. PARTNER INSTITUTIONS (Schools with MOA)
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  short_name TEXT,
  type TEXT NOT NULL DEFAULT 'university'
    CHECK (type IN ('university','college','technical','ngo','government','other')),
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Philippines',

  -- MOA details
  moa_number TEXT,
  moa_signed_date DATE,
  moa_expiry_date DATE,
  moa_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moa_status IN ('active','expired','pending','terminated')),
  moa_file_path TEXT,          -- PDF path in Supabase Storage bucket 'moa-documents'
  max_slots_per_term INTEGER DEFAULT 5,

  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_institutions_status  ON partner_institutions(moa_status);
CREATE INDEX IF NOT EXISTS idx_partner_institutions_active  ON partner_institutions(is_active);
CREATE INDEX IF NOT EXISTS idx_partner_institutions_expiry  ON partner_institutions(moa_expiry_date);

ALTER TABLE partner_institutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read partner institutions" ON partner_institutions;
DROP POLICY IF EXISTS "Admins can manage partner institutions" ON partner_institutions;

CREATE POLICY "Authenticated users can read partner institutions"
  ON partner_institutions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage partner institutions"
  ON partner_institutions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','hr')
    )
  );

-- =====================================================
-- 3. PROGRAM ENROLLMENTS (Per-intern/volunteer record)
-- =====================================================
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  partner_institution_id UUID REFERENCES partner_institutions(id) ON DELETE SET NULL,

  program_type TEXT NOT NULL DEFAULT 'internship'
    CHECK (program_type IN ('internship','ojt','volunteer','practicum','apprenticeship')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  supervisor_id UUID REFERENCES employees(id) ON DELETE SET NULL,  -- internal supervisor

  -- School-side info
  school_coordinator TEXT,
  school_coordinator_email TEXT,
  endorsement_letter_path TEXT,  -- uploaded file path

  -- Duration & hours
  start_date DATE NOT NULL,
  end_date DATE,
  required_hours INTEGER NOT NULL DEFAULT 600,
  rendered_hours NUMERIC(8,2) NOT NULL DEFAULT 0,

  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','completed','dropped','extended','pending')),

  -- Certificate
  certificate_issued BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_issued_at TIMESTAMPTZ,
  certificate_file_path TEXT,

  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_enrollments_employee   ON program_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_institution ON program_enrollments(partner_institution_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status      ON program_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_type        ON program_enrollments(program_type);

ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read program enrollments" ON program_enrollments;
DROP POLICY IF EXISTS "Admins can manage program enrollments" ON program_enrollments;

CREATE POLICY "Authenticated users can read program enrollments"
  ON program_enrollments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage program enrollments"
  ON program_enrollments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin','hr')
    )
  );

-- =====================================================
-- 4. Seed a few sample partner institutions
-- =====================================================
INSERT INTO partner_institutions
  (name, short_name, type, contact_person, contact_email, moa_number, moa_signed_date, moa_expiry_date, moa_status, max_slots_per_term)
VALUES
  ('University of Santo Tomas',      'UST',   'university', NULL, NULL, 'MOA-2025-UST-001',   '2025-01-15', '2027-01-14', 'active', 10),
  ('De La Salle University',         'DLSU',  'university', NULL, NULL, 'MOA-2025-DLSU-001',  '2025-03-01', '2027-02-28', 'active', 8),
  ('Polytechnic University of the Philippines', 'PUP', 'university', NULL, NULL, 'MOA-2024-PUP-001', '2024-06-01', '2026-05-31', 'active', 15),
  ('Technological University of the Philippines', 'TUP', 'technical', NULL, NULL, 'MOA-2025-TUP-001', '2025-01-01', '2027-12-31', 'active', 10)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. Storage bucket: moa-documents (private)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('moa-documents', 'moa-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can read moa documents" ON storage.objects;
CREATE POLICY "Authenticated users can read moa documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'moa-documents');
