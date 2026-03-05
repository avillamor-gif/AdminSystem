-- ============================================================
-- Printing Presses Table
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS printing_presses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100),
  specialties TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  min_order_qty INTEGER DEFAULT 1,
  turnaround_days INTEGER DEFAULT 5,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),n
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE printing_presses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on printing_presses"
  ON printing_presses FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on printing_presses"
  ON printing_presses FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update on printing_presses"
  ON printing_presses FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete on printing_presses"
  ON printing_presses FOR DELETE TO authenticated USING (true);
