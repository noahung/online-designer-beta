-- Combined manual migration for file_upload and dimensions support
-- Run these commands in your Supabase dashboard SQL editor

-- Add file_upload to the question_type enum
ALTER TYPE question_type ADD VALUE 'file_upload';

-- Add dimensions to the question_type enum  
ALTER TYPE question_type ADD VALUE 'dimensions';

-- Add columns to response_answers table to handle file uploads
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_size integer;

-- Add columns to response_answers table to handle dimension responses
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS width numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS height numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS depth numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS units text;

-- Add columns to form_steps table for file upload configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS max_file_size integer;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS allowed_file_types text[];

-- Add columns to form_steps table for dimensions configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS dimension_type text CHECK (dimension_type IN ('2d', '3d'));
