-- Add description field to form_steps table
-- This allows users to add a short description/explanation under the step title (like Typeform)

ALTER TABLE form_steps 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN form_steps.description IS 'Optional description/subtitle text displayed under the step title';
