-- Fix webhook trigger function and ensure it's properly applied
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_zapier_webhook ON responses;

-- Step 2: Drop existing function if it exists
DROP FUNCTION IF EXISTS notify_zapier_webhook();

-- Step 3: Recreate the webhook notification function
CREATE OR REPLACE FUNCTION notify_zapier_webhook()
RETURNS TRIGGER AS $$
DECLARE
  client_webhook_url TEXT;
  response_data JSON;
  form_data JSON;
  contact_data JSON;
  answers_data JSON;
  payload JSON;
BEGIN
  -- Log trigger activation
  RAISE LOG '🔍 [WEBHOOK TRIGGER] Trigger activated for response_id: %, form_id: %', NEW.id, NEW.form_id;

  -- Get client's webhook URL for this form
  SELECT c.webhook_url INTO client_webhook_url
  FROM forms f
  JOIN clients c ON f.client_id = c.id
  WHERE f.id = NEW.form_id
  AND c.webhook_url IS NOT NULL
  AND c.webhook_url != '';

  RAISE LOG '🔍 [WEBHOOK TRIGGER] Client webhook URL lookup result: %', CASE WHEN client_webhook_url IS NOT NULL THEN 'FOUND' ELSE 'NOT FOUND' END;

  -- If no webhook URL configured for this client, exit
  IF client_webhook_url IS NULL THEN
    RAISE LOG '⚠️ [WEBHOOK TRIGGER] No webhook URL configured for form %, skipping webhook creation', NEW.form_id;
    RETURN NEW;
  END IF;

  RAISE LOG '✅ [WEBHOOK TRIGGER] Webhook URL found: %', client_webhook_url;

  BEGIN
    RAISE LOG '🔍 [WEBHOOK TRIGGER] Building webhook payload...';

    -- Build the response data
    SELECT json_build_object(
      'response_id', NEW.id,
      'form_id', NEW.form_id,
      'submitted_at', NOW(),
      'contact_name', COALESCE(NEW.contact_name, ''),
      'contact_email', COALESCE(NEW.contact_email, ''),
      'contact_phone', COALESCE(NEW.contact_phone, ''),
      'contact_postcode', COALESCE(NEW.contact_postcode, '')
    ) INTO contact_data;

    RAISE LOG '🔍 [WEBHOOK TRIGGER] Contact data built successfully';

    -- Get form name and client info
    SELECT json_build_object(
      'form_name', f.name,
      'client_name', c.name,
      'client_id', c.id
    ) INTO form_data
    FROM forms f
    JOIN clients c ON f.client_id = c.id
    WHERE f.id = NEW.form_id;

    RAISE LOG '🔍 [WEBHOOK TRIGGER] Form data built successfully';

    -- Get answers data
    SELECT json_agg(
      json_build_object(
        'question', fa.question,
        'answer', fa.answer,
        'field_type', fa.field_type
      )
    ) INTO answers_data
    FROM form_answers fa
    WHERE fa.response_id = NEW.id;

    RAISE LOG '🔍 [WEBHOOK TRIGGER] Answers data built successfully';

    -- Build complete payload
    SELECT json_build_object(
      'event', 'form_response',
      'timestamp', NOW(),
      'contact', contact_data,
      'form', form_data,
      'answers', COALESCE(answers_data, '[]'::json)
    ) INTO payload;

    RAISE LOG '🔍 [WEBHOOK TRIGGER] Complete payload built successfully';

    -- Insert webhook notification
    INSERT INTO webhook_notifications (
      response_id,
      webhook_url,
      payload,
      status,
      attempts
    ) VALUES (
      NEW.id,
      client_webhook_url,
      payload,
      'pending',
      0
    );

    RAISE LOG '✅ [WEBHOOK TRIGGER] Webhook notification created successfully for response %', NEW.id;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG '❌ [WEBHOOK TRIGGER] Error building payload: %', SQLERRM;
      -- Don't fail the main transaction, just log the error
      RETURN NEW;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger on the responses table
CREATE TRIGGER trigger_notify_zapier_webhook
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_zapier_webhook();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON webhook_notifications TO anon, authenticated;
GRANT SELECT ON forms TO anon, authenticated;
GRANT SELECT ON clients TO anon, authenticated;
GRANT SELECT ON form_answers TO anon, authenticated;

-- Step 6: Test the trigger by inserting a test response
DO $$
DECLARE
    test_form_id UUID;
    new_response_id UUID;
BEGIN
    -- Get a form that has a client with webhook URL
    SELECT f.id INTO test_form_id
    FROM forms f
    JOIN clients c ON f.client_id = c.id
    WHERE c.webhook_url IS NOT NULL
    AND c.webhook_url != ''
    LIMIT 1;

    IF test_form_id IS NULL THEN
        RAISE NOTICE '⚠️ No forms found with webhook-enabled clients. Skipping test.';
        RETURN;
    END IF;

    RAISE NOTICE '🧪 Testing webhook trigger with form_id: %', test_form_id;

    -- Insert test response
    INSERT INTO responses (
        form_id,
        contact_name,
        contact_email,
        contact_phone,
        submitted_at
    ) VALUES (
        test_form_id,
        'Webhook Trigger Test',
        'trigger-test@webhook.local',
        '+1234567890',
        NOW()
    ) RETURNING id INTO new_response_id;

    RAISE NOTICE '✅ Test response inserted with ID: %', new_response_id;

    -- Wait a moment for trigger to fire
    PERFORM pg_sleep(1);

    -- Check if webhook notification was created
    IF EXISTS (SELECT 1 FROM webhook_notifications WHERE response_id = new_response_id) THEN
        RAISE NOTICE '✅ SUCCESS: Webhook notification was created automatically!';
        RAISE NOTICE '📊 Webhook notification details:';
        RAISE NOTICE '%', (SELECT row_to_json(wn) FROM webhook_notifications wn WHERE response_id = new_response_id);
    ELSE
        RAISE NOTICE '❌ FAILED: No webhook notification was created.';
        RAISE NOTICE '🔍 Checking webhook_notifications table...';
        RAISE NOTICE 'Total notifications: %', (SELECT COUNT(*) FROM webhook_notifications);
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Test failed with error: %', SQLERRM;
END $$;

-- Step 7: Show final status
SELECT 'Webhook Trigger Setup Complete' as status,
       'Trigger function and trigger have been recreated' as details;