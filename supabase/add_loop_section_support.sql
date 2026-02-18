-- Add loop section support to forms
-- This enables repeatable sections where users can loop through questions multiple times

-- Add loop configuration columns to form_steps table
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS loop_start_step_id UUID REFERENCES form_steps(id) ON DELETE SET NULL;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS loop_end_step_id UUID REFERENCES form_steps(id) ON DELETE SET NULL;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS loop_label TEXT;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS loop_max_iterations INTEGER DEFAULT 10;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS loop_button_text TEXT;

-- Add iteration tracking to response_answers
ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS iteration_number INTEGER DEFAULT 0;

-- Create index for efficient querying of looped answers
CREATE INDEX IF NOT EXISTS idx_response_answers_iteration ON response_answers(response_id, iteration_number);

-- Add comments for documentation
COMMENT ON COLUMN form_steps.loop_start_step_id IS 'For loop_section type: The first step of the repeatable section';
COMMENT ON COLUMN form_steps.loop_end_step_id IS 'For loop_section type: The last step of the repeatable section';
COMMENT ON COLUMN form_steps.loop_label IS 'For loop_section type: Label for the repeated item (e.g., "Window", "Property")';
COMMENT ON COLUMN form_steps.loop_max_iterations IS 'For loop_section type: Maximum number of times user can repeat the section';
COMMENT ON COLUMN form_steps.loop_button_text IS 'For loop_section type: Custom text for "Add Another" button';
COMMENT ON COLUMN response_answers.iteration_number IS 'Which iteration of a loop this answer belongs to (0 = not in loop, 1+ = loop iteration number)';
