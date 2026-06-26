'use client';

import { useEffect } from 'react';
import type { Block, BigNumbersEcossistemaData, BigNumbersEcossistemaCard } from '@/types/database';
import { ImageUpload } from '../ImageUpload';
import styles from '../../editor.module.css';

interface Props {
  block: Block & { type: 'big-numbers-ecossistema' };
  onUpdate: (block: Block) => void;
}

const DEFAULT_DATA: BigNumbersEcossistemaData = {
  badge: 'Ecossistema',
  title: 'A plataforma que conecta milhares de restaurantes todos os dias',
  cards: [
    { value: '65 milhões', label: 'clientes conectados ao ecossistema iFood' },
    { value: '180 milhões', label: 'de pedidos realizados no mês' },
    { value: '500 mil', label: 'lojas parceiras' },
    { value: '600 mil', label: 'entregadores ativos - maior frota do Brasil' },
  ],
};

export function BigNumbersEcossistemaEditor({ block, onUpdate }: Props) {
  const d: BigNumbersEcossistemaData = (block.data as BigNumbersEcossistemaData) ?? DEFAULT_DATA;

  useEffect(() => {
    if (!block.data) {
      onUpdate({ ...block, data: DEFAULT_DATA });
    }
  }, []);

  function patch(partial: Partial<BigNumbersEcossistemaData>) {
    onUpdate({ ...block, data: { ...d, ...partial } });
  }

  function updateCard(index: number, field: keyof BigNumbersEcossistemaCard, value: string) {
    const cards = d.cards.map((c, i) => i === index ? { ...c, [field]: value } : c);
    patch({ cards });
  }

  function addCard() {
    patch({ cards: [...d.cards, { value: '', label: '' }] });
  }

  function removeCard(index: number) {
    patch({ cards: d.cards.filter((_, i) => i !== index) });
  }

  return (
    <div className={styles.editorFields}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Badge</label>
        <input
          className={styles.fieldInput}
          value={d.badge ?? ''}
          onChange={(e) => patch({ badge: e.target.value })}
          placeholder="Ecossistema"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Título</label>
        <input
          className={styles.fieldInput}
          value={d.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="A plataforma que conecta..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Cards ({d.cards.length})</label>
        {d.cards.map((card, i) => (
          <div key={i} className={styles.repeaterItem}>
            <div className={styles.repeaterHeader}>
              <span className={styles.repeaterIndex}>#{i + 1}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeCard(i)}
                title="Remover"
              >×</button>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabelSm}>Ícone (imagem)</label>
              <ImageUpload
                value={card.icon ?? ''}
                onChange={(url: string) => updateCard(i, 'icon', url)}
                label="Ícone do card"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabelSm}>Número / Valor</label>
              <input
                className={styles.fieldInput}
                value={card.value}
                onChange={(e) => updateCard(i, 'value', e.target.value)}
                placeholder="65 milhões"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabelSm}>Rótulo</label>
              <input
                className={styles.fieldInput}
                value={card.label}
                onChange={(e) => updateCard(i, 'label', e.target.value)}
                placeholder="clientes conectados ao ecossistema iFood"
              />
            </div>
          </div>
        ))}
        <button type="button" className={styles.addItemBtn} onClick={addCard}>
          + Adicionar card
        </button>
      </div>
    </div>
  );
}
