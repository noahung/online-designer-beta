-- Fix RLS policy for email_notifications table
-- This error occurs because the trigger tries to insert into email_notifications 
-- but the RLS policy is too restrictive

-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view their email notifications" ON email_notifications;
DROP POLICY IF EXISTS "Service role can manage all email notifications" ON email_notifications;

-- Create new, more permissive policies

-- Allow users to view email notifications for their own responses
CREATE POLICY "Users can view their email notifications" ON email_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = email_notifications.response_id 
      AND f.user_id = auth.uid()
    )
  );

-- Allow the trigger to insert email notifications (this was the missing piece)
CREATE POLICY "System can create email notifications" ON email_notifications
  FOR INSERT WITH CHECK (true);

-- Allow service role to manage all email notifications
CREATE POLICY "Service role can manage all email notifications" ON email_notifications
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Allow authenticated users to update email notification status
CREATE POLICY "Users can update email notification status" ON email_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = email_notifications.response_id 
      AND f.user_id = auth.uid()
    )
  );
