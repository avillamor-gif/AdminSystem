-- Payroll Benefits Plans Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS benefits_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- e.g. 'health', 'retirement', 'allowance', etc.
  amount NUMERIC(12,2) NOT NULL,
  is_taxable BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_benefits_plans_type ON benefits_plans(type);

-- Enable RLS
ALTER TABLE benefits_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Only admin/hr can manage
CREATE POLICY "Admin/HR can manage benefits plans" ON benefits_plans FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'hr')
  )
);

-- Policy: Anyone can read
CREATE POLICY "Anyone can read benefits plans" ON benefits_plans FOR SELECT TO authenticated USING (true);
