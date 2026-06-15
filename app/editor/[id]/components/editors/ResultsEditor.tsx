'use client';

import type { ResultsBlock } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';

interface Props {
  block: ResultsBlock;
  onUpdate: (block: ResultsBlock) => void;
}

export function ResultsEditor({ block, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...block, data: { ...block.data, [field]: value } });
  };

  const testimonialsList = Array.isArray(block.data?.testimonials) ? block.data.testimonials : [];

  const updateTestimonial = (index: number, field: string, value: any) => {
    const testimonials = [...testimonialsList];
    testimonials[index] = { ...testimonials[index], [field]: value };
    update('testimonials', testimonials);
  };

  const addTestimonial = () => {
    update('testimonials', [...testimonialsList, {
      id: Date.now(),
      name: '',
      company: '',
      image: '',
      main_quote: '',
      full_quote: '',
      rating: 5,
    }]);
  };

  const removeTestimonial = (index: number) => {
    update('testimonials', testimonialsList.filter((_, i) => i !== index));
  };

  return (
    <>
      <p className={styles.selectorEmpty}>Edite badge e título com duplo-clique direto no preview.</p>

      {/* Variante */}
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Variante</label>
        <div className={styles.segmented} role="group">
          {([['default', 'Galeria'], ['featured', 'Destaque']] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={`${styles.segmentBtn} ${(block.data?.variant ?? 'default') === v ? styles.segmentBtnActive : ''}`}
              onClick={() => update('variant', v)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Depoimentos ({testimonialsList.length})</span>
          <button className={styles.addItemBtn} onClick={addTestimonial}>+ Depoimento</button>
        </div>
        {testimonialsList.map((t, i) => (
          <div key={t.id} className={styles.arrayItem}>
            <button className={styles.removeItemBtn} onClick={() => removeTestimonial(i)}>x</button>
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Nome</label>
                <input className={styles.fieldInput} value={t.name ?? ''} onChange={(e) => updateTestimonial(i, 'name', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Empresa</label>
                <input className={styles.fieldInput} value={t.company ?? ''} onChange={(e) => updateTestimonial(i, 'company', e.target.value)} />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Citação principal</label>
              <input className={styles.fieldInput} value={t.main_quote ?? ''} onChange={(e) => updateTestimonial(i, 'main_quote', e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Citação completa</label>
              <textarea className={styles.fieldTextarea} value={t.full_quote ?? ''} onChange={(e) => updateTestimonial(i, 'full_quote', e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Rating (1-5)</label>
              <input className={styles.fieldInput} type="number" min="1" max="5" value={t.rating ?? 5} onChange={(e) => updateTestimonial(i, 'rating', parseInt(e.target.value) || 5)} />
            </div>
            <ImageUpload
              label="Foto"
              value={t.image ?? ''}
              onChange={(url) => updateTestimonial(i, 'image', url)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
