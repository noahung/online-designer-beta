-- Fix RLS policies for response_frames to allow client access
-- This allows clients to view frames for responses from their own forms

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view accessible response_frames" ON response_frames;
DROP POLICY IF EXISTS "Public can create response_frames for public forms" ON response_frames;

-- Create policy for admin users
CREATE POLICY "Admin users can view their response_frames" ON response_frames
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = response_frames.response_id AND f.user_id = auth.uid()
    )
  );

-- Create policy for client users (using client context)
CREATE POLICY "Clients can view response_frames with valid client context" ON response_frames
  FOR SELECT 
  TO public
  USING (
    get_client_context_id() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      JOIN clients c ON c.id = f.client_id
      WHERE r.id = response_frames.response_id 
      AND c.id = get_client_context_id()
    )
  );

-- Keep the insert policy for public form submissions
CREATE POLICY "Public can create response_frames for public forms" ON response_frames
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN forms f ON r.form_id = f.id
      WHERE r.id = response_frames.response_id
    )
  );
