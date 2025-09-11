-- Create webhook trigger function to send data to Zapier
CREATE OR REPLACE FUNCTION notify_zapier_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record RECORD;
  response_data JSON;
  form_data JSON;
  contact_data JSON;
  answers_data JSON;
  payload JSON;
BEGIN
  -- Get webhook subscriptions for this form
  FOR webhook_record IN
    SELECT w.target_url, w.user_id
    FROM webhooks w
    WHERE w.form_id = NEW.form_id
    AND w.active = true
  LOOP
    -- Build the response data
    SELECT json_build_object(
      'response_id', NEW.id,
      'form_id', NEW.form_id,
      'submitted_at', NEW.created_at,
      'contact_name', NEW.contact_name,
      'contact_email', NEW.contact_email,
      'contact_phone', NEW.contact_phone,
      'contact_postcode', NEW.contact_postcode
    ) INTO contact_data;

    -- Get form name
    SELECT json_build_object(
      'form_name', f.name
    ) INTO form_data
    FROM forms f
    WHERE f.id = NEW.form_id;

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

    -- Build complete payload in Zapier format
    SELECT json_build_object(
      'response_id', NEW.id::text,
      'form_id', NEW.form_id::text,
      'form_name', form_data->>'form_name',
      'submitted_at', NEW.created_at::text,
      'contact__name', NEW.contact_name,
      'contact__email', NEW.contact_email,
      'contact__phone', NEW.contact_phone,
      'contact__postcode', NEW.contact_postcode,
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

    -- Store webhook payload for processing (instead of direct HTTP call)
    INSERT INTO webhook_notifications (
      webhook_id,
      form_id,
      response_id,
      payload,
      status,
      created_at
    ) VALUES (
      webhook_record.id,
      NEW.form_id,
      NEW.id,
      payload,
      'pending',
      now()
    );

  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create webhook_notifications table to store pending webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES webhooks(id) ON DELETE CASCADE,
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

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_status ON webhook_notifications(status);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_webhook_id ON webhook_notifications(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_created_at ON webhook_notifications(created_at);

-- Create the trigger on the responses table
DROP TRIGGER IF EXISTS trigger_notify_zapier_webhook ON responses;

CREATE TRIGGER trigger_notify_zapier_webhook
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_zapier_webhook();

-- Grant necessary permissions
GRANT ALL ON webhook_notifications TO authenticated;
GRANT ALL ON webhook_notifications TO anon;
GRANT EXECUTE ON FUNCTION notify_zapier_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_zapier_webhook() TO anon;

-- Comment for documentation
COMMENT ON FUNCTION notify_zapier_webhook() IS 'Automatically stores webhook data for Zapier when new form response is received';
COMMENT ON TRIGGER trigger_notify_zapier_webhook ON responses IS 'Triggers storage of Zapier webhook data for each new form response';
COMMENT ON TABLE webhook_notifications IS 'Stores webhook payloads waiting to be sent to Zapier';
