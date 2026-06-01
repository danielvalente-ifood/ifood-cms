'use client';

import { Icon } from '@/components/Icon/Icon';
import type { MediaFolder } from '@/lib/media';
import styles from './FolderCard.module.css';

interface FolderCardProps {
  folder: MediaFolder;
  onClick: () => void;
}

function formatUpdated(iso: string | null): string {
  if (!iso) return 'vazia';
  const d = new Date(iso);
  return `atualizado ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
}

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const { name, color, count, thumbs } = folder;
  const accent = color ?? 'var(--bg-tertiary)';
  // Preenche até 4 slots: thumbs reais + blocos na cor da vertical
  const slots = Array.from({ length: 4 }, (_, i) => thumbs[i] ?? null);
  const hasThumbs = thumbs.length > 0;

  return (
    <article
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Pasta ${name}, ${count} assets`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Capa */}
      <div className={styles.cover} style={{ background: accent }}>
        {hasThumbs ? (
          <div className={styles.collage}>
            {slots.map((url, i) =>
              url ? (
                <img key={i} src={url} alt="" loading="lazy" className={styles.collageImg} />
              ) : (
                <span key={i} className={styles.collageFill} style={{ background: accent }} />
              ),
            )}
          </div>
        ) : null}
        <div className={styles.coverScrim} />
      </div>

      {/* Rodapé */}
      <div className={styles.footer}>
        <span className={styles.iconBadge} style={{ background: color ? `${color}22` : 'var(--bg-tertiary)', color: color ?? 'var(--text-secondary)' }}>
          <Icon name="folder" size={20} />
        </span>
        <div className={styles.info}>
          <h3 className={styles.title}>{name}</h3>
          <p className={styles.meta}>
            {count} {count === 1 ? 'asset' : 'assets'} · {formatUpdated(folder.updated)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default FolderCard;
