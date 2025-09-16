-- Test basic response insertion to isolate the webhook trigger issue
-- Run this in Supabase SQL Editor

-- First, let's see what forms exist
SELECT id, name, client_id FROM forms LIMIT 5;

-- Test 1: Try to insert a response with a valid form_id
-- Replace 'your-form-id-here' with an actual form ID from the query above
DO $$
DECLARE
    test_form_id UUID := (SELECT id FROM forms LIMIT 1); -- Get first available form
    new_response_id UUID;
BEGIN
    RAISE NOTICE 'Testing response insertion with form_id: %', test_form_id;

    -- Try to insert a test response
    INSERT INTO responses (
        form_id,
        contact_name,
        contact_email,
        contact_phone,
        submitted_at
    ) VALUES (
        test_form_id,
        'Webhook Diagnostic Test',
        'diagnostic@test.local',
        '+1234567890',
        NOW()
    ) RETURNING id INTO new_response_id;

    RAISE NOTICE '✅ Successfully inserted response with ID: %', new_response_id;

    -- Check if webhook notification was created
    RAISE NOTICE 'Checking for webhook notification...';
    PERFORM pg_sleep(2); -- Wait 2 seconds for trigger to fire

    IF EXISTS (SELECT 1 FROM webhook_notifications WHERE response_id = new_response_id) THEN
        RAISE NOTICE '✅ Webhook notification was created for response %', new_response_id;
    ELSE
        RAISE NOTICE '❌ No webhook notification was created for response %', new_response_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '❌ Error inserting response: %', SQLERRM;
        RAISE NOTICE 'Error details: %', SQLSTATE;
END $$;

-- Check what happened
SELECT 'Test Results' as status,
       COUNT(*) as webhook_notifications_created
FROM webhook_notifications
WHERE created_at >= NOW() - INTERVAL '1 minute';