-- Remove the old CHECK constraint on location_type
-- This constraint was limiting location_type to hardcoded values
-- Now we want to allow any value from the location_types table

ALTER TABLE locations 
DROP CONSTRAINT IF EXISTS locations_location_type_check;

-- Optionally, you can add a foreign key constraint instead
-- to ensure location_type references a valid code from location_types table
-- (Uncomment the lines below if you want to enforce this relationship)

-- ALTER TABLE locations
-- ADD CONSTRAINT locations_location_type_fkey
-- FOREIGN KEY (location_type) 
-- REFERENCES location_types(code)
-- ON DELETE RESTRICT
-- ON UPDATE CASCADE;
