-- SQL commands to run in Supabase SQL Editor
-- Run these one by one in the Supabase Dashboard > SQL Editor

-- 1. Add file_upload to question_type enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'file_upload';

-- 2. Add columns to response_answers table for file uploads  
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_size integer;

-- 3. Add columns to form_steps table for file upload configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS max_file_size integer;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS allowed_file_types text[];

-- 4. Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'response_answers' 
AND column_name IN ('file_url', 'file_name', 'file_size');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'form_steps' 
AND column_name IN ('max_file_size', 'allowed_file_types');

-- 5. Check enum values
SELECT unnest(enum_range(NULL::question_type)) as question_type;
