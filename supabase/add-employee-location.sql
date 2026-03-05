-- Migration: Add location_id to employees table
-- This allows linking employees to office locations

-- Add location_id column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(location_id);

-- Add comment
COMMENT ON COLUMN employees.location_id IS 'Office location where the employee is based';

-- Optional: Add additional employee location-related fields
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS work_location_type VARCHAR(20) CHECK (work_location_type IN ('office', 'remote', 'hybrid', 'field'));

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS remote_location TEXT;

COMMENT ON COLUMN employees.work_location_type IS 'Type of work location: office, remote, hybrid, field';
COMMENT ON COLUMN employees.remote_location IS 'Remote work location details if applicable';
