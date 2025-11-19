-- Migration: Add Client User System
-- This adds support for client users who can login and view their own responses

-- 1. Add user roles enum
CREATE TYPE user_role AS ENUM ('admin', 'client');

-- 2. Add user_profiles table to store role information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'admin',
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 3. Add client login credentials to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS client_email text,
ADD COLUMN IF NOT EXISTS client_password_hash text,
ADD COLUMN IF NOT EXISTS client_user_id text; -- Changed from uuid REFERENCES to just text

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_id ON user_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_user_id ON clients(client_user_id);

-- 5. Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all profiles" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.user_id = auth.uid() AND up.role = 'admin'
    )
  );

-- 7. Update RLS policies for existing tables to support client users

-- Clients table: Client users can only see their assigned client
DROP POLICY IF EXISTS "Users can view their own clients" ON clients;
CREATE POLICY "Users can view accessible clients" ON clients
  FOR SELECT USING (
    user_id = auth.uid() OR -- Admin users see their clients
    client_user_id = auth.uid() -- Client users see their own client record
  );

-- Forms table: Client users can see forms for their client
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
CREATE POLICY "Users can view accessible forms" ON forms
  FOR SELECT USING (
    user_id = auth.uid() OR -- Admin users see their forms
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = forms.client_id AND c.client_user_id = auth.uid()
    ) -- Client users see forms for their client
  );

-- Responses table: Client users can see responses for their client's forms
DROP POLICY IF EXISTS "Users can view their own responses" ON responses;
CREATE POLICY "Users can view accessible responses" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms f 
      WHERE f.id = responses.form_id AND f.user_id = auth.uid()
    ) OR -- Admin users see responses to their forms
    EXISTS (
      SELECT 1 FROM forms f 
      JOIN clients c ON c.id = f.client_id 
      WHERE f.id = responses.form_id AND c.client_user_id = auth.uid()
    ) -- Client users see responses to their client's forms
  );

-- Form steps table: Client users can see steps for their client's forms
DROP POLICY IF EXISTS "Users can view their own form_steps" ON form_steps;
CREATE POLICY "Users can view accessible form_steps" ON form_steps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM forms f 
      WHERE f.id = form_steps.form_id AND f.user_id = auth.uid()
    ) OR -- Admin users see steps for their forms
    EXISTS (
      SELECT 1 FROM forms f 
      JOIN clients c ON c.id = f.client_id 
      WHERE f.id = form_steps.form_id AND c.client_user_id = auth.uid()
    ) -- Client users see steps for their client's forms
  );

-- Form options table: Client users can see options for their client's forms
DROP POLICY IF EXISTS "Users can view their own form_options" ON form_options;
CREATE POLICY "Users can view accessible form_options" ON form_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM form_steps fs 
      JOIN forms f ON f.id = fs.form_id 
      WHERE fs.id = form_options.step_id AND f.user_id = auth.uid()
    ) OR -- Admin users see options for their forms
    EXISTS (
      SELECT 1 FROM form_steps fs 
      JOIN forms f ON f.id = fs.form_id 
      JOIN clients c ON c.id = f.client_id 
      WHERE fs.id = form_options.step_id AND c.client_user_id = auth.uid()
    ) -- Client users see options for their client's forms
  );

-- Response answers table: Client users can see answers for their client's responses
DROP POLICY IF EXISTS "Users can view their own response_answers" ON response_answers;
CREATE POLICY "Users can view accessible response_answers" ON response_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r 
      JOIN forms f ON f.id = r.form_id 
      WHERE r.id = response_answers.response_id AND f.user_id = auth.uid()
    ) OR -- Admin users see answers for their forms
    EXISTS (
      SELECT 1 FROM responses r 
      JOIN forms f ON f.id = r.form_id 
      JOIN clients c ON c.id = f.client_id 
      WHERE r.id = response_answers.response_id AND c.client_user_id = auth.uid()
    ) -- Client users see answers for their client's responses
  );

-- 8. Create function to create client user account
CREATE OR REPLACE FUNCTION create_client_user(
  p_client_id uuid,
  p_email text,
  p_password text
) RETURNS uuid
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admin users can create client accounts';
  END IF;

  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create user profile as client
  INSERT INTO user_profiles (user_id, role, client_id)
  VALUES (new_user_id, 'client', p_client_id);

  -- Update client record with user reference
  UPDATE clients 
  SET 
    client_email = p_email,
    client_user_id = new_user_id
  WHERE id = p_client_id;

  RETURN new_user_id;
END;
$$;

-- 9. Create admin user profile for existing admin users
INSERT INTO user_profiles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_profiles)
ON CONFLICT (user_id) DO NOTHING;
