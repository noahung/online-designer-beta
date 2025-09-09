-- Check if email_notifications table exists and has proper structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'email_notifications'
ORDER BY ordinal_position;

-- Also check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'email_notifications';

-- Check if the trigger function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname LIKE '%email_notification%';

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE '%email%';
