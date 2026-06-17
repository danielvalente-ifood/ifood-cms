-- =============================================
-- 011: rastrear quem editou em page_versions
-- =============================================
ALTER TABLE page_versions
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES cms_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_page_versions_edited_by ON page_versions(edited_by);
