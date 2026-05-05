-- Add borrowable_by column to assets table
-- Values: 'employees' | 'external' | 'both' | 'none'
-- Default: 'both' (existing assets are borrowable by everyone)

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS borrowable_by TEXT NOT NULL DEFAULT 'both'
  CHECK (borrowable_by IN ('employees', 'external', 'both', 'none'));

-- Existing assets default to 'both'
UPDATE assets SET borrowable_by = 'both' WHERE borrowable_by IS NULL;
