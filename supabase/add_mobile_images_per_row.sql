-- Add mobile column count for image_selection steps
-- Run this in your Supabase SQL Editor

-- Add mobile_images_per_row column so desktop and mobile grids can be configured independently
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS mobile_images_per_row INTEGER DEFAULT 1;

COMMENT ON COLUMN form_steps.mobile_images_per_row IS 'Number of image cards per row on narrow screens (<768px) for image_selection steps. Default is 1.';

-- Verify the change
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'form_steps'
AND column_name IN ('images_per_row', 'mobile_images_per_row');
