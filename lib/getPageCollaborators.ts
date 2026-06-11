import { supabase } from '@/lib/supabase';

export interface Collaborator {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

/**
 * Busca últimos 3 colaboradores **distintos** de uma página
 * (últimas pessoas a editar), em ordem recente descrescente.
 *
 * Deduplicado: se o mesmo usuário editou 5 vezes, aparece uma vez.
 */
export async function getPageCollaborators(pageId: string, limit = 3): Promise<Collaborator[]> {
  // Tenta com join; se falhar (edited_by pode ser NULL em novos registros), retorna []
  const { data: versions, error } = await supabase
    .from('page_versions')
    .select('edited_by, creator:edited_by(id, full_name, avatar_url)')
    .eq('page_id', pageId)
    .not('edited_by', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !versions) {
    return [];
  }

  // Dedup por user_id, pega últimos N únicos
  const seen = new Set<string>();
  const collaborators: Collaborator[] = [];

  for (const version of versions) {
    const userId = version.edited_by;
    if (!userId || seen.has(userId)) continue;

    seen.add(userId);

    const collaborator = version.creator as unknown as Collaborator | null;
    if (collaborator) {
      collaborators.push(collaborator);
      if (collaborators.length >= limit) break;
    }
  }

  return collaborators;
}
