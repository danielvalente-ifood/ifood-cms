// @ts-nocheck
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ALLOWED_DOMAIN = 'ifood.com.br';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[Callback] Starting');
      const { data: { session }, error } = await supabase.auth.getSession();

      console.log('[Callback] getSession:', !!session, error);

      if (error || !session) {
        console.log('[Callback] No session, redirecting');
        router.replace('/login');
        return;
      }

      const email = session.user.email || '';
      const domain = email.split('@')[1];

      console.log('[Callback] Domain:', domain);

      if (domain !== ALLOWED_DOMAIN) {
        console.log('[Callback] Domain not allowed');
        await supabase.auth.signOut();
        router.replace('/login?error=domain');
        return;
      }

      console.log('[Callback] Domain OK, syncing profile');
      const u = session.user;
      try {
        await supabase.from('cms_users').upsert({
          auth_id: u.id,
          email: u.email || '',
          full_name: u.user_metadata?.full_name || '',
          avatar_url: u.user_metadata?.avatar_url || '',
        }, { onConflict: 'auth_id' });
        console.log('[Callback] Profile synced');
      } catch (err) {
        console.error('[Callback] Upsert error:', err);
      }

      console.log('[Callback] Redirecting to /');
      router.replace('/');
    };

    handleCallback();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px', background: 'var(--bg-primary)' }}>
      Autenticando...
    </div>
  );
}
