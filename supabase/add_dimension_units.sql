-- Add dimension_units field to form_steps table
-- This allows admins to configure the default units for dimension questions
-- Users will no longer be able to change units - only the admin-configured units will be used

ALTER TABLE form_steps 
ADD COLUMN IF NOT EXISTS dimension_units TEXT DEFAULT 'mm';

COMMENT ON COLUMN form_steps.dimension_units IS 'Default units for dimensions (mm, cm, m, in, ft) - configured by admin';

-- Also add to step_templates table if it exists
ALTER TABLE step_templates 
ADD COLUMN IF NOT EXISTS dimension_units TEXT DEFAULT 'mm';

COMMENT ON COLUMN step_templates.dimension_units IS 'Default units for dimensions (mm, cm, m, in, ft) in template';
