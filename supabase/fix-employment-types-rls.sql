-- Fix RLS policies for employment_types table

-- Disable RLS for development (you can enable it later with proper policies)
ALTER TABLE employment_types DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled, create proper policies:
-- First drop existing policies if any
DROP POLICY IF EXISTS "Allow read access to employment_types" ON employment_types;
DROP POLICY IF EXISTS "Allow all access to employment_types" ON employment_types;

-- Enable RLS
ALTER TABLE employment_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "Allow read access to employment_types"
  ON employment_types FOR SELECT
  TO authenticated
  USING (true);

-- Allow all authenticated users to insert/update/delete
CREATE POLICY "Allow all access to employment_types"
  ON employment_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
