-- Fix client authentication by allowing public read access to client credentials
-- This allows the login system to check client credentials without being authenticated first

-- Add a policy to allow public access for client authentication
CREATE POLICY "Public can read client credentials for authentication"
  ON clients
  FOR SELECT
  TO public
  USING (client_email IS NOT NULL AND client_password_hash IS NOT NULL);
