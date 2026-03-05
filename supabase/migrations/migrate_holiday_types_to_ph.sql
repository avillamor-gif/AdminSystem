-- Migrate existing holiday types to Philippine classification
-- This migration updates existing data before changing the constraint

-- STEP 1: Drop the old constraint first
ALTER TABLE holidays DROP CONSTRAINT IF EXISTS holidays_holiday_type_check;

-- STEP 2: Update existing holidays to new types
-- Map old types to new Philippine types
UPDATE holidays 
SET holiday_type = CASE 
  WHEN holiday_type IN ('public', 'national', 'federal') THEN 'regular'
  WHEN holiday_type IN ('company', 'religious', 'regional', 'observance', 'bank') THEN 'special_non_working'
  WHEN holiday_type = 'optional' THEN 'special_working'
  ELSE 'regular'  -- default fallback
END
WHERE holiday_type NOT IN ('regular', 'special_non_working', 'special_working');

-- STEP 3: Add new constraint with Philippine holiday types
ALTER TABLE holidays ADD CONSTRAINT holidays_holiday_type_check 
  CHECK (holiday_type IN ('regular', 'special_non_working', 'special_working'));
