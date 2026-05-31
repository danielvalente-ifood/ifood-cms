'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isAllowedDomain } from '@/lib/auth';

/** Tempo máximo aguardando a sessão antes de desistir e voltar ao login. */
const SESSION_TIMEOUT_MS = 8000;

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let settled = false;

    function resolve(session: Session | null) {
      if (settled) return;
      settled = true;
      subscription.unsubscribe();
      clearTimeout(timeout);

      if (!session) {
        router.replace('/login');
        return;
      }

      if (!isAllowedDomain(session.user.email)) {
        supabase.auth.signOut().finally(() => router.replace('/login?error=domain'));
        return;
      }

      router.replace('/');
    }

    // O token do Google chega no hash da URL e o Supabase o processa de forma
    // assíncrona. Em vez de checar a sessão uma única vez (o que causava a
    // corrida e mandava o usuário de volta pro login), aguardamos o evento de
    // autenticação. getSession cobre o caso já-resolvido e o timeout é a rede
    // de segurança para não travar em "Autenticando...".
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) resolve(session);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) resolve(session);
    });

    const timeout = setTimeout(() => resolve(null), SESSION_TIMEOUT_MS);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)',
        fontSize: '14px',
        background: 'var(--bg-primary)',
      }}
    >
      Autenticando...
    </div>
  );
}
