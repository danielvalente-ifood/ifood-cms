'use client';

import type { FooterBlock } from '@/types/database';
import styles from '../../editor.module.css';
import { ImageUpload } from '../ImageUpload';

interface Props {
  block: FooterBlock;
  onUpdate: (block: FooterBlock) => void;
}

export function FooterEditor({ block, onUpdate }: Props) {
  const update = (field: string, value: any) => {
    onUpdate({ ...block, data: { ...block.data, [field]: value } });
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const columns = [...block.data.columns];
    columns[index] = { ...columns[index], [field]: value };
    update('columns', columns);
  };

  const updateLink = (colIndex: number, linkIndex: number, field: string, value: string) => {
    const columns = [...block.data.columns];
    const links = [...columns[colIndex].links];
    links[linkIndex] = { ...links[linkIndex], [field]: value };
    columns[colIndex] = { ...columns[colIndex], links };
    update('columns', columns);
  };

  const addColumn = () => {
    update('columns', [...block.data.columns, { title: 'Nova coluna', badge: null, links: [] }]);
  };

  const removeColumn = (index: number) => {
    update('columns', block.data.columns.filter((_, i) => i !== index));
  };

  const addLink = (colIndex: number) => {
    const columns = [...block.data.columns];
    columns[colIndex] = {
      ...columns[colIndex],
      links: [...columns[colIndex].links, { label: '', url: '#' }],
    };
    update('columns', columns);
  };

  const removeLink = (colIndex: number, linkIndex: number) => {
    const columns = [...block.data.columns];
    columns[colIndex] = {
      ...columns[colIndex],
      links: columns[colIndex].links.filter((_, i) => i !== linkIndex),
    };
    update('columns', columns);
  };

  return (
    <>
      <ImageUpload
        label="Logo"
        value={block.data.logo}
        onChange={(url) => update('logo', url)}
      />

      <div className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>Copyright</label>
        <input className={styles.fieldInput} value={block.data.copyright} onChange={(e) => update('copyright', e.target.value)} />
      </div>

      <div className={styles.arraySection}>
        <div className={styles.arraySectionHeader}>
          <span className={styles.arraySectionTitle}>Colunas ({block.data.columns.length})</span>
          <button className={styles.addItemBtn} onClick={addColumn}>+ Coluna</button>
        </div>
        {block.data.columns.map((col, ci) => (
          <div key={ci} className={styles.arrayItem}>
            <button className={styles.removeItemBtn} onClick={() => removeColumn(ci)}>x</button>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Título da coluna</label>
              <input className={styles.fieldInput} value={col.title ?? ''} onChange={(e) => updateColumn(ci, 'title', e.target.value)} />
            </div>

            <div className={styles.arraySection}>
              <div className={styles.arraySectionHeader}>
                <span className={styles.arraySectionTitle}>Links ({col.links.length})</span>
                <button className={styles.addItemBtn} onClick={() => addLink(ci)}>+ Link</button>
              </div>
              {col.links.map((link, li) => (
                <div key={li} className={styles.arrayItem}>
                  <button className={styles.removeItemBtn} onClick={() => removeLink(ci, li)}>x</button>
                  <div className={styles.fieldRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Texto</label>
                      <input className={styles.fieldInput} value={link.label ?? ''} onChange={(e) => updateLink(ci, li, 'label', e.target.value)} />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>URL</label>
                      <input className={styles.fieldInput} value={link.url ?? ''} onChange={(e) => updateLink(ci, li, 'url', e.target.value)} />
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
