'use client';

import { Icon } from '@/components/Icon/Icon';
import { formatFileSize } from '@/lib/media';
import type { MediaFolder } from '@/lib/media';
import styles from './FolderCard.module.css';

interface FolderCardProps {
  folder: MediaFolder;
  onClick: () => void;
}

const MAX_AVATARS = 3;

export function FolderCard({ folder, onClick }: FolderCardProps) {
  const { name, color, count, sizeBytes, members } = folder;
  const accent = color ?? 'var(--text-secondary)';
  const shown = members.slice(0, MAX_AVATARS);
  const extra = members.length - shown.length;

  return (
    <article
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Pasta ${name}, ${count} arquivos`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Topo: ícone da pasta */}
      <div className={styles.top}>
        <span
          className={styles.folderIcon}
          style={{ background: color ? `${color}1A` : 'var(--bg-tertiary)', color: accent }}
        >
          <Icon name="folder" size={22} />
        </span>
      </div>

      {/* Meio: título + contagem */}
      <div className={styles.body}>
        <h3 className={styles.title}>{name}</h3>
        <p className={styles.count}>{count} {count === 1 ? 'arquivo' : 'arquivos'}</p>
      </div>

      {/* Rodapé: tamanho + avatares */}
      <div className={styles.footer}>
        <span className={styles.size}>{formatFileSize(sizeBytes)}</span>
        {members.length > 0 && (
          <div className={styles.avatars} aria-label={`${members.length} com acesso`}>
            {shown.map((m) => (
              m.avatar ? (
                <img
                  key={m.id}
                  src={m.avatar}
                  alt={m.name}
                  title={m.name}
                  className={styles.avatar}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span key={m.id} className={styles.avatarFallback} title={m.name}>
                  {m.name.charAt(0).toUpperCase()}
                </span>
              )
            ))}
            {extra > 0 && <span className={styles.avatarMore}>+{extra}</span>}
          </div>
        )}
      </div>
    </article>
  );
}

export default FolderCard;
