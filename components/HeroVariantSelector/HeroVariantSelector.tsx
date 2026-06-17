'use client';

import styles from './HeroVariantSelector.module.css';

interface HeroVariantSelectorProps {
  currentVariant: 'image-left' | 'image-right' | 'image-overlay' | 'full-width';
  onVariantChange: (variant: 'image-left' | 'image-right' | 'image-overlay' | 'full-width') => void;
}

const variants = [
  {
    id: 'image-left',
    label: 'Imagem Esquerda',
    description: 'Texto à esquerda, imagem decorativa à direita',
    preview: '📄 ├─ 📷',
  },
  {
    id: 'image-right',
    label: 'Imagem Direita',
    description: 'Imagem decorativa à esquerda, texto à direita',
    preview: '📷 ─┤ 📄',
  },
  {
    id: 'image-overlay',
    label: 'Overlay Centralizado',
    description: 'Texto centralizado sobre a imagem com gradiente',
    preview: '📷 [📄]',
  },
  {
    id: 'full-width',
    label: 'Tela Cheia',
    description: 'Imagem em tela cheia com texto centralizado',
    preview: '█ [📄] █',
  },
] as const;

export function HeroVariantSelector({ currentVariant, onVariantChange }: HeroVariantSelectorProps) {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Variação de Hero</h3>
      
      <div className={styles.grid}>
        {variants.map((variant) => (
          <button
            key={variant.id}
            className={`${styles.card} ${currentVariant === variant.id ? styles.active : ''}`}
            onClick={() => onVariantChange(variant.id as any)}
          >
            <div className={styles.preview}>{variant.preview}</div>
            <div className={styles.label}>{variant.label}</div>
            <div className={styles.description}>{variant.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
