-- Comprehensive webhook diagnostic
-- Run this in Supabase SQL Editor to diagnose webhook issues

-- 1. Check if webhook_notifications table exists and its structure
SELECT
  '=== WEBHOOK_NOTIFICATIONS TABLE ===' as section,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webhook_notifications' AND table_schema = 'public')
    THEN '✅ Table exists'
    ELSE '❌ Table missing'
  END as status;

-- Check table structure
SELECT
  '=== TABLE STRUCTURE ===' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'webhook_notifications'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if trigger exists
SELECT
  '=== TRIGGER STATUS ===' as section,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_notify_zapier_webhook')
    THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as trigger_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'notify_zapier_webhook')
    THEN '✅ Function exists'
    ELSE '❌ Function missing'
  END as function_status;

-- 3. Check recent webhook notifications
SELECT
  '=== RECENT WEBHOOK NOTIFICATIONS ===' as section,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM webhook_notifications
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Show recent notifications
SELECT
  id,
  webhook_url,
  status,
  attempts,
  created_at,
  LEFT(payload::text, 200) || '...' as payload_preview
FROM webhook_notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check clients with webhook URLs
SELECT
  '=== CLIENTS WITH WEBHOOKS ===' as section,
  COUNT(*) as clients_with_webhooks,
  COUNT(CASE WHEN webhook_url IS NOT NULL AND webhook_url != '' THEN 1 END) as valid_webhook_urls
FROM clients;

-- Show clients with webhooks
SELECT
  id,
  name,
  webhook_url,
  CASE WHEN webhook_url IS NOT NULL AND webhook_url != ''
    THEN '✅ Valid'
    ELSE '❌ Invalid/Missing'
  END as webhook_status
FROM clients
WHERE webhook_url IS NOT NULL AND webhook_url != ''
ORDER BY name;

-- 5. Check recent form responses
SELECT
  '=== RECENT FORM RESPONSES ===' as section,
  COUNT(*) as recent_responses
FROM responses
WHERE submitted_at > NOW() - INTERVAL '24 hours';

-- Show recent responses with client info
SELECT
  r.id,
  r.submitted_at,
  f.name as form_name,
  c.name as client_name,
  c.webhook_url
FROM responses r
JOIN forms f ON r.form_id = f.id
LEFT JOIN clients c ON f.client_id = c.id
WHERE r.submitted_at > NOW() - INTERVAL '24 hours'
ORDER BY r.submitted_at DESC
LIMIT 10;

-- 6. Test the trigger function manually
SELECT
  '=== TRIGGER FUNCTION TEST ===' as section,
  'Testing trigger function...' as test;

-- Create a test response to trigger webhook (uncomment to test)
-- INSERT INTO responses (form_id, contact_name, contact_email, submitted_at)
-- SELECT
--   f.id,
--   'Test User',
--   'test@example.com',
--   NOW()
-- FROM forms f
-- JOIN clients c ON f.client_id = c.id
-- WHERE c.webhook_url IS NOT NULL AND c.webhook_url != ''
-- LIMIT 1;

-- 7. Check database logs (if available)
SELECT
  '=== DIAGNOSTIC COMPLETE ===' as section,
  'Check the results above for any issues' as recommendation;