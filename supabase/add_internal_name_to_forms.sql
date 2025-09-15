-- Add internal_name field to forms table for internal identification
ALTER TABLE forms ADD COLUMN IF NOT EXISTS internal_name TEXT;

-- Optionally, you can set NOT NULL and a default value if desired:
-- ALTER TABLE forms ADD COLUMN IF NOT EXISTS internal_name TEXT NOT NULL DEFAULT '';

-- You may want to update RLS policies if you restrict access to this field.
