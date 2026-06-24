'use client';

import type { SegmentosBlock, SegmentosTab } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';

interface Props {
  block: SegmentosBlock;
  onUpdate: (block: SegmentosBlock) => void;
}

function emptyTab(): SegmentosTab {
  return { label: 'Novo segmento', icon: '', description: '' };
}

export function SegmentosEditor({ block, onUpdate }: Props) {
  const d = block.data;
  const tabs = d.tabs ?? [];

  const update = (patch: Partial<typeof d>) =>
    onUpdate({ ...block, data: { ...d, ...patch } });

  const setTab = (i: number, patch: Partial<SegmentosTab>) =>
    update({ tabs: tabs.map((t, j) => (j === i ? { ...t, ...patch } : t)) });

  return (
    <>
      <p className={styles.selectorEmpty}>Edite badge e título com duplo-clique direto no preview.</p>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Segmentos ({tabs.length})</span>
          <button
            type="button"
            className={styles.addItemBtn}
            onClick={() => update({ tabs: [...tabs, emptyTab()] })}
          >
            + Segmento
          </button>
        </div>

        {tabs.map((tab, i) => (
          <div key={i} className={styles.arrayItem}>
            <button
              type="button"
              className={styles.removeItemBtn}
              onClick={() => update({ tabs: tabs.filter((_, j) => j !== i) })}
            >
              ×
            </button>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Label</label>
              <input
                className={styles.fieldInput}
                value={tab.label}
                onChange={(e) => setTab(i, { label: e.target.value })}
              />
            </div>

            <ImageUpload
              label="Ícone (30×30)"
              value={tab.icon ?? ''}
              onChange={(url) => setTab(i, { icon: url })}
            />

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Descrição</label>
              <textarea
                className={styles.fieldTextarea}
                rows={3}
                value={tab.description}
                onChange={(e) => setTab(i, { description: e.target.value })}
              />
            </div>
          </div>
        ))}

        {tabs.length === 0 && (
          <p className={styles.selectorEmpty}>Nenhum segmento. Adicione um acima.</p>
        )}
      </div>
    </>
  );
}
