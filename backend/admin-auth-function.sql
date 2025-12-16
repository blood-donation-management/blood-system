-- Create a secure function for admin login that can be called with anon key
-- This function will verify admin credentials without exposing the admins table

CREATE OR REPLACE FUNCTION public.admin_login(
  p_username TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin RECORD;
  v_result JSON;
BEGIN
  -- Find admin by username
  SELECT id, username, password, role
  INTO v_admin
  FROM public.admins
  WHERE username = p_username
  LIMIT 1;

  -- Check if admin exists
  IF v_admin IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid credentials'
    );
  END IF;

  -- Simple password check (in production, use proper hashing)
  IF v_admin.password = p_password THEN
    RETURN json_build_object(
      'success', true,
      'admin', json_build_object(
        'id', v_admin.id,
        'username', v_admin.username,
        'role', v_admin.role
      )
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid credentials'
    );
  END IF;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.admin_login(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.admin_login(TEXT, TEXT) TO authenticated;
