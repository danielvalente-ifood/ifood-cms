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
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        router.replace('/login');
        return;
      }

      const email = session.user.email || '';
      const domain = email.split('@')[1];

      if (domain !== ALLOWED_DOMAIN) {
        await supabase.auth.signOut();
        router.replace('/login?error=domain');
        return;
      }

      // Ensure cms_users profile exists
      const u = session.user;
      await supabase.from('cms_users').upsert({
        auth_id: u.id,
        email: u.email || '',
        full_name: u.user_metadata?.full_name || '',
        avatar_url: u.user_metadata?.avatar_url || '',
      }, { onConflict: 'auth_id' });

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
