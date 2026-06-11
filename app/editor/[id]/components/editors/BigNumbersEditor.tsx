'use client';

import type { BigNumbersBlock } from '@/types/database';
import styles from '../../editor.module.css';

interface Props {
  block: BigNumbersBlock;
  onUpdate: (block: BigNumbersBlock) => void;
}

export function BigNumbersEditor({ block, onUpdate }: Props) {
  const stats = block.data?.stats ?? [];

  const update = (field: string, value: unknown) => {
    onUpdate({ ...block, data: { ...(block.data ?? {}), [field]: value } });
  };

  const updateStat = (index: number, field: string, value: string) => {
    const stats = [...(block.data?.stats ?? [])];
    stats[index] = { ...stats[index], [field]: value };
    update('stats', stats);
  };

  const addStat = () => {
    if (stats.length >= 5) return;
    update('stats', [...stats, { value: '', icon: 'barchart-default', label: '' }]);
  };

  const removeStat = (index: number) => {
    if (stats.length <= 3) return;
    update('stats', stats.filter((_, i) => i !== index));
  };

  return (
    <>
      <p className={styles.selectorEmpty}>
        Edite badge e título com duplo-clique direto no preview. Use o painel abaixo para gerenciar as estatísticas.
      </p>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>
            Estatísticas ({stats.length}/5)
          </span>
          <button
            className={styles.addItemBtn}
            onClick={addStat}
            disabled={stats.length >= 5}
          >
            + Estatística
          </button>
        </div>

        {stats.map((stat, i) => (
          <div key={i} className={styles.arrayItem}>
            <button
              className={styles.removeItemBtn}
              onClick={() => removeStat(i)}
              disabled={stats.length <= 3}
              title={stats.length <= 3 ? 'Mínimo de 3 estatísticas' : 'Remover'}
            >
              ×
            </button>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Valor</label>
              <input
                className={styles.fieldInput}
                value={stat.value}
                placeholder="ex: 120 milhões"
                onChange={(e) => updateStat(i, 'value', e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Ícone</label>
              <input
                className={styles.fieldInput}
                value={stat.icon}
                placeholder="ex: heart"
                onChange={(e) => updateStat(i, 'icon', e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Label</label>
              <input
                className={styles.fieldInput}
                value={stat.label}
                placeholder="ex: Pedidos no app"
                onChange={(e) => updateStat(i, 'label', e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
