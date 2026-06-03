-- Wire job_categories to job_titles
-- Safe to run multiple times (uses IF NOT EXISTS / DO $$ guards)
-- No existing data is affected.

ALTER TABLE job_titles
  ADD COLUMN IF NOT EXISTS job_category_id UUID REFERENCES job_categories(id) ON DELETE SET NULL;

-- Index for filtering/joining
CREATE INDEX IF NOT EXISTS idx_job_titles_job_category ON job_titles(job_category_id);
