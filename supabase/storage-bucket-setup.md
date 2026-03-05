# Storage Bucket Setup Guide

## Required Buckets

You need to create TWO storage buckets in Supabase:

### 1. contracts bucket
For employment contract documents

### 2. attachments bucket  
For personal employee attachments

## How to Create Buckets

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Enter bucket name: `contracts` (or `attachments`)
4. **Important**: Make it **Public** or add proper policies
5. Click "Create bucket"

## Option A: Public Buckets (Simplest for Development)

When creating the bucket, toggle **"Public bucket"** to ON.

This allows authenticated users to upload/download without additional policies.

## Option B: Private Buckets with Policies (More Secure)

If you want private buckets, after creating them, add these policies:

### For 'contracts' bucket:

**Policy Name**: Allow authenticated users all access
**Allowed operation**: SELECT, INSERT, UPDATE, DELETE
**Target roles**: authenticated
**USING expression**: `true`
**WITH CHECK expression**: `true`

### For 'attachments' bucket:

**Policy Name**: Allow authenticated users all access  
**Allowed operation**: SELECT, INSERT, UPDATE, DELETE
**Target roles**: authenticated
**USING expression**: `true`
**WITH CHECK expression**: `true`

## Verify Buckets Exist

Run this in Supabase SQL Editor:

```sql
SELECT name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name IN ('contracts', 'attachments');
```

Should return 2 rows showing both buckets.

## Common Issues

### Error: "Bucket not found"
- Bucket doesn't exist yet - create it in Dashboard

### Error: "new row violates row-level security policy"  
- Bucket is private without policies - either make public or add policies

### Error: "Permission denied"
- Storage policies missing - add the policies shown above

## Quick Test

After creating buckets, try uploading a small PDF file in the app. Check browser console (F12) for detailed error messages if upload fails.
