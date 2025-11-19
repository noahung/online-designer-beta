/*
  # Initial Database Schema for Designer Tool

  ## Overview
  This migration creates the complete database schema for the Online Designer Tool MVP, 
  supporting form building, client management, and response collection for windows, 
  doors, and conservatories companies.

  ## New Tables
  1. **clients** - Store client information and branding
     - `id` (uuid, primary key)
     - `name` (text) - Client company name
     - `logo_url` (text, nullable) - URL to uploaded logo
     - `primary_color` (text) - Hex color code for primary branding
     - `secondary_color` (text) - Hex color code for secondary branding
     - `user_id` (uuid) - References auth.users, identifies agency admin
     - `created_at` (timestamptz) - Record creation timestamp

  2. **forms** - Store form definitions for each client
     - `id` (uuid, primary key)
     - `client_id` (uuid) - Foreign key to clients table
     - `name` (text) - Form display name
     - `description` (text, nullable) - Optional form description
     - `is_active` (boolean) - Whether form accepts submissions
     - `user_id` (uuid) - References auth.users, identifies agency admin
     - `created_at` (timestamptz) - Record creation timestamp

  3. **form_steps** - Individual questions/steps within each form
     - `id` (uuid, primary key)
     - `form_id` (uuid) - Foreign key to forms table
     - `title` (text) - Question title/prompt
     - `question_type` (enum) - Type: image_selection, multiple_choice, text_input, contact_fields
     - `is_required` (boolean) - Whether response is mandatory
     - `step_order` (integer) - Display order in form sequence
     - `created_at` (timestamptz) - Record creation timestamp

  4. **form_options** - Answer choices for multiple choice and image selection questions
     - `id` (uuid, primary key)
     - `step_id` (uuid) - Foreign key to form_steps table
     - `label` (text) - Display text for option
     - `image_url` (text, nullable) - URL for image selection cards
     - `jump_to_step` (integer, nullable) - Step number for conditional logic
     - `option_order` (integer) - Display order within step
     - `created_at` (timestamptz) - Record creation timestamp

  5. **responses** - Form submissions from end users
     - `id` (uuid, primary key)
     - `form_id` (uuid) - Foreign key to forms table
     - `contact_name` (text, nullable) - Submitted name
     - `contact_email` (text, nullable) - Submitted email
     - `contact_phone` (text, nullable) - Submitted phone number
     - `contact_postcode` (text, nullable) - Submitted postcode
     - `submitted_at` (timestamptz) - Submission timestamp
     - `webhook_sent` (boolean) - Whether Zapier webhook was triggered

  6. **response_answers** - Individual answers within each response
     - `id` (uuid, primary key)
     - `response_id` (uuid) - Foreign key to responses table
     - `step_id` (uuid) - Foreign key to form_steps table
     - `answer_text` (text, nullable) - Text response for input fields
     - `selected_option_id` (uuid, nullable) - Foreign key to form_options for selections
     - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Agency admins can only access their own data
  - Public read access for form responses (for iframe embedding)
  - Policies enforce user isolation and proper access controls

  ## Indexes
  - Performance indexes on frequently queried columns
  - Foreign key constraints ensure data integrity
*/

-- Create custom types
CREATE TYPE question_type AS ENUM ('image_selection', 'multiple_choice', 'text_input', 'contact_fields');

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#2563EB',
  secondary_color text NOT NULL DEFAULT '#475569',
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Forms table
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Form steps table
CREATE TABLE IF NOT EXISTS form_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  title text NOT NULL,
  question_type question_type NOT NULL,
  is_required boolean DEFAULT true,
  step_order integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Form options table
CREATE TABLE IF NOT EXISTS form_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES form_steps(id) ON DELETE CASCADE,
  label text NOT NULL,
  image_url text,
  jump_to_step integer,
  option_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  contact_name text,
  contact_email text,
  contact_phone text,
  contact_postcode text,
  submitted_at timestamptz DEFAULT now(),
  webhook_sent boolean DEFAULT false
);

-- Response answers table
CREATE TABLE IF NOT EXISTS response_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES form_steps(id) ON DELETE CASCADE,
  answer_text text,
  selected_option_id uuid REFERENCES form_options(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_answers ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Users can manage their own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Forms policies
CREATE POLICY "Users can manage their own forms"
  ON forms
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read active forms"
  ON forms
  FOR SELECT
  TO public
  USING (is_active = true);

-- Form steps policies
CREATE POLICY "Users can manage steps in their forms"
  ON form_steps
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = form_steps.form_id 
    AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Public can read steps from active forms"
  ON form_steps
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = form_steps.form_id 
    AND forms.is_active = true
  ));

-- Form options policies
CREATE POLICY "Users can manage options in their forms"
  ON form_options
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM form_steps
    JOIN forms ON forms.id = form_steps.form_id
    WHERE form_steps.id = form_options.step_id 
    AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Public can read options from active forms"
  ON form_options
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM form_steps
    JOIN forms ON forms.id = form_steps.form_id
    WHERE form_steps.id = form_options.step_id 
    AND forms.is_active = true
  ));

-- Responses policies
CREATE POLICY "Users can view responses to their forms"
  ON responses
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = responses.form_id 
    AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Public can insert responses to active forms"
  ON responses
  FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = responses.form_id 
    AND forms.is_active = true
  ));

-- Response answers policies
CREATE POLICY "Users can view answers to their forms"
  ON response_answers
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM responses
    JOIN forms ON forms.id = responses.form_id
    WHERE responses.id = response_answers.response_id 
    AND forms.user_id = auth.uid()
  ));

CREATE POLICY "Public can insert answers to active forms"
  ON response_answers
  FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM responses
    JOIN forms ON forms.id = responses.form_id
    WHERE responses.id = response_answers.response_id 
    AND forms.is_active = true
  ));

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_forms_client_id ON forms(client_id);
CREATE INDEX IF NOT EXISTS idx_forms_user_id ON forms(user_id);
CREATE INDEX IF NOT EXISTS idx_form_steps_form_id ON form_steps(form_id);
CREATE INDEX IF NOT EXISTS idx_form_steps_order ON form_steps(form_id, step_order);
CREATE INDEX IF NOT EXISTS idx_form_options_step_id ON form_options(step_id);
CREATE INDEX IF NOT EXISTS idx_form_options_order ON form_options(step_id, option_order);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_submitted_at ON responses(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_response_answers_response_id ON response_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_response_answers_step_id ON response_answers(step_id);