-- Add welcome_message column to forms table
ALTER TABLE forms ADD COLUMN IF NOT EXISTS welcome_message text;
