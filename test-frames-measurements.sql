-- Test frames plan response with measurements
-- Run this in Supabase SQL Editor to verify measurements are included in webhook

-- First, get a form with frames_plan questions
SELECT f.id, f.name, fs.id as step_id, fs.title, fs.question_type
FROM forms f
JOIN form_steps fs ON f.id = fs.form_id
WHERE fs.question_type = 'frames_plan'
LIMIT 5;

-- Test inserting a response with frames data including measurements
DO $$
DECLARE
    test_form_id UUID;
    test_step_id UUID;
    new_response_id UUID;
    new_answer_id UUID;
BEGIN
    -- Get a form with frames_plan
    SELECT f.id, fs.id INTO test_form_id, test_step_id
    FROM forms f
    JOIN form_steps fs ON f.id = fs.form_id
    WHERE fs.question_type = 'frames_plan'
    LIMIT 1;

    IF test_form_id IS NULL THEN
        RAISE NOTICE '❌ No forms with frames_plan questions found';
        RETURN;
    END IF;

    RAISE NOTICE 'Testing with form_id: %, step_id: %', test_form_id, test_step_id;

    -- Insert test response
    INSERT INTO responses (
        form_id,
        contact_name,
        contact_email,
        submitted_at
    ) VALUES (
        test_form_id,
        'Frames Test User',
        'frames@test.local',
        NOW()
    ) RETURNING id INTO new_response_id;

    RAISE NOTICE '✅ Created response with ID: %', new_response_id;

    -- Insert answer with frames_count
    INSERT INTO response_answers (
        response_id,
        step_id,
        frames_count
    ) VALUES (
        new_response_id,
        test_step_id,
        2
    ) RETURNING id INTO new_answer_id;

    RAISE NOTICE '✅ Created answer with ID: %', new_answer_id;

    -- Insert frame data with measurements
    INSERT INTO response_frames (
        response_id,
        step_id,
        frame_number,
        location_text,
        measurements_text
    ) VALUES
    (
        new_response_id,
        test_step_id,
        1,
        'Living Room Wall',
        '1200 × 800 mm'
    ),
    (
        new_response_id,
        test_step_id,
        2,
        'Bedroom Wall',
        '1000 × 600 mm'
    );

    RAISE NOTICE '✅ Inserted frame data with measurements';

    -- Check webhook notification
    PERFORM pg_sleep(3);

    IF EXISTS (SELECT 1 FROM webhook_notifications WHERE response_id = new_response_id) THEN
        RAISE NOTICE '✅ Webhook notification created';

        -- Show the webhook payload
        SELECT
            payload->'answers__frames' as frames_data,
            payload->'answers' as answers_data
        FROM webhook_notifications
        WHERE response_id = new_response_id;
    ELSE
        RAISE NOTICE '❌ No webhook notification found';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error: %', SQLERRM;
END $$;