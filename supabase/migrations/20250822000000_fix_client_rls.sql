-- Fix RLS policies for mock client authentication
-- This migration updates RLS policies to work with the mock client auth system

-- First, create a helper function for setting configuration
CREATE OR REPLACE FUNCTION set_app_config(setting_name text, setting_value text, is_local boolean DEFAULT true)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, is_local);
  RETURN setting_value;
END;
$$;

-- Create or replace function to get client ID from custom context
CREATE OR REPLACE FUNCTION get_client_context_id() 
RETURNS uuid 
LANGUAGE sql 
SECURITY DEFINER
AS $$
  -- Get the client_id from session variable
  SELECT COALESCE(
    current_setting('app.client_id', true)::uuid,
    NULL
  );
$$;

-- Update responses policy to work with client context
DROP POLICY IF EXISTS "Users can view accessible responses" ON responses;

-- Create separate policies for admin and client access
CREATE POLICY "Admin users can view their responses" ON responses
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forms f 
      WHERE f.id = responses.form_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view client responses with valid client context" ON responses
  FOR SELECT 
  TO public
  USING (
    -- Allow if client_id context is set and matches the form's client
    get_client_context_id() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM forms f 
      JOIN clients c ON c.id = f.client_id 
      WHERE f.id = responses.form_id 
      AND c.id = get_client_context_id()
    )
  );

-- Update forms policy similarly
DROP POLICY IF EXISTS "Users can view accessible forms" ON forms;

CREATE POLICY "Admin users can view their forms" ON forms
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can view client forms with valid client context" ON forms
  FOR SELECT 
  TO public
  USING (
    -- Allow if client_id context is set and matches
    get_client_context_id() IS NOT NULL 
    AND client_id = get_client_context_id()
  );

-- Update form_steps policy
DROP POLICY IF EXISTS "Users can view accessible form_steps" ON form_steps;

CREATE POLICY "Admin users can view their form steps" ON form_steps
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forms f 
      WHERE f.id = form_steps.form_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view client form steps with valid client context" ON form_steps
  FOR SELECT 
  TO public
  USING (
    get_client_context_id() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM forms f 
      JOIN clients c ON c.id = f.client_id 
      WHERE f.id = form_steps.form_id AND c.id = get_client_context_id()
    )
  );

-- Update form_options policy
DROP POLICY IF EXISTS "Users can view accessible form_options" ON form_options;

CREATE POLICY "Admin users can view their form options" ON form_options
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM form_steps fs 
      JOIN forms f ON f.id = fs.form_id 
      WHERE fs.id = form_options.step_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view client form options with valid client context" ON form_options
  FOR SELECT 
  TO public
  USING (
    get_client_context_id() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM form_steps fs 
      JOIN forms f ON f.id = fs.form_id 
      JOIN clients c ON c.id = f.client_id 
      WHERE fs.id = form_options.step_id AND c.id = get_client_context_id()
    )
  );

-- Update response_answers policy
DROP POLICY IF EXISTS "Users can view accessible response_answers" ON response_answers;

CREATE POLICY "Admin users can view their response answers" ON response_answers
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM responses r 
      JOIN forms f ON f.id = r.form_id 
      WHERE r.id = response_answers.response_id AND f.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view client response answers with valid client context" ON response_answers
  FOR SELECT 
  TO public
  USING (
    get_client_context_id() IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM responses r 
      JOIN forms f ON f.id = r.form_id 
      JOIN clients c ON c.id = f.client_id 
      WHERE r.id = response_answers.response_id AND c.id = get_client_context_id()
    )
  );

-- Update clients policy
DROP POLICY IF EXISTS "Users can view accessible clients" ON clients;

CREATE POLICY "Admin users can view their clients" ON clients
  FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can view specific client with valid client context" ON clients
  FOR SELECT 
  TO public
  USING (
    get_client_context_id() IS NOT NULL 
    AND id = get_client_context_id()
  );
