-- Verify and recreate webhook system
-- Run this in Supabase SQL Editor to ensure webhook system is working

-- First, check if webhook_notifications table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_notifications') THEN
    RAISE NOTICE 'Creating webhook_notifications table...';

    -- Create webhook_notifications table
    CREATE TABLE webhook_notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      webhook_url TEXT NOT NULL,
      form_id UUID NOT NULL,
      response_id UUID NOT NULL,
      payload JSONB NOT NULL,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
      attempts INTEGER DEFAULT 0,
      last_attempt_at TIMESTAMPTZ,
      error_message TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_webhook_notifications_status ON webhook_notifications(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_notifications_webhook_url ON webhook_notifications(webhook_url);
    CREATE INDEX IF NOT EXISTS idx_webhook_notifications_created_at ON webhook_notifications(created_at);

    -- Grant permissions
    GRANT ALL ON webhook_notifications TO authenticated;
    GRANT ALL ON webhook_notifications TO anon;

    RAISE NOTICE 'webhook_notifications table created successfully';
  ELSE
    RAISE NOTICE 'webhook_notifications table already exists';
  END IF;
END $$;

-- Recreate the webhook trigger function
CREATE OR REPLACE FUNCTION notify_zapier_webhook()
RETURNS TRIGGER AS $$
DECLARE
  client_webhook_url TEXT;
BEGIN
  -- Get client's webhook URL for this form
  SELECT c.webhook_url INTO client_webhook_url
  FROM forms f
  JOIN clients c ON f.client_id = c.id
  WHERE f.id = NEW.form_id;

  -- If no webhook URL configured for this client, exit
  IF client_webhook_url IS NULL OR client_webhook_url = '' THEN
    RETURN NEW;
  END IF;

  -- Store webhook payload for processing
  INSERT INTO webhook_notifications (
    webhook_url,
    form_id,
    response_id,
    payload,
    status,
    created_at
  ) VALUES (
    client_webhook_url,
    NEW.form_id,
    NEW.id,
    json_build_object(
      'response_id', NEW.id::text,
      'form_id', NEW.form_id::text,
      'submitted_at', NEW.submitted_at::text,
      'contact_name', NEW.contact_name,
      'contact_email', NEW.contact_email,
      'contact_phone', NEW.contact_phone
    ),
    'pending',
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_notify_zapier_webhook ON responses;
CREATE TRIGGER trigger_notify_zapier_webhook
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_zapier_webhook();

-- Grant permissions
GRANT EXECUTE ON FUNCTION notify_zapier_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_zapier_webhook() TO anon;

-- Test the setup
SELECT
  'Webhook system status:' as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_notifications')
    THEN '✅ webhook_notifications table exists'
    ELSE '❌ webhook_notifications table missing'
  END as table_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_zapier_webhook')
    THEN '✅ webhook trigger exists'
    ELSE '❌ webhook trigger missing'
  END as trigger_status;