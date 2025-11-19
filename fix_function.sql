-- Fix the function name conflict
DROP FUNCTION IF EXISTS set_config(text, text, boolean);

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
