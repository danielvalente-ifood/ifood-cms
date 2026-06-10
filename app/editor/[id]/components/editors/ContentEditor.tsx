'use client';

import { useEffect } from 'react';
import type { ContentBlock, ContentCTA } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';
import { contentDefaults } from '../../block-config';

interface Props {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
}

const MAX_CTAS = 2;

function emptyCta(): ContentCTA {
  return { text: 'Botão', link: '#', style: 'primary' };
}

/* ---- segmented genérico ---- */
function Segmented<T extends string>({
  value, options, onChange, label,
}: {
  value: T | undefined;
  options: { v: T; label: string }[];
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className={styles.fieldGroup}>
      {label && <label className={styles.fieldLabel}>{label}</label>}
      <div className={styles.segmented} role="group">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            className={`${styles.segmentBtn} ${value === o.v ? styles.segmentBtnActive : ''}`}
            onClick={() => onChange(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- editor de linhas de título ---- */
function LinesEditor({
  value, onChange, label = 'Título (uma linha por campo)',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}) {
  const lines = value ?? [];
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: i < lines.length - 1 ? 6 : 0 }}>
          <input
            className={styles.fieldInput}
            value={line}
            placeholder={`Linha ${i + 1}`}
            onChange={(e) => {
              const next = [...lines];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          {lines.length > 1 && (
            <button
              type="button"
              className={styles.addItemBtn}
              onClick={() => onChange(lines.filter((_, j) => j !== i))}
              title="Remover linha"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button type="button" className={styles.addItemBtn} onClick={() => onChange([...lines, ''])} style={{ marginTop: 6 }}>
        + Linha
      </button>
    </div>
  );
}

/* ---- editor de CTAs (0 a 2) ---- */
function CtasEditor({
  value, onChange,
}: {
  value: ContentCTA[] | undefined;
  onChange: (v: ContentCTA[]) => void;
}) {
  const ctas = value ?? [];
  const setCta = (i: number, patch: Partial<ContentCTA>) =>
    onChange(ctas.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <div className={styles.arraySection}>
      <div className={styles.arraySectionHeader}>
        <span className={styles.arraySectionTitle}>Botões ({ctas.length}/{MAX_CTAS})</span>
        {ctas.length < MAX_CTAS && (
          <button type="button" className={styles.addItemBtn} onClick={() => onChange([...ctas, emptyCta()])}>
            + Botão
          </button>
        )}
      </div>
      {ctas.map((c, i) => (
        <div key={i} className={styles.arrayItem}>
          <button type="button" className={styles.removeItemBtn} onClick={() => onChange(ctas.filter((_, j) => j !== i))}>×</button>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Texto</label>
              <input className={styles.fieldInput} value={c.text} onChange={(e) => setCta(i, { text: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Link</label>
              <input className={styles.fieldInput} value={c.link} onChange={(e) => setCta(i, { link: e.target.value })} />
            </div>
          </div>
          <Segmented
            label="Estilo"
            value={c.style ?? 'primary'}
            onChange={(v) => setCta(i, { style: v })}
            options={[{ v: 'primary', label: 'Primário' }, { v: 'secondary', label: 'Secundário' }]}
          />
        </div>
      ))}
      {ctas.length === 0 && <p className={styles.selectorEmpty}>Sem botões (CTA opcional).</p>}
    </div>
  );
}

/* ---- ContentEditor ---- */
export function ContentEditor({ block, onUpdate }: Props) {
  // Bloco sem data (criado por caminho legado) → semeia o conteúdo default
  // completo para que o usuário só precise editar as informações.
  const existing = block.data as ContentBlock['data'] | undefined;
  const d = existing ?? contentDefaults('image-left');

  // Persiste o default no bloco para que o preview e o salvamento fiquem
  // consistentes — usuário só precisa editar as informações.
  useEffect(() => {
    if (!existing) onUpdate({ ...block, data: d });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  const update = (patch: Partial<typeof d>) => onUpdate({ ...block, data: { ...d, ...patch } });

  return (
    <>
      <Segmented
        label="Posição da imagem"
        value={d.assetPosition ?? 'left'}
        onChange={(v) => update({ assetPosition: v })}
        options={[{ v: 'left', label: 'Esquerda' }, { v: 'right', label: 'Direita' }]}
      />

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Badge</label>
        <input
          className={styles.fieldInput}
          value={d.badge ?? ''}
          placeholder="Ex: Comer fora"
          onChange={(e) => update({ badge: e.target.value })}
        />
      </div>

      <LinesEditor value={d.title} onChange={(v) => update({ title: v })} />

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Descrição (opcional)</label>
        <textarea
          className={styles.fieldTextarea}
          value={d.description ?? ''}
          placeholder="Texto de apoio abaixo do título"
          onChange={(e) => update({ description: e.target.value })}
        />
      </div>

      <ImageUpload label="Imagem" value={d.image || ''} onChange={(url) => update({ image: url })} />

      <CtasEditor value={d.ctas} onChange={(v) => update({ ctas: v })} />
    </>
  );
}
