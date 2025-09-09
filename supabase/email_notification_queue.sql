-- Alternative approach: Create a webhook notification table and use Supabase's built-in webhook feature
-- This is more reliable than using the http extension

-- Create a table to queue email notifications
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  client_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for email notifications
CREATE POLICY "Users can view their email notifications" ON email_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = email_notifications.response_id 
      AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all email notifications" ON email_notifications
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_response_id ON email_notifications(response_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);

-- Create function to queue email notification
CREATE OR REPLACE FUNCTION queue_response_email()
RETURNS TRIGGER AS $$
DECLARE
  client_email_var TEXT;
BEGIN
  -- Get the client email for this form
  SELECT c.client_email INTO client_email_var
  FROM forms f
  JOIN clients c ON f.client_id = c.id
  WHERE f.id = NEW.form_id;
  
  -- Only queue if client has email configured
  IF client_email_var IS NOT NULL AND client_email_var != '' THEN
    INSERT INTO email_notifications (response_id, client_email)
    VALUES (NEW.id, client_email_var);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_queue_response_email ON responses;

CREATE TRIGGER trigger_queue_response_email
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION queue_response_email();

-- Add comments
COMMENT ON TABLE email_notifications IS 'Queue for email notifications to be sent to clients';
COMMENT ON FUNCTION queue_response_email() IS 'Queues email notification when new response is created';
COMMENT ON TRIGGER trigger_queue_response_email ON responses IS 'Automatically queues email notification for new responses';
