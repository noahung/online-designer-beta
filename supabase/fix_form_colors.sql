-- Fix color column names and add missing columns
-- Run this in your Supabase SQL Editor

-- First, rename the existing button_text_color to match the code
ALTER TABLE forms RENAME COLUMN button_text_color TO primary_button_text_color;

-- Add the missing secondary button color columns
ALTER TABLE forms ADD COLUMN secondary_button_color VARCHAR(7) DEFAULT '#e5e7eb';
ALTER TABLE forms ADD COLUMN secondary_button_text_color VARCHAR(7) DEFAULT '#374151';

-- Verify all color columns are present and correctly named
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'forms' 
AND column_name IN ('primary_button_color', 'primary_button_text_color', 'secondary_button_color', 'secondary_button_text_color')
ORDER BY column_name;
