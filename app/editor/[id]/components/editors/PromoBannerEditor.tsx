'use client';

import { useEffect } from 'react';
import type { PromoBlock, PromoCTA } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';
import { promoDefaults } from '../../block-config';

interface Props {
  block: PromoBlock;
  onUpdate: (block: PromoBlock) => void;
}

const MAX_CTAS = 2;

function emptyCta(): PromoCTA {
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

/* ---- seletor de cor (hex) ---- */
function ColorField({
  value, onChange, label = 'Cor do fundo',
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  label?: string;
}) {
  const hex = value || '#272727';
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>{label}</label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#272727'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 36, padding: 0, border: '1px solid var(--border-default)', borderRadius: 6, background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
          aria-label="Selecionar cor"
        />
        <input
          className={styles.fieldInput}
          value={hex}
          placeholder="#272727"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

/* ---- editor de CTAs (0 a 2) ---- */
function CtasEditor({
  value, onChange,
}: {
  value: PromoCTA[] | undefined;
  onChange: (v: PromoCTA[]) => void;
}) {
  const ctas = value ?? [];
  const setCta = (i: number, patch: Partial<PromoCTA>) =>
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
            options={[{ v: 'primary', label: 'Primário' }, { v: 'secondary', label: 'Secundário' }, { v: 'empty', label: 'Vazio' }]}
          />
        </div>
      ))}
      {ctas.length === 0 && <p className={styles.selectorEmpty}>Sem botões (CTA opcional).</p>}
    </div>
  );
}

/* ---- PromoBannerEditor ---- */
export function PromoBannerEditor({ block, onUpdate }: Props) {
  // Bloco sem data (caminho legado) → semeia o conteúdo default completo.
  const existing = block.data as PromoBlock['data'] | undefined;
  const d = existing ?? promoDefaults('centered');

  useEffect(() => {
    if (!existing) onUpdate({ ...block, data: d });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  const update = (patch: Partial<typeof d>) => onUpdate({ ...block, data: { ...d, ...patch } });

  const bgType = d.backgroundType ?? 'color';

  return (
    <>
      <Segmented
        label="Layout"
        value={d.layout ?? 'centered'}
        onChange={(v) => update({ layout: v })}
        options={[{ v: 'centered', label: 'Centralizado' }, { v: 'split', label: 'Com imagem' }]}
      />

      {d.layout === 'split' && (
        <Segmented
          label="Posição da imagem"
          value={d.assetPosition ?? 'right'}
          onChange={(v) => update({ assetPosition: v })}
          options={[{ v: 'left', label: 'Esquerda' }, { v: 'right', label: 'Direita' }]}
        />
      )}

      {/* fundo: cor ou imagem */}
      <Segmented
        label="Fundo"
        value={bgType}
        onChange={(v) => update({ backgroundType: v })}
        options={[{ v: 'color', label: 'Cor' }, { v: 'image', label: 'Imagem' }]}
      />
      {bgType === 'color' ? (
        <ColorField value={d.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
      ) : (
        <ImageUpload label="Imagem de fundo" value={d.backgroundImage || ''} onChange={(url) => update({ backgroundImage: url })} />
      )}

      {/* cor do conteúdo (claro sobre fundo escuro / escuro sobre fundo claro) */}
      <Segmented
        label="Cor do conteúdo"
        value={d.contentColor ?? 'light'}
        onChange={(v) => update({ contentColor: v })}
        options={[{ v: 'light', label: 'Claro' }, { v: 'dark', label: 'Escuro' }]}
      />

      {/* efeito cortina */}
      <Segmented
        label="Efeito cortina (rolagem)"
        value={d.curtain === false ? 'off' : 'on'}
        onChange={(v) => update({ curtain: v === 'on' })}
        options={[{ v: 'on', label: 'Ligado' }, { v: 'off', label: 'Desligado' }]}
      />

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Descrição</span>
          <button
            className={styles.addItemBtn}
            onClick={() => update({ description: d.description ? '' : 'Uma plataforma que organiza atendimento, pedidos, pagamentos e gestão.' })}
          >
            {d.description ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
      </div>

      <p className={styles.selectorEmpty}>Edite título e descrição com duplo-clique direto no preview.</p>

      {d.layout === 'split' && (
        <ImageUpload label="Imagem do card" value={d.image || ''} onChange={(url) => update({ image: url })} />
      )}

      <CtasEditor value={d.ctas} onChange={(v) => update({ ctas: v })} />
    </>
  );
}
