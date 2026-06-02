-- =============================================
-- 008: campos de SEO por página
-- =============================================
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS og_image TEXT;
