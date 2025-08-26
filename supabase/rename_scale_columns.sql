-- Rename existing opinion scale columns to match the code
-- Run this in your Supabase SQL Editor

-- Rename min_value to scale_min
ALTER TABLE form_steps RENAME COLUMN min_value TO scale_min;

-- Rename max_value to scale_max  
ALTER TABLE form_steps RENAME COLUMN max_value TO scale_max;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'form_steps' 
AND column_name IN ('scale_min', 'scale_max', 'scale_type')
ORDER BY column_name;
