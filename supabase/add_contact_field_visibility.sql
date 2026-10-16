-- Add contact field visibility toggle columns to form_steps
-- These control which optional fields appear on the contact_fields step in the form embed

ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS contact_show_phone BOOLEAN DEFAULT TRUE;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS contact_show_address BOOLEAN DEFAULT TRUE;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS contact_show_project_details BOOLEAN DEFAULT TRUE;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS contact_show_preferred_contact BOOLEAN DEFAULT TRUE;
ALTER TABLE form_steps ADD COLUMN IF NOT EXISTS contact_show_file_upload BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN form_steps.contact_show_phone IS 'Whether to show the phone number field on the contact step';
COMMENT ON COLUMN form_steps.contact_show_address IS 'Whether to show the property address field on the contact step';
COMMENT ON COLUMN form_steps.contact_show_project_details IS 'Whether to show the project details textarea on the contact step';
COMMENT ON COLUMN form_steps.contact_show_preferred_contact IS 'Whether to show the preferred contact method dropdown on the contact step';
COMMENT ON COLUMN form_steps.contact_show_file_upload IS 'Whether to show the file upload area on the contact step';
