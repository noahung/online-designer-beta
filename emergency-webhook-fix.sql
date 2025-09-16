-- EMERGENCY FIX: Simplified webhook trigger that won't break form submissions
-- This version has proper error handling and will never cause form submission failures

CREATE OR REPLACE FUNCTION notify_zapier_webhook()
RETURNS TRIGGER AS $$
DECLARE
  client_webhook_url TEXT;
BEGIN
  -- Log trigger activation
  RAISE LOG '🔍 [WEBHOOK TRIGGER] Trigger activated for response_id: %, form_id: %', NEW.id, NEW.form_id;

  BEGIN
    -- Get client's webhook URL for this form
    SELECT c.webhook_url INTO client_webhook_url
    FROM forms f
    JOIN clients c ON f.client_id = c.id
    WHERE f.id = NEW.form_id
    AND c.webhook_url IS NOT NULL
    AND c.webhook_url != '';

    -- If no webhook URL configured, exit gracefully
    IF client_webhook_url IS NULL THEN
      RAISE LOG '⚠️ [WEBHOOK TRIGGER] No webhook URL configured for form %, skipping', NEW.form_id;
      RETURN NEW;
    END IF;

    RAISE LOG '✅ [WEBHOOK TRIGGER] Webhook URL found: %', client_webhook_url;

    -- Insert a simple webhook notification record
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
        'submitted_at', NOW()::text,
        'contact_name', COALESCE(NEW.contact_name, ''),
        'contact_email', COALESCE(NEW.contact_email, ''),
        'contact_phone', COALESCE(NEW.contact_phone, ''),
        'contact_postcode', COALESCE(NEW.contact_postcode, '')
      ),
      'pending',
      now()
    );

    RAISE LOG '✅ [WEBHOOK TRIGGER] Simple notification created for response_id: %', NEW.id;

  EXCEPTION WHEN OTHERS THEN
    -- Log error but NEVER fail the form submission
    RAISE LOG '❌ [WEBHOOK TRIGGER] Error (but form submission continues): %', SQLERRM;
    RAISE LOG '❌ [WEBHOOK TRIGGER] Error details - SQLSTATE: %, SQLCODE: %', SQLSTATE, SQLCODE;
  END;

  -- CRITICAL: Always return NEW to allow form submission to succeed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;