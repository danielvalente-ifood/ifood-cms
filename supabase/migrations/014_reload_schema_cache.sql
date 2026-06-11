-- Force PostgREST schema cache reload
-- Garante que a coluna edited_by existe e notifica o cache

-- Re-add just in case (IF NOT EXISTS é safe)
ALTER TABLE page_versions
  ADD COLUMN IF NOT EXISTS edited_by UUID REFERENCES cms_users(id) ON DELETE SET NULL;

-- Notifica PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';
