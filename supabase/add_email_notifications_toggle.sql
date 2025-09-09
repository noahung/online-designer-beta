-- Add email notifications toggle to clients table
ALTER TABLE clients 
ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;

-- Add comment explaining the purpose
COMMENT ON COLUMN clients.email_notifications_enabled IS 'Whether to send email notifications for new form responses to this client';
