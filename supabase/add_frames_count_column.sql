-- Add frames_count column to response_answers table for frames_plan questions
-- This stores the selected number of frames (1-10) chosen by the user

ALTER TABLE response_answers ADD COLUMN IF NOT EXISTS frames_count integer;

COMMENT ON COLUMN response_answers.frames_count IS 'Number of frames selected for frames_plan questions (1-10)';

-- Add index for performance when querying frames_count
CREATE INDEX IF NOT EXISTS idx_response_answers_frames_count ON response_answers(frames_count);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'response_answers' AND column_name = 'frames_count';