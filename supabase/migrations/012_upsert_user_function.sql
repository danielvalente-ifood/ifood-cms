-- =============================================
-- Function: upsert_current_user
-- Purpose: Allow authenticated users to upsert their own cms_users record
-- Security: SECURITY DEFINER (runs as postgres, not user)
-- =============================================

CREATE OR REPLACE FUNCTION public.upsert_current_user(
  email_input VARCHAR(255),
  full_name_input VARCHAR(255),
  avatar_url_input TEXT
)
RETURNS uuid AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get the auth user ID
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Upsert the user into cms_users
  INSERT INTO public.cms_users (auth_id, email, full_name, avatar_url, role)
  VALUES (user_id, email_input, full_name_input, avatar_url_input, 'viewer')
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();

  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_current_user(VARCHAR, VARCHAR, TEXT) TO authenticated;
