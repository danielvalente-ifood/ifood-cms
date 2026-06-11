'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRole } from '@/hooks/useRole';
import { getPageCollaborators } from '@/lib/getPageCollaborators';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Icon } from '@/components/Icon/Icon';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { PageCard } from '@/components/PageCard/PageCard';
import { useToast } from '@/hooks/useToast';
import type { Page, Vertical } from '@/types/database';
import styles from './home.module.css';

type PageWithVertical = Page & {
  vertical?: Vertical | null;
  creator?: { full_name: string | null; avatar_url: string | null } | null;
  collaborators?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
};

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canEdit } = useRole();
  const { toast, showToast } = useToast();
  const [pages, setPages] = useState<PageWithVertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<PageWithVertical | null>(null);
  const [formName, setFormName] = useState('');
  const [formVerticalId, setFormVerticalId] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const fetchPages = useCallback(async () => {
    // Tenta com join de criador; se falhar, faz query simples (compatível com bancos antigos)
    let pagesData: any = [];
    const { data: verticalsData } = await supabase.from('verticals').select('*');
    setVerticals(verticalsData || []);

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

    // Fetch collaborators for each page in parallel
    const pagesWithVerticals: PageWithVertical[] = await Promise.all(
      (pagesData || []).map(async (page: any) => {
        const collaborators = await getPageCollaborators(page.id);
        return {
          ...page,
          vertical: page.vertical_id
            ? verticalsMap.get(page.vertical_id) || null
            : null,
          creator: page.creator || null,
          collaborators,
        };
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

  const openEditModal = (page: PageWithVertical) => {
    setSelectedPage(page);
    setFormName(page.name);
    setFormVerticalId(page.vertical_id || '');
    setShowEditModal(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedPage || !formName.trim()) {
      showToast('Nome é obrigatório', 'error');
      return;
    }

    setFormLoading(true);

    const updateData: any = {
      name: formName.trim(),
    };
    if (formVerticalId) {
      updateData.vertical_id = formVerticalId;
    } else {
      updateData.vertical_id = null;
    }

    const { error } = await supabase
      .from('pages')
      .update(updateData)
      .eq('id', selectedPage.id);

    if (error) {
      showToast('Erro ao salvar configurações', 'error');
      setFormLoading(false);
      return;
    }

    setShowEditModal(false);
    setFormLoading(false);
    showToast('Configurações atualizadas', 'success');
    fetchPages();
  };

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
                    onEditSettings={canEdit ? () => openEditModal(page) : undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Edit Settings Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Configurações da Página"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveSettings} disabled={formLoading}>
              {formLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Nome da página
            </label>
            <input
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nome da página"
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-primary)' }}>
              Vertical
            </label>
            <select
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-default)',
                borderRadius: '6px',
                fontSize: '13px',
                fontFamily: 'inherit',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
              value={formVerticalId}
              onChange={(e) => setFormVerticalId(e.target.value)}
            >
              <option value="">Ecossistema (sem vertical)</option>
              {verticals.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
