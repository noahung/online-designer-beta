-- Create step_logic table to store conditional branching rules for form steps
CREATE TABLE IF NOT EXISTS step_logic (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES form_steps(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of LogicRule objects
  default_action JSONB, -- DefaultLogicAction object for "all other cases"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(step_id) -- One logic configuration per step
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_step_logic_step_id ON step_logic(step_id);
CREATE INDEX IF NOT EXISTS idx_step_logic_form_id ON step_logic(form_id);

-- Add RLS policies
ALTER TABLE step_logic ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view logic for their own forms
CREATE POLICY "Users can view their own step logic"
  ON step_logic FOR SELECT
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert logic for their own forms
CREATE POLICY "Users can insert step logic for their own forms"
  ON step_logic FOR INSERT
  WITH CHECK (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update logic for their own forms
CREATE POLICY "Users can update their own step logic"
  ON step_logic FOR UPDATE
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete logic for their own forms
CREATE POLICY "Users can delete their own step logic"
  ON step_logic FOR DELETE
  USING (
    form_id IN (
      SELECT id FROM forms WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_step_logic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_step_logic_timestamp
  BEFORE UPDATE ON step_logic
  FOR EACH ROW
  EXECUTE FUNCTION update_step_logic_updated_at();

-- Add comment to table
COMMENT ON TABLE step_logic IS 'Stores conditional branching/logic rules for form steps, enabling dynamic form flows based on user responses';
COMMENT ON COLUMN step_logic.rules IS 'Array of If-Then/Else-If-Then logic rules in JSON format';
COMMENT ON COLUMN step_logic.default_action IS 'Default action for cases that do not match any rules (Else-Then)';
