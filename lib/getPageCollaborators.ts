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
  try {
    // Busca todas as versões com edited_by (pode ter NULLs)
    const { data: versions, error: versionsError } = await supabase
      .from('page_versions')
      .select('edited_by')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false });

    if (versionsError || !versions) {
      return [];
    }

    // Filtra NULLs e coleta IDs únicos (últimos N)
    const seen = new Set<string>();
    const userIds: string[] = [];

    for (const version of versions) {
      const userId = version.edited_by;
      if (userId && !seen.has(userId)) {
        seen.add(userId);
        userIds.push(userId);
        if (userIds.length >= limit) break;
      }
    }

    if (userIds.length === 0) {
      return [];
    }

    // Busca dados dos usuários
    const { data: users, error: usersError } = await supabase
      .from('cms_users')
      .select('id, full_name, avatar_url')
      .in('id', userIds);

    if (usersError || !users) {
      return [];
    }

    // Retorna na mesma ordem dos IDs
    const collaborators: Collaborator[] = [];
    for (const userId of userIds) {
      const user = users.find((u) => u.id === userId);
      if (user) {
        collaborators.push({
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
        });
      }
    }

    return collaborators;
  } catch (err) {
    console.error('Erro ao buscar colaboradores:', err);
    return [];
  }
}
