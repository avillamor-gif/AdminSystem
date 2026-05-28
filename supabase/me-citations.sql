-- =============================================================
-- M&E Citation Tracker
-- Tracks external mentions/citations of programs, research,
-- advocacy work, policy documents, etc.
-- =============================================================

CREATE TABLE IF NOT EXISTS me_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was cited
  title TEXT NOT NULL,
  -- Who/what did the citing
  source_name TEXT NOT NULL,           -- e.g. "Philippine Daily Inquirer", "WHO Report 2025"
  source_type TEXT NOT NULL DEFAULT 'news'
    CHECK (source_type IN (
      'news_article','academic_journal','policy_document',
      'government_report','social_media','book','conference','website','other'
    )),
  url TEXT,
  publication_date DATE,
  authors TEXT,                        -- comma-separated or free text

  -- Link to M&E records (optional)
  program_id UUID REFERENCES me_programs(id) ON DELETE SET NULL,
  project_id UUID REFERENCES me_projects(id) ON DELETE SET NULL,

  -- Which internal work type is cited
  work_type TEXT NOT NULL DEFAULT 'research'
    CHECK (work_type IN ('research','advocacy','policy','program','project','publication','other')),
  work_title TEXT,                     -- exact title of the cited internal work

  -- Meta
  notes TEXT,
  tags TEXT[],                         -- free tags e.g. {"climate","youth"}
  added_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- updated_at trigger
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_me_citations_updated_at') THEN
    CREATE TRIGGER trg_me_citations_updated_at
      BEFORE UPDATE ON me_citations
      FOR EACH ROW EXECUTE FUNCTION update_me_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE me_citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "me_citations_read"        ON me_citations FOR SELECT TO authenticated  USING (true);
CREATE POLICY "me_citations_service_all" ON me_citations FOR ALL    TO service_role   USING (true) WITH CHECK (true);
