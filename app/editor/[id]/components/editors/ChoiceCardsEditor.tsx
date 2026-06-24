'use client';

import type {
  ChoiceCardsBlock,
  ChoiceCardItem,
  ChoiceCardChallenge,
  ChoiceCardNeed,
  ChoiceCardChoicebox,
} from '@/types/database';
import styles from '../../editor.module.css';
import { Icon } from '@/components/Icon/Icon';

interface Props {
  block: ChoiceCardsBlock;
  onUpdate: (block: ChoiceCardsBlock) => void;
  cardIndex?: number | null;
  onCardIndexChange?: (index: number | null) => void;
}

const MIN_CARDS = 2;
const MAX_CARDS = 4;

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
  'store-building-default',
  'heart',
  'users-group-default',
  'map-pin-location-default',
];

function emptyCard(): ChoiceCardItem {
  return {
    icon: 'grid-dashboard-bento',
    iconColor: '#EB0033',
    iconBgOpacity: 10,
    text: 'Novo perfil',
    subtitle: '',
    challenges: [{ text: 'Desafio 1' }, { text: 'Desafio 2' }],
    needs: [{ text: 'Necessidade 1' }],
    choicebox: {
      label: 'Produto ideal',
      title: 'Nome do produto',
      description: 'Descrição do produto ou solução.',
      image: '',
    },
    ctaText: 'Contratar agora',
    ctaLink: '#',
  };
}

function IconPicker({ value, onChange }: { value: string; onChange: (icon: string) => void }) {
  return (
    <div className={styles.fieldGroup}>
      <label className={styles.fieldLabel}>Ícone</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: 6 }}>
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

export function ChoiceCardsEditor({ block, onUpdate, cardIndex = null, onCardIndexChange }: Props) {
  const d = block.data;
  const cards = d.cards ?? [];

  const update = (patch: Partial<typeof d>) => onUpdate({ ...block, data: { ...d, ...patch } });
  const setCard = (i: number, patch: Partial<ChoiceCardItem>) =>
    update({ cards: cards.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  const setChoicebox = (i: number, patch: Partial<ChoiceCardChoicebox>) => {
    const card = cards[i];
    const box: ChoiceCardChoicebox = { title: '', description: '', ...(card.choicebox ?? {}), ...patch };
    setCard(i, { choicebox: box });
  };

  const setChallenges = (i: number, challenges: ChoiceCardChallenge[]) => setCard(i, { challenges });
  const setNeeds = (i: number, needs: ChoiceCardNeed[]) => setCard(i, { needs });

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
          <button type="button" className={styles.addItemBtn} onClick={() => onCardIndexChange?.(null)}>
            ← Voltar
          </button>
          <span className={styles.arraySectionTitle}>Card {activeIndex + 1} de {cards.length}</span>
        </div>

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

        {/* ---- CTA ---- */}
        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Texto do botão</label>
            <input
              type="text"
              className={styles.input}
              value={card.ctaText ?? ''}
              placeholder="Contratar agora"
              onChange={(e) => setCard(activeIndex, { ctaText: e.target.value })}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Link do botão</label>
            <input
              type="text"
              className={styles.input}
              value={card.ctaLink ?? ''}
              placeholder="https://"
              onChange={(e) => setCard(activeIndex, { ctaLink: e.target.value })}
            />
          </div>
        </div>

        <IconPicker value={card.icon} onChange={(icon) => setCard(activeIndex, { icon })} />

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Cor do ícone</label>
            <input
              type="color"
              value={card.iconColor || '#EB0033'}
              onChange={(e) => setCard(activeIndex, { iconColor: e.target.value })}
              style={{ width: '100%', height: 36, border: '1px solid #e8e8ed', borderRadius: 8, cursor: 'pointer', padding: 2 }}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Opacidade ({card.iconBgOpacity ?? 10}%)</label>
            <input
              type="range"
              min={0}
              max={100}
              value={card.iconBgOpacity ?? 10}
              onChange={(e) => setCard(activeIndex, { iconBgOpacity: Number(e.target.value) })}
              style={{ width: '100%', marginTop: 8 }}
            />
          </div>
        </div>

        <p className={styles.selectorEmpty}>Edite título e subtítulo com duplo-clique direto no preview.</p>

        {/* ---- Desafios ---- */}
        <div className={styles.arraySection} style={{ marginTop: 8 }}>
          <div className={styles.arraySectionHeader}>
            <span className={styles.arraySectionTitle}>Principais desafios</span>
          </div>
          {(card.challenges ?? []).map((ch, j) => (
            <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                type="text"
                className={styles.input}
                value={ch.text}
                onChange={(e) => {
                  const updated = [...(card.challenges ?? [])];
                  updated[j] = { text: e.target.value };
                  setChallenges(activeIndex, updated);
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setChallenges(activeIndex, (card.challenges ?? []).filter((_, k) => k !== j))}
                style={{ padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Remover"
              >
                <Icon name="trash-delete-bin" size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.addItemBtn}
            onClick={() => setChallenges(activeIndex, [...(card.challenges ?? []), { text: 'Novo desafio' }])}
          >
            + Adicionar desafio
          </button>
        </div>

        {/* ---- Necessidades ---- */}
        <div className={styles.arraySection} style={{ marginTop: 8 }}>
          <div className={styles.arraySectionHeader}>
            <span className={styles.arraySectionTitle}>O que você precisa agora (tags)</span>
          </div>
          {(card.needs ?? []).map((need, j) => (
            <div key={j} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input
                type="text"
                className={styles.input}
                value={need.text}
                onChange={(e) => {
                  const updated = [...(card.needs ?? [])];
                  updated[j] = { text: e.target.value };
                  setNeeds(activeIndex, updated);
                }}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setNeeds(activeIndex, (card.needs ?? []).filter((_, k) => k !== j))}
                style={{ padding: '0 10px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Remover"
              >
                <Icon name="trash-delete-bin" size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.addItemBtn}
            onClick={() => setNeeds(activeIndex, [...(card.needs ?? []), { text: 'Nova tag' }])}
          >
            + Adicionar tag
          </button>
        </div>

        {/* ---- Choicebox ---- */}
        <div className={styles.arraySection} style={{ marginTop: 8 }}>
          <div className={styles.arraySectionHeader}>
            <span className={styles.arraySectionTitle}>Caixa do produto</span>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Rótulo (ex: &ldquo;Produto ideal&rdquo;)</label>
            <input
              type="text"
              className={styles.input}
              value={card.choicebox?.label ?? ''}
              placeholder="Produto ideal"
              onChange={(e) => setChoicebox(activeIndex, { label: e.target.value })}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Título do produto</label>
            <input
              type="text"
              className={styles.input}
              value={card.choicebox?.title ?? ''}
              placeholder="Nome do produto"
              onChange={(e) => setChoicebox(activeIndex, { title: e.target.value })}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Descrição</label>
            <textarea
              className={styles.textarea}
              value={card.choicebox?.description ?? ''}
              rows={3}
              onChange={(e) => setChoicebox(activeIndex, { description: e.target.value })}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>URL da imagem (56×56)</label>
            <input
              type="text"
              className={styles.input}
              value={card.choicebox?.image ?? ''}
              placeholder="/images/ifood/produto.png"
              onChange={(e) => setChoicebox(activeIndex, { image: e.target.value })}
            />
          </div>
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
      <p className={styles.selectorEmpty}>Edite badge, título e descrição com duplo-clique direto no preview.</p>

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
              {card.text || `Card ${i + 1}`}
            </span>
            <Icon name="chevron-right" size={16} />
          </button>
        ))}

        <p className={styles.selectorEmpty}>Clique num card para editar ícone, desafios, tags e produto.</p>
      </div>
    </>
  );
}
