-- Fix storage bucket policies to allow client access to view uploaded images
-- This allows clients to view images/files from their own form responses

-- First, ensure the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'form-assets';

-- Drop existing policies for form-assets bucket
DROP POLICY IF EXISTS "Public read access xj519o_0" ON storage.objects;
DROP POLICY IF EXISTS "Public upload policy xj519o_0" ON storage.objects;
DROP POLICY IF EXISTS "Public delete policy xj519o_0" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_upload_form_assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view form assets" ON storage.objects;
DROP POLICY IF EXISTS "Clients can view form assets" ON storage.objects;

-- Allow public to SELECT (view/download) files from form-assets bucket
CREATE POLICY "Public can view form-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'form-assets');

-- Allow authenticated users to INSERT files
CREATE POLICY "Authenticated users can upload form-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'form-assets');

-- Allow public to INSERT files (for form submissions)
CREATE POLICY "Public can upload form-assets"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'form-assets');

-- Allow authenticated users to DELETE their files
CREATE POLICY "Authenticated users can delete form-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'form-assets');
