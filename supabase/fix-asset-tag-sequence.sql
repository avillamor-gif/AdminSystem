-- ============================================================
-- Fix missing asset_tag_seq sequence and generate_asset_tag trigger
-- Run in Supabase SQL Editor if you get:
--   "relation asset_tag_seq does not exist"
-- Safe to run multiple times.
-- ============================================================

-- 1. Create the sequence (starting after the highest existing tag number)
DO $$
DECLARE
  max_num INTEGER := 0;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(asset_tag FROM 5) AS INTEGER)), 0)
  INTO max_num
  FROM assets
  WHERE asset_tag ~ '^AST-[0-9]+$';

  EXECUTE format('CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START %s', max_num + 1);
END;
$$;

-- 2. Re-create the trigger function
CREATE OR REPLACE FUNCTION generate_asset_tag()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  IF NEW.asset_tag IS NULL OR TRIM(NEW.asset_tag) = '' THEN
    next_number := nextval('asset_tag_seq');
    NEW.asset_tag := 'AST-' || LPAD(next_number::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Re-attach the trigger
DROP TRIGGER IF EXISTS trigger_generate_asset_tag ON assets;
CREATE TRIGGER trigger_generate_asset_tag
  BEFORE INSERT ON assets
  FOR EACH ROW
  EXECUTE FUNCTION generate_asset_tag();

-- Verify
SELECT last_value FROM asset_tag_seq;
