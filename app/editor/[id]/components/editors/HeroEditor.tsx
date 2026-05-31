'use client';

import type { HeroBlock } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';
import { HeroVariantSelector } from '@/components/HeroVariantSelector/HeroVariantSelector';

interface Props {
  block: HeroBlock;
  onUpdate: (block: HeroBlock) => void;
}

export function HeroEditor({ block, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...block, data: { ...block.data, [field]: value } });
  };

  return (
    <>
      <HeroVariantSelector
        currentVariant={block.data.variant || 'image-left'}
        onVariantChange={(variant) => update('variant', variant)}
      />

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Título (uma linha por campo)</label>
        {block.data.title.map((line, i) => (
          <input
            key={i}
            className={styles.fieldInput}
            value={line}
            onChange={(e) => {
              const newTitle = [...block.data.title];
              newTitle[i] = e.target.value;
              update('title', newTitle);
            }}
            placeholder={`Linha ${i + 1}`}
            style={{ marginBottom: i < block.data.title.length - 1 ? 6 : 0 }}
          />
        ))}
        <button className={styles.addItemBtn} onClick={() => update('title', [...block.data.title, ''])} style={{ marginTop: 6 }}>
          + Linha
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Descrição</label>
        <textarea className={styles.fieldTextarea} value={block.data.description} onChange={(e) => update('description', e.target.value)} />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Texto do CTA</label>
          <input className={styles.fieldInput} value={block.data.cta_text} onChange={(e) => update('cta_text', e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Link do CTA</label>
          <input className={styles.fieldInput} value={block.data.cta_link} onChange={(e) => update('cta_link', e.target.value)} />
        </div>
      </div>

      <ImageUpload
        label="Imagem de fundo"
        value={block.data.background_image}
        onChange={(url) => update('background_image', url)}
      />
    </>
  );
}
