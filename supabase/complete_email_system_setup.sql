-- ==============================================================
-- COMPLETE EMAIL NOTIFICATION SYSTEM SETUP FOR SUPABASE
-- Run this entire script in your Supabase SQL Editor
-- ==============================================================

-- Step 1: Add email_notifications_enabled column to clients table
-- (This fixes the "column does not exist" error)
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true;

-- Add comment explaining the purpose
COMMENT ON COLUMN clients.email_notifications_enabled IS 'Whether to send email notifications for new form responses to this client';

-- Step 2: Create email_notifications table (if not exists)
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  client_email text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_email_notifications_response_id ON email_notifications(response_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);

-- Enable RLS on email_notifications table
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Fix RLS policies for email_notifications table
-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view their email notifications" ON email_notifications;
DROP POLICY IF EXISTS "Service role can manage all email notifications" ON email_notifications;
DROP POLICY IF EXISTS "System can create email notifications" ON email_notifications;
DROP POLICY IF EXISTS "Users can update email notification status" ON email_notifications;

-- Create new, more permissive policies

-- Allow users to view email notifications for their own responses
CREATE POLICY "Users can view their email notifications" ON email_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = email_notifications.response_id 
      AND f.user_id = auth.uid()
    )
  );

-- Allow the trigger to insert email notifications (this was the missing piece)
CREATE POLICY "System can create email notifications" ON email_notifications
  FOR INSERT WITH CHECK (true);

-- Allow service role to manage all email notifications
CREATE POLICY "Service role can manage all email notifications" ON email_notifications
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Allow authenticated users to update email notification status
CREATE POLICY "Users can update email notification status" ON email_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = email_notifications.response_id 
      AND f.user_id = auth.uid()
    )
  );

-- Step 4: Create trigger function for email notifications
CREATE OR REPLACE FUNCTION notify_client_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if the client has email notifications enabled
  IF EXISTS (
    SELECT 1 FROM forms f 
    JOIN clients c ON f.client_id = c.id 
    WHERE f.id = NEW.form_id 
    AND c.client_email IS NOT NULL 
    AND c.email_notifications_enabled = true
  ) THEN
    INSERT INTO email_notifications (response_id, client_email)
    SELECT NEW.id, c.client_email
    FROM forms f
    JOIN clients c ON f.client_id = c.id
    WHERE f.id = NEW.form_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on responses table
DROP TRIGGER IF EXISTS trigger_notify_client_email ON responses;
CREATE TRIGGER trigger_notify_client_email
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_client_email();

-- Step 6: Update existing clients to have email notifications enabled by default
UPDATE clients 
SET email_notifications_enabled = true 
WHERE email_notifications_enabled IS NULL;

-- Step 7: Verify the setup
SELECT 'Setup completed successfully! Email notification system is now active.' as status;

-- Optional: Check the setup
SELECT 
  'clients table' as table_name,
  COUNT(*) as total_clients,
  COUNT(*) FILTER (WHERE email_notifications_enabled = true) as with_notifications_enabled,
  COUNT(*) FILTER (WHERE client_email IS NOT NULL) as with_email_configured
FROM clients
UNION ALL
SELECT 
  'email_notifications table' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count
FROM email_notifications;
