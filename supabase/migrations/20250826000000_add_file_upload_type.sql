-- Add file_upload to the question_type enum
ALTER TYPE question_type ADD VALUE 'file_upload';

-- Add columns to response_answers table to handle file uploads
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_size integer;

-- Add columns to form_steps table for file upload configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS max_file_size integer;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS allowed_file_types text[];
