// @ts-nocheck
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

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
    let isMounted = true;
    let resolved = false;

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted && !resolved) {
          resolved = true;
          setUser(session?.user ?? null);
          setProviderToken(session?.provider_token ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error('[AuthProvider] getSession error:', err);
        if (isMounted && !resolved) {
          resolved = true;
          setLoading(false);
        }
      }
    };

    // Start auth check immediately
    getSession();

    // Fallback timeout
    const timeout = setTimeout(() => {
      if (isMounted && !resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 5000);

    let subscription: any;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!isMounted) return;

        setUser(session?.user ?? null);
        if (session?.provider_token) {
          setProviderToken(session.provider_token);
        }

        if (!resolved) {
          resolved = true;
          setLoading(false);
        }

        // Sync cms_users profile on sign-in
        if (_event === 'SIGNED_IN' && session?.user) {
          const u = session.user;
          try {
            await supabase.from('cms_users').upsert({
              auth_id: u.id,
              email: u.email || '',
              full_name: u.user_metadata?.full_name || '',
              avatar_url: u.user_metadata?.avatar_url || '',
            }, { onConflict: 'auth_id' });
          } catch (err) {
            console.error('[AuthProvider] upsert error:', err);
          }
        }
      });
      subscription = data?.subscription;
    } catch (err) {
      console.error('[AuthProvider] listener setup error:', err);
    }

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
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
    // Salvar dados do último usuário para exibir na tela de login
    if (user) {
      localStorage.setItem('ifood_last_user', JSON.stringify({
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        avatar: user.user_metadata?.avatar_url || '',
        email: user.email || '',
      }));
    }
    await supabase.auth.signOut();
    router.replace('/login');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px', background: 'var(--bg-primary)' }}>
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
