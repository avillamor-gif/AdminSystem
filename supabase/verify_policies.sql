-- Run this in Supabase SQL Editor to verify the policies exist

-- Check what policies exist on user_roles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Also check if RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'user_roles';
