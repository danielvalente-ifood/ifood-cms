// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { useRole } from '@/hooks/useRole';
import { getPageCollaborators } from '@/lib/getPageCollaborators';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Icon } from '@/components/Icon/Icon';
import { PageCard } from '@/components/PageCard/PageCard';
import type { StatusType } from '@/components/ui/status-badge';
import cardStyles from '@/components/PageCard/PageCard.module.css';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { useToast } from '@/hooks/useToast';
import type { Page, Vertical } from '@/types/database';
import styles from './pages.module.css';

type PageWithVertical = Page & {
  vertical?: Vertical | null;
  creator?: { full_name: string | null; avatar_url: string | null } | null;
  collaborators?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
};

export default function PagesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { canEdit } = useRole();

  const [pages, setPages] = useState<PageWithVertical[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useToast();

  // Filters
  const [search, setSearch] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<PageWithVertical | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formVerticalId, setFormVerticalId] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    // Tenta com join; se falhar (coluna criador não existe), faz query simples
    const { data: joinedPages, error: joinError } = await supabase
      .from('pages')
      .select('*, creator:created_by(full_name, avatar_url)')
      .order('updated_at', { ascending: false });

    let pgs = joinedPages;
    if (joinError && !joinedPages) {
      // Fallback: coluna created_by não existe ainda
      const { data: simplePages } = await supabase
        .from('pages')
        .select('*')
        .order('updated_at', { ascending: false });
      pgs = simplePages;
    }

    const { data: verts } = await supabase.from('verticals').select('*').order('name');

    const vertMap = new Map((verts || []).map((v: Vertical) => [v.id, v]));

    // Fetch collaborators for each page in parallel
    const pagesWithVerticals: PageWithVertical[] = await Promise.all(
      (pgs || []).map(async (p: any) => {
        const collaborators = await getPageCollaborators(p.id);
        return {
          ...p,
          vertical: p.vertical_id ? vertMap.get(p.vertical_id) || null : null,
          creator: p.creator || null,
          collaborators,
        };
      })
    );

    setPages(pagesWithVerticals);
    setVerticals(verts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Slug generator
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormName(value);
    setFormSlug(generateSlug(value));
    setFormError('');
  };

  const resetForm = () => {
    setFormName('');
    setFormSlug('');
    setFormVerticalId('');
    setFormError('');
    setFormLoading(false);
    setSelectedPage(null);
  };

  const ensureUserExists = async (userId: string) => {
    try {
      // Tenta criar ou atualizar o usuário (upsert)
      const insertData: any = {
        id: userId,
        email: user?.email || '',
        full_name: user?.user_metadata?.full_name || '',
      };

      // Só inclui avatar_url se tiver valor
      if (user?.user_metadata?.avatar_url) {
        insertData.avatar_url = user.user_metadata.avatar_url;
      }

      const { error: upsertError, data } = await supabase
        .from('cms_users')
        .upsert(insertData, { onConflict: 'id' });

      if (upsertError) {
        console.error('Erro ao garantir usuário em cms_users:', JSON.stringify(upsertError));
        // Continua mesmo com erro - o banco pode deixar passar
        return true;
      }

      return true;
    } catch (err) {
      console.error('Erro inesperado em ensureUserExists:', err);
      // Continua mesmo com erro - não bloqueia a criação da página
      return true;
    }
  };

  // ---- Create ----
  const handleCreate = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      setFormError('Nome e slug são obrigatórios');
      return;
    }

    if (!user?.id) {
      setFormError('Usuário não autenticado');
      return;
    }

    setFormLoading(true);

    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', formSlug);

    if (existing && existing.length > 0) {
      setFormError('Esse slug já está em uso');
      setFormLoading(false);
      return;
    }

    const insertData: any = {
      name: formName.trim(),
      slug: formSlug.trim(),
      status: 'draft',
      created_by: user.id,
    };
    if (formVerticalId) {
      insertData.vertical_id = formVerticalId;
    }

    const { data: newPage, error } = await supabase
      .from('pages')
      .insert(insertData)
      .select()
      .single();

    if (error || !newPage) {
      setFormError('Erro ao criar página');
      setFormLoading(false);
      return;
    }

    await supabase.from('page_versions').insert({
      page_id: newPage.id,
      content: { blocks: [] },
      version_type: 'draft',
      edited_by: user.id,
    });

    setShowCreateModal(false);
    resetForm();
    showToast('Página criada com sucesso', 'success');
    fetchData();
  };

  // ---- Duplicate ----
  const openDuplicate = (page: PageWithVertical) => {
    setSelectedPage(page);
    setFormName(`${page.name} (cópia)`);
    setFormSlug(`${page.slug}-copia`);
    setFormVerticalId(page.vertical_id || '');
    setFormError('');
    setShowDuplicateModal(true);
  };

  const handleDuplicate = async () => {
    if (!selectedPage || !formName.trim() || !formSlug.trim()) {
      setFormError('Nome e slug são obrigatórios');
      return;
    }

    setFormLoading(true);

    const { data: existing } = await supabase
      .from('pages')
      .select('id')
      .eq('slug', formSlug);

    if (existing && existing.length > 0) {
      setFormError('Esse slug já está em uso');
      setFormLoading(false);
      return;
    }

    // Fetch source content
    let { data: sourceVersion } = await supabase
      .from('page_versions')
      .select('content')
      .eq('page_id', selectedPage.id)
      .eq('version_type', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!sourceVersion) {
      const { data: pubVersion } = await supabase
        .from('page_versions')
        .select('content')
        .eq('page_id', selectedPage.id)
        .eq('version_type', 'published')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      sourceVersion = pubVersion;
    }

    const content = sourceVersion?.content ?? { blocks: [] };

    const insertData: any = {
      name: formName.trim(),
      slug: formSlug.trim(),
      status: 'draft',
    };
    if (formVerticalId) {
      insertData.vertical_id = formVerticalId;
    }

    const { data: newPage, error } = await supabase
      .from('pages')
      .insert(insertData)
      .select()
      .single();

    if (error || !newPage) {
      setFormError('Erro ao duplicar página');
      setFormLoading(false);
      return;
    }

    await supabase.from('page_versions').insert({
      page_id: newPage.id,
      content,
      version_type: 'draft',
    });

    setShowDuplicateModal(false);
    resetForm();
    showToast('Página duplicada com sucesso', 'success');
    fetchData();
  };

  // ---- Delete ----
  const openDelete = (page: PageWithVertical) => {
    setSelectedPage(page);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!selectedPage) return;
    setFormLoading(true);

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', selectedPage.id);

    if (error) {
      showToast('Erro ao deletar página', 'error');
      setFormLoading(false);
      return;
    }

    setShowDeleteConfirm(false);
    setSelectedPage(null);
    setFormLoading(false);
    showToast('Página deletada', 'success');
    fetchData();
  };

  // ---- Publish / Unpublish ----
  const handleTogglePublish = async (page: PageWithVertical) => {
    if (page.status === 'published') {
      const { error } = await supabase
        .from('pages')
        .update({ status: 'draft' })
        .eq('id', page.id);

      if (error) {
        showToast('Erro ao despublicar', 'error');
        return;
      }
      showToast('Página despublicada', 'success');
    } else {
      const { data: version } = await supabase
        .from('page_versions')
        .select('content')
        .eq('page_id', page.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!version || !version.content?.blocks?.length) {
        showToast('Página sem blocos — não é possível publicar', 'error');
        return;
      }

      await supabase.from('page_versions').insert({
        page_id: page.id,
        content: version.content,
        version_type: 'published',
      });

      const { error } = await supabase
        .from('pages')
        .update({ status: 'published' })
        .eq('id', page.id);

      if (error) {
        showToast('Erro ao publicar', 'error');
        return;
      }
      showToast('Página publicada!', 'success');

      // Generate thumbnail screenshot in background
      fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: page.id, slug: page.slug }),
      }).catch(() => {});
    }

    fetchData();
  };

  const handleStatusChange = (page: PageWithVertical, newStatus: StatusType) => {
    if (newStatus !== page.status) {
      handleTogglePublish(page);
    }
  };

  // ---- Generate Thumbnail ----
  const handleGenerateThumbnail = async (page: PageWithVertical) => {
    setGeneratingThumbnail(page.id);
    try {
      const res = await fetch('/api/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: page.id, slug: page.slug }),
      });
      if (res.ok) {
        showToast('Thumbnail gerada!', 'success');
        fetchData();
      } else {
        showToast('Erro ao gerar thumbnail', 'error');
      }
    } catch {
      showToast('Erro ao gerar thumbnail', 'error');
    }
    setGeneratingThumbnail(null);
  };

  // ---- Edit Settings ----
  const openEditModal = (page: PageWithVertical) => {
    setSelectedPage(page);
    setFormName(page.name);
    setFormVerticalId(page.vertical_id || '');
    setFormError('');
    setShowEditModal(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedPage || !formName.trim()) {
      setFormError('Nome é obrigatório');
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
      setFormError('Erro ao salvar configurações');
      setFormLoading(false);
      return;
    }

    setShowEditModal(false);
    setFormLoading(false);
    showToast('Configurações atualizadas', 'success');
    fetchData();
  };

  // ---- Formatting ----
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFirstName = () => {
    const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
    return fullName.split(' ')[0];
  };

  const userName = getFirstName();
  const userAvatar = user?.user_metadata?.avatar_url || null;

  // ---- Filtering ----
  const filteredPages = pages.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesVertical =
      !verticalFilter ||
      (verticalFilter === '__none__' ? !p.vertical_id : p.vertical_id === verticalFilter);
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesVertical && matchesStatus;
  });

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>Páginas</h1>
            <p>
              {pages.length} página{pages.length !== 1 ? 's' : ''}
              {filteredPages.length !== pages.length && ` · ${filteredPages.length} exibida${filteredPages.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {canEdit && (
            <Button variant="primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <Icon name="plus-default" size={16} />
              Nova página
            </Button>
          )}
        </div>

        {/* Toolbar */}
        {pages.length > 0 && (
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar páginas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FilterDropdown
              value={verticalFilter}
              onChange={setVerticalFilter}
              placeholder="Todas as verticais"
              options={[
                { value: '', label: 'Todas as verticais' },
                { value: '__none__', label: 'Ecossistema' },
                ...verticals.map((v) => ({ value: v.id, label: v.name })),
              ]}
            />
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Todos os status"
              options={[
                { value: '', label: 'Todos os status' },
                { value: 'published', label: 'Publicada' },
                { value: 'draft', label: 'Rascunho' },
              ]}
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className={styles.loading}>Carregando...</div>
        ) : pages.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Nenhuma página criada</h3>
            <p>Crie sua primeira landing page para começar</p>
          </div>
        ) : filteredPages.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Nenhum resultado</h3>
            <p>Tente ajustar os filtros de busca</p>
          </div>
        ) : (
          <div className={styles.pagesGrid}>
            {filteredPages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                userName={page.creator?.full_name || 'Desconhecido'}
                userAvatar={page.creator?.avatar_url || null}
                formatDate={formatDate}
                onClick={() => router.push(`/editor/${page.id}`)}
                onStatusChange={canEdit ? (newStatus) => handleStatusChange(page, newStatus) : undefined}
                onEditSettings={canEdit ? () => openEditModal(page) : undefined}
                actions={canEdit ? (
                  <>
                    <button className={cardStyles.btnAction} onClick={() => router.push(`/editor/${page.id}`)}>
                      Editar
                    </button>
                    <button className={cardStyles.btnAction} onClick={() => openDuplicate(page)}>
                      Duplicar
                    </button>
                    <button className={cardStyles.btnActionDanger} onClick={() => openDelete(page)}>
                      Remover
                    </button>
                  </>
                ) : undefined}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nova Página"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreate} disabled={formLoading}>
              {formLoading ? 'Criando...' : 'Criar página'}
            </Button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nome da página</label>
          <input
            className={styles.formInput}
            value={formName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ex: Página iFood Pago"
            autoFocus
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Slug (URL)</label>
          <input
            className={styles.formInput}
            value={formSlug}
            onChange={(e) => { setFormSlug(e.target.value); setFormError(''); }}
            placeholder="pagina-ifood-pago"
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Vertical</label>
          <select
            className={styles.formSelect}
            value={formVerticalId}
            onChange={(e) => setFormVerticalId(e.target.value)}
          >
            <option value="">Ecossistema (sem vertical)</option>
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        {formError && <p className={styles.formError}>{formError}</p>}
      </Modal>

      {/* Duplicate Modal */}
      <Modal
        open={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        title="Duplicar Página"
        description={selectedPage ? `Duplicando ${selectedPage.name}` : ''}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDuplicateModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleDuplicate} disabled={formLoading}>
              {formLoading ? 'Duplicando...' : 'Duplicar'}
            </Button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nome da cópia</label>
          <input
            className={styles.formInput}
            value={formName}
            onChange={(e) => handleNameChange(e.target.value)}
            autoFocus
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Slug (URL)</label>
          <input
            className={styles.formInput}
            value={formSlug}
            onChange={(e) => { setFormSlug(e.target.value); setFormError(''); }}
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Vertical</label>
          <select
            className={styles.formSelect}
            value={formVerticalId}
            onChange={(e) => setFormVerticalId(e.target.value)}
          >
            <option value="">Ecossistema (sem vertical)</option>
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        {formError && <p className={styles.formError}>{formError}</p>}
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Deletar Página"
        description={selectedPage ? `Tem certeza que deseja deletar ${selectedPage.name}? Essa ação não pode ser desfeita.` : ''}
        variant="danger"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} disabled={formLoading}>
              {formLoading ? 'Deletando...' : 'Deletar'}
            </Button>
          </>
        }
      />

      {/* Edit Settings Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Configurações da Página"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSaveSettings} disabled={formLoading}>
              {formLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nome da página</label>
          <input
            className={styles.formInput}
            value={formName}
            onChange={(e) => { setFormName(e.target.value); setFormError(''); }}
            placeholder="Nome da página"
            autoFocus
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Vertical</label>
          <select
            className={styles.formSelect}
            value={formVerticalId}
            onChange={(e) => { setFormVerticalId(e.target.value); setFormError(''); }}
          >
            <option value="">Ecossistema (sem vertical)</option>
            {verticals.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        {formError && <p className={styles.formError}>{formError}</p>}
      </Modal>

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}
