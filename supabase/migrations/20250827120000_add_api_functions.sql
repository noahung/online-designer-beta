-- Create a function to validate API key and return user info
CREATE OR REPLACE FUNCTION validate_api_key(api_key_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_info_result json;
BEGIN
  -- Get user info by API key
  SELECT json_build_object(
    'user_id', us.user_id,
    'valid', true
  ) INTO user_info_result
  FROM user_settings us
  WHERE us.api_key = api_key_param;
  
  -- If no user found, return invalid
  IF user_info_result IS NULL THEN
    RETURN json_build_object('valid', false);
  END IF;
  
  RETURN user_info_result;
END;
$$;

-- Create a function to generate new API key for a user
CREATE OR REPLACE FUNCTION generate_new_api_key(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_api_key text;
BEGIN
  -- Generate a new API key with proper format using random() and md5
  new_api_key := 'dk_live_' || substr(md5(random()::text || clock_timestamp()::text), 1, 32);
  
  -- Update or insert user settings with new API key
  INSERT INTO user_settings (user_id, api_key)
  VALUES (user_id_param, new_api_key)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    updated_at = now();
  
  RETURN new_api_key;
END;
$$;

-- Create a function to get forms for API key authentication
CREATE OR REPLACE FUNCTION get_forms_by_api_key(api_key_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_found uuid;
  forms_result json;
BEGIN
  -- First, find the user by API key
  SELECT user_id INTO user_id_found
  FROM user_settings 
  WHERE api_key = api_key_param;
  
  -- If no user found, return empty
  IF user_id_found IS NULL THEN
    RETURN '[]'::json;
  END IF;
  
  -- Get user's active forms
  SELECT json_agg(
    json_build_object(
      'id', f.id,
      'name', f.name,
      'description', f.description,
      'created_at', f.created_at,
      'is_active', f.is_active
    )
  ) INTO forms_result
  FROM forms f
  WHERE f.user_id = user_id_found 
  AND f.is_active = true;
  
  RETURN COALESCE(forms_result, '[]'::json);
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION validate_api_key(text) TO anon;
GRANT EXECUTE ON FUNCTION get_forms_by_api_key(text) TO anon;
GRANT EXECUTE ON FUNCTION generate_new_api_key(uuid) TO authenticated;
