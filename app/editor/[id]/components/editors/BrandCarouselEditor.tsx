'use client';

import { useEffect } from 'react';
import type { Block } from '@/types/database';
import type { BrandCarouselData, BrandCarouselLogo } from '@/types/database';
import { ImageUpload } from '../ImageUpload';
import styles from '../../editor.module.css';

interface Props {
  block: Block & { type: 'brand-carousel' };
  onUpdate: (block: Block) => void;
}

const DEFAULT_DATA: BrandCarouselData = {
  badge: 'Empresas parceiras',
  title: 'Empresas de todos os portes utilizam e aprovam nossas soluções',
  logos: Array.from({ length: 11 }, () => ({ src: '', alt: '' })),
};

export function BrandCarouselEditor({ block, onUpdate }: Props) {
  const d: BrandCarouselData = (block.data as BrandCarouselData) ?? DEFAULT_DATA;

  useEffect(() => {
    if (!block.data) {
      onUpdate({ ...block, data: DEFAULT_DATA });
    }
  }, []);

  function patch(partial: Partial<BrandCarouselData>) {
    onUpdate({ ...block, data: { ...d, ...partial } });
  }

  function updateLogo(index: number, field: keyof BrandCarouselLogo, value: string) {
    const logos = d.logos.map((l, i) => i === index ? { ...l, [field]: value } : l);
    patch({ logos });
  }

  function addLogo() {
    patch({ logos: [...d.logos, { src: '', alt: '' }] });
  }

  function removeLogo(index: number) {
    patch({ logos: d.logos.filter((_, i) => i !== index) });
  }

  return (
    <div className={styles.editorFields}>
      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Badge</label>
        <input
          className={styles.fieldInput}
          value={d.badge ?? ''}
          onChange={(e) => patch({ badge: e.target.value })}
          placeholder="Empresas parceiras"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Título</label>
        <textarea
          className={styles.fieldTextarea}
          value={d.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Empresas de todos os portes..."
          rows={2}
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Logos ({d.logos.length})</label>
        {d.logos.map((logo, i) => (
          <div key={i} className={styles.repeaterItem}>
            <div className={styles.repeaterHeader}>
              <span className={styles.repeaterIndex}>Logo #{i + 1}</span>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeLogo(i)}
                title="Remover"
              >×</button>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabelSm}>Imagem</label>
              <ImageUpload
                value={logo.src}
                onChange={(url) => updateLogo(i, 'src', url)}
                folder="logos"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabelSm}>Alt text</label>
              <input
                className={styles.fieldInput}
                value={logo.alt ?? ''}
                onChange={(e) => updateLogo(i, 'alt', e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
          </div>
        ))}
        <button type="button" className={styles.addItemBtn} onClick={addLogo}>
          + Adicionar logo
        </button>
      </div>
    </div>
  );
}
