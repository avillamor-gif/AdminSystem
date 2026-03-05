-- Update holiday types to Philippine classification system
-- Regular Holidays, Special (Non-Working) Holidays, Special (Working) Holidays

-- Drop the old constraint
ALTER TABLE holidays DROP CONSTRAINT IF EXISTS holidays_holiday_type_check;

-- Add new constraint with Philippine holiday types
ALTER TABLE holidays ADD CONSTRAINT holidays_holiday_type_check 
  CHECK (holiday_type IN ('regular', 'special_non_working', 'special_working'));
