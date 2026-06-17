'use client';

import type { BigNumbersBlock } from '@/types/database';
import styles from '../../editor.module.css';

interface Props {
  block: BigNumbersBlock;
  onUpdate: (block: BigNumbersBlock) => void;
  /** índice do stat selecionado (via clique no iframe) */
  cardIndex?: number | null;
}

const ICONS = [
  'barchart-default', 'heart', 'store-building-default', 'map-pin-location-default',
  'users-group-default', 'rocket-ship', 'plugin-addon-puzzle', 'grid-dashboard-bento',
  'star', 'sparkle-ai', 'smartphone', 'sun', 'lab-flask-round', 'bot',
  'text-quotes-paragraph', 'check', 'file-default', 'search',
];

export function BigNumbersEditor({ block, onUpdate, cardIndex }: Props) {
  const stats = Array.isArray(block.data?.stats) ? block.data.stats : [];

  const update = (field: string, value: unknown) => {
    onUpdate({ ...block, data: { ...(block.data ?? {}), [field]: value } });
  };

  const updateStat = (index: number, patch: Record<string, unknown>) => {
    const next = [...stats];
    next[index] = { ...next[index], ...patch };
    update('stats', next);
  };

  const addStat = () => {
    if (stats.length >= 5) return;
    update('stats', [...stats, { value: '', icon: 'barchart-default', label: '', iconColor: '#141414', iconBgOpacity: 10 }]);
  };

  const removeStat = (index: number) => {
    if (stats.length <= 3) return;
    update('stats', stats.filter((_, i) => i !== index));
  };

  const selectedStat = cardIndex != null ? stats[cardIndex] : null;

  return (
    <>
      <p className={styles.selectorEmpty}>
        Edite badge e título com duplo-clique no preview. Clique em uma estatística no preview para editar ícone e cores.
      </p>

      {/* Painel de edição do stat selecionado */}
      {selectedStat && cardIndex != null && (
        <div className={styles.arraySection}>
          <div className={styles.arraySectionHeader}>
            <span className={styles.arraySectionTitle}>Estatística {cardIndex + 1} — Ícone e Cor</span>
          </div>

          {/* Picker de ícone */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Ícone</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {ICONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => updateStat(cardIndex, { icon: name })}
                  style={{
                    width: 36, height: 36,
                    borderRadius: 8,
                    border: selectedStat.icon === name ? '2px solid #141414' : '1px solid #e8e8ed',
                    background: selectedStat.icon === name ? '#f5f5f5' : '#fff',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <img src={`/icons/${name}.svg`} width={18} height={18} alt={name} style={{ opacity: 0.7 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Cor do ícone */}
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Cor do ícone</label>
              <input
                type="color"
                value={selectedStat.iconColor || '#141414'}
                onChange={(e) => updateStat(cardIndex, { iconColor: e.target.value })}
                style={{ width: '100%', height: 36, border: '1px solid #e8e8ed', borderRadius: 8, cursor: 'pointer', padding: 2 }}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Opacidade do fundo ({selectedStat.iconBgOpacity ?? 10}%)</label>
              <input
                type="range"
                min={0} max={100}
                value={selectedStat.iconBgOpacity ?? 10}
                onChange={(e) => updateStat(cardIndex, { iconBgOpacity: Number(e.target.value) })}
                style={{ width: '100%', marginTop: 8 }}
              />
            </div>
          </div>

          {/* Preview do chip */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Preview</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {(() => {
                const hex = selectedStat.iconColor || '#141414';
                const op = (selectedStat.iconBgOpacity ?? 10) / 100;
                const r = parseInt(hex.slice(1,3), 16);
                const g = parseInt(hex.slice(3,5), 16);
                const b = parseInt(hex.slice(5,7), 16);
                return (
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `rgba(${r},${g},${b},${op})`,
                    color: hex,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <img src={`/icons/${selectedStat.icon || 'barchart-default'}.svg`} width={18} height={18} alt="" style={{ filter: 'none' }} />
                  </div>
                );
              })()}
              <span style={{ fontSize: 12, color: '#666' }}>Chip de ícone com as configurações atuais</span>
            </div>
          </div>
        </div>
      )}

      {!selectedStat && (
        <p className={styles.selectorEmpty} style={{ color: '#999' }}>
          Clique em uma estatística no preview para editar seu ícone e cores.
        </p>
      )}

      {/* Lista de stats */}
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
          <div key={i} className={styles.arrayItem} style={{ outline: cardIndex === i ? '2px solid #141414' : undefined, borderRadius: 8 }}>
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
                value={stat.value ?? ''}
                placeholder="ex: 120 milhões"
                onChange={(e) => updateStat(i, { value: e.target.value })}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Label</label>
              <input
                className={styles.fieldInput}
                value={stat.label ?? ''}
                placeholder="ex: Pedidos no app"
                onChange={(e) => updateStat(i, { label: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
