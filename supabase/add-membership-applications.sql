-- Membership Applications Table
-- Run this in Supabase SQL Editor to extend the membership system

-- Drop if exists (for fresh setup)
DROP TABLE IF EXISTS member_applications CASCADE;
DROP TABLE IF EXISTS member_endorsements CASCADE;
DROP TABLE IF EXISTS member_education CASCADE;
DROP TABLE IF EXISTS member_org_affiliations CASCADE;
DROP TABLE IF EXISTS member_engagement_history CASCADE;

-- ── Member Applications (Main Form) ────────────────────────────────────────────

CREATE TABLE member_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Status workflow
  status VARCHAR(50) NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('draft', 'submitted', 'under_review', 'more_info_needed', 'approved', 'rejected')),
  
  -- Personal Information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  age INT,
  citizenship VARCHAR(100),
  home_address TEXT,
  office_address TEXT,
  phone_home VARCHAR(50),
  phone_office VARCHAR(50),
  
  -- Photo
  photo_url VARCHAR(500),
  
  -- IBON Application
  how_learned_about_ibon TEXT, -- free text: website, friend, event, etc.
  why_join TEXT, -- free text motivation
  publications_read TEXT, -- which IBON publications they've read
  
  -- Endorsement
  endorser_name VARCHAR(255),
  endorser_relationship VARCHAR(100), -- "colleague", "supervisor", "friend", etc.
  endorser_email VARCHAR(255),
  endorser_verified BOOLEAN DEFAULT FALSE,
  endorser_verified_at TIMESTAMPTZ,
  
  -- Admin notes
  admin_notes TEXT,
  admin_decision_reason TEXT, -- if rejected, why?
  
  -- Tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- applicant's auth user (can be null for anonymous)
  created_by_email VARCHAR(255), -- fallback email for non-authenticated users
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- admin who reviewed
  reviewed_at TIMESTAMPTZ,
  
  -- Metadata
  reference_number VARCHAR(50) UNIQUE, -- e.g. APP-2026-001234
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  
  -- Links
  created_member_id UUID REFERENCES members(id) ON DELETE SET NULL
);

-- ── Education History ────────────────────────────────────────────────────────

CREATE TABLE member_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES member_applications(id) ON DELETE CASCADE,
  
  highest_attainment VARCHAR(100), -- "High School", "Bachelor's", "Master's", etc.
  institution_name VARCHAR(255),
  institution_address TEXT,
  years_inclusive VARCHAR(50), -- e.g. "2010-2014"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Organizational Affiliation ─────────────────────────────────────────────

CREATE TABLE member_org_affiliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES member_applications(id) ON DELETE CASCADE,
  
  organization_name VARCHAR(255) NOT NULL,
  position VARCHAR(255),
  years_involved INT,
  organization_address TEXT,
  organization_type VARCHAR(100), -- "People's Organization", "NGO", "Network", "Platform", etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Engagement History (participation in IBON events) ────────────────────────

CREATE TABLE member_engagement_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES member_applications(id) ON DELETE CASCADE,
  
  title VARCHAR(255), -- e.g. "Global Assembly 2024"
  engagement_type VARCHAR(100), -- "Conference", "Workshop", "Seminar", "Training", etc.
  date_participated VARCHAR(50), -- or use DATE type
  location VARCHAR(255),
  participation_type VARCHAR(100), -- "Speaker", "Facilitator", "Moderator", "Participant"
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_org_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_engagement_history ENABLE ROW LEVEL SECURITY;

-- Public can view/insert their own applications
CREATE POLICY "Applicants can view own application"
  ON member_applications FOR SELECT
  USING (
    auth.uid() = created_by 
    OR created_by IS NULL  -- allow anonymous view of any (will be restricted by row in practice)
  );

CREATE POLICY "Anyone can insert (public form)"
  ON member_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Applicants can update own application"
  ON member_applications FOR UPDATE
  USING (auth.uid() = created_by OR created_by IS NULL)
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON member_applications FOR SELECT
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update applications"
  ON member_applications FOR UPDATE
  USING (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

-- Policies for child tables (same as parent)
CREATE POLICY "View own education records"
  ON member_education FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM member_applications a
      WHERE a.id = member_education.application_id
      AND (a.created_by = auth.uid() OR a.created_by IS NULL)
    )
    OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Insert education records"
  ON member_education FOR INSERT
  WITH CHECK (true);

CREATE POLICY "View own org affiliations"
  ON member_org_affiliations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM member_applications a
      WHERE a.id = member_org_affiliations.application_id
      AND (a.created_by = auth.uid() OR a.created_by IS NULL)
    )
    OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Insert org affiliations"
  ON member_org_affiliations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "View own engagement history"
  ON member_engagement_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM member_applications a
      WHERE a.id = member_engagement_history.application_id
      AND (a.created_by = auth.uid() OR a.created_by IS NULL)
    )
    OR (SELECT role FROM user_roles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Insert engagement history"
  ON member_engagement_history FOR INSERT
  WITH CHECK (true);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX idx_member_applications_status ON member_applications(status);
CREATE INDEX idx_member_applications_email ON member_applications(email);
CREATE INDEX idx_member_applications_reference ON member_applications(reference_number);
CREATE INDEX idx_member_applications_created_member ON member_applications(created_member_id);

-- ── Auto-generate reference number ────────────────────────────────────────────

-- Trigger to generate APP-YYYY-000001 format
CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS TRIGGER AS $$
DECLARE
  year_num INT;
  seq_num INT;
  year_prefix TEXT;
BEGIN
  year_num := EXTRACT(YEAR FROM NOW())::INT;
  year_prefix := 'APP-' || year_num;
  
  -- Get next sequence number for this year
  seq_num := COALESCE(
    (SELECT MAX(CAST(SUBSTRING(reference_number FROM LENGTH(year_prefix) + 2) AS INT))
     FROM member_applications
     WHERE reference_number LIKE year_prefix || '-%'),
    0
  ) + 1;
  
  NEW.reference_number := year_prefix || '-' || LPAD(seq_num::TEXT, 6, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_app_reference
BEFORE INSERT ON member_applications
FOR EACH ROW
WHEN (NEW.reference_number IS NULL)
EXECUTE FUNCTION generate_application_reference();
