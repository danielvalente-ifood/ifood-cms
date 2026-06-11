-- =============================================
-- 010: atribuir páginas existentes ao criador
-- =============================================
UPDATE pages
SET created_by = (
  SELECT id FROM cms_users
  WHERE email = 'daniel.valente@ifood.com.br'
  LIMIT 1
)
WHERE created_by IS NULL;
