'use client';

import { useEffect } from 'react';
import type { StackedBlock, StackedCard, StackedCTA } from '@/types/database';
import styles from '../../editor.module.css';
import { Icon } from '@/components/Icon/Icon';
import { ImageUpload } from '../ImageUpload';
import { stackedDefaults } from '../../block-config';

interface Props {
  block: StackedBlock;
  onUpdate: (block: StackedBlock) => void;
  /** índice do card em edição (null = modo seção). Controlado pelo editor. */
  cardIndex?: number | null;
  /** troca entre modo seção (null) e edição de um card específico */
  onCardIndexChange?: (index: number | null) => void;
}

const MIN_CARDS = 3;
const MAX_CARDS = 8;

function emptyCard(): StackedCard {
  return {
    label: 'Novo card',
    title: 'Título do card',
    description: 'Descrição do card.',
    image: '',
    cta: { text: 'Ativar agora', link: '#' },
  };
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

/* ---- StackedEditor ---- */
export function StackedEditor({ block, onUpdate, cardIndex = null, onCardIndexChange }: Props) {
  // Bloco legado / recém-criado pode chegar sem data — semeia os defaults
  // pra evitar runtime error ao acessar d.cards.
  const existing = block.data as StackedBlock['data'] | undefined;
  const d = existing ?? stackedDefaults('media');

  useEffect(() => {
    if (!existing) onUpdate({ ...block, data: d });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);

  const cards = d.cards ?? [];

  const update = (patch: Partial<typeof d>) => onUpdate({ ...block, data: { ...d, ...patch } });
  const setCard = (i: number, patch: Partial<StackedCard>) =>
    update({ cards: cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const setCardCta = (i: number, patch: Partial<StackedCTA>) => {
    const current = cards[i]?.cta ?? { text: '', link: '#' };
    setCard(i, { cta: { ...current, ...patch } });
  };

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
    const hasCta = !!card.cta;
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

        <p className={styles.selectorEmpty}>Edite rótulo, título e descrição do card com duplo-clique direto no preview.</p>

        <ImageUpload label="Imagem" value={card.image || ''} onChange={(url) => setCard(activeIndex, { image: url })} />

        {/* CTA opcional (1 botão) */}
        <div className={styles.arraySection}>
          <div className={styles.arraySectionHeader}>
            <span className={styles.arraySectionTitle}>Botão</span>
            <button
              type="button"
              className={styles.addItemBtn}
              onClick={() => setCard(activeIndex, { cta: hasCta ? undefined : { text: 'Ativar agora', link: '#' } })}
            >
              {hasCta ? 'Remover' : '+ Botão'}
            </button>
          </div>
          {hasCta && (
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Texto</label>
                <input className={styles.fieldInput} value={card.cta!.text} onChange={(e) => setCardCta(activeIndex, { text: e.target.value })} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Link</label>
                <input className={styles.fieldInput} value={card.cta!.link} onChange={(e) => setCardCta(activeIndex, { link: e.target.value })} />
              </div>
            </div>
          )}
        </div>

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
      <p className={styles.selectorEmpty}>Edite badge e título com duplo-clique direto no preview.</p>

      <Segmented
        label="Posição da imagem (card aberto)"
        value={d.assetPosition ?? 'left'}
        onChange={(v) => update({ assetPosition: v })}
        options={[{ v: 'left', label: 'Esquerda' }, { v: 'right', label: 'Direita' }]}
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'var(--bg-secondary)', flexShrink: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {i + 1}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--weight-medium)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {card.label || `Card ${i + 1}`}
            </span>
            <Icon name="chevron-right" size={16} />
          </button>
        ))}

        <p className={styles.selectorEmpty}>Clique num card para editar. Mínimo {MIN_CARDS}, máximo {MAX_CARDS}.</p>
      </div>
    </>
  );
}
