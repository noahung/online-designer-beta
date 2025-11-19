-- Manual migration for all new form features
-- Run this in your Supabase SQL Editor

-- 1. Add file_upload to the question_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t 
                   JOIN pg_enum e ON t.oid = e.enumtypid  
                   JOIN pg_namespace n ON n.oid = t.typnamespace 
                   WHERE n.nspname = 'public' AND t.typname = 'question_type' 
                   AND e.enumlabel = 'file_upload') THEN
        ALTER TYPE question_type ADD VALUE 'file_upload';
    END IF;
END $$;

-- 2. Add dimensions to the question_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t 
                   JOIN pg_enum e ON t.oid = e.enumtypid  
                   JOIN pg_namespace n ON n.oid = t.typnamespace 
                   WHERE n.nspname = 'public' AND t.typname = 'question_type' 
                   AND e.enumlabel = 'dimensions') THEN
        ALTER TYPE question_type ADD VALUE 'dimensions';
    END IF;
END $$;

-- 3. Add opinion_scale to the question_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t 
                   JOIN pg_enum e ON t.oid = e.enumtypid  
                   JOIN pg_namespace n ON n.oid = t.typnamespace 
                   WHERE n.nspname = 'public' AND t.typname = 'question_type' 
                   AND e.enumlabel = 'opinion_scale') THEN
        ALTER TYPE question_type ADD VALUE 'opinion_scale';
    END IF;
END $$;

-- 4. Add columns to form_steps table for file upload configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS max_file_size integer;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS allowed_file_types text[];

-- 5. Add columns to form_steps table for dimensions configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS dimension_type text CHECK (dimension_type IN ('2d', '3d'));

-- 6. Add columns to form_steps table for opinion scale configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_type text CHECK (scale_type IN ('number', 'star'));
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_min integer DEFAULT 1;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_max integer DEFAULT 10;

-- 7. Add columns to response_answers table to handle file uploads
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS file_size integer;

-- 8. Add columns to response_answers table to handle dimension responses
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS width numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS height numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS depth numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS units text;

-- 9. Add columns to response_answers table to handle opinion scale responses
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS scale_rating integer;

-- Success message
SELECT 'All migrations completed successfully!' as result;
