-- Payroll Tax Configuration Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tax_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  min_income NUMERIC(12,2) NOT NULL,
  max_income NUMERIC(12,2),
  rate NUMERIC(5,2) NOT NULL, -- percent
  base_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_tax_configurations_min_income ON tax_configurations(min_income);

-- Enable RLS
ALTER TABLE tax_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin/hr can manage
CREATE POLICY "Admin/HR can manage tax configurations" ON tax_configurations FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'hr')
  )
);

-- Policy: Anyone can read
CREATE POLICY "Anyone can read tax configurations" ON tax_configurations FOR SELECT TO authenticated USING (true);
