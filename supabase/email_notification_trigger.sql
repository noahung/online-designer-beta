-- Create automatic email notification system for new form responses
-- This trigger will automatically send email notifications to clients when they receive new responses

-- First, create a function to call the Edge Function
CREATE OR REPLACE FUNCTION notify_response_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Make an async HTTP request to our Edge Function
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on the responses table
DROP TRIGGER IF EXISTS trigger_notify_response_email ON responses;

CREATE TRIGGER trigger_notify_response_email
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_response_email();

-- Comment for documentation
COMMENT ON FUNCTION notify_response_email() IS 'Automatically sends email notification to client when new form response is received';
COMMENT ON TRIGGER trigger_notify_response_email ON responses IS 'Triggers email notification to client for each new form response';

-- Enable the http extension if not already enabled (required for net.http_post)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- Set up the service role key setting (you'll need to update this with the actual key)
-- This should be set in your Supabase project settings, but we'll create a placeholder
ALTER DATABASE postgres SET app.settings.service_role_key TO 'your-service-role-key-here';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT USAGE ON SCHEMA net TO anon;
GRANT EXECUTE ON FUNCTION notify_response_email() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_response_email() TO anon;
