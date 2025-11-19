-- Add image layout customization for image_selection steps
-- Run this in your Supabase SQL Editor

-- Add images_per_row column to control grid layout for image selection steps
ALTER TABLE form_steps ADD COLUMN images_per_row INTEGER DEFAULT 2;

-- Add a comment to explain the column
COMMENT ON COLUMN form_steps.images_per_row IS 'Number of image cards to display per row for image_selection question types. Default is 2.';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'form_steps' 
AND column_name = 'images_per_row';
