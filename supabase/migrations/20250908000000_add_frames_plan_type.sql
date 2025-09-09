-- Add frames_plan question type
-- This allows users to specify number of frames and collect data for each frame

-- Add the new question type to the enum
ALTER TYPE question_type ADD VALUE IF NOT EXISTS 'frames_plan';

-- Add columns to form_steps table for frames plan configuration
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_max_count integer DEFAULT 10;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_image boolean DEFAULT true;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_location boolean DEFAULT true;  
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS frames_require_measurements boolean DEFAULT true;

-- Create a table to store individual frame data in responses
CREATE TABLE IF NOT EXISTS response_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES form_steps(id) ON DELETE CASCADE,
  frame_number integer NOT NULL,
  image_url text,
  location_text text,
  measurements_text text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for the new table
ALTER TABLE response_frames ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for response_frames
CREATE POLICY "Users can view accessible response_frames" ON response_frames
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = response_frames.response_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can create response_frames for public forms" ON response_frames
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = response_frames.response_id
    )
  );

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_response_frames_response_id ON response_frames(response_id);
CREATE INDEX IF NOT EXISTS idx_response_frames_step_id ON response_frames(step_id);

-- Comment for documentation
COMMENT ON TABLE response_frames IS 'Stores individual frame data for frames_plan question types';
COMMENT ON COLUMN response_frames.frame_number IS 'The sequential number of this frame (1, 2, 3, etc.)';
COMMENT ON COLUMN response_frames.image_url IS 'URL to uploaded image for this frame';
COMMENT ON COLUMN response_frames.location_text IS 'Location description (e.g., bedroom, kitchen)';
COMMENT ON COLUMN response_frames.measurements_text IS 'Measurements in format like "1200 x 800"';
