-- Add preferred_contact and project_details columns to responses table
-- This ensures contact forms capture all required fields

ALTER TABLE responses ADD COLUMN IF NOT EXISTS preferred_contact text;
ALTER TABLE responses ADD COLUMN IF NOT EXISTS project_details text;

-- Add comment for documentation
COMMENT ON COLUMN responses.preferred_contact IS 'Preferred method of contact (email, phone, etc.)';
COMMENT ON COLUMN responses.project_details IS 'Additional project details from contact form';