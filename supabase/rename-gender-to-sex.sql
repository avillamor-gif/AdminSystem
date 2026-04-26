-- Rename 'gender' column to 'sex' to match application field name
-- Safe: uses IF EXISTS so it won't fail if already renamed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'gender'
  ) THEN
    ALTER TABLE employees RENAME COLUMN gender TO sex;
  END IF;

  -- Ensure sex column exists in case gender was never added
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'sex'
  ) THEN
    ALTER TABLE employees ADD COLUMN sex VARCHAR(20);
  END IF;
END $$;
