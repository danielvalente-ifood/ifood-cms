import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

/** Único domínio corporativo autorizado a acessar o CMS. */
export const ALLOWED_DOMAIN = 'ifood.com.br';

/** Retorna true se o e-mail pertence ao domínio autorizado. */
export function isAllowedDomain(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.split('@')[1]?.toLowerCase() === ALLOWED_DOMAIN;
}

/**
 * Sincroniza o perfil do usuário autenticado na tabela `cms_users`.
 *
 * Usa `onConflict: 'auth_id'`, então em logins seguintes só atualiza
 * nome/avatar/email — o `role` não é enviado de propósito, para não
 * sobrescrever a permissão já atribuída (a coluna tem default no banco
 * para registros novos).
 */
export async function syncUserProfile(user: User): Promise<void> {
  const { error } = await supabase.from('cms_users').upsert(
    {
      auth_id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name ?? '',
      avatar_url: user.user_metadata?.avatar_url ?? '',
    },
    { onConflict: 'auth_id' },
  );

  if (error) {
    console.error('[auth] Falha ao sincronizar cms_users:', error.message);
  }
}
