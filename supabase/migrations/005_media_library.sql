-- =============================================
-- 005: Media Library — evolve assets + storage bucket
-- =============================================

ALTER TABLE assets
  ADD COLUMN IF NOT EXISTS vertical_id UUID REFERENCES verticals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS alt_text TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES cms_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assets_vertical_id ON assets(vertical_id);
CREATE INDEX IF NOT EXISTS idx_assets_uploaded_by ON assets(uploaded_by);

CREATE POLICY "Editors can manage assets"
  ON assets FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND get_user_role() IN ('admin', 'editor')
  );

-- Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 'media', true, 52428800,
  ARRAY[
    'image/jpeg','image/jpg','image/png','image/gif','image/webp',
    'image/svg+xml','video/mp4','video/webm','video/ogg','application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read media"
  ON storage.objects FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated update media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media' AND auth.role() = 'authenticated');
