'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncUserProfile } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  providerToken: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  providerToken: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const PUBLIC_ROUTES = ['/login', '/auth/callback'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.provider_token) {
        setProviderToken(session.provider_token);
      }

      // Sincroniza o perfil em cms_users no login (fonte única — antes isso
      // estava duplicado também no /auth/callback).
      if (event === 'SIGNED_IN' && session?.user) {
        void syncUserProfile(session.user);
      }

      setLoading(false);
    });

    // Rede de segurança: se o listener não disparar em 5s, libera o loading.
    const timeout = setTimeout(() => setLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

    if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    // Salva o último usuário para exibir na próxima tela de login.
    if (user) {
      localStorage.setItem(
        'ifood_last_user',
        JSON.stringify({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          avatar: user.user_metadata?.avatar_url || '',
          email: user.email || '',
        }),
      );
    }
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
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
        Carregando...
      </div>
    );
  }

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!user && !isPublic) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, providerToken, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
