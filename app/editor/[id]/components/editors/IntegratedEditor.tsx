'use client';

import type { IntegratedBlock } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';

interface Props {
  block: IntegratedBlock;
  onUpdate: (block: IntegratedBlock) => void;
}

export function IntegratedEditor({ block, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...block, data: { ...block.data, [field]: value } });
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const features = [...block.data.features];
    features[index] = { ...features[index], [field]: value };
    update('features', features);
  };

  const addFeature = () => {
    update('features', [...block.data.features, { id: Date.now(), title: '', subtitle: '', description: '', icon: '' }]);
  };

  const removeFeature = (index: number) => {
    update('features', block.data.features.filter((_, i) => i !== index));
  };

  return (
    <>
      <p className={styles.selectorEmpty}>Edite badge e título com duplo-clique direto no preview.</p>

      <ImageUpload
        label="Imagem"
        value={block.data.image}
        onChange={(url) => update('image', url)}
      />

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Features ({block.data.features.length})</span>
          <button className={styles.addItemBtn} onClick={addFeature}>+ Feature</button>
        </div>
        {block.data.features.map((f, i) => (
          <div key={f.id} className={styles.arrayItem}>
            <button className={styles.removeItemBtn} onClick={() => removeFeature(i)}>x</button>
            <div className={styles.fieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Título</label>
                <input className={styles.fieldInput} value={f.title} onChange={(e) => updateFeature(i, 'title', e.target.value)} />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Subtítulo</label>
                <input className={styles.fieldInput} value={f.subtitle} onChange={(e) => updateFeature(i, 'subtitle', e.target.value)} />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Descrição</label>
              <textarea className={styles.fieldTextarea} value={f.description} onChange={(e) => updateFeature(i, 'description', e.target.value)} />
            </div>
            <ImageUpload
              label="Ícone"
              value={f.icon}
              onChange={(url) => updateFeature(i, 'icon', url)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
