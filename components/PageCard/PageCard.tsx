'use client';

import { ReactNode } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import type { StatusType } from '@/components/ui/status-badge';
import type { Page, Vertical } from '@/types/database';
import { AvatarStack } from '@/components/AvatarStack/AvatarStack';
import { ActionMenu } from '@/components/ActionMenu/ActionMenu';
import styles from './PageCard.module.css';

export interface PageWithVertical extends Page {
  vertical?: Vertical | null;
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
                items={[
                  {
                    label: 'Configurações',
                    icon: 'settings-gear',
                    onClick: onEditSettings,
                  },
                ]}
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
            {userAvatar ? (
              <img src={userAvatar} alt="" className={styles.authorAvatar} />
            ) : (
              <span className={styles.authorAvatarFallback}>
                {userName.charAt(0)}
              </span>
            )}
            <span className={styles.authorName}>{userName}</span>
            {page.collaborators && page.collaborators.length > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <AvatarStack avatars={page.collaborators} max={3} size={24} />
              </div>
            )}
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
