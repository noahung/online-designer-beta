-- Create step_templates table to store reusable step configurations
CREATE TABLE IF NOT EXISTS step_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Template name (e.g., "Window Style Selection", "Contact Info")
  description TEXT, -- Optional description of what this template is for
  question_type TEXT NOT NULL, -- image_selection, multiple_choice, text_input, etc.
  
  -- Step configuration
  title TEXT NOT NULL, -- Default step title when template is used
  is_required BOOLEAN DEFAULT true,
  
  -- Type-specific configurations
  max_file_size INTEGER, -- for file_upload steps (in MB)
  allowed_file_types TEXT[], -- for file_upload steps (array of mime types)
  dimension_type TEXT, -- for dimensions steps ('2d' or '3d')
  scale_type TEXT, -- for opinion_scale steps ('number' or 'star')
  scale_min INTEGER, -- for opinion_scale steps
  scale_max INTEGER, -- for opinion_scale steps
  images_per_row INTEGER, -- for image_selection steps
  crop_images_to_square BOOLEAN, -- for image_selection steps
  
  -- Frames plan specific fields
  frames_max_count INTEGER,
  frames_require_image BOOLEAN,
  frames_require_location BOOLEAN,
  frames_require_measurements BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create step_template_options table to store options for templates
CREATE TABLE IF NOT EXISTS step_template_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES step_templates(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  image_url TEXT, -- Store image URLs (user can upload new images or reuse these)
  jump_to_step INTEGER, -- Note: This is relative and may need adjustment when applied
  option_order INTEGER NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_step_templates_user_id ON step_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_step_templates_question_type ON step_templates(question_type);
CREATE INDEX IF NOT EXISTS idx_step_template_options_template_id ON step_template_options(template_id);

-- Enable Row Level Security
ALTER TABLE step_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_template_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for step_templates
-- Users can only see their own templates
CREATE POLICY "Users can view their own templates"
  ON step_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own templates
CREATE POLICY "Users can create their own templates"
  ON step_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates"
  ON step_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates"
  ON step_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for step_template_options
-- Users can view options for their own templates
CREATE POLICY "Users can view their template options"
  ON step_template_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM step_templates
      WHERE step_templates.id = step_template_options.template_id
      AND step_templates.user_id = auth.uid()
    )
  );

-- Users can create options for their own templates
CREATE POLICY "Users can create their template options"
  ON step_template_options
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM step_templates
      WHERE step_templates.id = step_template_options.template_id
      AND step_templates.user_id = auth.uid()
    )
  );

-- Users can update options for their own templates
CREATE POLICY "Users can update their template options"
  ON step_template_options
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM step_templates
      WHERE step_templates.id = step_template_options.template_id
      AND step_templates.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM step_templates
      WHERE step_templates.id = step_template_options.template_id
      AND step_templates.user_id = auth.uid()
    )
  );

-- Users can delete options for their own templates
CREATE POLICY "Users can delete their template options"
  ON step_template_options
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM step_templates
      WHERE step_templates.id = step_template_options.template_id
      AND step_templates.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_step_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_step_templates_updated_at
  BEFORE UPDATE ON step_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_step_template_updated_at();

-- Add comments for documentation
COMMENT ON TABLE step_templates IS 'Stores reusable step configurations that users can apply to any form';
COMMENT ON TABLE step_template_options IS 'Stores options for step templates (for image_selection and multiple_choice types)';
COMMENT ON COLUMN step_templates.name IS 'User-friendly name for the template';
COMMENT ON COLUMN step_templates.description IS 'Optional description explaining what this template is for';
COMMENT ON COLUMN step_templates.question_type IS 'Type of step (image_selection, multiple_choice, text_input, etc.)';
