'use client';

import { useState, useEffect } from 'react';
import type { Block } from '@/types/database';
import styles from '../editor.module.css';
import { HeroEditor } from './editors/HeroEditor';
import { VisionEditor } from './editors/VisionEditor';
import { GrowthEditor } from './editors/GrowthEditor';
import { IntegratedEditor } from './editors/IntegratedEditor';
import { ResultsEditor } from './editors/ResultsEditor';
import { FAQEditor } from './editors/FAQEditor';
import { NavbarEditor } from './editors/NavbarEditor';
import { FooterEditor } from './editors/FooterEditor';

interface BlockEditorProps {
  block: Block;
  index: number;
  total: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate: (block: Block) => void;
  onRemove: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onDuplicate: () => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
}

const typeLabels: Record<string, string> = {
  navbar: 'Navbar',
  hero: 'Hero',
  vision: 'Social Proof',
  growth: 'Growth',
  integrated: 'Features',
  results: 'Depoimentos',
  faq: 'FAQ',
  footer: 'Footer',
};

const typeIcons: Record<string, string> = {
  navbar: 'N',
  hero: 'H',
  vision: 'V',
  growth: 'G',
  integrated: 'I',
  results: 'R',
  faq: 'F',
  footer: 'Ft',
};

export function BlockEditor({ block, index, total, isSelected, onSelect, onUpdate, onRemove, onMove, onDuplicate, isDragging, isDragOver, onDragStart, onDragEnd, onDragOver, onDrop }: BlockEditorProps) {
  const [collapsed, setCollapsed] = useState(true);

  // Auto-expand when selected from iframe
  useEffect(() => {
    if (isSelected) setCollapsed(false);
  }, [isSelected]);

  const renderEditor = () => {
    switch (block.type) {
      case 'hero': return <HeroEditor block={block} onUpdate={onUpdate} />;
      case 'vision': return <VisionEditor block={block} onUpdate={onUpdate} />;
      case 'growth': return <GrowthEditor block={block} onUpdate={onUpdate} />;
      case 'integrated': return <IntegratedEditor block={block} onUpdate={onUpdate} />;
      case 'results': return <ResultsEditor block={block} onUpdate={onUpdate} />;
      case 'faq': return <FAQEditor block={block} onUpdate={onUpdate} />;
      case 'navbar': return <NavbarEditor block={block} onUpdate={onUpdate} />;
      case 'footer': return <FooterEditor block={block} onUpdate={onUpdate} />;
      default: return <p>Editor não disponível para este tipo de bloco</p>;
    }
  };

  return (
    <div
      className={`${styles.blockCard} ${isSelected ? styles.blockCardSelected : ''} ${isDragging ? styles.blockCardDragging : ''} ${isDragOver ? styles.blockCardDragOver : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className={styles.blockHeader} onClick={() => { setCollapsed(!collapsed); onSelect?.(); }}>
        <div className={styles.blockType}>
          <div
            className={styles.dragHandle}
            draggable
            onDragStart={(e) => {
              e.stopPropagation();
              onDragStart?.();
            }}
            onDragEnd={(e) => {
              e.stopPropagation();
              onDragEnd?.();
            }}
            title="Arrastar para reordenar"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
            </svg>
          </div>
          <div className={styles.blockTypeIcon}>{typeIcons[block.type] || '?'}</div>
          {typeLabels[block.type] || block.type}
        </div>
        <div className={styles.blockActions} onClick={(e) => e.stopPropagation()}>
          {/* Move up */}
          <button className={styles.blockActionBtn} onClick={() => onMove('up')} disabled={index === 0} title="Mover acima">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15" /></svg>
          </button>
          {/* Move down */}
          <button className={styles.blockActionBtn} onClick={() => onMove('down')} disabled={index === total - 1} title="Mover abaixo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {/* Duplicate */}
          <button className={styles.blockActionBtn} onClick={onDuplicate} title="Duplicar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          {/* Remove */}
          <button className={`${styles.blockActionBtn} ${styles.blockActionBtnDanger}`} onClick={onRemove} title="Remover">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className={styles.blockBody}>
          {renderEditor()}
        </div>
      )}
    </div>
  );
}
