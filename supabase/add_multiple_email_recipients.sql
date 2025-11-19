-- Add support for multiple email recipients for client notifications
-- Run this in your Supabase SQL Editor

-- First, clean up any conflicting triggers
DROP TRIGGER IF EXISTS trigger_notify_response_email ON responses;
DROP TRIGGER IF EXISTS trigger_notify_client_email ON responses;
DROP TRIGGER IF EXISTS trigger_queue_response_email ON responses;

-- Drop any conflicting functions
DROP FUNCTION IF EXISTS notify_response_email();
DROP FUNCTION IF EXISTS notify_client_email();
DROP FUNCTION IF EXISTS queue_response_email();

-- Enable the http extension if not already enabled (required for net.http_post)
-- Try different schemas in case it's installed elsewhere
DO $$
BEGIN
  -- Try to create extension in net schema
  CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA net;
EXCEPTION
  WHEN OTHERS THEN
    -- If that fails, try extensions schema
    BEGIN
      CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
    EXCEPTION
      WHEN OTHERS THEN
        -- If both fail, continue without the extension
        RAISE NOTICE 'HTTP extension not available, Edge Function calls will be skipped';
    END;
END $$;

-- Add additional_emails column to clients table (JSON array for multiple emails)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the purpose
COMMENT ON COLUMN clients.additional_emails IS 'Array of additional email addresses to receive notifications (JSON array of strings)';

-- Update existing clients to have empty array if null
UPDATE clients
SET additional_emails = '[]'::jsonb
WHERE additional_emails IS NULL;

-- Create a function to get all notification emails for a client
CREATE OR REPLACE FUNCTION get_client_notification_emails(client_id uuid)
RETURNS TEXT[] AS $$
DECLARE
  primary_email TEXT;
  additional_emails TEXT[];
  all_emails TEXT[];
BEGIN
  -- Get primary email
  SELECT c.client_email INTO primary_email
  FROM clients c
  WHERE c.id = client_id;

  -- Get additional emails (check if column exists first)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'additional_emails'
  ) THEN
    SELECT array_agg(t.email) INTO additional_emails
    FROM jsonb_array_elements_text(
      (SELECT c2.additional_emails FROM clients c2 WHERE c2.id = client_id)
    ) AS t(email)
    WHERE t.email IS NOT NULL AND t.email != '';
  END IF;

  -- Combine emails, filtering out nulls and duplicates
  all_emails := array_remove(ARRAY[primary_email], NULL);

  IF additional_emails IS NOT NULL THEN
    all_emails := array_cat(all_emails, additional_emails);
  END IF;

  -- Remove duplicates and nulls
  SELECT array_agg(DISTINCT email) INTO all_emails
  FROM unnest(all_emails) AS email
  WHERE email IS NOT NULL AND email != '';

  RETURN all_emails;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the unified email notification trigger function
CREATE OR REPLACE FUNCTION notify_response_email()
RETURNS TRIGGER AS $$
DECLARE
  client_emails TEXT[];
  email_address TEXT;
BEGIN
  -- Only proceed if the client has email notifications enabled
  IF EXISTS (
    SELECT 1 FROM forms f
    JOIN clients c ON f.client_id = c.id
    WHERE f.id = NEW.form_id
    AND c.email_notifications_enabled = true
  ) THEN
    -- Get all notification emails for the client
    SELECT get_client_notification_emails(c.id) INTO client_emails
    FROM forms f
    JOIN clients c ON f.client_id = c.id
    WHERE f.id = NEW.form_id;

    -- Insert notification records for each email
    IF client_emails IS NOT NULL AND array_length(client_emails, 1) > 0 THEN
      RAISE NOTICE 'Inserting % email notification records for response_id: %', array_length(client_emails, 1), NEW.id;
      FOREACH email_address IN ARRAY client_emails LOOP
        RAISE NOTICE 'Inserting notification for email: %', email_address;
        INSERT INTO email_notifications (response_id, client_email)
        VALUES (NEW.id, email_address);
      END LOOP;
      RAISE NOTICE 'Email notification records inserted successfully';
    ELSE
      RAISE NOTICE 'No client emails found for response_id: %', NEW.id;
    END IF;
  END IF;

  -- Make an async HTTP request to our Edge Function (for backward compatibility)
  -- Try different schemas for the HTTP function
  BEGIN
    -- Try net.http_post first
    IF EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'net'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'net' AND routine_name = 'http_post'
    ) THEN
      RAISE NOTICE 'Calling Edge Function via net.http_post for response_id: %', NEW.id;
      PERFORM
        net.http_post(
          url := 'https://bahloynyhjgmdndqabhu.supabase.co/functions/v1/send-response-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'response_id', NEW.id::text
          )
        );
      RAISE NOTICE 'Edge Function call completed via net.http_post';
    -- Try extensions.http_post as fallback
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.schemata WHERE schema_name = 'extensions'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.routines
      WHERE routine_schema = 'extensions' AND routine_name = 'http_post'
    ) THEN
      RAISE NOTICE 'Calling Edge Function via extensions.http_post for response_id: %', NEW.id;
      PERFORM
        extensions.http_post(
          url := 'https://bahloynyhjgmdndqabhu.supabase.co/functions/v1/send-response-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'response_id', NEW.id::text
          )
        );
      RAISE NOTICE 'Edge Function call completed via extensions.http_post';
    ELSE
      RAISE NOTICE 'No HTTP extension available, skipping Edge Function call for response_id: %', NEW.id;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If HTTP call fails, log the error and continue without it
      RAISE NOTICE 'HTTP call to Edge Function failed for response_id: %, error: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on responses table
DROP TRIGGER IF EXISTS trigger_notify_response_email ON responses;
CREATE TRIGGER trigger_notify_response_email
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_response_email();

-- Verify the setup
SELECT 'Multiple email recipients support added successfully!' as status;

-- Check current triggers
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'responses';

-- Check if additional_emails column exists
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name = 'additional_emails';

-- Check recent email notifications
SELECT 
  en.*,
  r.form_id,
  f.name as form_name
FROM email_notifications en
LEFT JOIN responses r ON en.response_id = r.id
LEFT JOIN forms f ON r.form_id = f.id
ORDER BY en.created_at DESC
LIMIT 5;
