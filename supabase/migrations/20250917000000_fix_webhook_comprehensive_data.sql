-- Fix webhook trigger to include all form response data
-- This migration updates the notify_zapier_webhook function to send comprehensive data to Zapier

-- Fix webhook trigger to include all form response data
-- This migration updates the notify_zapier_webhook function to send comprehensive data to Zapier

-- Ensure webhook_notifications table exists with correct JSONB type (matching schema)
CREATE TABLE IF NOT EXISTS webhook_notifications (
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

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_status ON webhook_notifications(status);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_webhook_url ON webhook_notifications(webhook_url);
CREATE INDEX IF NOT EXISTS idx_webhook_notifications_created_at ON webhook_notifications(created_at);

-- Grant permissions
GRANT ALL ON webhook_notifications TO authenticated;
GRANT ALL ON webhook_notifications TO anon;

-- Recreate the webhook trigger function with full data mapping including frames
CREATE OR REPLACE FUNCTION notify_zapier_webhook()
RETURNS TRIGGER AS $$
DECLARE
  client_webhook_url TEXT;
  form_name TEXT;
  answers_json JSONB;
  contact_info JSONB;
  file_attachments JSONB;
  text_responses JSONB;
  multiple_choice_responses JSONB;
  image_selections JSONB;
  file_uploads JSONB;
  dimensions_data JSONB;
  opinion_ratings JSONB;
  frames_data JSONB;
  total_questions INTEGER;
  completion_percentage INTEGER;
BEGIN
  -- Get client's webhook URL and form name
  SELECT c.webhook_url, f.name INTO client_webhook_url, form_name
  FROM forms f
  JOIN clients c ON f.client_id = c.id
  WHERE f.id = NEW.form_id;

  -- If no webhook URL configured for this client, exit
  IF client_webhook_url IS NULL OR client_webhook_url = '' THEN
    RETURN NEW;
  END IF;

  -- Build contact information
  contact_info := jsonb_build_object(
    'name', NEW.contact_name,
    'email', NEW.contact_email,
    'phone', NEW.contact_phone,
    'postcode', NEW.contact_postcode
  );

  -- Get all answers with detailed information including frames data
  SELECT
    jsonb_agg(
      jsonb_build_object(
        'question', fs.title,
        'question_type', fs.question_type,
        'answer_text', ra.answer_text,
        'selected_option', CASE
          WHEN ra.selected_option_id IS NOT NULL THEN
            (SELECT jsonb_build_object('id', fo.id, 'label', fo.label, 'image_url', fo.image_url)
             FROM form_options fo WHERE fo.id = ra.selected_option_id)
          ELSE NULL
        END,
        'file_url', ra.file_url,
        'file_name', ra.file_name,
        'file_size', ra.file_size,
        'dimensions', CASE
          WHEN ra.width IS NOT NULL OR ra.height IS NOT NULL OR ra.depth IS NOT NULL THEN
            jsonb_build_object(
              'width', ra.width,
              'height', ra.height,
              'depth', ra.depth,
              'units', ra.units
            )
          ELSE NULL
        END,
        'scale_rating', ra.scale_rating,
        'frames', CASE
          WHEN fs.question_type = 'frames_plan' THEN
            (SELECT jsonb_agg(
                jsonb_build_object(
                  'frame_number', rf.frame_number,
                  'image_url', rf.image_url,
                  'location_text', rf.location_text,
                  'measurements_text', rf.measurements_text
                )
             )
             FROM response_frames rf
             WHERE rf.response_id = ra.response_id AND rf.step_id = ra.step_id)
          ELSE NULL
        END,
        'frames_count', ra.frames_count,
        'step_order', fs.step_order
      )
    ),
    COUNT(*),
    ROUND((COUNT(*)::decimal / NULLIF((SELECT COUNT(*) FROM form_steps WHERE form_id = NEW.form_id), 0)) * 100)
  INTO answers_json, total_questions, completion_percentage
  FROM response_answers ra
  JOIN form_steps fs ON ra.step_id = fs.id
  WHERE ra.response_id = NEW.id;

  -- Build categorized responses
  SELECT jsonb_agg(ra.answer_text) INTO text_responses
  FROM response_answers ra
  JOIN form_steps fs ON ra.step_id = fs.id
  WHERE ra.response_id = NEW.id AND ra.answer_text IS NOT NULL AND fs.question_type = 'text_input';

  SELECT jsonb_agg(
    jsonb_build_object(
      'question', fs.title,
      'answer', fo.label,
      'option_id', fo.id
    )
  ) INTO multiple_choice_responses
  FROM response_answers ra
  JOIN form_steps fs ON ra.step_id = fs.id
  JOIN form_options fo ON ra.selected_option_id = fo.id
  WHERE ra.response_id = NEW.id AND fs.question_type IN ('multiple_choice', 'image_selection');

  SELECT jsonb_agg(
    jsonb_build_object(
      'question', fs.title,
      'image_url', fo.image_url,
      'option_label', fo.label
    )
  ) INTO image_selections
  FROM response_answers ra
  JOIN form_steps fs ON ra.step_id = fs.id
  JOIN form_options fo ON ra.selected_option_id = fo.id
  WHERE ra.response_id = NEW.id AND fs.question_type = 'image_selection';

  SELECT jsonb_agg(
    jsonb_build_object(
      'question', fs.title,
      'file_name', ra.file_name,
      'file_url', ra.file_url,
      'file_size', ra.file_size
    )
  ) INTO file_uploads
  FROM response_answers ra
  JOIN form_steps fs ON ra.step_id = fs.id
  WHERE ra.response_id = NEW.id AND ra.file_url IS NOT NULL;

  SELECT jsonb_agg(
    jsonb_build_object(
      'question', fs.title,
      'dimensions', jsonb_build_object(
        'width', ra.width,
        'height', ra.height,
        'depth', ra.depth,
        'units', ra.units
      )
    )
  ) INTO dimensions_data
  FROM response_answers ra
  JOIN form_steps fs ON ra.step_id = fs.id
  WHERE ra.response_id = NEW.id AND (ra.width IS NOT NULL OR ra.height IS NOT NULL OR ra.depth IS NOT NULL);

  SELECT jsonb_agg(
    jsonb_build_object(
      'question', fs.title,
      'rating', ra.scale_rating
    )
  ) INTO opinion_ratings
  FROM response_answers ra
  JOIN form_steps fs ON ra.step_id = fs.id
  WHERE ra.response_id = NEW.id AND ra.scale_rating IS NOT NULL;

  -- Build frames data for frames_plan questions
  SELECT jsonb_agg(
    jsonb_build_object(
      'question', fs.title,
      'step_id', fs.id,
      'frames_count', ra.frames_count,
      'frames', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'frame_number', rf.frame_number,
            'image_url', rf.image_url,
            'location_text', rf.location_text,
            'measurements_text', rf.measurements_text
          )
        )
        FROM response_frames rf
        WHERE rf.response_id = NEW.id AND rf.step_id = fs.id
      )
    )
  ) INTO frames_data
  FROM form_steps fs
  JOIN response_answers ra ON ra.step_id = fs.id AND ra.response_id = NEW.id
  WHERE fs.form_id = NEW.form_id AND fs.question_type = 'frames_plan'
  AND EXISTS (SELECT 1 FROM response_frames rf WHERE rf.response_id = NEW.id AND rf.step_id = fs.id);

  -- Build file attachments array
  SELECT jsonb_agg(ra.file_url) INTO file_attachments
  FROM response_answers ra
  WHERE ra.response_id = NEW.id AND ra.file_url IS NOT NULL;

  -- Store comprehensive webhook payload for processing
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
    jsonb_build_object(
      'response_id', NEW.id::text,
      'form_id', NEW.form_id::text,
      'form_name', form_name,
      'submitted_at', NEW.submitted_at::text,
      'contact', contact_info,
      'contact__name', NEW.contact_name,
      'contact__email', NEW.contact_email,
      'contact__phone', NEW.contact_phone,
      'contact__postcode', NEW.contact_postcode,
      'answers', COALESCE(answers_json, '[]'::jsonb),
      'answers__text_responses', COALESCE(text_responses, '[]'::jsonb),
      'answers__multiple_choice', COALESCE(multiple_choice_responses, '[]'::jsonb),
      'answers__image_selections', COALESCE(image_selections, '[]'::jsonb),
      'answers__file_uploads', COALESCE(file_uploads, '[]'::jsonb),
      'answers__dimensions', COALESCE(dimensions_data, '[]'::jsonb),
      'answers__opinion_ratings', COALESCE(opinion_ratings, '[]'::jsonb),
      'answers__frames', COALESCE(frames_data, '[]'::jsonb),
      'file_attachments', COALESCE(file_attachments, '[]'::jsonb),
      'file_names', COALESCE(
        (SELECT jsonb_agg(ra.file_name)
         FROM response_answers ra
         WHERE ra.response_id = NEW.id AND ra.file_name IS NOT NULL),
        '[]'::jsonb
      ),
      'total_questions_answered', COALESCE(total_questions, 0),
      'completion_percentage', COALESCE(completion_percentage, 0)
    ),
    'pending',
    now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the webhook trigger to ensure it's using the updated function
-- Changed to trigger on response_answers to ensure all data is inserted first
DROP TRIGGER IF EXISTS trigger_notify_zapier_webhook ON responses;
DROP TRIGGER IF EXISTS trigger_notify_zapier_webhook ON response_answers;

-- Recreate the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS trigger_notify_zapier_webhook ON responses;
DROP TRIGGER IF EXISTS trigger_notify_zapier_webhook ON response_answers;
DROP FUNCTION IF EXISTS notify_zapier_webhook_trigger();

CREATE TRIGGER trigger_notify_zapier_webhook
  AFTER INSERT ON responses
  FOR EACH ROW
  EXECUTE FUNCTION notify_zapier_webhook();

-- Grant permissions
GRANT EXECUTE ON FUNCTION notify_zapier_webhook() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_zapier_webhook() TO anon;