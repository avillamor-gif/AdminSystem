-- Make destination column nullable so travel requests can be saved as drafts
-- without a destination filled in yet
ALTER TABLE travel_requests ALTER COLUMN destination DROP NOT NULL;
