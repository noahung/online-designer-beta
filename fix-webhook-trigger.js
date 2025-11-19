// Database fix script - run this in browser console to fix the webhook trigger
// This will update the webhook trigger function to declare the missing variables

async function fixWebhookTrigger() {
  console.log('🔧 FIXING WEBHOOK TRIGGER FUNCTION')
  console.log('=================================')

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

    // The SQL to fix the webhook trigger function
    const fixSQL = `
      CREATE OR REPLACE FUNCTION notify_zapier_webhook()
      RETURNS TRIGGER AS $$
      DECLARE
        client_webhook_url TEXT;
        response_data JSON;
        form_data JSON;
        contact_data JSON;
        answers_data JSON;
        payload JSON;
        text_answers JSON;
        multiple_choice_answers JSON;
        image_answers JSON;
        file_answers JSON;
        dimension_answers JSON;
        opinion_answers JSON;
        file_urls JSON;
        file_names_list JSON;
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

          RAISE LOG '🔍 [WEBHOOK TRIGGER] Form data retrieved: form=%, client=%', form_data->>'form_name', form_data->>'client_name';

          -- Get answers data
          SELECT json_agg(
            json_build_object(
              'question', fs.title,
              'question_type', fs.question_type,
              'answer_text', ra.answer_text,
              'selected_option_id', ra.selected_option_id,
              'file_url', ra.file_url,
              'file_name', ra.file_name,
              'file_size', ra.file_size,
              'width', ra.width,
              'height', ra.height,
              'depth', ra.depth,
              'units', ra.units,
              'scale_rating', ra.scale_rating,
              'step_order', fs.step_order
            )
          ) INTO answers_data
          FROM response_answers ra
          JOIN form_steps fs ON ra.step_id = fs.id
          WHERE ra.response_id = NEW.id;

          RAISE LOG '🔍 [WEBHOOK TRIGGER] Answers data built, count: %', CASE WHEN answers_data IS NOT NULL THEN array_length(answers_data, 1) ELSE 0 END;

          -- Build complete payload in Zapier format
          SELECT json_build_object(
            'response_id', NEW.id::text,
            'form_id', NEW.form_id::text,
            'form_name', form_data->>'form_name',
            'submitted_at', NOW()::text,
            'contact__name', COALESCE(NEW.contact_name, ''),
            'contact__email', COALESCE(NEW.contact_email, ''),
            'contact__phone', COALESCE(NEW.contact_phone, ''),
            'contact__postcode', COALESCE(NEW.contact_postcode, ''),
            'answers', COALESCE(answers_data, '[]'::json),
            'answers__text_responses', COALESCE(text_answers, '[]'::json),
            'answers__multiple_choice', COALESCE(multiple_choice_answers, '[]'::json),
            'answers__image_selections', COALESCE(image_answers, '[]'::json),
            'answers__file_uploads', COALESCE(file_answers, '[]'::json),
            'answers__dimensions', COALESCE(dimension_answers, '[]'::json),
            'answers__opinion_ratings', COALESCE(opinion_answers, '[]'::json),
            'file_attachments', COALESCE(file_urls, '[]'::json),
            'file_names', COALESCE(file_names_list, '[]'::json),
            'total_questions_answered', COALESCE(array_length(answers_data, 1), 0),
            'completion_percentage', 100
          ) INTO payload
          FROM (
            SELECT
              -- Text responses
              json_agg(
                CASE WHEN fs.question_type IN ('text_input', 'text_area') THEN ra.answer_text ELSE NULL END
              ) FILTER (WHERE ra.answer_text IS NOT NULL AND fs.question_type IN ('text_input', 'text_area')) as text_answers,

              -- Multiple choice responses
              json_agg(
                CASE WHEN fs.question_type = 'multiple_choice' THEN
                  fs.title || ' → ' || COALESCE(ra.answer_text, 'No selection')
                ELSE NULL END
              ) FILTER (WHERE fs.question_type = 'multiple_choice') as multiple_choice_answers,

              -- Image selections
              json_agg(
                CASE WHEN fs.question_type = 'image_selection' THEN
                  fs.title || ' → ' || COALESCE(ra.answer_text, 'No selection')
                ELSE NULL END
              ) FILTER (WHERE fs.question_type = 'image_selection') as image_answers,

              -- File uploads
              json_agg(
                CASE WHEN fs.question_type = 'file_upload' THEN
                  COALESCE(ra.file_name, 'Unknown file') || ' (' ||
                  CASE WHEN ra.file_size IS NOT NULL THEN (ra.file_size / 1024)::text || ' KB' ELSE 'Unknown size' END ||
                  ') - ' || COALESCE(ra.file_url, '')
                ELSE NULL END
              ) FILTER (WHERE fs.question_type = 'file_upload' AND ra.file_url IS NOT NULL) as file_answers,

              -- Dimensions
              json_agg(
                CASE WHEN fs.question_type = 'dimensions' THEN
                  'Width: ' || COALESCE(ra.width::text, 'N/A') || COALESCE(ra.units, '') || ', ' ||
                  'Height: ' || COALESCE(ra.height::text, 'N/A') || COALESCE(ra.units, '') || ', ' ||
                  'Depth: ' || COALESCE(ra.depth::text, 'N/A') || COALESCE(ra.units, '')
                ELSE NULL END
              ) FILTER (WHERE fs.question_type = 'dimensions') as dimension_answers,

              -- Opinion ratings
              json_agg(
                CASE WHEN fs.question_type = 'opinion_scale' THEN
                  fs.title || ' rating: ' || COALESCE(ra.scale_rating::text, 'No rating') || '/5 stars'
                ELSE NULL END
              ) FILTER (WHERE fs.question_type = 'opinion_scale') as opinion_answers,

              -- File URLs
              json_agg(ra.file_url) FILTER (WHERE ra.file_url IS NOT NULL) as file_urls,

              -- File names
              json_agg(ra.file_name) FILTER (WHERE ra.file_name IS NOT NULL) as file_names_list

            FROM response_answers ra
            JOIN form_steps fs ON ra.step_id = fs.id
            WHERE ra.response_id = NEW.id
          ) as categorized_answers;

          RAISE LOG '🔍 [WEBHOOK TRIGGER] Complete payload built successfully';

          -- Store webhook payload for processing (instead of direct HTTP call)
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
            payload,
            'pending',
            now()
          );

          RAISE LOG '✅ [WEBHOOK TRIGGER] Webhook notification created successfully for response_id: %', NEW.id;

        EXCEPTION WHEN OTHERS THEN
          -- Log error but don't fail the form submission
          RAISE LOG '❌ [WEBHOOK TRIGGER] Error in webhook creation: %', SQLERRM;
          RAISE LOG '❌ [WEBHOOK TRIGGER] Error details - SQLSTATE: %, SQLCODE: %', SQLSTATE, SQLCODE;
        END;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Try to execute the SQL using rpc (if available)
    const { data, error } = await supabase.rpc('exec_sql', { sql: fixSQL })

    if (error) {
      console.error('❌ Failed to execute SQL via RPC:', error)
      console.log('💡 You may need to run this SQL manually in the Supabase dashboard')
      console.log('📄 SQL to run:')
      console.log(fixSQL)
    } else {
      console.log('✅ Webhook trigger function fixed successfully!')
      console.log('🔄 The function now has all required variable declarations')
    }

  } catch (error) {
    console.error('❌ Fix failed:', error)
    console.log('💡 Manual fix required - run the SQL in Supabase dashboard')
  }
}

// Run the fix
fixWebhookTrigger().then(() => {
  console.log('🏁 Fix attempt completed')
})