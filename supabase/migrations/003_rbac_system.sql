-- =============================================
-- RBAC System — Roles, Verticais e Policies
-- =============================================

-- =============================================
-- 1. Enum type
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- =============================================
-- 2. Table: cms_users
-- =============================================
CREATE TABLE cms_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cms_users_auth_id ON cms_users(auth_id);
CREATE INDEX idx_cms_users_email ON cms_users(email);
CREATE INDEX idx_cms_users_role ON cms_users(role);

-- Auto-update updated_at
CREATE TRIGGER cms_users_updated_at
  BEFORE UPDATE ON cms_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 3. Table: user_verticals (join table)
-- =============================================
CREATE TABLE user_verticals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES verticals(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, vertical_id)
);

CREATE INDEX idx_user_verticals_user_id ON user_verticals(user_id);
CREATE INDEX idx_user_verticals_vertical_id ON user_verticals(vertical_id);

-- =============================================
-- 4. Helper functions (SECURITY DEFINER)
-- =============================================

-- Retorna o role do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.cms_users WHERE auth_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se o usuário tem acesso a uma vertical específica
CREATE OR REPLACE FUNCTION user_has_vertical_access(target_vertical_id UUID)
RETURNS BOOLEAN AS $$
  SELECT
    CASE
      WHEN get_user_role() = 'admin' THEN true
      WHEN target_vertical_id IS NULL THEN true  -- Ecossistema (sem vertical) acessível a todos
      ELSE EXISTS (
        SELECT 1 FROM public.user_verticals uv
        JOIN public.cms_users cu ON cu.id = uv.user_id
        WHERE cu.auth_id = auth.uid()
        AND uv.vertical_id = target_vertical_id
      )
    END
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 5. Trigger: auto-provisioning on auth.users insert
-- =============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.cms_users (auth_id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'viewer'
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 6. Enable RLS on new tables + experiments
-- =============================================
ALTER TABLE cms_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. Drop old permissive policies
-- =============================================
DROP POLICY IF EXISTS "Authenticated users full access on pages" ON pages;
DROP POLICY IF EXISTS "Authenticated users full access on page_versions" ON page_versions;
DROP POLICY IF EXISTS "Authenticated users full access on assets" ON assets;

-- =============================================
-- 8. New RLS policies — pages
-- =============================================

-- SELECT: authenticated + vertical scope
CREATE POLICY "Users can read pages in their scope"
  ON pages FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND user_has_vertical_access(vertical_id)
  );

-- INSERT: admin/editor + vertical scope
CREATE POLICY "Editors and Admins can create pages"
  ON pages FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND user_has_vertical_access(vertical_id)
  );

-- UPDATE: admin/editor + vertical scope
CREATE POLICY "Editors and Admins can update pages"
  ON pages FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND user_has_vertical_access(vertical_id)
  )
  WITH CHECK (
    user_has_vertical_access(vertical_id)
  );

-- DELETE: admin/editor + vertical scope
CREATE POLICY "Editors and Admins can delete pages"
  ON pages FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND user_has_vertical_access(vertical_id)
  );

-- =============================================
-- 9. New RLS policies — page_versions
-- =============================================

CREATE POLICY "Users can read page_versions in scope"
  ON page_versions FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = page_versions.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

CREATE POLICY "Editors can create page_versions"
  ON page_versions FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = page_versions.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

CREATE POLICY "Editors can update page_versions"
  ON page_versions FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = page_versions.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

CREATE POLICY "Editors can delete page_versions"
  ON page_versions FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = page_versions.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

-- =============================================
-- 10. New RLS policies — assets
-- =============================================
-- Keep "Public can read assets" as-is

CREATE POLICY "Editors can create assets"
  ON assets FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Editors can update assets"
  ON assets FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
  );

CREATE POLICY "Editors can delete assets"
  ON assets FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
  );

-- =============================================
-- 11. New RLS policies — experiments
-- =============================================

CREATE POLICY "Users can read experiments in scope"
  ON experiments FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = experiments.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

CREATE POLICY "Editors can manage experiments"
  ON experiments FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = experiments.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

CREATE POLICY "Editors can update experiments"
  ON experiments FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = experiments.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

CREATE POLICY "Editors can delete experiments"
  ON experiments FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM pages WHERE pages.id = experiments.page_id
      AND user_has_vertical_access(pages.vertical_id)
    )
  );

-- =============================================
-- 12. New RLS policies — experiment_variants
-- =============================================

CREATE POLICY "Users can read variants in scope"
  ON experiment_variants FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM experiments e
      JOIN pages p ON p.id = e.page_id
      WHERE e.id = experiment_variants.experiment_id
      AND user_has_vertical_access(p.vertical_id)
    )
  );

CREATE POLICY "Editors can manage variants"
  ON experiment_variants FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM experiments e
      JOIN pages p ON p.id = e.page_id
      WHERE e.id = experiment_variants.experiment_id
      AND user_has_vertical_access(p.vertical_id)
    )
  );

CREATE POLICY "Editors can update variants"
  ON experiment_variants FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM experiments e
      JOIN pages p ON p.id = e.page_id
      WHERE e.id = experiment_variants.experiment_id
      AND user_has_vertical_access(p.vertical_id)
    )
  );

CREATE POLICY "Editors can delete variants"
  ON experiment_variants FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
    AND EXISTS (
      SELECT 1 FROM experiments e
      JOIN pages p ON p.id = e.page_id
      WHERE e.id = experiment_variants.experiment_id
      AND user_has_vertical_access(p.vertical_id)
    )
  );

-- =============================================
-- 13. New RLS policies — cms_users
-- =============================================

-- SELECT: own row OR admin
CREATE POLICY "Users can read own profile"
  ON cms_users FOR SELECT
  USING (
    auth.uid() = auth_id
    OR get_user_role() = 'admin'
  );

-- INSERT: admin only (trigger handles auto-provisioning as SECURITY DEFINER)
CREATE POLICY "Admins can create users"
  ON cms_users FOR INSERT
  WITH CHECK (
    get_user_role() = 'admin'
    OR auth.uid() = auth_id  -- allow self-provisioning fallback
  );

-- UPDATE: admin only
CREATE POLICY "Admins can update users"
  ON cms_users FOR UPDATE
  USING (get_user_role() = 'admin');

-- DELETE: admin only
CREATE POLICY "Admins can delete users"
  ON cms_users FOR DELETE
  USING (get_user_role() = 'admin');

-- =============================================
-- 14. New RLS policies — user_verticals
-- =============================================

-- SELECT: own verticals OR admin
CREATE POLICY "Users can read own verticals"
  ON user_verticals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cms_users
      WHERE cms_users.id = user_verticals.user_id
      AND cms_users.auth_id = auth.uid()
    )
    OR get_user_role() = 'admin'
  );

-- INSERT/UPDATE/DELETE: admin only
CREATE POLICY "Admins can manage user_verticals"
  ON user_verticals FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update user_verticals"
  ON user_verticals FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete user_verticals"
  ON user_verticals FOR DELETE
  USING (get_user_role() = 'admin');

-- =============================================
-- 15. New RLS policies — verticals
-- =============================================

-- SELECT: all authenticated users (needed for dropdowns)
CREATE POLICY "Authenticated can read verticals"
  ON verticals FOR SELECT
  USING (auth.role() = 'authenticated');

-- Write: admin only
CREATE POLICY "Admins can create verticals"
  ON verticals FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can update verticals"
  ON verticals FOR UPDATE
  USING (get_user_role() = 'admin');

CREATE POLICY "Admins can delete verticals"
  ON verticals FOR DELETE
  USING (get_user_role() = 'admin');

-- =============================================
-- 16. Backfill: create cms_users for existing auth.users
-- =============================================
INSERT INTO cms_users (auth_id, email, full_name, avatar_url, role)
SELECT
  id,
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', ''),
  'viewer'
FROM auth.users
ON CONFLICT (auth_id) DO NOTHING;
