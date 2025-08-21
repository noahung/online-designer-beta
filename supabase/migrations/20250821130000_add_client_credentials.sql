-- Add client login credentials to clients table
-- This allows clients to log in and view their own form responses

ALTER TABLE clients 
ADD COLUMN client_email TEXT,
ADD COLUMN client_password_hash TEXT,
ADD COLUMN client_user_id UUID;

-- Add index on client_email for faster login lookups
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(client_email);

-- Add comment explaining the purpose
COMMENT ON COLUMN clients.client_email IS 'Email address for client portal login';
COMMENT ON COLUMN clients.client_password_hash IS 'Password hash for client portal login';
COMMENT ON COLUMN clients.client_user_id IS 'Optional reference to actual Supabase user for client';
