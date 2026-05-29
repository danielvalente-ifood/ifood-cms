// @ts-nocheck
'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Icon } from '@/components/Icon/Icon';
import type { CmsUserWithVerticals, UserRole, Vertical } from '@/types/database';
import styles from './UserRow.module.css';

interface UserRowProps {
  user: CmsUserWithVerticals;
  currentAuthId: string;
  allVerticals: Vertical[];
  onUpdate: () => void;
  onShowToast: (msg: string, type: 'success' | 'error') => void;
  onDeleteUser: (user: CmsUserWithVerticals) => void;
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const roles: UserRole[] = ['admin', 'editor', 'viewer'];

export function UserRow({
  user,
  currentAuthId,
  allVerticals,
  onUpdate,
  onShowToast,
  onDeleteUser,
}: UserRowProps) {
  const [updatingRole, setUpdatingRole] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showVerticalDropdown, setShowVerticalDropdown] = useState(false);
  const [optimisticRole, setOptimisticRole] = useState<UserRole>(user.role);
  const roleRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLDivElement>(null);
  const isCurrentUser = user.auth_id === currentAuthId;

  // Sync optimistic role when prop changes (after refetch)
  useEffect(() => {
    setOptimisticRole(user.role);
  }, [user.role]);

  // Close role dropdown on outside click
  useEffect(() => {
    if (!showRoleDropdown) return;
    const handler = (e: MouseEvent) => {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setShowRoleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showRoleDropdown]);

  // Close vertical dropdown on outside click
  useEffect(() => {
    if (!showVerticalDropdown) return;
    const handler = (e: MouseEvent) => {
      if (verticalRef.current && !verticalRef.current.contains(e.target as Node)) {
        setShowVerticalDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showVerticalDropdown]);

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === user.role) return;
    setOptimisticRole(newRole);
    setShowRoleDropdown(false);
    setUpdatingRole(true);

    const { error } = await supabase
      .from('cms_users')
      .update({ role: newRole })
      .eq('id', user.id);

    if (error) {
      setOptimisticRole(user.role);
      onShowToast('Erro ao atualizar role', 'error');
    } else {
      onShowToast(`${user.full_name || user.email} agora é ${roleLabels[newRole]}`, 'success');
      onUpdate();
    }
    setUpdatingRole(false);
  };

  const handleToggleVertical = async (vertical: Vertical) => {
    const isAssigned = user.verticals.some((v) => v.id === vertical.id);

    if (isAssigned) {
      const { error } = await supabase
        .from('user_verticals')
        .delete()
        .eq('user_id', user.id)
        .eq('vertical_id', vertical.id);

      if (error) {
        onShowToast('Erro ao remover vertical', 'error');
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_verticals')
        .insert({ user_id: user.id, vertical_id: vertical.id });

      if (error) {
        onShowToast('Erro ao adicionar vertical', 'error');
        return;
      }
    }

    onUpdate();
  };

  const initial = (user.full_name || user.email).charAt(0).toUpperCase();
  const assignedIds = new Set(user.verticals.map((v) => v.id));

  const getVerticalLabel = () => {
    if (user.verticals.length === 0) return 'Todas as verticais';
    if (user.verticals.length === 1) return user.verticals[0].name;
    return `${user.verticals.length} verticais`;
  };

  return (
    <div className={styles.row}>
      <div className={styles.userInfo}>
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
        ) : (
          <span className={styles.avatarFallback}>{initial}</span>
        )}
        <div className={styles.nameGroup}>
          <span className={styles.name}>
            {user.full_name || user.email.split('@')[0]}
            {isCurrentUser && <span className={styles.youBadge}>você</span>}
          </span>
          <span className={styles.email}>{user.email}</span>
        </div>
      </div>

      <div className={styles.controls}>
        {/* Role dropdown */}
        <div className={styles.dropdownWrapper} ref={roleRef}>
          <button
            className={`${styles.dropdownTrigger} ${isCurrentUser ? styles.dropdownTriggerDisabled : ''}`}
            onClick={() => !isCurrentUser && setShowRoleDropdown(!showRoleDropdown)}
            disabled={isCurrentUser || updatingRole}
          >
            <span className={styles.dropdownTriggerLabel}>{roleLabels[optimisticRole]}</span>
            {!isCurrentUser && (
              <span className={`${styles.dropdownChevron} ${showRoleDropdown ? styles.dropdownChevronOpen : ''}`}>
                <Icon name="chevron-down" size={12} />
              </span>
            )}
          </button>

          {showRoleDropdown && (
            <>
              <div className={styles.backdrop} onClick={() => setShowRoleDropdown(false)} />
              <div className={styles.dropdownMenu}>
                {roles.map((r) => (
                  <button
                    key={r}
                    className={`${styles.dropdownItem} ${r === optimisticRole ? styles.dropdownItemActive : ''}`}
                    onClick={() => handleRoleChange(r)}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Vertical dropdown */}
        <div className={styles.dropdownWrapper} ref={verticalRef}>
          <button
            className={styles.dropdownTrigger}
            onClick={() => setShowVerticalDropdown(!showVerticalDropdown)}
          >
            <span className={styles.dropdownTriggerLabel}>{getVerticalLabel()}</span>
            <span className={`${styles.dropdownChevron} ${showVerticalDropdown ? styles.dropdownChevronOpen : ''}`}>
              <Icon name="chevron-down" size={12} />
            </span>
          </button>

          {showVerticalDropdown && (
            <>
              <div className={styles.backdrop} onClick={() => setShowVerticalDropdown(false)} />
              <div className={styles.dropdownMenu}>
                {allVerticals.map((v) => {
                  const checked = assignedIds.has(v.id);
                  return (
                    <button
                      key={v.id}
                      className={`${styles.dropdownItem} ${checked ? styles.dropdownItemActive : ''}`}
                      onClick={() => handleToggleVertical(v)}
                    >
                      <span className={`${styles.checkbox} ${checked ? styles.checkboxChecked : ''}`}>
                        {checked && <span className={styles.checkIcon}>✓</span>}
                      </span>
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {!isCurrentUser ? (
          <button
            className={styles.deleteBtn}
            onClick={() => onDeleteUser(user)}
            title="Remover usuário"
          >
            <Icon name="close-x" size={14} />
          </button>
        ) : (
          <div className={styles.deletePlaceholder} />
        )}
      </div>
    </div>
  );
}
