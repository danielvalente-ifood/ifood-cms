'use client';

import { ReactNode } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import type { StatusType } from '@/components/ui/status-badge';
import type { Page, Vertical } from '@/types/database';
import { ActionMenu } from '@/components/ActionMenu/ActionMenu';
import styles from './PageCard.module.css';

export interface PageWithVertical extends Page {
  vertical?: Vertical | null;
  creator?: { id?: string; full_name: string | null; avatar_url: string | null } | null;
  collaborators?: Array<{ id: string; full_name: string | null; avatar_url: string | null }>;
}

interface PageCardProps {
  page: PageWithVertical;
  userName: string;
  userAvatar: string | null;
  formatDate: (dateStr: string) => string;
  onClick: () => void;
  actions?: ReactNode;
  onStatusChange?: (newStatus: StatusType) => void;
  onEditSettings?: () => void;
}

const PAGE_STATUSES: StatusType[] = ['draft', 'published'];

/** Avatar quadrado com canto arredondado, sobrepostos */
function AvatarChip({
  src,
  name,
  size,
  zIndex,
  offset,
}: {
  src: string | null;
  name: string | null;
  size: number;
  zIndex: number;
  offset: number;
}) {
  const radius = Math.round(size * 0.32);
  const border = '2px solid var(--home-card-bg, #fff)';

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        title={name || ''}
        style={{
          width: size, height: size, borderRadius: radius,
          border, objectFit: 'cover', flexShrink: 0,
          marginLeft: offset, zIndex, position: 'relative',
        }}
      />
    );
  }
  return (
    <div
      title={name || ''}
      style={{
        width: size, height: size, borderRadius: radius,
        border, background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size / 2.2, fontWeight: 600, flexShrink: 0,
        marginLeft: offset, zIndex, position: 'relative',
      }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export function PageCard({
  page,
  userName,
  userAvatar,
  formatDate,
  onClick,
  actions,
  onStatusChange,
  onEditSettings,
}: PageCardProps) {
  const SIZE = 24;
  const OVERLAP = -(SIZE / 3);

  // Colaboradores que NÃO são o owner (filtra por id se disponível, senão pelo avatar_url)
  const uniqueCollabs = (page.collaborators || []).filter((c) => {
    if (page.creator?.id) return c.id !== page.creator.id;
    // fallback: compara avatar_url
    return c.avatar_url !== page.creator?.avatar_url;
  });

  // Stack: owner sempre primeiro, depois colaboradores únicos (max 3 no total)
  const stackMax = 3;
  const collabsToShow = uniqueCollabs.slice(0, stackMax - 1); // reserva 1 slot pro owner
  const remaining = uniqueCollabs.length - collabsToShow.length;
  const showStack = collabsToShow.length > 0;

  return (
    <article
      className={`${styles.card} ${actions ? styles.cardWithActions : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardInner}>
        <div
          className={styles.cardTop}
          onClick={onStatusChange ? (e) => e.stopPropagation() : undefined}
        >
          <StatusBadge
            status={page.status as StatusType}
            size="sm"
            onStatusChange={onStatusChange}
            dropdownStatuses={onStatusChange ? PAGE_STATUSES : undefined}
          />
          <span className={styles.cardDate}>{formatDate(page.updated_at)}</span>
          {onEditSettings && (
            <div style={{ marginLeft: 'auto', marginRight: '-8px' }} onClick={(e) => e.stopPropagation()}>
              <ActionMenu
                items={[{ label: 'Configurações', icon: 'settings-gear', onClick: onEditSettings }]}
              />
            </div>
          )}
        </div>

        <div className={styles.cardBottom}>
          <span className={styles.cardVertical}>
            {page.vertical?.name || 'Ecossistema'}
          </span>
          <h3 className={styles.cardTitle}>{page.name}</h3>

          <div className={styles.cardAuthor}>
            {/* Stack de avatares: owner + colaboradores sobrepostos */}
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {/* Owner sempre no topo (z mais alto) */}
              <AvatarChip
                src={userAvatar}
                name={userName}
                size={SIZE}
                zIndex={stackMax + 1}
                offset={0}
              />
              {/* Colaboradores sobrepostos */}
              {showStack && collabsToShow.map((c, i) => (
                <AvatarChip
                  key={c.id}
                  src={c.avatar_url}
                  name={c.full_name}
                  size={SIZE}
                  zIndex={stackMax - i}
                  offset={OVERLAP}
                />
              ))}
              {/* Overflow "+N" */}
              {remaining > 0 && (
                <div
                  title={`+${remaining} colaboradores`}
                  style={{
                    width: SIZE, height: SIZE,
                    borderRadius: Math.round(SIZE * 0.32),
                    border: '2px solid var(--home-card-bg, #fff)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: SIZE / 2.5, fontWeight: 600, flexShrink: 0,
                    marginLeft: OVERLAP, zIndex: 0, position: 'relative',
                  }}
                >
                  +{remaining}
                </div>
              )}
            </div>

            {/* Nome + label Owner */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span className={styles.authorName}>{userName}</span>
              <span className={styles.authorLabel}>Owner</span>
            </div>
          </div>
        </div>
      </div>

      {actions && (
        <div
          className={styles.cardActions}
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </article>
  );
}

export default PageCard;
