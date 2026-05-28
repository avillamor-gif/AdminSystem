-- =============================================================
-- Monitoring & Evaluation Module
-- =============================================================

-- Programs (top-level interventions)
CREATE TABLE IF NOT EXISTS me_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  program_type TEXT NOT NULL DEFAULT 'project'
    CHECK (program_type IN ('project','advocacy','research','capacity_building','other')),
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning','active','completed','suspended')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(15,2),
  currency TEXT DEFAULT 'PHP',
  lead_staff_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  beneficiary_target INTEGER,
  beneficiary_count INTEGER DEFAULT 0,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects (may belong to a program or be standalone)
CREATE TABLE IF NOT EXISTS me_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES me_programs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL DEFAULT 'implementation'
    CHECK (project_type IN ('implementation','pilot','research','training','advocacy','other')),
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning','active','completed','suspended')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(15,2),
  currency TEXT DEFAULT 'PHP',
  lead_staff_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indicators (measurable results)
CREATE TABLE IF NOT EXISTS me_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES me_programs(id) ON DELETE CASCADE,
  project_id UUID REFERENCES me_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  indicator_type TEXT NOT NULL DEFAULT 'output'
    CHECK (indicator_type IN ('input','output','outcome','impact','process')),
  unit_of_measure TEXT NOT NULL DEFAULT 'number',
  baseline_value NUMERIC,
  target_value NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'quarterly'
    CHECK (frequency IN ('monthly','quarterly','semi-annual','annual','as-needed')),
  data_source TEXT,
  responsible_staff_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data Entries (staff-entered actual values per period)
CREATE TABLE IF NOT EXISTS me_data_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES me_indicators(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL,      -- e.g. "Q1 2025", "Jan 2025"
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  actual_value NUMERIC NOT NULL,
  narrative TEXT,
  entered_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  verified_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','verified')),
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reports (periodic summaries)
CREATE TABLE IF NOT EXISTS me_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  program_id UUID REFERENCES me_programs(id) ON DELETE SET NULL,
  project_id UUID REFERENCES me_projects(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL DEFAULT 'progress'
    CHECK (report_type IN ('progress','quarterly','annual','evaluation','baseline','endline')),
  period_label TEXT,
  period_start DATE,
  period_end DATE,
  content TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','final')),
  prepared_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_me_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_me_programs_updated_at') THEN
    CREATE TRIGGER trg_me_programs_updated_at BEFORE UPDATE ON me_programs FOR EACH ROW EXECUTE FUNCTION update_me_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_me_projects_updated_at') THEN
    CREATE TRIGGER trg_me_projects_updated_at BEFORE UPDATE ON me_projects FOR EACH ROW EXECUTE FUNCTION update_me_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_me_indicators_updated_at') THEN
    CREATE TRIGGER trg_me_indicators_updated_at BEFORE UPDATE ON me_indicators FOR EACH ROW EXECUTE FUNCTION update_me_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_me_data_entries_updated_at') THEN
    CREATE TRIGGER trg_me_data_entries_updated_at BEFORE UPDATE ON me_data_entries FOR EACH ROW EXECUTE FUNCTION update_me_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_me_reports_updated_at') THEN
    CREATE TRIGGER trg_me_reports_updated_at BEFORE UPDATE ON me_reports FOR EACH ROW EXECUTE FUNCTION update_me_updated_at();
  END IF;
END $$;

-- RLS
ALTER TABLE me_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE me_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE me_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE me_data_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE me_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read everything
CREATE POLICY "me_programs_read" ON me_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "me_projects_read" ON me_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "me_indicators_read" ON me_indicators FOR SELECT TO authenticated USING (true);
CREATE POLICY "me_data_entries_read" ON me_data_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "me_reports_read" ON me_reports FOR SELECT TO authenticated USING (true);

-- Service role (API routes) can do everything
CREATE POLICY "me_programs_service_all" ON me_programs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "me_projects_service_all" ON me_projects FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "me_indicators_service_all" ON me_indicators FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "me_data_entries_service_all" ON me_data_entries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "me_reports_service_all" ON me_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
