'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isAllowedDomain, syncUserProfile } from '@/lib/auth';

// Guarda module-level: o code PKCE só pode ser trocado uma vez. Sem isso o
// double-invoke do useEffect (React StrictMode em dev) dispara um 2º exchange
// com o mesmo code já consumido → erro → bounce para /login.
let exchangedCode: string | null = null;

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const oauthError = params.get('error');

      if (oauthError) {
        router.replace('/login');
        return;
      }

      // Já trocado nesta sessão de página — não repete.
      if (code && exchangedCode === code) return;

      // PKCE: troca o ?code= pela sessão explicitamente (detectSessionInUrl
      // está desligado, então este é o único ponto de exchange).
      if (code) {
        exchangedCode = code;
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (error || !data.session) {
          console.error('[Callback] exchangeCodeForSession falhou:', error?.message);
          router.replace('/login');
          return;
        }

        const session = data.session;

        if (!isAllowedDomain(session.user.email)) {
          await supabase.auth.signOut();
          router.replace('/login?error=domain');
          return;
        }

        void syncUserProfile(session.user);
        router.replace('/');
        return;
      }

      // Sem code: talvez a sessão já exista (revisita). Senão volta ao login.
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session && isAllowedDomain(session.user.email)) {
        router.replace('/');
      } else {
        router.replace('/login');
      }
    }

    handleCallback();

    return () => { cancelled = true; };
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
