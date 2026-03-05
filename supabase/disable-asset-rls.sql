-- Disable RLS for asset tables (DEVELOPMENT ONLY)
-- Run this in Supabase SQL Editor if you encounter RLS errors

ALTER TABLE asset_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenance DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_requests DISABLE ROW LEVEL SECURITY;

-- Disable RLS for request/workflow tables
ALTER TABLE travel_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE publication_requests DISABLE ROW LEVEL SECURITY;

-- Note: In production, you should properly configure RLS policies instead of disabling them