'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { supabase } from '@/lib/supabase';
import { ALLOWED_DOMAIN } from '@/lib/auth';
import { DottedSurface } from '@/components/DottedSurface/DottedSurface';
import styles from './login.module.css';

// useLayoutEffect no cliente evita o flash da animação de entrada; no SSR cai
// para useEffect e evita o warning do Next. (Padrão recomendado pelo GSAP.)
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface LastUser {
  name: string;
  avatar: string;
  email: string;
}

/** Ícone colorido do Google (reaproveitado nos dois estados do botão). */
function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const domainError = searchParams.get('error') === 'domain';
  const cardRef = useRef<HTMLDivElement>(null);
  const [lastUser, setLastUser] = useState<LastUser | null>(null);
  const [loading, setLoading] = useState(false);

  // Ler dados do último usuário do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ifood_last_user');
      if (stored) {
        setLastUser(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  useIsomorphicLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // gsap.context isola as animações e o ctx.revert() no cleanup limpa tudo,
    // tornando o efeito seguro contra o double-invoke do React StrictMode. O
    // estado inicial (oculto) é aplicado pelos fromTo antes do paint (layout
    // effect), então não há flash; e, ao reverter, o conteúdo volta a ficar
    // visível — o botão de login nunca fica preso oculto, mesmo se a animação
    // for interrompida.
    const ctx = gsap.context(() => {
      const ringWrap = card.querySelector(`.${styles.avatarRingWrap}`) as HTMLElement;
      const neonGlow = card.querySelector(`.${styles.neonGlow}`) as HTMLElement;
      const neonBorder = card.querySelector(`.${styles.neonBorder}`) as HTMLElement;
      const title = card.querySelector(`.${styles.formTitle}`) as HTMLElement;
      const subtitle = card.querySelector(`.${styles.formSubtitle}`) as HTMLElement;
      const btnArea = card.querySelector(`.${styles.btnArea}`) as HTMLElement;
      const error = card.querySelector(`.${styles.error}`) as HTMLElement | null;

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. Avatar ring wrap — scale up from 0
      tl.fromTo(
        ringWrap,
        { scale: 0, opacity: 0, visibility: 'hidden' },
        { scale: 1, opacity: 1, visibility: 'visible', duration: 0.8, ease: 'back.out(1.4)' },
      );

      // 2. Title — fade in + slide up
      tl.fromTo(
        title,
        { y: 20, opacity: 0, visibility: 'hidden' },
        { y: 0, opacity: 1, visibility: 'visible', duration: 0.5 },
        '-=0.3',
      );

      // 3. Subtitle — fade in + slide up (staggered)
      tl.fromTo(
        subtitle,
        { y: 15, opacity: 0, visibility: 'hidden' },
        { y: 0, opacity: 1, visibility: 'visible', duration: 0.5 },
        '-=0.25',
      );

      // 4. Button — slide up with elastic ease
      tl.fromTo(
        btnArea,
        { y: 30, opacity: 0, visibility: 'hidden' },
        { y: 0, opacity: 1, visibility: 'visible', duration: 0.6, ease: 'back.out(1.2)' },
        '-=0.2',
      );

      // 5. Error (if present) — fade in
      if (error) {
        tl.fromTo(
          error,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4 },
          '-=0.1',
        );
      }

      // 6. Subtle floating animation on the ring wrap (loops forever)
      gsap.to(ringWrap, {
        y: -6,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: tl.duration(),
      });

      // 7. Neon rotation — animate the CSS custom property
      const neonProxy = { angle: 0 };
      gsap.to(neonProxy, {
        angle: 360,
        duration: 3,
        ease: 'none',
        repeat: -1,
        onUpdate: () => {
          const val = `${neonProxy.angle}deg`;
          neonGlow.style.setProperty('--neon-angle', val);
          neonBorder.style.setProperty('--neon-angle', val);
        },
      });
    }, card);

    return () => ctx.revert();
  }, [domainError, lastUser]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          hd: ALLOWED_DOMAIN,
          access_type: 'offline',
          prompt: lastUser ? 'none' : 'consent',
        },
        scopes: 'https://www.googleapis.com/auth/analytics.readonly',
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const firstName = lastUser?.name?.split(' ')[0] || '';

  return (
    <div className={styles.page}>
      {/* Full-screen dotted surface background */}
      <div className={styles.backdrop}>
        <DottedSurface />
      </div>

      {/* Logo top-left */}
      <img src="/ifood-icon.png" alt="iFood" className={styles.logoTopLeft} />

      {/* Content layer */}
      <div className={styles.content}>
        <div className={styles.loginCard} ref={cardRef}>
          {/* Avatar ring with neon glow */}
          <div className={styles.avatarRingWrap}>
            <div className={styles.neonGlow} />
            <div className={styles.neonBorder} />
            <div className={styles.avatarRing}>
              {lastUser?.avatar ? (
                <img
                  src={lastUser.avatar}
                  alt={lastUser.name}
                  className={styles.userAvatar}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className={styles.avatarCircle}>
                  <img
                    src="/ifood-icon.png"
                    alt="iFood"
                    className={styles.avatarIcon}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className={styles.formArea}>
            <h1 className={styles.formTitle}>
              {lastUser ? `Olá, ${firstName}` : 'iFood Portal'}
            </h1>
            <p className={styles.formSubtitle}>
              {lastUser
                ? lastUser.email
                : 'Faça login para acessar o painel de gerenciamento'}
            </p>
          </div>

          {/* Google Sign-In button */}
          <div className={styles.btnArea}>
            <button
              className={`${styles.googleBtn} ${loading ? styles.googleBtnLoading : ''}`}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Aguardando autenticação...
                </>
              ) : lastUser ? (
                <>
                  <GoogleIcon />
                  Continuar como {firstName}
                </>
              ) : (
                <>
                  <GoogleIcon />
                  Entrar com o Google
                </>
              )}
            </button>

            {/* Link para usar outra conta */}
            {lastUser && (
              <button
                className={styles.switchAccount}
                onClick={() => {
                  localStorage.removeItem('ifood_last_user');
                  setLastUser(null);
                }}
              >
                Usar outra conta
              </button>
            )}
          </div>

          {/* Error */}
          {domainError && (
            <p className={styles.error}>Acesso permitido apenas para emails @ifood.com.br</p>
          )}
        </div>
      </div>
    </div>
  );
}
