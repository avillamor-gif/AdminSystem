-- Add image_urls JSONB array column to assets table for multi-image support
ALTER TABLE assets ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Backfill: copy existing image_url into image_urls array if not already there
UPDATE assets
SET image_urls = jsonb_build_array(image_url)
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR image_urls = '[]'::jsonb);
