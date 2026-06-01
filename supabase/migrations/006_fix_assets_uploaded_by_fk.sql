-- =============================================
-- 006: assets.uploaded_by referencia auth.users(id)
-- O client envia auth.users.id (não cms_users.id). Reaponta a FK para casar,
-- senão o INSERT viola a constraint e o upload de mídia falha.
-- =============================================

ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_uploaded_by_fkey;
ALTER TABLE assets
  ADD CONSTRAINT assets_uploaded_by_fkey
  FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
