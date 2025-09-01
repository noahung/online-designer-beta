-- Add theme support to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS form_theme VARCHAR(50) DEFAULT 'generic';

-- Add theme options
COMMENT ON COLUMN forms.form_theme IS 'Theme for form presentation: generic, soft-ui';
