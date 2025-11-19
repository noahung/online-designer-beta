-- Check database triggers and webhook system status
-- Run this in Supabase SQL Editor to diagnose the webhook system

-- 1. Check if webhook_notifications table exists and has data
SELECT 'webhook_notifications table check' as check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public'
         AND table_name = 'webhook_notifications'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 2. Check webhook_notifications table structure
SELECT 'webhook_notifications structure' as check_name,
       column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'webhook_notifications'
ORDER BY ordinal_position;

-- 3. Check if triggers exist on responses table
SELECT 'triggers on responses table' as check_name,
       trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'responses';

-- 4. Check webhook_notifications table permissions
SELECT 'webhook_notifications permissions' as check_name,
       grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'webhook_notifications';

-- 5. Check recent webhook notifications
SELECT 'recent webhook notifications' as check_name,
       COUNT(*) as total_notifications,
       COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
       COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
       COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
FROM webhook_notifications;

-- 6. Check clients with webhook URLs
SELECT 'clients with webhook URLs' as check_name,
       COUNT(*) as total_clients_with_webhooks
FROM clients
WHERE webhook_url IS NOT NULL
AND webhook_url != '';

-- 7. Check if notify_zapier_webhook function exists
SELECT 'webhook function exists' as check_name,
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.routines
         WHERE routine_schema = 'public'
         AND routine_name = 'notify_zapier_webhook'
       ) THEN 'EXISTS' ELSE 'MISSING' END as status;

-- 8. Test basic response insertion (this should work)
-- Note: This will create a test response, you may want to delete it after testing
/*
INSERT INTO responses (
  form_id,
  contact_name,
  contact_email,
  contact_phone,
  submitted_at
) VALUES (
  (SELECT id FROM forms LIMIT 1),
  'Webhook Test',
  'test@webhook.local',
  '+1234567890',
  NOW()
) RETURNING id;
*/