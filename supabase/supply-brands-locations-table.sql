-- Create supply_brands table
CREATE TABLE IF NOT EXISTS supply_brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create supply_locations table
CREATE TABLE IF NOT EXISTS supply_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE supply_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies — allow authenticated users to read/write (same as supply_categories)
CREATE POLICY "Allow authenticated users full access on supply_brands"
  ON supply_brands FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access on supply_locations"
  ON supply_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
