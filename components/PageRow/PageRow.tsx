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

/** Linha compacta de página — usada dentro do accordion da vertical. */
export function PageRow({ page, formatDate, onClick, onStatusChange, actionItems }: PageRowProps) {
  return (
    <div className={styles.row} onClick={onClick}>
      <div className={styles.statusCol} onClick={(e) => e.stopPropagation()}>
        <StatusBadge
          status={page.status as StatusType}
          size="sm"
          onStatusChange={onStatusChange}
          dropdownStatuses={onStatusChange ? PAGE_STATUSES : undefined}
        />
      </div>

      <div className={styles.nameCol}>
        <span className={styles.name}>{page.name}</span>
        {page.is_home && <span className={styles.homeBadge}>Home</span>}
        <span className={styles.slug}>/{page.slug}</span>
      </div>

      <span className={styles.date}>{formatDate(page.updated_at)}</span>

      {actionItems && actionItems.length > 0 && (
        <div className={styles.actionsCol} onClick={(e) => e.stopPropagation()}>
          <ActionMenu items={actionItems} />
        </div>
      )}
    </div>
  );
}

export default PageRow;
