-- Pay Grades Table for Admin Module
-- Run this in your Supabase SQL Editor

-- Create pay grades table
CREATE TABLE pay_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade VARCHAR(50) NOT NULL,
  level INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- executive, management, professional, support, etc.
  minimum_salary DECIMAL(12, 2) NOT NULL,
  midpoint_salary DECIMAL(12, 2) NOT NULL,
  maximum_salary DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'active', -- active, inactive
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint on grade
ALTER TABLE pay_grades ADD CONSTRAINT unique_pay_grade UNIQUE (grade);

-- Add updated_at trigger (reuse the function from job_descriptions if it exists)
CREATE TRIGGER update_pay_grades_updated_at 
  BEFORE UPDATE ON pay_grades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data for testing
INSERT INTO pay_grades (
  grade, 
  level, 
  title, 
  description, 
  category, 
  minimum_salary, 
  midpoint_salary, 
  maximum_salary, 
  status
) VALUES 
  ('E1', 1, 'Executive Level 1', 'Senior Executive positions', 'executive', 150000, 200000, 250000, 'active'),
  ('M1', 2, 'Management Level 1', 'Department Manager positions', 'management', 80000, 100000, 120000, 'active'),
  ('M2', 3, 'Management Level 2', 'Team Lead positions', 'management', 60000, 75000, 90000, 'active'),
  ('P1', 4, 'Professional Level 1', 'Senior Professional positions', 'professional', 50000, 65000, 80000, 'active'),
  ('P2', 5, 'Professional Level 2', 'Mid-level Professional positions', 'professional', 40000, 50000, 60000, 'active'),
  ('P3', 6, 'Professional Level 3', 'Entry-level Professional positions', 'professional', 30000, 40000, 50000, 'active'),
  ('S1', 7, 'Support Level 1', 'Senior Support positions', 'support', 25000, 35000, 45000, 'active'),
  ('S2', 8, 'Support Level 2', 'Entry-level Support positions', 'support', 20000, 28000, 36000, 'active');