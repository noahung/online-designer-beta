-- Add color customization fields to forms table
-- Run this in your Supabase SQL Editor

-- Add primary button color (background)
ALTER TABLE forms ADD COLUMN IF NOT EXISTS primary_button_color text DEFAULT '#3B82F6';

-- Add primary button text color
ALTER TABLE forms ADD COLUMN IF NOT EXISTS primary_button_text_color text DEFAULT '#FFFFFF';

-- Add secondary button color (background) - for Previous button
ALTER TABLE forms ADD COLUMN IF NOT EXISTS secondary_button_color text DEFAULT '#E5E7EB';

-- Add secondary button text color
ALTER TABLE forms ADD COLUMN IF NOT EXISTS secondary_button_text_color text DEFAULT '#374151';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name LIKE '%button_color%'
ORDER BY column_name;
