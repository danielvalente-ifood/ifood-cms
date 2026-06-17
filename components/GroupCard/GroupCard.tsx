'use client';

import { Icon } from '@/components/Icon/Icon';
import type { PageGroup } from '@/lib/groupPagesByVertical';
import styles from './GroupCard.module.css';

interface GroupCardProps {
  group: PageGroup;
  onClick: () => void;
}

/** Tile de thumbnail (preview de uma página) ou placeholder. */
function Thumb({ src, label }: { src: string | null; label: string }) {
  if (src) {
    return <img className={styles.thumb} src={src} alt={label} title={label} />;
  }
  return (
    <div className={styles.thumbPlaceholder} title={label}>
      <Icon name="file-default" size={16} />
      <span className={styles.thumbName}>{label}</span>
    </div>
  );
}

/**
 * Card agrupador — exibe uma vertical como "projeto" (igual ao Figma), com
 * previews das páginas, o nome da vertical e a contagem. Usado na home quando
 * a vertical tem mais de uma página.
 */
export function GroupCard({ group, onClick }: GroupCardProps) {
  const name = group.vertical?.name || 'Ecossistema';
  const count = group.pages.length;

  const MAX_VISIBLE = 4;
  const overflow = count > MAX_VISIBLE ? count - (MAX_VISIBLE - 1) : 0;
  const thumbs = overflow > 0 ? group.pages.slice(0, MAX_VISIBLE - 1) : group.pages.slice(0, MAX_VISIBLE);

  return (
    <article className={styles.card} onClick={onClick}>
      <div className={styles.thumbs} data-count={Math.min(count, MAX_VISIBLE)}>
        {thumbs.map((p) => (
          <Thumb key={p.id} src={p.thumbnail_url} label={p.name} />
        ))}
        {overflow > 0 && (
          <div className={styles.overflow}>
            <span>+{overflow}</span>
          </div>
        )}
      </div>

      <div className={styles.cardBottom}>
        <span className={styles.cardLabel}>
          <svg width="14" height="14" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M1 7.40022C1 5.16001 1 4.03991 1.43597 3.18426C1.81947 2.43161 2.43139 1.81969 3.18404 1.43619C4.03969 1.00022 5.15979 1.00022 7.4 1.00022H7.71556C8.18517 1.00022 8.41997 1.00022 8.6331 1.06495C8.82179 1.12225 8.99732 1.21619 9.14966 1.3414C9.32174 1.48284 9.45199 1.6782 9.71248 2.06894L10.2875 2.9315C10.548 3.32224 10.6783 3.51761 10.8503 3.65904C11.0027 3.78425 11.1782 3.87819 11.3669 3.93549C11.58 4.00022 11.8148 4.00022 12.2844 4.00022H14.6C16.8402 4.00022 17.9603 4.00022 18.816 4.43619C19.5686 4.81969 20.1805 5.43161 20.564 6.18426C21 7.03991 21 8.16001 21 10.4002V12.6002C21 14.8404 21 15.9605 20.564 16.8162C20.1805 17.5688 19.5686 18.1808 18.816 18.5642C17.9603 19.0002 16.8402 19.0002 14.6 19.0002H7.4C5.15979 19.0002 4.03969 19.0002 3.18404 18.5642C2.43139 18.1808 1.81947 17.5688 1.43597 16.8162C1 15.9605 1 14.8404 1 12.6002V7.40022Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Vertical
        </span>
        <h3 className={styles.cardTitle}>{name}</h3>
        <span className={styles.cardCount}>
          {count} página{count !== 1 ? 's' : ''}
        </span>
      </div>
    </article>
  );
}

export default GroupCard;
