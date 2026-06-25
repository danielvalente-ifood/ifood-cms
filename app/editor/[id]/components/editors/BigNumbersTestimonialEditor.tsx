'use client';

import { useEffect } from 'react';
import type { Block } from '@/types/database';
import type { BigNumbersTestimonialData, BigNumbersTestimonialStat, BigNumbersTestimonialCard } from '@/types/database';
import styles from '../../editor.module.css';

interface Props {
  block: Block & { type: 'big-numbers-testimonial' };
  onUpdate: (block: Block) => void;
}

const DEFAULT_DATA: BigNumbersTestimonialData = {
  badge: 'Resultados reais',
  title: 'Números que falam por si',
  stats: [
    { value: '+30%', description: 'de economia de tempo\nno fechamento de caixa' },
    { value: 'R$0', description: 'de comissão em pedidos\npelo cardápio próprio' },
    { value: '-40%', description: 'de desistência\nna fila de espera' },
  ],
  testimonials: [
    { rating: 5, quote: 'Nós precisávamos de um sistema...', author: 'Lucas Xavier, sócio', company: 'Frango Loco' },
    { rating: 5, quote: 'O robô de WhatsApp pagou o plano...', author: 'Ana R.', company: 'Hamburgueria Artesanal' },
    { rating: 5, quote: 'A fila digital foi um divisor de águas...', author: 'João P.', company: 'Restaurante A La Carte' },
  ],
};

export function BigNumbersTestimonialEditor({ block, onUpdate }: Props) {
  const d: BigNumbersTestimonialData = (block.data as BigNumbersTestimonialData) ?? DEFAULT_DATA;

  useEffect(() => {
    if (!block.data) {
      onUpdate({ ...block, data: DEFAULT_DATA });
    }
  }, []);

  function patch(partial: Partial<BigNumbersTestimonialData>) {
    onUpdate({ ...block, data: { ...d, ...partial } });
  }

  function updateStat(index: number, field: keyof BigNumbersTestimonialStat, value: string) {
    const stats = d.stats.map((s, i) => i === index ? { ...s, [field]: value } : s);
    patch({ stats });
  }

  function addStat() {
    patch({ stats: [...d.stats, { value: '+0%', description: 'descrição\ndo número' }] });
  }

  function removeStat(index: number) {
    patch({ stats: d.stats.filter((_, i) => i !== index) });
  }

  function updateTestimonial(index: number, field: keyof BigNumbersTestimonialCard, value: string | number) {
    const testimonials = d.testimonials.map((t, i) => i === index ? { ...t, [field]: value } : t);
    patch({ testimonials });
  }

  function addTestimonial() {
    patch({ testimonials: [...d.testimonials, { rating: 5, quote: '', author: '', company: '' }] });
  }

  function removeTestimonial(index: number) {
    patch({ testimonials: d.testimonials.filter((_, i) => i !== index) });
  }

  return (
    <div className={styles.editorFields}>
      {/* Header */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Badge</label>
        <input
          className={styles.fieldInput}
          value={d.badge ?? ''}
          onChange={(e) => patch({ badge: e.target.value })}
          placeholder="Resultados reais"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Título</label>
        <input
          className={styles.fieldInput}
          value={d.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Números que falam por si"
        />
      </div>

      {/* Stats */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Estatísticas</label>
        {d.stats.map((stat, i) => (
          <div key={i} className={styles.repeaterItem}>
            <div className={styles.repeaterRow}>
              <input
                className={styles.fieldInput}
                value={stat.value}
                onChange={(e) => updateStat(i, 'value', e.target.value)}
                placeholder="+30%"
                style={{ flex: '0 0 120px' }}
              />
              <textarea
                className={styles.fieldTextarea}
                value={stat.description}
                onChange={(e) => updateStat(i, 'description', e.target.value)}
                placeholder="descrição (use Enter para nova linha)"
                rows={2}
              />
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeStat(i)}
                title="Remover"
              >×</button>
            </div>
          </div>
        ))}
        <button type="button" className={styles.addItemBtn} onClick={addStat}>
          + Adicionar estatística
        </button>
      </div>

      {/* Testimonials */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Depoimentos</label>
        {d.testimonials.map((t, i) => (
          <div key={i} className={styles.repeaterItem}>
            <div className={styles.repeaterHeader}>
              <span className={styles.repeaterIndex}>#{i + 1}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeTestimonial(i)}
                title="Remover"
              >×</button>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabelSm}>Avaliação (1–5)</label>
              <input
                className={styles.fieldInput}
                type="number"
                min={1}
                max={5}
                value={t.rating}
                onChange={(e) => updateTestimonial(i, 'rating', Number(e.target.value))}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabelSm}>Depoimento</label>
              <textarea
                className={styles.fieldTextarea}
                value={t.quote}
                onChange={(e) => updateTestimonial(i, 'quote', e.target.value)}
                placeholder="O que o cliente disse..."
                rows={3}
              />
            </div>

            <div className={styles.repeaterRow}>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.fieldLabelSm}>Nome</label>
                <input
                  className={styles.fieldInput}
                  value={t.author}
                  onChange={(e) => updateTestimonial(i, 'author', e.target.value)}
                  placeholder="João P."
                />
              </div>
              <div className={styles.fieldGroup} style={{ flex: 1 }}>
                <label className={styles.fieldLabelSm}>Empresa</label>
                <input
                  className={styles.fieldInput}
                  value={t.company}
                  onChange={(e) => updateTestimonial(i, 'company', e.target.value)}
                  placeholder="Restaurante"
                />
              </div>
            </div>
          </div>
        ))}
        <button type="button" className={styles.addItemBtn} onClick={addTestimonial}>
          + Adicionar depoimento
        </button>
      </div>
    </div>
  );
}
