-- Add form_type column to forms table
-- Values: 'multi_step' (default, existing behaviour) | 'single_page' (new)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS form_type text NOT NULL DEFAULT 'multi_step';

-- Backfill all existing forms as multi_step
UPDATE forms SET form_type = 'multi_step' WHERE form_type IS NULL;

-- Verify
SELECT id, name, form_type FROM forms LIMIT 10;
