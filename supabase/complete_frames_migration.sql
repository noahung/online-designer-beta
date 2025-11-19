-- Complete migration script to add frames_plan support
-- IMPORTANT: Run these commands ONE AT A TIME in your Supabase SQL Editor
-- PostgreSQL requires enum values to be committed before they can be used

-- STEP 1: Add frames_plan to the question_type enum (Run this first, then commit)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'question_type' AND e.enumlabel = 'frames_plan'
    ) THEN
        ALTER TYPE question_type ADD VALUE 'frames_plan';
    END IF;
END $$;

-- STEP 2: After running STEP 1, run this separately to add the columns
-- Add necessary columns to form_steps table  
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_max_count integer DEFAULT 10;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_image boolean DEFAULT true;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_location boolean DEFAULT true;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_measurements boolean DEFAULT false;

-- STEP 3: Add comments for documentation
COMMENT ON COLUMN form_steps.frames_max_count IS 'Maximum number of frames allowed for frames_plan questions';
COMMENT ON COLUMN form_steps.frames_require_image IS 'Whether image upload is required for each frame in frames_plan questions';
COMMENT ON COLUMN form_steps.frames_require_location IS 'Whether room location is required for each frame in frames_plan questions';  
COMMENT ON COLUMN form_steps.frames_require_measurements IS 'Whether measurements are required for each frame in frames_plan questions';

-- STEP 4: Verify the enum was updated correctly
SELECT unnest(enum_range(NULL::question_type)) as question_types;

-- STEP 5: If you don't have the response_frames table yet, run add_response_frames_table.sql
-- This also issues a PostgREST schema reload so the REST endpoint is available immediately.
