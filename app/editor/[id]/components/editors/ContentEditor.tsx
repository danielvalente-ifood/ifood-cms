'use client';

import { useEffect } from 'react';
import type { ContentBlock, ContentCTA, ContentBullet } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';
import { contentDefaults, CONTENT_BULLETS_DEFAULT } from '../../block-config';

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
          <div className={styles.fieldRow}>
            <Segmented
              label="Estilo"
              value={c.style ?? 'primary'}
              onChange={(v) => setCta(i, { style: v })}
              options={[{ v: 'primary', label: 'Primário' }, { v: 'secondary', label: 'Secundário' }, { v: 'empty', label: 'Vazio' }]}
            />
            <Segmented
              label="Abrir em"
              value={c.target ?? '_self'}
              onChange={(v) => setCta(i, { target: v as '_blank' | '_self' })}
              options={[{ v: '_self', label: 'Mesma aba' }, { v: '_blank', label: 'Nova aba' }]}
            />
          </div>
        </div>
      ))}
      {ctas.length === 0 && <p className={styles.selectorEmpty}>Sem botões (CTA opcional).</p>}
    </div>
  );
}

/* ---- editor de bullets ---- */
function BulletsEditor({
  value, onChange,
}: {
  value: ContentBullet[] | undefined;
  onChange: (v: ContentBullet[]) => void;
}) {
  const bullets = value ?? [];
  const set = (i: number, patch: Partial<ContentBullet>) =>
    onChange(bullets.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  return (
    <div className={styles.arraySection}>
      <div className={styles.arraySectionHeader}>
        <span className={styles.arraySectionTitle}>Bullets ({bullets.length})</span>
        <button type="button" className={styles.addItemBtn}
          onClick={() => onChange([...bullets, { label: '', text: 'Novo item' }])}>
          + Item
        </button>
      </div>
      {bullets.map((b, i) => (
        <div key={i} className={styles.arrayItem}>
          <button type="button" className={styles.removeItemBtn} onClick={() => onChange(bullets.filter((_, j) => j !== i))}>×</button>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Prefixo em negrito</label>
            <input className={styles.fieldInput} value={b.label ?? ''} placeholder="Ex: CRM nativo:" onChange={(e) => set(i, { label: e.target.value })} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Texto</label>
            <textarea className={styles.fieldTextarea} rows={2} value={b.text} onChange={(e) => set(i, { text: e.target.value })} />
          </div>
        </div>
      ))}
      {bullets.length === 0 && <p className={styles.selectorEmpty}>Nenhum bullet adicionado.</p>}
    </div>
  );
}

/* ---- ContentEditor ---- */
export function ContentEditor({ block, onUpdate }: Props) {
  const existing = block.data as ContentBlock['data'] | undefined;
  const d = existing ?? contentDefaults('image-left');
  const isBullets = Array.isArray(d.bullets);

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

      <p className={styles.selectorEmpty}>Edite badge, título e descrição com duplo-clique direto no preview.</p>

      <ImageUpload label="Imagem" value={d.image || ''} onChange={(url) => update({ image: url })} />

      {isBullets ? (
        <BulletsEditor value={d.bullets} onChange={(v) => update({ bullets: v })} />
      ) : (
        <div className={styles.fieldGroup}>
          <button
            type="button"
            className={styles.addItemBtn}
            onClick={() => update({ bullets: CONTENT_BULLETS_DEFAULT.map((b) => ({ ...b })) })}
          >
            + Ativar bullets (5 padrões)
          </button>
        </div>
      )}

      <CtasEditor value={d.ctas} onChange={(v) => update({ ctas: v })} />
    </>
  );
}
