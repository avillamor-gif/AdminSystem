-- Migration: Supply Units table for Office Supplies
-- Run ONCE in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS supply_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  abbreviation TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_supply_units_name ON supply_units(name);

-- Enable RLS
ALTER TABLE supply_units ENABLE ROW LEVEL SECURITY;

-- Policy: allow all authenticated users (same as other supply tables)
-- CREATE POLICY "Allow authenticated users full access on supply_units"
--   ON supply_units FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed common units
INSERT INTO supply_units (name, abbreviation, description) VALUES
  ('Piece',    'pc',   'Individual items'),
  ('Box',      'box',  'A box of items'),
  ('Pack',     'pack', 'A pack of items'),
  ('Ream',     'rm',   '500 sheets of paper'),
  ('Roll',     'roll', 'A roll (tape, ribbon, etc.)'),
  ('Set',      'set',  'A set of items'),
  ('Bottle',   'btl',  'A bottle of liquid supplies'),
  ('Can',      'can',  'A can of supplies'),
  ('Bag',      'bag',  'A bag of items'),
  ('Pair',     'pr',   'A pair of items'),
  ('Dozen',    'doz',  '12 pieces'),
  ('Bundle',   'bdl',  'A bundle of items'),
  ('Booklet',  'bkl',  'A booklet of items')
ON CONFLICT (name) DO NOTHING;
