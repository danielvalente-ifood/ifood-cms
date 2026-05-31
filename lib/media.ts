import { supabase } from '@/lib/supabase';
import type { Asset } from '@/types/database';

export const MEDIA_BUCKET = 'media';

export type MediaType = 'image' | 'video' | 'pdf' | 'other';

export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Builds the storage path: {verticalSlug}/{sanitizedFilename} */
export function buildStoragePath(verticalSlug: string | null, filename: string): string {
  const folder = verticalSlug ?? 'global';
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${folder}/${safe}`;
}

/** Returns the public URL for a storage path */
export function getPublicUrl(storagePath: string): string {
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

export interface UploadOptions {
  file: File;
  verticalId: string | null;
  verticalSlug: string | null;
  uploadedBy: string | null;
  altText?: string;
}

/** Upload a file to Supabase Storage and register it in assets table */
export async function uploadMedia(opts: UploadOptions): Promise<{ asset: Asset | null; error: string | null }> {
  const { file, verticalId, verticalSlug, uploadedBy, altText } = opts;

  // Deduplicate filename if collision
  const ts = Date.now();
  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const base = file.name.slice(0, file.name.lastIndexOf('.') || undefined).replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${base}_${ts}${ext}`;
  const storagePath = buildStoragePath(verticalSlug, uniqueName);

  const { error: uploadError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(storagePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) return { asset: null, error: uploadError.message };

  const publicUrl = getPublicUrl(storagePath);

  const { data, error: dbError } = await supabase
    .from('assets')
    .insert({
      vertical_id: verticalId,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: storagePath,
      alt_text: altText ?? null,
      uploaded_by: uploadedBy,
    })
    .select()
    .single();

  if (dbError) {
    // Rollback storage upload
    await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    return { asset: null, error: dbError.message };
  }

  return { asset: data as Asset, error: null };
}

/** Rename: copy to new path, delete old, update DB */
export async function renameMedia(
  asset: Asset,
  newName: string,
  verticalSlug: string | null,
): Promise<{ error: string | null }> {
  if (!asset.storage_path) return { error: 'Asset sem storage_path' };

  const ext = asset.file_name?.includes('.') ? asset.file_name.slice(asset.file_name.lastIndexOf('.')) : '';
  const safeName = newName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const newStoragePath = buildStoragePath(verticalSlug, `${safeName}${ext}`);

  const { error: copyError } = await supabase.storage
    .from(MEDIA_BUCKET)
    .copy(asset.storage_path, newStoragePath);

  if (copyError) return { error: copyError.message };

  await supabase.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);

  const newPublicUrl = getPublicUrl(newStoragePath);

  const { error: dbError } = await supabase
    .from('assets')
    .update({
      file_name: `${safeName}${ext}`,
      storage_path: newStoragePath,
      file_url: newPublicUrl,
    })
    .eq('id', asset.id);

  return { error: dbError?.message ?? null };
}

/** Delete from storage + DB */
export async function deleteMedia(asset: Asset): Promise<{ error: string | null }> {
  if (asset.storage_path) {
    await supabase.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
  }

  const { error } = await supabase.from('assets').delete().eq('id', asset.id);
  return { error: error?.message ?? null };
}

/** Fetch assets filtered by vertical (null = global, undefined = all) */
export async function fetchAssets(verticalId: string | null | undefined): Promise<Asset[]> {
  let query = supabase
    .from('assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (verticalId === null) {
    query = query.is('vertical_id', null);
  } else if (verticalId !== undefined) {
    query = query.eq('vertical_id', verticalId);
  }

  const { data } = await query;
  return (data as Asset[]) ?? [];
}
