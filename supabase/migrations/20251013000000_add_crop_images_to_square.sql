-- Add crop_images_to_square column to form_steps table
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS crop_images_to_square boolean DEFAULT true;