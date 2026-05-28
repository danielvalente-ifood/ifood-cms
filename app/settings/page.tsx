// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { RoleGuard } from '@/components/RoleGuard';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';
import { UserRow } from './components/UserRow';
import type { CmsUser, CmsUserWithVerticals, Vertical } from '@/types/database';
import styles from './settings.module.css';

function SettingsContent() {
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const [users, setUsers] = useState<CmsUserWithVerticals[]>([]);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<CmsUserWithVerticals | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const [{ data: usersData }, { data: verticalsData }, { data: userVerticalsData }] =
      await Promise.all([
        supabase.from('cms_users').select('*').order('created_at', { ascending: true }),
        supabase.from('verticals').select('*').order('name'),
        supabase.from('user_verticals').select('*'),
      ]);

    const verts = verticalsData || [];
    setVerticals(verts);

    const vertMap = new Map(verts.map((v: Vertical) => [v.id, v]));
    const uvByUser = new Map<string, Vertical[]>();

    (userVerticalsData || []).forEach((uv: { user_id: string; vertical_id: string }) => {
      const vert = vertMap.get(uv.vertical_id);
      if (vert) {
        const existing = uvByUser.get(uv.user_id) || [];
        existing.push(vert);
        uvByUser.set(uv.user_id, existing);
      }
    });

    const usersWithVerticals: CmsUserWithVerticals[] = (usersData || []).map(
      (u: CmsUser) => ({
        ...u,
        verticals: uvByUser.get(u.id) || [],
      })
    );

    setUsers(usersWithVerticals);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDelete = (u: CmsUserWithVerticals) => {
    setDeleteTarget(u);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    // Remove user_verticals first (FK)
    await supabase
      .from('user_verticals')
      .delete()
      .eq('user_id', deleteTarget.id);

    // Remove cms_users row
    const { error } = await supabase
      .from('cms_users')
      .delete()
      .eq('id', deleteTarget.id);

    if (error) {
      showToast('Erro ao remover usuário', 'error');
    } else {
      showToast(`${deleteTarget.full_name || deleteTarget.email} removido`, 'success');
    }

    setDeleting(false);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    fetchData();
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1>Configurações</h1>
            <p>Gestão de usuários e permissões</p>
          </div>
        </div>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${styles.tabActive}`}>
            Usuários ({users.length})
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.toolbar}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.loading}>Carregando...</div>
          ) : filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>Nenhum usuário encontrado</div>
          ) : (
            <div className={styles.usersList}>
              {filteredUsers.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  currentAuthId={user?.id || ''}
                  allVerticals={verticals}
                  onUpdate={fetchData}
                  onShowToast={showToast}
                  onDeleteUser={handleOpenDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete user confirmation */}
        <Modal
          open={showDeleteModal}
          onClose={() => !deleting && setShowDeleteModal(false)}
          title="Remover usuário"
          description={deleteTarget ? `Tem certeza que deseja remover ${deleteTarget.full_name || deleteTarget.email}? O acesso ao CMS será revogado.` : ''}
          variant="danger"
          actions={
            <>
              <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteUser} disabled={deleting}>
                {deleting ? 'Removendo...' : 'Remover'}
              </Button>
            </>
          }
        />

        <Toast toast={toast} />
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <SettingsContent />
    </RoleGuard>
  );
}
