-- Publication Categories table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS publication_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed with defaults that match existing PUBLICATION_TYPES
INSERT INTO publication_categories (name, description, icon, is_active) VALUES
  ('Book', 'Full-length published books', '📚', true),
  ('Journal', 'Academic or research journals', '📓', true),
  ('Magazine', 'Periodical magazines', '📰', true),
  ('Newsletter', 'Internal or external newsletters', '📄', true),
  ('Report', 'Reports and research documents', '📊', true),
  ('Manual', 'Manuals and handbooks', '📋', true),
  ('Brochure', 'Brochures and flyers', '🗒️', true),
  ('Other', 'Other publication types', '📁', true)
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE publication_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read publication_categories"
  ON publication_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert publication_categories"
  ON publication_categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update publication_categories"
  ON publication_categories FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete publication_categories"
  ON publication_categories FOR DELETE TO authenticated USING (true);
