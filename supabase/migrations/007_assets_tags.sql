-- =============================================
-- 007: tags nos assets (biblioteca de mídia)
-- =============================================
ALTER TABLE assets ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING gin(tags);
