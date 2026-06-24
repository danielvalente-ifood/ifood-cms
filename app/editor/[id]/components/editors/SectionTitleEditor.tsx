'use client';

import type { Block, SectionTitleBlock } from '@/types/database';
import styles from '../../editor.module.css';

interface Props {
  block: Block & { type: 'section-title' };
  onUpdate: (block: Block) => void;
}

export function SectionTitleEditor({ block, onUpdate }: Props) {
  const d = block.data as SectionTitleBlock['data'];

  function update(patch: Partial<typeof d>) {
    onUpdate({ ...block, data: { ...d, ...patch } });
  }

  return (
    <div className={styles.editorFields}>
      {/* Badge */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Badge</label>
        <input
          className={styles.fieldInput}
          value={d.badge ?? ''}
          onChange={(e) => update({ badge: e.target.value || undefined })}
          placeholder="ex: A Plataforma Conectada"
        />
      </div>

      {/* Título */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Título</label>
        <textarea
          className={styles.fieldTextarea}
          value={(d.title ?? []).join('\n')}
          onChange={(e) =>
            update({ title: e.target.value.split('\n').filter(Boolean) })
          }
          rows={2}
          placeholder="Uma linha por quebra de texto"
        />
      </div>

      {/* Descrição */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Descrição</label>
        <textarea
          className={styles.fieldTextarea}
          value={d.description ?? ''}
          onChange={(e) => update({ description: e.target.value || undefined })}
          rows={2}
          placeholder="Subtítulo opcional"
        />
      </div>

      {/* Alinhamento */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Alinhamento</label>
        <select
          className={styles.fieldSelect}
          value={d.align ?? 'center'}
          onChange={(e) => update({ align: e.target.value as 'center' | 'left' })}
        >
          <option value="center">Centralizado</option>
          <option value="left">Esquerda</option>
        </select>
      </div>

      {/* Tema */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Tema</label>
        <select
          className={styles.fieldSelect}
          value={d.theme ?? 'light'}
          onChange={(e) => update({ theme: e.target.value as 'light' | 'dark' })}
        >
          <option value="light">Fundo claro</option>
          <option value="dark">Fundo escuro (#141414)</option>
        </select>
      </div>
    </div>
  );
}
