'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import type { StatusType } from '@/components/ui/status-badge';
import { ActionMenu } from '@/components/ActionMenu/ActionMenu';
import type { PageWithVertical } from '@/lib/groupPagesByVertical';
import styles from './PageRow.module.css';

const PAGE_STATUSES: StatusType[] = ['draft', 'published'];

interface ActionItem {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}

interface PageRowProps {
  page: PageWithVertical;
  formatDate: (dateStr: string) => string;
  onClick: () => void;
  onStatusChange?: (newStatus: StatusType) => void;
  actionItems?: ActionItem[];
}

function TreeConnector() {
  return (
    <svg className={styles.connector} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2 L4 9 L13 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6.5 L13 9 L10 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Linha compacta de página — usada dentro do accordion da vertical. */
export function PageRow({ page, formatDate, onClick, onStatusChange, actionItems }: PageRowProps) {
  return (
    <div className={styles.row} onClick={onClick}>
      <TreeConnector />

      <div className={styles.nameCol}>
        <span className={styles.name}>{page.name}</span>
        {page.is_home && <span className={styles.homeBadge}>Home</span>}
        <span className={styles.slug}>/{page.slug}</span>
      </div>

      <span className={styles.date}>{formatDate(page.updated_at)}</span>

      <div className={styles.statusCol} onClick={(e) => e.stopPropagation()}>
        <StatusBadge
          status={page.status as StatusType}
          size="sm"
          onStatusChange={onStatusChange}
          dropdownStatuses={onStatusChange ? PAGE_STATUSES : undefined}
        />
      </div>

      {actionItems && actionItems.length > 0 && (
        <div className={styles.actionsCol} onClick={(e) => e.stopPropagation()}>
          <ActionMenu items={actionItems} />
        </div>
      )}
    </div>
  );
}

export default PageRow;
