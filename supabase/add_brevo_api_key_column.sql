-- Add brevo_api_key column to user_settings table
-- This allows users to configure their own Brevo API key in settings

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS brevo_api_key text;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.brevo_api_key IS 'Brevo (Sendinblue) API key for email notifications';
