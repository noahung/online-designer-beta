-- Add webhook_url column to clients table for per-client webhook URLs
-- This allows each client to have their own Zapier webhook URL

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS webhook_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clients.webhook_url IS 'Webhook URL for sending form responses to client-specific integrations (e.g., Zapier)';
