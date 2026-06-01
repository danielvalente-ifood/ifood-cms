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

import type { Vertical } from '@/types/database';

export interface FolderMember {
  id: string;
  name: string;
  avatar: string | null;
  role: string;
}

export interface MediaFolder {
  /** null = Global (assets sem vertical) */
  vertical: Vertical | null;
  slug: string;
  name: string;
  color: string | null;
  count: number;
  /** soma dos file_size da pasta, em bytes */
  sizeBytes: number;
  /** até 4 URLs de imagem (mais recentes) para o collage de capa */
  thumbs: string[];
  /** created_at mais recente da pasta, ou null se vazia */
  updated: string | null;
  /** pessoas com acesso à pasta (admins + atribuídos; Global = todos) */
  members: FolderMember[];
}

const GLOBAL_FOLDER = { slug: 'global', name: 'Global' };

/**
 * Agrupa todos os assets por vertical (+ Global) para a visão de pastas.
 * Inclui tamanho total e os membros com acesso a cada pasta.
 */
export async function fetchMediaFolders(): Promise<MediaFolder[]> {
  const [{ data: verticals }, { data: assets }, { data: users }, { data: userVerticals }] =
    await Promise.all([
      supabase.from('verticals').select('*').order('name'),
      supabase
        .from('assets')
        .select('id, file_url, file_type, file_size, vertical_id, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('cms_users').select('id, full_name, email, avatar_url, role'),
      supabase.from('user_verticals').select('user_id, vertical_id'),
    ]);

  const rows = (assets ?? []) as Pick<Asset, 'id' | 'file_url' | 'file_type' | 'file_size' | 'vertical_id' | 'created_at'>[];
  const allUsers = (users ?? []) as { id: string; full_name: string | null; email: string; avatar_url: string | null; role: string }[];
  const assignments = (userVerticals ?? []) as { user_id: string; vertical_id: string }[];

  const toMember = (u: typeof allUsers[number]): FolderMember => ({
    id: u.id,
    name: u.full_name || u.email.split('@')[0],
    avatar: u.avatar_url,
    role: u.role,
  });

  const admins = allUsers.filter((u) => u.role === 'admin');

  const membersFor = (vid: string | null): FolderMember[] => {
    // Global: todos têm acesso. Vertical: admins + atribuídos.
    if (vid === null) return allUsers.map(toMember);
    const assignedIds = new Set(assignments.filter((a) => a.vertical_id === vid).map((a) => a.user_id));
    const set = new Map<string, FolderMember>();
    for (const a of admins) set.set(a.id, toMember(a));
    for (const u of allUsers) if (assignedIds.has(u.id)) set.set(u.id, toMember(u));
    return [...set.values()];
  };

  const build = (vertical: Vertical | null): MediaFolder => {
    const vid = vertical?.id ?? null;
    const group = rows.filter((a) => (a.vertical_id ?? null) === vid);
    const thumbs = group
      .filter((a) => getMediaType(a.file_type) === 'image')
      .slice(0, 4)
      .map((a) => a.file_url);
    return {
      vertical,
      slug: vertical?.slug ?? GLOBAL_FOLDER.slug,
      name: vertical?.name ?? GLOBAL_FOLDER.name,
      color: vertical?.color ?? null,
      count: group.length,
      sizeBytes: group.reduce((sum, a) => sum + (a.file_size ?? 0), 0),
      thumbs,
      updated: group[0]?.created_at ?? null,
      members: membersFor(vid),
    };
  };

  const verticalFolders = ((verticals ?? []) as Vertical[]).map((v) => build(v));
  return [...verticalFolders, build(null)];
}

/** Resolve um slug de pasta para o vertical_id (null = global, undefined = inválido) */
export async function resolveFolderVertical(
  slug: string,
): Promise<{ verticalId: string | null; name: string; slug: string } | undefined> {
  if (slug === 'global') return { verticalId: null, name: 'Global', slug: 'global' };
  const { data } = await supabase.from('verticals').select('*').eq('slug', slug).single();
  if (!data) return undefined;
  const v = data as Vertical;
  return { verticalId: v.id, name: v.name, slug: v.slug };
}
