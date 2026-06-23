-- Add country column to member_applications
ALTER TABLE member_applications
  ADD COLUMN IF NOT EXISTS country VARCHAR(100);
