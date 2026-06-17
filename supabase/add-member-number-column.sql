-- Add member_number column to members table and create auto-generation system

-- Add member_number column if it doesn't exist
ALTER TABLE members
ADD COLUMN IF NOT EXISTS member_number VARCHAR(50) UNIQUE;

-- Create an index on member_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_member_number ON members(member_number);

-- Create a sequence for member numbering
CREATE SEQUENCE IF NOT EXISTS member_number_seq START WITH 99 INCREMENT BY 1;

-- Create a function to generate member numbers
CREATE OR REPLACE FUNCTION generate_member_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  next_num INTEGER;
  member_num VARCHAR(50);
BEGIN
  next_num := nextval('member_number_seq');
  member_num := 'MEM-2026-' || LPAD(next_num::TEXT, 5, '0');
  RETURN member_num;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to auto-generate member_number on INSERT
CREATE OR REPLACE FUNCTION set_member_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.member_number IS NULL THEN
    NEW.member_number := generate_member_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS members_auto_member_number ON members;

-- Create the trigger
CREATE TRIGGER members_auto_member_number
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION set_member_number();
