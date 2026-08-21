-- Expand form_theme check constraint to support all modern presets and custom style tokens
ALTER TABLE forms DROP CONSTRAINT IF EXISTS forms_theme_check;

-- Optional: Allow any theme string or text (recommended for maximum flexibility with future presets)
ALTER TABLE forms ALTER COLUMN form_theme TYPE TEXT;
