-- Add budget_plan_url and budget_plan_filename to travel_requests
-- Stores the Google Drive file URL and original filename of the uploaded Budget Plan Excel file
ALTER TABLE travel_requests
  ADD COLUMN IF NOT EXISTS budget_plan_url TEXT,
  ADD COLUMN IF NOT EXISTS budget_plan_filename TEXT;
