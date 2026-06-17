'use client';

import type { Block, SectionConfig } from '@/types/database';
import styles from '../editor.module.css';

interface Props {
  block: Block;
  onUpdate: (block: Block) => void;
}

const HEADER_TYPES = ['Padrão', 'Centralizado', 'Compacto', 'Sem header'];

/**
 * Painel de configuração estrutural rápida de uma seção (estilo Relume).
 * Persiste em block.config. Render parcial: alguns eixos (assetPosition)
 * já afetam o preview; outros ficam salvos para uso futuro.
 */
export function SectionConfigPanel({ block, onUpdate }: Props) {
  const cfg: SectionConfig = block.config ?? {};

  const set = (patch: Partial<SectionConfig>) =>
    onUpdate({ ...block, config: { ...cfg, ...patch } });

  const Segmented = ({
    value, options, onChange, label,
  }: {
    value: string | undefined;
    options: { v: string; label: string }[];
    onChange: (v: string) => void;
    label: string;
  }) => (
    <div className={styles.cfgField}>
      <label className={styles.fieldLabel}>{label}</label>
      <div className={styles.segmented} role="group" aria-label={label}>
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

  return (
    <div className={styles.cfgPanel}>
      <span className={styles.cfgTitle}>Configuração da seção</span>

      <div className={styles.cfgField}>
        <label className={styles.fieldLabel}>Nome da seção</label>
        <input
          className={styles.fieldInput}
          value={cfg.name ?? ''}
          placeholder="Ex: Hero principal"
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>

      <div className={styles.cfgField}>
        <label className={styles.fieldLabel}>Descrição / prompt</label>
        <textarea
          className={styles.fieldTextarea}
          value={cfg.prompt ?? ''}
          placeholder="Descreva o objetivo desta seção…"
          rows={2}
          onChange={(e) => set({ prompt: e.target.value })}
        />
      </div>

      <div className={styles.cfgField}>
        <label className={styles.fieldLabel}>Layout / header</label>
        <select
          className={styles.fieldSelect}
          value={cfg.headerType ?? HEADER_TYPES[0]}
          onChange={(e) => set({ headerType: e.target.value })}
        >
          {HEADER_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>

      <Segmented
        label="Estilo visual"
        value={cfg.style ?? 'normal'}
        onChange={(v) => set({ style: v as SectionConfig['style'] })}
        options={[{ v: 'normal', label: 'Normal' }, { v: 'card', label: 'Card' }]}
      />

      <Segmented
        label="Tipo de asset"
        value={cfg.assetType ?? 'image'}
        onChange={(v) => set({ assetType: v as SectionConfig['assetType'] })}
        options={[{ v: 'image', label: 'Imagem' }, { v: 'video', label: 'Vídeo' }]}
      />

      <Segmented
        label="Posição do asset"
        value={cfg.assetPosition ?? 'left'}
        onChange={(v) => set({ assetPosition: v as SectionConfig['assetPosition'] })}
        options={[{ v: 'left', label: 'Esquerda' }, { v: 'right', label: 'Direita' }]}
      />

      <Segmented
        label="Tipo de conteúdo"
        value={cfg.contentType ?? 'button'}
        onChange={(v) => set({ contentType: v as SectionConfig['contentType'] })}
        options={[
          { v: 'button', label: 'Botão' },
          { v: 'form', label: 'Formulário' },
          { v: 'none', label: 'Sem CTA' },
        ]}
      />
    </div>
  );
}
