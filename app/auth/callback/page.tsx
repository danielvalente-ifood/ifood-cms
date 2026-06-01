'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isAllowedDomain, syncUserProfile } from '@/lib/auth';

// Promise module-level: o code PKCE só pode ser trocado UMA vez. Compartilhar a
// mesma promise entre os dois invokes do useEffect (React StrictMode em dev)
// garante um único exchange — ambos os mounts aguardam o mesmo resultado e
// fazem o redirect (idempotente). Em page load real o módulo reinicia → null.
let exchangePromise: ReturnType<typeof supabase.auth.exchangeCodeForSession> | null = null;

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const oauthError = params.get('error');

      if (oauthError) {
        console.error('[Callback] OAuth error:', oauthError);
        router.replace('/login');
        return;
      }

      if (code) {
        if (!exchangePromise) {
          exchangePromise = supabase.auth.exchangeCodeForSession(code);
        }
        const { data, error } = await exchangePromise;

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

      // Sem code: sessão já pode existir (revisita direta). Senão volta ao login.
      const { data: { session } } = await supabase.auth.getSession();
      if (session && isAllowedDomain(session.user.email)) {
        router.replace('/');
      } else {
        router.replace('/login');
      }
    }

    run();
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
