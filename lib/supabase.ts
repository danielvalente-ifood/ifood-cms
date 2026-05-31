import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Login com Google usa PKCE (default do supabase-js): o provider volta com
    // `?code=...` e o client troca pela sessão automaticamente quando
    // `detectSessionInUrl` está ligado — é o sinal que o /auth/callback aguarda.
    // (Forçar `implicit` quebrava o login: o client esperava `#access_token` no
    // hash e ignorava o `?code=`, então a sessão nunca era estabelecida.)
    flowType: 'pkce',
    // Exchange do ?code= é feito MANUALMENTE no /auth/callback via
    // exchangeCodeForSession. detectSessionInUrl fica desligado para não
    // competir/consumir o code antes (causava sessão nunca estabelecida).
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});
