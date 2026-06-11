'use client';

import type { FAQBlock } from '@/types/database';
import styles from '../../editor.module.css';

interface Props {
  block: FAQBlock;
  onUpdate: (block: FAQBlock) => void;
}

export function FAQEditor({ block, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...block, data: { ...block.data, [field]: value } });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const items = [...block.data.items];
    items[index] = { ...items[index], [field]: value };
    update('items', items);
  };

  const addItem = () => {
    update('items', [...block.data.items, { id: Date.now(), question: '', answer: '' }]);
  };

  const removeItem = (index: number) => {
    update('items', block.data.items.filter((_, i) => i !== index));
  };

  return (
    <>
      <p className={styles.selectorEmpty}>Edite badge, título e descrição com duplo-clique direto no preview.</p>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Botão "Não encontrei minha dúvida"</span>
          <button
            className={styles.addItemBtn}
            onClick={() => update('cta', block.data.cta ? null : { text: 'Não encontrei minha dúvida', link: '#' })}
          >
            {block.data.cta ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {block.data.cta && (
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Texto</label>
              <input
                className={styles.fieldInput}
                value={block.data.cta.text}
                onChange={(e) => update('cta', { text: e.target.value, link: block.data.cta?.link ?? '#' })}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Link</label>
              <input
                className={styles.fieldInput}
                value={block.data.cta.link}
                onChange={(e) => update('cta', { text: block.data.cta?.text ?? 'Não encontrei minha dúvida', link: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Perguntas ({block.data.items.length})</span>
          <button className={styles.addItemBtn} onClick={addItem}>+ Pergunta</button>
        </div>
        {block.data.items.map((item, i) => (
          <div key={item.id} className={styles.arrayItem}>
            <button className={styles.removeItemBtn} onClick={() => removeItem(i)}>x</button>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Pergunta</label>
              <input className={styles.fieldInput} value={item.question} onChange={(e) => updateItem(i, 'question', e.target.value)} />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Resposta</label>
              <textarea className={styles.fieldTextarea} value={item.answer} onChange={(e) => updateItem(i, 'answer', e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
