'use client';

import type { BeneficiosBlock, BeneficioCard, BeneficioCTA } from '@/types/database';
import styles from '../../editor.module.css';
import { Icon } from '@/components/Icon/Icon';
import { ImageUpload } from '../ImageUpload';

interface Props {
  block: BeneficiosBlock;
  onUpdate: (block: BeneficiosBlock) => void;
  /** índice do card em edição (null = modo seção). Controlado pelo editor. */
  cardIndex?: number | null;
  /** troca entre modo seção (null) e edição de um card específico */
  onCardIndexChange?: (index: number | null) => void;
}

const MIN_CARDS = 2;
const MAX_CARDS = 5;
const MAX_CTAS = 2;

/** Biblioteca fixa de ícones (mesmo conjunto SVG do /public/icons). */
const ICON_LIBRARY = [
  'grid-dashboard-bento',
  'barchart-default',
  'plugin-addon-puzzle',
  'rocket-ship',
  'sparkle-ai',
  'star',
  'check',
  'bot',
  'lab-flask-round',
  'settings-gear',
  'monitor',
  'smartphone',
  'tablet',
  'eye-on',
  'search',
  'file-default',
  'folder',
  'photo-image-default',
  'text-quotes-paragraph',
  'copy-default',
];

function emptyCta(): BeneficioCTA {
  return { text: 'Botão', link: '#', style: 'primary' };
}
function emptyCard(): BeneficioCard {
  return { icon: 'grid-dashboard-bento', title: 'Novo benefício', description: 'Descrição do benefício.' };
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

/* ---- picker de ícone (biblioteca fixa) ---- */
function IconPicker({
  value, onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Ícone</label>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
          gap: 6,
        }}
      >
        {ICON_LIBRARY.map((name) => {
          const selected = value === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onChange(name)}
              title={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                borderRadius: 8,
                cursor: 'pointer',
                background: selected ? 'var(--brand-subtle)' : 'var(--bg-primary)',
                border: `1px solid ${selected ? 'var(--brand)' : 'var(--border-default)'}`,
                color: selected ? 'var(--brand)' : 'var(--text-primary)',
              }}
            >
              <Icon name={name} size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---- editor de CTAs (máx. 2) ---- */
function CtasEditor({
  value, onChange,
}: {
  value: BeneficioCTA[] | undefined;
  onChange: (v: BeneficioCTA[]) => void;
}) {
  const ctas = value ?? [];
  const setCta = (i: number, patch: Partial<BeneficioCTA>) =>
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
              <input className={styles.fieldInput} value={c.text ?? ''} onChange={(e) => setCta(i, { text: e.target.value })} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Link</label>
              <input className={styles.fieldInput} value={c.link ?? ''} onChange={(e) => setCta(i, { link: e.target.value })} />
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

/* ---- BeneficiosEditor ---- */
export function BeneficiosEditor({ block, onUpdate, cardIndex = null, onCardIndexChange }: Props) {
  const d = block.data;
  const cards = d.cards ?? [];

  const update = (patch: Partial<typeof d>) => onUpdate({ ...block, data: { ...d, ...patch } });
  const setCard = (i: number, patch: Partial<BeneficioCard>) =>
    update({ cards: cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const addCard = () => {
    if (cards.length >= MAX_CARDS) return;
    update({ cards: [...cards, emptyCard()] });
  };
  const removeCard = (i: number) => {
    if (cards.length <= MIN_CARDS) return;
    update({ cards: cards.filter((_, j) => j !== i) });
  };

  const activeIndex = cardIndex !== null && cardIndex >= 0 && cardIndex < cards.length ? cardIndex : null;

  /* ====================== MODO CARD ====================== */
  if (activeIndex !== null) {
    const card = cards[activeIndex];
    return (
      <>
        <div className={styles.arraySectionHeader} style={{ marginBottom: 4 }}>
          <button
            type="button"
            className={styles.addItemBtn}
            onClick={() => onCardIndexChange?.(null)}
          >
            ← Voltar
          </button>
          <span className={styles.arraySectionTitle}>Card {activeIndex + 1} de {cards.length}</span>
        </div>

        {/* navegação entre cards */}
        {cards.length > 1 && (
          <div className={styles.segmented} role="group" aria-label="Navegar cards">
            {cards.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.segmentBtn} ${i === activeIndex ? styles.segmentBtnActive : ''}`}
                onClick={() => onCardIndexChange?.(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <Segmented
          label="Tipo de ícone"
          value={card.image ? 'image' : 'icon'}
          onChange={(v) => {
            if (v === 'icon') setCard(activeIndex, { image: undefined });
            else setCard(activeIndex, { image: '' });
          }}
          options={[{ v: 'icon', label: 'Ícone' }, { v: 'image', label: 'Imagem' }]}
        />

        {card.image !== undefined ? (
          <ImageUpload
            label="Imagem do card (50×50)"
            value={card.image}
            onChange={(url) => setCard(activeIndex, { image: url })}
          />
        ) : (
          <>
            <IconPicker value={card.icon} onChange={(icon) => setCard(activeIndex, { icon })} />

            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Cor do ícone / caixa</label>
                <input
                  type="color"
                  value={card.iconColor || '#141414'}
                  onChange={(e) => setCard(activeIndex, { iconColor: e.target.value })}
                  style={{ width: '100%', height: 36, border: '1px solid #e8e8ed', borderRadius: 8, cursor: 'pointer', padding: 2 }}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Opacidade da caixa ({card.iconBgOpacity ?? 5}%)</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={card.iconBgOpacity ?? 5}
                  onChange={(e) => setCard(activeIndex, { iconBgOpacity: Number(e.target.value) })}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </div>
            </div>

            {(() => {
              const hex = card.iconColor || '#141414';
              const op = (card.iconBgOpacity ?? 5) / 100;
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return (
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Preview</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 16,
                      background: `rgba(${r},${g},${b},${op})`,
                      color: hex,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon name={card.icon || 'grid-dashboard-bento'} size={24} />
                    </div>
                    <span style={{ fontSize: 12, color: '#666' }}>Chip com as configurações atuais</span>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        <p className={styles.selectorEmpty}>Edite título e descrição do card com duplo-clique direto no preview.</p>

        <CtasEditor value={card.ctas} onChange={(v) => setCard(activeIndex, { ctas: v })} />

        {cards.length > MIN_CARDS && (
          <button
            type="button"
            className={styles.addItemBtn}
            style={{ marginTop: 8, color: 'var(--color-error-text)', borderColor: 'var(--color-error-bg)' }}
            onClick={() => { removeCard(activeIndex); onCardIndexChange?.(null); }}
          >
            Remover este card
          </button>
        )}
      </>
    );
  }

  /* ====================== MODO SEÇÃO ====================== */
  return (
    <>
      <p className={styles.selectorEmpty}>Edite badge, título e descrição com duplo-clique direto no preview.</p>

      <Segmented
        label="Variante"
        value={d.variant ?? 'default'}
        onChange={(v) => update({ variant: v })}
        options={[{ v: 'default', label: 'Padrão' }, { v: 'compact', label: 'Compacto' }]}
      />

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Quantidade de cards</span>
          <div className={styles.segmented} role="group" aria-label="Quantidade de cards">
            <button
              type="button"
              className={styles.segmentBtn}
              onClick={() => removeCard(cards.length - 1)}
              disabled={cards.length <= MIN_CARDS}
              title={cards.length <= MIN_CARDS ? `Mínimo de ${MIN_CARDS}` : 'Remover último'}
            >
              −
            </button>
            <span className={styles.segmentBtn} style={{ pointerEvents: 'none', minWidth: 28 }}>{cards.length}</span>
            <button
              type="button"
              className={styles.segmentBtn}
              onClick={addCard}
              disabled={cards.length >= MAX_CARDS}
              title={cards.length >= MAX_CARDS ? `Máximo de ${MAX_CARDS}` : 'Adicionar card'}
            >
              +
            </button>
          </div>
        </div>

        {/* Lista de cards — clicar abre a edição daquele card */}
        {cards.map((card, i) => (
          <button
            key={i}
            type="button"
            className={styles.arrayItem}
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, textAlign: 'left', cursor: 'pointer', paddingRight: 12 }}
            onClick={() => onCardIndexChange?.(i)}
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'var(--bg-secondary)', flexShrink: 0 }}>
              <Icon name={card.icon || 'grid-dashboard-bento'} size={18} />
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {card.title || `Card ${i + 1}`}
            </span>
            <Icon name="chevron-right" size={16} />
          </button>
        ))}

        <p className={styles.selectorEmpty}>Clique num card (aqui ou no preview) para editar.</p>
      </div>
    </>
  );
}
