-- Create storage buckets used by the app
-- Run this in Supabase SQL editor or create buckets via the Storage UI.

-- If using the SQL function, this creates a public bucket for form assets
-- If this errors in SQL editor, create the bucket manually in Storage -> New bucket

-- Create public buckets. Form card images and client logos will be publicly viewable
-- by saving and serving the public URL. If you prefer private buckets, change the
-- second argument to false and use signed URLs at runtime instead.
SELECT storage.create_bucket('client-logos', true);
SELECT storage.create_bucket('form-assets', true);
-- Optional: bucket for temporary/uploads during form filling
SELECT storage.create_bucket('form-uploads', true);
