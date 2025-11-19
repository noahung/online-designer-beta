-- Add dimensions to the question_type enum
ALTER TYPE question_type ADD VALUE 'dimensions';

-- Add columns to form_steps table for dimensions configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS dimension_type text CHECK (dimension_type IN ('2d', '3d'));

-- Add columns to response_answers table to handle dimension responses
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS width numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS height numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS depth numeric;
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS units text;
