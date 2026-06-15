'use client';

import type { VisionBlock } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';

interface Props {
  block: VisionBlock;
  onUpdate: (block: VisionBlock) => void;
}

export function VisionEditor({ block, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...block, data: { ...block.data, [field]: value } });
  };

  const updateCard = (index: number, field: string, value: string) => {
    const cards = [...block.data.cards];
    cards[index] = { ...cards[index], [field]: value };
    update('cards', cards);
  };

  const addCard = () => {
    update('cards', [...block.data.cards, { id: Date.now(), title: '', bg_image: '', icon: '', variant: '' }]);
  };

  const removeCard = (index: number) => {
    update('cards', block.data.cards.filter((_, i) => i !== index));
  };

  return (
    <>
      <p className={styles.selectorEmpty}>Edite badge e título com duplo-clique direto no preview.</p>

      <div className={styles.fieldRow}>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Contagem de avaliações</label>
          <input className={styles.fieldInput} value={block.data.ratings_count} onChange={(e) => update('ratings_count', e.target.value)} />
        </div>
        <div className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>Texto de avaliações</label>
          <input className={styles.fieldInput} value={block.data.ratings_text} onChange={(e) => update('ratings_text', e.target.value)} />
        </div>
      </div>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Cards ({block.data.cards.length})</span>
          <button className={styles.addItemBtn} onClick={addCard}>+ Card</button>
        </div>
        {block.data.cards.map((card, i) => (
          <div key={card.id} className={styles.arrayItem}>
            <button className={styles.removeItemBtn} onClick={() => removeCard(i)}>x</button>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Título</label>
              <input className={styles.fieldInput} value={card.title} onChange={(e) => updateCard(i, 'title', e.target.value)} />
            </div>
            <ImageUpload
              label="Ícone"
              value={card.icon}
              onChange={(url) => updateCard(i, 'icon', url)}
            />
            <ImageUpload
              label="Imagem de fundo"
              value={card.bg_image}
              onChange={(url) => updateCard(i, 'bg_image', url)}
            />
          </div>
        ))}
      </div>
    </>
  );
}
