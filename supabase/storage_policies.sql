-- Storage policies for form assets and client logos buckets
-- These policies allow public read access and authenticated upload access
-- Note: These policies are managed through Supabase's storage system, not direct table access

-- For 'form-assets' bucket - create policies via Supabase Dashboard or API:
-- 1. Go to Supabase Dashboard → Storage → form-assets → Policies
-- 2. Create the following policies:

-- Policy 1: Allow public read access
-- Name: "Public read access"
-- Allowed operation: SELECT
-- Policy definition: true (allow all)

-- Policy 2: Allow authenticated users to upload
-- Name: "Authenticated users can upload"
-- Allowed operation: INSERT
-- Policy definition: auth.role() = 'authenticated'

-- Policy 3: Allow authenticated users to update
-- Name: "Authenticated users can update"
-- Allowed operation: UPDATE
-- Policy definition: auth.role() = 'authenticated'

-- Policy 4: Allow authenticated users to delete
-- Name: "Authenticated users can delete"
-- Allowed operation: DELETE
-- Policy definition: auth.role() = 'authenticated'

-- For 'client-logos' bucket - same policies as form-assets

-- For 'form-uploads' bucket - allow anonymous access:
-- Policy 1: Allow public read access
-- Name: "Public read access"
-- Allowed operation: SELECT
-- Policy definition: true

-- Policy 2: Allow anyone to upload
-- Name: "Anyone can upload"
-- Allowed operation: INSERT
-- Policy definition: true

-- Policy 3: Allow anyone to update
-- Name: "Anyone can update"
-- Allowed operation: UPDATE
-- Policy definition: true

-- Policy 4: Allow anyone to delete
-- Name: "Anyone can delete"
-- Allowed operation: DELETE
-- Policy definition: true

-- Alternative: Use Supabase CLI to manage policies
-- supabase storage update form-assets --file-size-limit 10485760
-- Then set policies through the dashboard

-- DO NOT RUN THIS SQL - it will fail due to permissions
-- The storage.objects table is managed by Supabase's storage system
-- Use the Supabase Dashboard or CLI instead
