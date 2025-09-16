// EMERGENCY FIX: Apply the simplified webhook trigger function
// Run this in your browser console to fix the form submission issue

async function emergencyWebhookFix() {
  console.log('🚨 EMERGENCY WEBHOOK FIX')
  console.log('========================')

  try {
    const supabase = window.supabase
    if (!supabase) {
      console.error('❌ Supabase client not available')
      return
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('❌ No active session')
      return
    }

    console.log('✅ Connected to Supabase')

    // The simplified SQL that won't break form submissions
    const emergencySQL = `
      CREATE OR REPLACE FUNCTION notify_zapier_webhook()
      RETURNS TRIGGER AS $$
      DECLARE
        client_webhook_url TEXT;
      BEGIN
        RAISE LOG '🔍 [WEBHOOK TRIGGER] Trigger activated for response_id: %, form_id: %', NEW.id, NEW.form_id;

        BEGIN
          SELECT c.webhook_url INTO client_webhook_url
          FROM forms f
          JOIN clients c ON f.client_id = c.id
          WHERE f.id = NEW.form_id
          AND c.webhook_url IS NOT NULL
          AND c.webhook_url != '';

          IF client_webhook_url IS NULL THEN
            RAISE LOG '⚠️ [WEBHOOK TRIGGER] No webhook URL configured for form %, skipping', NEW.form_id;
            RETURN NEW;
          END IF;

          RAISE LOG '✅ [WEBHOOK TRIGGER] Webhook URL found: %', client_webhook_url;

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
          RAISE LOG '❌ [WEBHOOK TRIGGER] Error (but form submission continues): %', SQLERRM;
        END;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    console.log('📄 Attempting to apply emergency fix...')
    console.log('⚠️  If this fails, you need to run the SQL manually in Supabase dashboard')

    // Try to execute the SQL
    try {
      // This might not work if RPC isn't set up, but let's try
      const { data, error } = await supabase.rpc('exec_sql', { sql: emergencySQL })

      if (error) {
        console.error('❌ RPC method failed:', error)
        console.log('💡 Manual application required')
        console.log('📄 Copy this SQL to Supabase SQL Editor:')
        console.log(emergencySQL)
      } else {
        console.log('✅ Emergency fix applied successfully!')
        console.log('🔄 Form submissions should work now')
      }
    } catch (e) {
      console.error('❌ SQL execution failed:', e)
      console.log('💡 You need to run this SQL manually:')
      console.log(emergencySQL)
    }

  } catch (error) {
    console.error('❌ Emergency fix failed:', error)
  }
}

// Run the emergency fix
emergencyWebhookFix().then(() => {
  console.log('🏁 Emergency fix attempt completed')
})