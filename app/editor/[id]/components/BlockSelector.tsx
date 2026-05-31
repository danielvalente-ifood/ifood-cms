'use client';

import { useEffect, useRef, useState } from 'react';
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

/** Tempo total da animação de fechamento sequenciada (200ms delay + 550ms duração). */
const CLOSE_ANIMATION_MS = 750;

export function BlockSelector({ onSelect, onClose, existingTypes = [] }: BlockSelectorProps) {
  const [pendingType, setPendingType] = useState<BlockType | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const pendingOption = pendingType ? blockOptions.find((o) => o.type === pendingType) : null;
  const variants = pendingType ? BLOCK_VARIANTS[pendingType] : undefined;

  const isDisabled = (type: BlockType): boolean =>
    SINGLETON_TYPES.includes(type) && existingTypes.includes(type);

  const handleCategoryClick = (type: BlockType) => {
    if (isClosing) return;
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
      setIsClosing(false);
    }
  };

  const handleBack = () => {
    if (isClosing) return;
    // Camada 1 começa a voltar imediatamente; camada 2 sai depois (delay no CSS).
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setPendingType(null);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, CLOSE_ANIMATION_MS);
  };

  return (
    <>
      <div className={styles.selectorOverlay} onClick={onClose} aria-hidden="true" />

      <aside
        className={`${styles.selectorDrawer}${pendingType && !isClosing ? ` ${styles.selectorDrawerPushed}` : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Adicionar bloco"
      >
        <h2>Adicionar bloco</h2>
        <div className={styles.selectorGrid}>
          {blockOptions.map((opt) => (
            <button key={opt.type} className={styles.selectorItem} onClick={() => onSelect(opt.type)}>
              <span className={styles.selectorItemIcon}>
                <Icon name={typeIcons[opt.type] || 'grid-dashboard-bento'} size={20} />
              </span>
              <div className={styles.selectorItemInfo}>
                <h3>{opt.label}</h3>
                <p>{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {pendingType && pendingOption && variants && (
        <aside
          className={`${styles.variantDrawer}${isClosing ? ` ${styles.variantDrawerClosing}` : ''}`}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-label={`Escolher layout de ${pendingOption.label}`}
        >
          <button
            type="button"
            className={styles.variantBack}
            onClick={handleBack}
            aria-label="Voltar"
          >
            ← Voltar
          </button>
          <h2>Layout de {pendingOption.label}</h2>
          <p className={styles.variantSubtitle}>Escolha uma das opções</p>
          <div className={styles.variantList}>
            {variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className={styles.variantCard}
                onClick={() => handleVariantSelect(v.id)}
              >
                <div className={styles.variantPreview} aria-hidden="true">
                  <span className={styles.variantPreviewLabel}>{v.label}</span>
                </div>
                <span className={styles.variantCardDesc}>{v.description}</span>
              </button>
            ))}
          </div>
        </aside>
      )}
    </>
  );
}
