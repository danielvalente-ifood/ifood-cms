'use client';

import type { GrowthBlock } from '@/types/database';
import styles from '../../editor.module.css';

interface Props {
  block: GrowthBlock;
  onUpdate: (block: GrowthBlock) => void;
}

export function GrowthEditor({ block, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...block, data: { ...block.data, [field]: value } });
  };

  const updateTab = (tabIndex: number, field: string, value: any) => {
    const tabs = [...block.data.tabs];
    tabs[tabIndex] = { ...tabs[tabIndex], [field]: value };
    update('tabs', tabs);
  };

  const updateCard = (tabIndex: number, cardIndex: number, field: string, value: string) => {
    const tabs = [...block.data.tabs];
    const cards = [...tabs[tabIndex].cards];
    cards[cardIndex] = { ...cards[cardIndex], [field]: value };
    tabs[tabIndex] = { ...tabs[tabIndex], cards };
    update('tabs', tabs);
  };

  const addTab = () => {
    update('tabs', [...block.data.tabs, { id: `tab-${Date.now()}`, label: 'Nova tab', cards: [] }]);
  };

  const removeTab = (index: number) => {
    update('tabs', block.data.tabs.filter((_, i) => i !== index));
  };

  const addCard = (tabIndex: number) => {
    const tabs = [...block.data.tabs];
    tabs[tabIndex] = {
      ...tabs[tabIndex],
      cards: [...tabs[tabIndex].cards, { id: Date.now(), title: '', description: '' }],
    };
    update('tabs', tabs);
  };

  const removeCard = (tabIndex: number, cardIndex: number) => {
    const tabs = [...block.data.tabs];
    tabs[tabIndex] = {
      ...tabs[tabIndex],
      cards: tabs[tabIndex].cards.filter((_, i) => i !== cardIndex),
    };
    update('tabs', tabs);
  };

  return (
    <>
      <p className={styles.selectorEmpty}>Edite badge e título com duplo-clique direto no preview.</p>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Tabs ({block.data.tabs.length})</span>
          <button className={styles.addItemBtn} onClick={addTab}>+ Tab</button>
        </div>
        {block.data.tabs.map((tab, ti) => (
          <div key={tab.id} className={styles.arrayItem}>
            <button className={styles.removeItemBtn} onClick={() => removeTab(ti)}>x</button>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Nome da tab</label>
              <input className={styles.fieldInput} value={tab.label ?? ''} onChange={(e) => updateTab(ti, 'label', e.target.value)} />
            </div>

            <div className={styles.arraySection}>
              <div className={styles.arraySectionHeader}>
                <span className={styles.arraySectionTitle}>Cards ({tab.cards.length})</span>
                <button className={styles.addItemBtn} onClick={() => addCard(ti)}>+ Card</button>
              </div>
              {tab.cards.map((card, ci) => (
                <div key={card.id} className={styles.arrayItem}>
                  <button className={styles.removeItemBtn} onClick={() => removeCard(ti, ci)}>x</button>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Título</label>
                      <input className={styles.fieldInput} value={card.title ?? ''} onChange={(e) => updateCard(ti, ci, 'title', e.target.value)} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Descrição</label>
                      <input className={styles.fieldInput} value={card.description ?? ''} onChange={(e) => updateCard(ti, ci, 'description', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
