-- =============================================
-- 009: adicionar created_by em pages
-- =============================================
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES cms_users(id) ON DELETE SET NULL;

-- Index para queries que filtram por criador
CREATE INDEX IF NOT EXISTS idx_pages_created_by ON pages(created_by);
