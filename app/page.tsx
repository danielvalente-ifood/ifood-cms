'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRole } from '@/hooks/useRole';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Icon } from '@/components/Icon/Icon';
import { Button } from '@/components/ui/button';
import { PageCard } from '@/components/PageCard/PageCard';
import type { Page, Vertical } from '@/types/database';
import styles from './home.module.css';

type PageWithVertical = Page & {
  vertical?: Vertical | null;
  creator?: { full_name: string | null; avatar_url: string | null } | null;
};

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canEdit } = useRole();
  const [pages, setPages] = useState<PageWithVertical[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    // Tenta com join de criador; se falhar, faz query simples (compatível com bancos antigos)
    let pagesData: any = [];
    const { data: verticalsData } = await supabase.from('verticals').select('*');

    const { data: joinedPages, error: joinError } = await supabase
      .from('pages')
      .select('*, creator:created_by(full_name, avatar_url)')
      .order('updated_at', { ascending: false });

    if (joinError && !joinedPages) {
      // Coluna created_by não existe ou join falhou — query simples
      const { data: simplePges } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });
      pagesData = simplePges || [];
    } else {
      pagesData = joinedPages || [];
    }

    const verticalsMap = new Map(
      (verticalsData || []).map((v: Vertical) => [v.id, v])
    );

    const pagesWithVerticals: PageWithVertical[] = (pagesData || []).map(
      (page: any) => ({
        ...page,
        vertical: page.vertical_id
          ? verticalsMap.get(page.vertical_id) || null
          : null,
        creator: page.creator || null,
      })
    );

    setPages(pagesWithVerticals);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const getFirstName = () => {
    const fullName =
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'Usuário';
    return fullName.split(' ')[0];
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getFormattedDate = () => {
    const now = new Date();
    const weekday = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const rest = now.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
    });
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalized}, ${rest}`;
  };

  const formatCardDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const userName = getFirstName();
  const userAvatar = user?.user_metadata?.avatar_url || null;

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroGreeting}>
            {getGreeting()}, {userName}
          </h1>
          <p className={styles.heroDate}>{getFormattedDate()}</p>
        </section>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : pages.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Comece criando sua primeira página</h3>
              <p>Crie, edite e publique landing pages em minutos</p>
            </div>
          ) : (
            <section className={styles.pagesSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Suas páginas</h2>
                <div className={styles.sectionActions}>
                  {canEdit && (
                    <Button variant="primary" onClick={() => router.push('/pages')}>
                      <Icon name="plus-default" size={16} />
                      Criar nova página
                    </Button>
                  )}
                  <button
                    className={styles.btnIcon}
                    onClick={() => router.push('/pages')}
                  >
                    <Icon name="chevron-right" size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.pagesGrid}>
                {pages.slice(0, 4).map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    userName={page.creator?.full_name || 'Desconhecido'}
                    userAvatar={page.creator?.avatar_url || null}
                    formatDate={formatCardDate}
                    onClick={() => router.push(`/editor/${page.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
