-- Add organization column to members table if it doesn't exist
ALTER TABLE members
ADD COLUMN IF NOT EXISTS organization VARCHAR(255);

-- Create index for organization filtering
CREATE INDEX IF NOT EXISTS idx_members_organization ON members(organization);

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'members' AND column_name = 'organization';
