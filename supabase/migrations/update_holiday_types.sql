-- Update holiday types to include more options
-- Run this migration to add new holiday types

-- Drop the old constraint
ALTER TABLE holidays DROP CONSTRAINT IF EXISTS holidays_holiday_type_check;

-- Add new constraint with updated holiday types
ALTER TABLE holidays ADD CONSTRAINT holidays_holiday_type_check 
  CHECK (holiday_type IN (
    'public', 
    'national', 
    'company', 
    'optional', 
    'religious',
    'regional',
    'observance',
    'federal',
    'bank'
  ));
