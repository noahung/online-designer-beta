-- Simplified webhook trigger with detailed logging
-- This version has extensive logging to help debug issues

CREATE OR REPLACE FUNCTION notify_zapier_webhook()
RETURNS TRIGGER AS $$
DECLARE
  client_webhook_url TEXT;
  webhook_count INTEGER;
BEGIN
  -- Log that trigger was activated
  RAISE LOG '🚀 [WEBHOOK TRIGGER] ===== TRIGGER ACTIVATED =====';
  RAISE LOG '🚀 [WEBHOOK TRIGGER] Response ID: %, Form ID: %', NEW.id, NEW.form_id;
  RAISE LOG '🚀 [WEBHOOK TRIGGER] Contact: % (%)', NEW.contact_name, NEW.contact_email;

  -- Check if webhook_notifications table exists
  SELECT COUNT(*) INTO webhook_count FROM information_schema.tables
  WHERE table_name = 'webhook_notifications' AND table_schema = 'public';

  IF webhook_count = 0 THEN
    RAISE LOG '❌ [WEBHOOK TRIGGER] webhook_notifications table does not exist!';
    RETURN NEW;
  END IF;

  RAISE LOG '✅ [WEBHOOK TRIGGER] webhook_notifications table exists';

  -- Get client's webhook URL for this form
  RAISE LOG '🔍 [WEBHOOK TRIGGER] Looking up webhook URL for form %', NEW.form_id;

  SELECT c.webhook_url INTO client_webhook_url
  FROM forms f
  JOIN clients c ON f.client_id = c.id
  WHERE f.id = NEW.form_id;

  RAISE LOG '🔍 [WEBHOOK TRIGGER] Query result - webhook_url: %', client_webhook_url;

  -- If no webhook URL configured for this client, exit
  IF client_webhook_url IS NULL OR client_webhook_url = '' THEN
    RAISE LOG '⚠️ [WEBHOOK TRIGGER] No webhook URL configured for client/form %, skipping', NEW.form_id;
    RETURN NEW;
  END IF;

  RAISE LOG '✅ [WEBHOOK TRIGGER] Found webhook URL: %', client_webhook_url;

  -- Validate webhook URL format
  IF NOT (client_webhook_url LIKE 'http%' OR client_webhook_url LIKE 'https%') THEN
    RAISE LOG '❌ [WEBHOOK TRIGGER] Invalid webhook URL format: %', client_webhook_url;
    RETURN NEW;
  END IF;

  RAISE LOG '✅ [WEBHOOK TRIGGER] Webhook URL format is valid';

  -- Create payload
  RAISE LOG '📦 [WEBHOOK TRIGGER] Creating webhook payload...';

  -- Store webhook payload for processing
  RAISE LOG '💾 [WEBHOOK TRIGGER] Inserting into webhook_notifications table...';

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
      'contact_phone', NEW.contact_phone,
      'webhook_created_at', NOW()::text
    ),
    'pending',
    now()
  );

  RAISE LOG '✅ [WEBHOOK TRIGGER] Successfully inserted webhook notification';
  RAISE LOG '🎉 [WEBHOOK TRIGGER] ===== TRIGGER COMPLETED =====';

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  RAISE LOG '❌ [WEBHOOK TRIGGER] ERROR: %', SQLERRM;
  RAISE LOG '❌ [WEBHOOK TRIGGER] SQLSTATE: %, SQLCODE: %', SQLSTATE, SQLCODE;
  RAISE LOG '❌ [WEBHOOK TRIGGER] ERROR DETAILS - Response ID: %, Form ID: %', NEW.id, NEW.form_id;

  -- Don't fail the form submission, just log the error
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

-- Test the trigger
SELECT
  '=== TRIGGER RECREATED ===' as status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_zapier_webhook')
    THEN '✅ Trigger exists and active'
    ELSE '❌ Trigger creation failed'
  END as trigger_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'notify_zapier_webhook')
    THEN '✅ Function exists and active'
    ELSE '❌ Function creation failed'
  END as function_status;