-- ============================================================
-- Distribution Lists table for Publications module
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS distribution_lists (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name             text        NOT NULL,
  description      text,
  publication_type varchar(50) DEFAULT 'All',
  recipients       text[]      DEFAULT '{}',
  frequency        varchar(30) DEFAULT 'monthly',
  is_active        boolean     DEFAULT true,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE distribution_lists ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='distribution_lists' AND policyname='auth read distribution lists') THEN
    CREATE POLICY "auth read distribution lists"   ON distribution_lists FOR SELECT TO authenticated USING (true);
    CREATE POLICY "auth insert distribution lists" ON distribution_lists FOR INSERT TO authenticated WITH CHECK (true);
    CREATE POLICY "auth update distribution lists" ON distribution_lists FOR UPDATE TO authenticated USING (true);
    CREATE POLICY "auth delete distribution lists" ON distribution_lists FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- Verify
SELECT COUNT(*) AS distribution_lists_count FROM distribution_lists;
