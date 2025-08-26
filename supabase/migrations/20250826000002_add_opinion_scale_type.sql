-- Add opinion_scale to the question_type enum
ALTER TYPE question_type ADD VALUE 'opinion_scale';

-- Add columns to form_steps table for opinion scale configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_type text CHECK (scale_type IN ('number', 'star'));
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_min integer DEFAULT 1;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS scale_max integer DEFAULT 10;

-- Add columns to response_answers table to handle opinion scale responses
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS scale_rating integer;
