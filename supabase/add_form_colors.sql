-- Add color customization fields to forms table
-- Run this in your Supabase SQL Editor

-- Add primary button color (default blue)
ALTER TABLE forms ADD COLUMN primary_button_color VARCHAR(7) DEFAULT '#3b82f6';

-- Add button text color (default white)  
ALTER TABLE forms ADD COLUMN button_text_color VARCHAR(7) DEFAULT '#ffffff';

-- Add secondary button color (default gray)
ALTER TABLE forms ADD COLUMN secondary_button_color VARCHAR(7) DEFAULT '#e5e7eb';

-- Add secondary button text color (default dark gray)
ALTER TABLE forms ADD COLUMN secondary_button_text_color VARCHAR(7) DEFAULT '#374151';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name IN ('primary_button_color', 'button_text_color', 'secondary_button_color', 'secondary_button_text_color')
ORDER BY column_name;
