-- =============================================
-- Fix: upsert_current_user deve retornar cms_users.id (não auth_id)
-- =============================================

CREATE OR REPLACE FUNCTION public.upsert_current_user(
  email_input VARCHAR(255),
  full_name_input VARCHAR(255),
  avatar_url_input TEXT
)
RETURNS uuid AS $$
DECLARE
  cms_user_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.cms_users (auth_id, email, full_name, avatar_url, role)
  VALUES (auth.uid(), email_input, full_name_input, avatar_url_input, 'viewer')
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now()
  RETURNING id INTO cms_user_id;

  -- Se o RETURNING não capturou (no UPDATE path em alguns Postgres), busca explicitamente
  IF cms_user_id IS NULL THEN
    SELECT id INTO cms_user_id FROM public.cms_users WHERE auth_id = auth.uid();
  END IF;

  RETURN cms_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_current_user(VARCHAR, VARCHAR, TEXT) TO authenticated;
