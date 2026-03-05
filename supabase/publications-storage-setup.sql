-- ============================================================
-- Publications Storage Setup
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add pdf_url and cover_url columns to publication_requests
ALTER TABLE publication_requests
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 2. Create the publications storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'publications',
  'publications',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage policies for the publications bucket

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads to publications"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'publications');

-- Allow public read access (so cover images display without auth)
CREATE POLICY "Allow public read from publications"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'publications');

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow authenticated deletes from publications"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'publications');
