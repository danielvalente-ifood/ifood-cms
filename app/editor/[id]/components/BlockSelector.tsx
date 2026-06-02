'use client';

import { useState } from 'react';
import type { BlockType } from '@/types/database';
import { Icon } from '@/components/Icon/Icon';
import styles from '../editor.module.css';

interface BlockSelectorProps {
  onSelect: (type: BlockType, variantId?: string) => void;
  onClose: () => void;
  /** Tipos de bloco já presentes na página — usado pra desabilitar singletons já adicionados. */
  existingTypes?: BlockType[];
}

/** Blocos que só podem existir uma vez por página. */
const SINGLETON_TYPES: BlockType[] = ['navbar', 'hero', 'footer'];

interface BlockVariant {
  id: string;
  label: string;
  description: string;
}

const typeIcons: Record<string, string> = {
  navbar: 'burger-menu-three',
  hero: 'photo-image-default',
  vision: 'barchart-default',
  growth: 'rocket-ship',
  integrated: 'plugin-addon-puzzle',
  results: 'text-quotes-paragraph',
  faq: 'file-02-question-mark',
  footer: 'window-dock-bottom',
};

const blockOptions: { type: BlockType; label: string; description: string }[] = [
  { type: 'hero', label: 'Hero', description: 'Seção principal com título e CTA' },
  { type: 'vision', label: 'Social Proof', description: 'Números e credibilidade' },
  { type: 'growth', label: 'Growth', description: 'Cards com tabs (slider)' },
  { type: 'integrated', label: 'Features', description: 'Lista de funcionalidades' },
  { type: 'results', label: 'Depoimentos', description: 'Testimonials de clientes' },
  { type: 'faq', label: 'FAQ', description: 'Perguntas e respostas' },
  { type: 'navbar', label: 'Navbar', description: 'Menu de navegação' },
  { type: 'footer', label: 'Footer', description: 'Rodapé com links' },
];

/**
 * Variantes por tipo de bloco. Todos os 8 blocos têm 3 layouts cada.
 * TODO: ligar cada variantId a um template real quando o renderer estiver pronto.
 */
const BLOCK_VARIANTS: Record<BlockType, BlockVariant[]> = {
  hero: [
    { id: 'hero-1', label: 'Layout 1', description: 'Texto à esquerda, imagem à direita' },
    { id: 'hero-2', label: 'Layout 2', description: 'Centralizado com background full' },
    { id: 'hero-3', label: 'Layout 3', description: 'Vídeo de fundo + CTA flutuante' },
  ],
  vision: [
    { id: 'vision-1', label: 'Layout 1', description: 'Cards horizontais com badges' },
    { id: 'vision-2', label: 'Layout 2', description: 'Grid 2x2 com ícones' },
    { id: 'vision-3', label: 'Layout 3', description: 'Carrossel com depoimentos' },
  ],
  growth: [
    { id: 'growth-1', label: 'Layout 1', description: 'Tabs horizontais clássico' },
    { id: 'growth-2', label: 'Layout 2', description: 'Steps numerados verticais' },
    { id: 'growth-3', label: 'Layout 3', description: 'Cards expansíveis' },
  ],
  integrated: [
    { id: 'integrated-1', label: 'Layout 1', description: 'Grid de cards com ícones' },
    { id: 'integrated-2', label: 'Layout 2', description: 'Lista vertical com screenshots' },
    { id: 'integrated-3', label: 'Layout 3', description: 'Bento grid assimétrico' },
  ],
  results: [
    { id: 'results-1', label: 'Layout 1', description: 'Carrossel horizontal com avatares' },
    { id: 'results-2', label: 'Layout 2', description: 'Grid de cards com aspas grandes' },
    { id: 'results-3', label: 'Layout 3', description: 'Vídeo principal + thumbnails' },
  ],
  faq: [
    { id: 'faq-1', label: 'Layout 1', description: 'Accordion simples vertical' },
    { id: 'faq-2', label: 'Layout 2', description: 'Duas colunas com busca' },
    { id: 'faq-3', label: 'Layout 3', description: 'Tabs por categoria' },
  ],
  navbar: [
    { id: 'navbar-1', label: 'Layout 1', description: 'Logo + menu central + CTA direita' },
    { id: 'navbar-2', label: 'Layout 2', description: 'Menu fullscreen com hambúrguer' },
    { id: 'navbar-3', label: 'Layout 3', description: 'Sticky com mega-menu' },
  ],
  footer: [
    { id: 'footer-1', label: 'Layout 1', description: 'Quatro colunas tradicional' },
    { id: 'footer-2', label: 'Layout 2', description: 'Minimalista compacto' },
    { id: 'footer-3', label: 'Layout 3', description: 'Extenso com newsletter' },
  ],
};

// Mini-mock de layout por variante (índice 0/1/2 → asset esq/dir/full).
function PreviewSkeleton({ index }: { index: number }) {
  const variant = index % 3; // 0 = asset esquerda, 1 = direita, 2 = full
  const asset = <span className={styles.previewAsset} />;
  const text = (
    <span className={styles.previewText}>
      <span className={styles.previewBar} style={{ width: '70%' }} />
      <span className={styles.previewBar} style={{ width: '90%' }} />
      <span className={styles.previewBar} style={{ width: '50%' }} />
      <span className={styles.previewChip} />
    </span>
  );
  if (variant === 2) {
    return <span className={`${styles.previewMock} ${styles.previewMockFull}`}>{asset}{text}</span>;
  }
  return (
    <span className={styles.previewMock}>
      {variant === 0 ? <>{asset}{text}</> : <>{text}{asset}</>}
    </span>
  );
}

export function BlockSelector({ onSelect, onClose, existingTypes = [] }: BlockSelectorProps) {
  const [pendingType, setPendingType] = useState<BlockType | null>(null);
  const [query, setQuery] = useState('');

  const filteredOptions = blockOptions.filter((o) => {
    const q = query.trim().toLowerCase();
    return !q || o.label.toLowerCase().includes(q) || o.description.toLowerCase().includes(q);
  });

  const pendingOption = pendingType ? blockOptions.find((o) => o.type === pendingType) : null;
  const variants = pendingType ? BLOCK_VARIANTS[pendingType] : undefined;

  const isDisabled = (type: BlockType): boolean =>
    SINGLETON_TYPES.includes(type) && existingTypes.includes(type);

  const handleCategoryClick = (type: BlockType) => {
    if (isDisabled(type)) return;
    const v = BLOCK_VARIANTS[type];
    if (v && v.length > 0) {
      setPendingType(type);
    } else {
      onSelect(type);
    }
  };

  const handleVariantSelect = (variantId: string) => {
    if (pendingType) {
      onSelect(pendingType, variantId);
      setPendingType(null);
    }
  };

  const handleBack = () => {
    setPendingType(null);
    setQuery('');
  };

  const filteredVariants = (variants ?? []).filter((v) => {
    const q = query.trim().toLowerCase();
    return !q || v.label.toLowerCase().includes(q) || v.description.toLowerCase().includes(q);
  });

  return (
    <>
      <div className={styles.addOverlay} onClick={onClose} aria-hidden="true" />

      <aside
        className={styles.addPanel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Adicionar componente"
      >
        {/* Header com back / título / fechar */}
        <div className={styles.addHeader}>
          {pendingType ? (
            <button type="button" className={styles.addIconBtn} onClick={handleBack} aria-label="Voltar">
              <Icon name="chevron-left" size={18} />
            </button>
          ) : (
            <span style={{ width: 28 }} />
          )}
          <span className={styles.addTitle}>
            {pendingOption ? `${pendingOption.label}` : 'Adicionar'}
          </span>
          <button type="button" className={styles.addIconBtn} onClick={onClose} aria-label="Fechar">
            <Icon name="close-x" size={18} />
          </button>
        </div>

        {/* Busca */}
        <div className={styles.addSearch}>
          <Icon name="search" size={14} />
          <input
            type="search"
            placeholder="Buscar…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar"
          />
        </div>

        {/* Corpo: navega dentro do mesmo painel */}
        <div className={styles.addBody}>
          {!pendingType ? (
            <>
              {filteredOptions.map((opt) => {
                const disabled = isDisabled(opt.type);
                return (
                  <button
                    key={opt.type}
                    className={styles.selectorItem}
                    onClick={() => handleCategoryClick(opt.type)}
                    disabled={disabled}
                    title={disabled ? 'Já adicionado nesta página' : undefined}
                  >
                    <span className={styles.selectorItemIcon}>
                      <Icon name={typeIcons[opt.type] || 'grid-dashboard-bento'} size={20} />
                    </span>
                    <div className={styles.selectorItemInfo}>
                      <h3>{opt.label}</h3>
                      <p>{disabled ? 'Já adicionado' : opt.description}</p>
                    </div>
                    <Icon name="chevron-right" size={16} />
                  </button>
                );
              })}
              {filteredOptions.length === 0 && (
                <p className={styles.selectorEmpty}>Nenhum componente encontrado.</p>
              )}
            </>
          ) : (
            <div className={styles.variantList}>
              {filteredVariants.map((v, i) => (
                <button
                  key={v.id}
                  type="button"
                  className={styles.variantCard}
                  onClick={() => handleVariantSelect(v.id)}
                >
                  <span className={styles.variantCardLabel}>{v.label}</span>
                  <div className={styles.variantPreview} aria-hidden="true">
                    <PreviewSkeleton index={i} />
                  </div>
                  <span className={styles.variantCardDesc}>{v.description}</span>
                </button>
              ))}
              {filteredVariants.length === 0 && (
                <p className={styles.selectorEmpty}>Nenhum layout encontrado.</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
