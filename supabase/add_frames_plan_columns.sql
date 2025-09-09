-- Add frames_plan question type and related columns to form_steps table

-- Add new columns for frames plan functionality
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_count INTEGER DEFAULT 1;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_max_count INTEGER DEFAULT 10; 
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_image BOOLEAN DEFAULT TRUE;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_location BOOLEAN DEFAULT TRUE;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_measurements BOOLEAN DEFAULT FALSE;

-- Add frames_plan to the allowed question types (if there's a constraint)
-- ALTER TABLE form_steps DROP CONSTRAINT IF EXISTS form_steps_question_type_check;
-- ALTER TABLE form_steps ADD CONSTRAINT form_steps_question_type_check 
--   CHECK (question_type IN ('multiple_choice', 'image_selection', 'text_input', 'file_upload', 'contact_fields', 'dimensions', 'opinion_scale', 'frames_plan'));

COMMENT ON COLUMN form_steps.frames_count IS 'Default number of frames for frames_plan questions';
COMMENT ON COLUMN form_steps.frames_max_count IS 'Maximum number of frames allowed for frames_plan questions';  
COMMENT ON COLUMN form_steps.frames_require_image IS 'Whether image upload is required for each frame';
COMMENT ON COLUMN form_steps.frames_require_location IS 'Whether room location is required for each frame';
COMMENT ON COLUMN form_steps.frames_require_measurements IS 'Whether measurements input is required for each frame';
