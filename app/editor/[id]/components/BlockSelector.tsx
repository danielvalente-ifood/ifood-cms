'use client';

import { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
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
  beneficios: 'grid-dashboard-bento',
  content: 'text-quotes-paragraph',
  promo: 'photo-image-default',
  stacked: 'grid-dashboard-bento',
  vision: 'barchart-default',
  growth: 'rocket-ship',
  integrated: 'plugin-addon-puzzle',
  results: 'text-quotes-paragraph',
  faq: 'file-02-question-mark',
  'big-numbers': 'barchart-default',
  leadform: 'users-group-default',
  'big-numbers-testimonial': 'barchart-default',
  segmentos: 'grid-dashboard-bento',
  'section-title': 'text-quotes-paragraph',
  'choice-cards': 'grid-dashboard-bento',
  'brand-carousel': 'photo-image-default',
  footer: 'window-dock-bottom',
};

const blockOptions: { type: BlockType; label: string; description: string }[] = [
  { type: 'hero', label: 'Hero', description: 'Seção principal com título e CTA' },
  { type: 'beneficios', label: 'Benefícios', description: 'Cards de benefícios (2 a 5)' },
  { type: 'content', label: 'Conteúdo', description: 'Imagem + texto, 2 colunas' },
  { type: 'promo', label: 'Banner promocional', description: 'Fundo cor/imagem + efeito cortina' },
  { type: 'stacked', label: 'Cards Empilhados', description: 'Cards que empilham no scroll (3 a 8)' },
  { type: 'vision', label: 'Social Proof', description: 'Números e credibilidade' },
  { type: 'growth', label: 'Growth', description: 'Cards com tabs (slider)' },
  { type: 'integrated', label: 'Features', description: 'Lista de funcionalidades' },
  { type: 'results', label: 'Depoimentos', description: 'Testimonials de clientes' },
  { type: 'faq', label: 'FAQ', description: 'Perguntas e respostas' },
  { type: 'big-numbers', label: 'Big Numbers', description: 'Estatísticas em destaque (3 a 5 itens)' },
  { type: 'leadform', label: 'Formulário de Lead', description: 'Captura de leads com layout ilha escura' },
  { type: 'big-numbers-testimonial', label: 'Big Numbers + Depoimentos', description: 'Estatísticas em destaque com depoimentos de clientes' },
  { type: 'segmentos', label: 'Segmentos', description: 'Tabs interativas por tipo de restaurante (Bar, Hamburgueria, Pizzaria…)' },
  { type: 'section-title', label: 'Título de Seção', description: 'Badge + título + descrição centralizado (separador entre seções)' },
  { type: 'choice-cards', label: 'Cards de Escolha', description: '3 cards de perfil do usuário com ícone e texto (fundo #FAFAFC)' },
  { type: 'brand-carousel', label: 'Carrossel de Marcas', description: 'Badge + título + logos de parceiros sobre fundo #FAFAFC' },
  { type: 'navbar', label: 'Navbar', description: 'Menu de navegação' },
  // Footer é fixo em toda página — não selecionável no painel de adicionar.
];

/**
 * Variantes por tipo de bloco. Todos os 8 blocos têm 3 layouts cada.
 * TODO: ligar cada variantId a um template real quando o renderer estiver pronto.
 */
const BLOCK_VARIANTS: Record<BlockType, BlockVariant[]> = {
  hero: [
    { id: 'full', label: 'Full (imersivo)', description: 'Imagem de fundo, altura total. Pode virar slider (até 3).' },
    { id: 'slider', label: 'Slider', description: 'Altura média, carrossel de até 3 banners.' },
    { id: 'centered', label: 'Centralizado', description: 'Compacto, fundo sólido, tudo centralizado.' },
    { id: 'split-image', label: 'Split com imagem', description: 'Texto à esquerda, card de imagem à direita.' },
    { id: 'split-form', label: 'Split com formulário', description: 'Texto à esquerda, captura de lead à direita.' },
  ],
  beneficios: [
    { id: 'cards', label: 'Cards', description: 'Ícone, título e descrição (2 a 5 cards).' },
    { id: 'cards-action', label: 'Cards com ação', description: 'Cards com CTAs no rodapé (2 a 5 cards).' },
  ],
  content: [
    { id: 'image-left', label: 'Imagem à esquerda', description: 'Card de imagem à esquerda, texto à direita.' },
    { id: 'image-right', label: 'Imagem à direita', description: 'Texto à esquerda, card de imagem à direita.' },
    { id: 'bullets-right', label: 'Bullets + imagem à direita', description: 'Lista de bullet points à esquerda, imagem à direita.' },
    { id: 'bullets-left', label: 'Bullets + imagem à esquerda', description: 'Imagem à esquerda, lista de bullet points à direita.' },
  ],
  promo: [
    { id: 'centered', label: 'Centralizado', description: 'Texto e CTAs centralizados sobre o fundo.' },
    { id: 'split', label: 'Com imagem', description: 'Texto à esquerda, card de imagem à direita.' },
  ],
  stacked: [
    { id: 'media', label: 'Mídia + texto', description: 'Cards empilham no scroll; aberto = imagem + título, descrição e CTA (3 a 8).' },
  ],
  vision: [
    { id: 'vision-1', label: 'Social Proof', description: 'Números, ratings e credibilidade' },
  ],
  growth: [
    { id: 'growth-1', label: 'Growth', description: 'Cards com tabs deslizantes' },
  ],
  integrated: [
    { id: 'integrated-1', label: 'Features', description: 'Lista de funcionalidades com ícones' },
  ],
  results: [
    { id: 'results-1', label: 'Depoimentos', description: 'Testimonials de clientes' },
  ],
  faq: [
    { id: 'faq-1', label: 'FAQ', description: 'Accordion de perguntas e respostas' },
  ],
  'big-numbers': [
    { id: 'default', label: 'Grade horizontal', description: 'Estatísticas em destaque lado a lado (3 a 5 itens).' },
  ],
  leadform: [
    { id: 'default', label: 'Ilha escura', description: 'Container #141414, coluna de benefícios + card branco do formulário.' },
  ],
  'big-numbers-testimonial': [
    { id: 'default', label: 'Fundo escuro', description: 'Big numbers vermelhos em destaque + cards brancos de depoimentos.' },
  ],
  segmentos: [
    { id: 'default', label: 'Fundo escuro', description: 'Seção escura com card branco e tabs interativas por segmento de restaurante.' },
  ],
  'section-title': [
    { id: 'light', label: 'Fundo claro', description: 'Badge + título + descrição centralizado sobre fundo transparente.' },
    { id: 'dark', label: 'Fundo escuro', description: 'Badge + título + descrição centralizado sobre fundo #141414.' },
  ],
  'choice-cards': [
    { id: 'default', label: 'Padrão', description: '3 cards de perfil com ícone chip vermelho sobre fundo #FAFAFC.' },
  ],
  'brand-carousel': [
    { id: 'default', label: 'Padrão', description: 'Badge + título + linha de logos de parceiros sobre fundo #FAFAFC.' },
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

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';

// Preview real: renderiza o componente isolado (rota /preview/[type] do
// landing) num iframe escalado. Render base 1280px → escala p/ caber no card.
function PreviewFrame({ type, variantId }: { type: BlockType; variantId?: string }) {
  const src = variantId
    ? `${LANDING_URL}/preview/${type}?variant=${encodeURIComponent(variantId)}`
    : `${LANDING_URL}/preview/${type}`;
  return (
    <div className={styles.previewFrameWrap}>
      <iframe
        src={src}
        className={styles.previewFrame}
        title={`Preview ${type} ${variantId ?? ''}`}
        loading="lazy"
        scrolling="no"
        tabIndex={-1}
      />
    </div>
  );
}

export function BlockSelector({ onSelect, onClose, existingTypes = [] }: BlockSelectorProps) {
  const [pendingType, setPendingType] = useState<BlockType | null>(null);
  const [query, setQuery] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Abertura do painel — fade suave + leve sobe
  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { y: 6, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.22, ease: 'power1.out' },
      );
    }
  }, []);

  // Transição ao navegar entre níveis (categorias ⇄ layouts)
  useEffect(() => {
    if (bodyRef.current) {
      gsap.fromTo(
        bodyRef.current,
        { x: pendingType ? 18 : -18, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.28, ease: 'power3.out' },
      );
    }
  }, [pendingType]);

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
    if (v && v.length > 1) {
      // Múltiplas variantes — mostra o picker
      setPendingType(type);
    } else if (v && v.length === 1) {
      // Única variante — adiciona direto sem mostrar picker
      onSelect(type, v[0].id);
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
      {/* Sem overlay: o painel de inserção fica persistente e o canvas
          permanece clicável para selecionar componentes já inseridos.
          Fecha apenas pelo botão X. */}
      <aside
        ref={panelRef}
        className={styles.addPanel}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Adicionar componente"
      >
        {/* Header com back / título / fechar */}
        <div className={styles.addHeader}>
          {pendingType && (
            <button type="button" className={styles.addIconBtn} onClick={handleBack} aria-label="Voltar">
              <Icon name="chevron-left" size={18} />
            </button>
          )}
          <span className={styles.addTitle} style={pendingType ? undefined : { paddingLeft: 12 }}>
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
        <div ref={bodyRef} className={styles.addBody}>
          {!pendingType ? (
            <div className={styles.bentoList}>
              {filteredOptions.map((opt) => {
                const disabled = isDisabled(opt.type);
                return (
                  <button
                    key={opt.type}
                    className={styles.bentoRow}
                    onClick={() => handleCategoryClick(opt.type)}
                    disabled={disabled}
                    title={disabled ? 'Já adicionado nesta página' : undefined}
                  >
                    <span className={styles.bentoIcon}>
                      <Icon name={typeIcons[opt.type] || 'grid-dashboard-bento'} size={20} />
                    </span>
                    <span className={styles.bentoLabel}>{opt.label}</span>
                    <span className={styles.bentoChevron}>
                      <Icon name="chevron-right" size={16} />
                    </span>
                  </button>
                );
              })}
              {filteredOptions.length === 0 && (
                <p className={styles.selectorEmpty}>Nenhum componente encontrado.</p>
              )}
            </div>
          ) : (
            <div className={styles.variantList}>
              {filteredVariants.map((v) => {
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={styles.variantCard}
                    onClick={() => handleVariantSelect(v.id)}
                  >
                    <span className={styles.variantCardLabel}>{v.label}</span>
                    <div className={styles.variantPreview} aria-hidden="true">
                      {pendingType && <PreviewFrame type={pendingType} variantId={v.id} />}
                    </div>
                    <span className={styles.variantCardDesc}>{v.description}</span>
                  </button>
                );
              })}
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
