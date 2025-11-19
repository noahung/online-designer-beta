-- Add form_theme column to forms table
-- This allows storing the selected theme for each form

ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS form_theme VARCHAR(50) DEFAULT 'generic';

-- Update existing forms to use the default theme
UPDATE forms 
SET form_theme = 'generic' 
WHERE form_theme IS NULL;

-- Add a check constraint to ensure only valid theme values
ALTER TABLE forms 
ADD CONSTRAINT forms_theme_check 
CHECK (form_theme IN ('generic', 'soft-ui'));

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_forms_theme ON forms(form_theme);
