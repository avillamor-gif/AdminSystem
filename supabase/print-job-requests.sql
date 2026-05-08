-- ============================================================
-- Print Job Requests + Distribution Plan
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Print Job Requests table
CREATE TABLE IF NOT EXISTS print_job_requests (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number        varchar(20) UNIQUE,
  publication_id        uuid REFERENCES publication_requests(id) ON DELETE SET NULL,
  title                 text NOT NULL,
  publication_type      varchar(50)  NOT NULL DEFAULT 'other',
  request_type          varchar(30)  NOT NULL DEFAULT 'new_print',
  quantity              integer      NOT NULL DEFAULT 1,
  purpose               text,
  event_name            text,
  target_date           date,
  paper_size            varchar(20)  DEFAULT 'A4',
  paper_type            varchar(30)  DEFAULT 'bond',
  color_mode            varchar(20)  DEFAULT 'full_color',
  binding_type          varchar(30)  DEFAULT 'none',
  special_instructions  text,
  estimated_cost        numeric(12,2),
  actual_cost           numeric(12,2),
  printing_press_id     uuid REFERENCES printing_presses(id) ON DELETE SET NULL,
  status                varchar(30)  NOT NULL DEFAULT 'draft',
  requested_by          uuid REFERENCES employees(id) ON DELETE SET NULL,
  approved_by           uuid REFERENCES employees(id) ON DELETE SET NULL,
  approved_at           timestamptz,
  rejection_reason      text,
  notes                 text,
  created_at            timestamptz  DEFAULT now(),
  updated_at            timestamptz  DEFAULT now()
);

-- 2. Distribution Plan rows (child of print_job_requests)
CREATE TABLE IF NOT EXISTS print_job_distribution_plan (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  print_job_id            uuid NOT NULL REFERENCES print_job_requests(id) ON DELETE CASCADE,
  recipient_group         text NOT NULL,
  recipient_type          varchar(20)  DEFAULT 'internal',  -- internal | external | event | online
  quantity                integer      NOT NULL DEFAULT 1,
  delivery_method         varchar(30)  DEFAULT 'pickup',    -- pickup | courier | mail | hand_carry | event | digital
  delivery_address        text,
  pic_name                text,
  target_date             date,
  actual_delivered_date   date,
  status                  varchar(20)  DEFAULT 'pending',   -- pending | in_transit | delivered | partial | returned
  notes                   text,
  sort_order              integer      DEFAULT 0,
  created_at              timestamptz  DEFAULT now()
);

-- 3. Auto-generate request numbers (PRJ-00001)
CREATE SEQUENCE IF NOT EXISTS print_job_seq START 1;

CREATE OR REPLACE FUNCTION generate_print_job_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL OR TRIM(NEW.request_number) = '' THEN
    NEW.request_number := 'PRJ-' || LPAD(nextval('print_job_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_print_job_number ON print_job_requests;
CREATE TRIGGER trigger_generate_print_job_number
  BEFORE INSERT ON print_job_requests
  FOR EACH ROW EXECUTE FUNCTION generate_print_job_number();

-- 4. RLS
ALTER TABLE print_job_requests          ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_job_distribution_plan ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='print_job_requests' AND policyname='auth read print jobs') THEN
    CREATE POLICY "auth read print jobs"   ON print_job_requests FOR SELECT TO authenticated USING (true);
    CREATE POLICY "auth insert print jobs" ON print_job_requests FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "auth update print jobs" ON print_job_requests FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "auth delete print jobs" ON print_job_requests FOR DELETE TO authenticated USING (true);
    CREATE POLICY "auth read dist plan"    ON print_job_distribution_plan FOR SELECT TO authenticated USING (true);
    CREATE POLICY "auth insert dist plan"  ON print_job_distribution_plan FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "auth update dist plan"  ON print_job_distribution_plan FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "auth delete dist plan"  ON print_job_distribution_plan FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- 5. Permission entry
INSERT INTO permissions (name, code, category, description)
VALUES ('Print Job Requests', 'admin.publications.print_jobs', 'Admin Modules', 'Access Print Job Requests submenu')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('Super Admin', 'Admin', 'HR Manager', 'Executive Director')
  AND p.code = 'admin.publications.print_jobs'
ON CONFLICT DO NOTHING;

-- Verify
SELECT 'print_job_requests' AS tbl, COUNT(*) FROM print_job_requests
UNION ALL
SELECT 'print_job_distribution_plan', COUNT(*) FROM print_job_distribution_plan;
