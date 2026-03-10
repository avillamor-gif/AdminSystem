-- Payroll Pay Components Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pay_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g. basic, rata, allowance, overtime, etc.
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  taxable BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_pay_components_type ON pay_components(type);

-- Enable RLS
ALTER TABLE pay_components ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin/hr can manage
CREATE POLICY "Admin/HR can manage pay components" ON pay_components FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'hr')
  )
);

-- Policy: Anyone can read
CREATE POLICY "Anyone can read pay components" ON pay_components FOR SELECT TO authenticated USING (true);
