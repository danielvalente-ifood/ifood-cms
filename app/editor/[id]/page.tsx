// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/hooks/useRole';
import type { Page, PageContent, Block, BlockType } from '@/types/database';
import { BlockEditor } from './components/BlockEditor';
import { BeneficiosEditor } from './components/editors/BeneficiosEditor';
import { StackedEditor } from './components/editors/StackedEditor';
import { MediaProvider } from './components/MediaContext';
import { BlockSelector } from './components/BlockSelector';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { ImageUpload } from './components/ImageUpload';
import { Icon } from '@/components/Icon/Icon';
import styles from './editor.module.css';
import {
  HERO_TYPES,
  CONTENT_TYPES,
  FOOTER_TYPES,
  CONTENT_CATEGORIES,
  BLOCK_TYPE_LABELS,
  createBlock,
  duplicateBlock as duplicateBlockConfig,
  heroDefaults,
  beneficiosDefaults,
  type GroupKey,
  type ContentType,
} from './block-config';
import type { HeroVariant } from '@/types/database';

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3001';

type StructureGroup = {
  key: GroupKey;
  label: string;
  icon: string;
  singleton: boolean;
};

const STRUCTURE_GROUPS: StructureGroup[] = [
  { key: 'hero', label: 'Hero', icon: 'window-dock-top', singleton: true },
  { key: 'content', label: 'Content', icon: 'window-fullscreen', singleton: false },
  { key: 'footer', label: 'Footer', icon: 'window-dock-bottom', singleton: true },
];

const HERO_SET = new Set<BlockType>(HERO_TYPES);
const CONTENT_SET = new Set<BlockType>(CONTENT_TYPES as unknown as BlockType[]);
const FOOTER_SET = new Set<BlockType>(FOOTER_TYPES);

function splitBlocks(blocks: Block[]) {
  const hero: Block[] = [];
  const content: Block[] = [];
  const footer: Block[] = [];
  for (const b of blocks) {
    if (HERO_SET.has(b.type)) hero.push(b);
    else if (FOOTER_SET.has(b.type)) footer.push(b);
    else if (CONTENT_SET.has(b.type)) content.push(b);
  }
  return { hero, content, footer };
}

function combineBlocks(hero: Block[], content: Block[], footer: Block[]): Block[] {
  return [...hero, ...content, ...footer];
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { canEdit } = useRole();
  const pageId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [page, setPage] = useState<Page | null>(null);
  const [verticalSlug, setVerticalSlug] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  // Card selecionado dentro de um bloco com itens (ex: benefícios)
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number>(-1);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [zoom, setZoom] = useState(100);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);
  const latestBlocksRef = useRef<Block[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // AI adaptation config
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSaving, setAiSaving] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // SEO
  const [showSeoPanel, setShowSeoPanel] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [seoSaving, setSeoSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    hero: true,
    content: true,
    footer: true,
  });
  const [activeGroup, setActiveGroup] = useState<GroupKey | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<ContentType | null>(
    CONTENT_CATEGORIES[0]?.type ?? null
  );
  const structureSectionRef = useRef<HTMLElement>(null);

  const grouped = useMemo(() => splitBlocks(blocks), [blocks]);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const sendToIframe = useCallback((type: string, payload: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type, payload }, '*');
    }
  }, []);

  useEffect(() => {
    if (iframeReady) {
      sendToIframe('cms:update-all-blocks', { blocks });
    }
  }, [blocks, iframeReady, sendToIframe]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'landing:ready') setIframeReady(true);
      // Clique numa seção no canvas abre o painel de edição (estilo Relume)
      if (type === 'landing:block-selected' && payload?.blockId) {
        setSelectedBlockId(payload.blockId);
        setSelectedCardIndex(null);
      }
      // Clique num card específico (ex: benefícios) → edição daquele card
      if (type === 'landing:card-selected' && payload?.blockId) {
        setSelectedBlockId(payload.blockId);
        setSelectedCardIndex(typeof payload.cardIndex === 'number' ? payload.cardIndex : null);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Load page and content
  useEffect(() => {
    async function load() {
      const { data: pageData, error: pageError } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (pageError || !pageData) {
        router.push('/');
        return;
      }

      setPage(pageData);
      setAiEnabled(pageData.ai_adaptation_enabled ?? false);
      setAiPrompt(pageData.ai_adaptation_prompt ?? '');
      setMetaTitle(pageData.meta_title ?? '');
      setMetaDescription(pageData.meta_description ?? '');
      setOgImage(pageData.og_image ?? '');

      // Load vertical slug for media organization
      if (pageData.vertical_id) {
        const { data: vert } = await supabase
          .from('verticals')
          .select('slug')
          .eq('id', pageData.vertical_id)
          .single();
        if (vert) setVerticalSlug(vert.slug);
      }

      let versionData = await supabase
        .from('page_versions')
        .select('content')
        .eq('page_id', pageId)
        .eq('version_type', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!versionData.data) {
        const pubVersionData = await supabase
          .from('page_versions')
          .select('content')
          .eq('page_id', pageId)
          .eq('version_type', 'published')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        versionData = pubVersionData as typeof versionData;
      }

      const content = (versionData.data as any)?.content as PageContent | null;
      setBlocks(content?.blocks ?? []);
      setLoading(false);
    }

    load();
  }, [pageId, router]);

  const saveDraft = useCallback(async (updatedBlocks: Block[], silent = false) => {
    setSaving(true);
    const content: PageContent = { blocks: updatedBlocks };

    const { error } = await supabase.from('page_versions').insert({
      page_id: pageId,
      content: content as unknown as Record<string, unknown>,
      version_type: 'draft' as const,
    } as any);

    if (error) {
      showToast('Erro ao salvar', 'error');
    } else {
      setSaved(true);
      setLastSavedAt(new Date());
      if (!silent) showToast('Rascunho salvo', 'success');
    }
    setSaving(false);
  }, [pageId, showToast]);

  useEffect(() => {
    latestBlocksRef.current = blocks;
    if (initialLoadRef.current) {
      if (!loading) initialLoadRef.current = false;
      return;
    }
    if (saved) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveDraft(latestBlocksRef.current, true);
    }, 1500);

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [blocks, saved, loading, saveDraft]);

  const handlePublish = async () => {
    if (blocks.length === 0) {
      showToast('Adicione ao menos 1 bloco antes de publicar', 'error');
      return;
    }

    setSaving(true);

    await supabase.from('page_versions').insert({
      page_id: pageId,
      content: { blocks } as unknown as Record<string, unknown>,
      version_type: 'draft' as const,
    } as any);

    await supabase.from('page_versions').insert({
      page_id: pageId,
      content: { blocks } as unknown as Record<string, unknown>,
      version_type: 'published' as const,
    } as any);

    // @ts-ignore
    await supabase.from('pages').update({ status: 'published' as const }).eq('id', pageId);

    setSaving(false);
    setSaved(true);
    setLastSavedAt(new Date());
    showToast('Página publicada!', 'success');

    const { data } = await supabase.from('pages').select('*').eq('id', pageId).single();
    if (data) setPage(data);

    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const saveAiConfig = async () => {
    setAiSaving(true);
    // @ts-ignore
    const { error } = await supabase
      .from('pages')
      .update({
        ai_adaptation_enabled: aiEnabled,
        ai_adaptation_prompt: aiPrompt || null,
      })
      .eq('id', pageId);

    if (error) {
      showToast('Erro ao salvar config IA', 'error');
    } else {
      showToast('Config IA salva', 'success');
    }
    setAiSaving(false);
  };

  const saveSeo = async () => {
    setSeoSaving(true);
    const { error } = await supabase
      .from('pages')
      .update({
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        og_image: ogImage || null,
      })
      .eq('id', pageId);
    showToast(error ? 'Erro ao salvar SEO' : 'SEO salvo', error ? 'error' : 'success');
    setSeoSaving(false);
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openBlockSelector = (index?: number) => {
    if (index !== undefined) {
      setInsertIndex(index);
    } else if (selectedBlockId) {
      // Insere abaixo da seção selecionada
      const i = blocks.findIndex((b) => b.id === selectedBlockId);
      setInsertIndex(i >= 0 ? i + 1 : blocks.length);
    } else {
      setInsertIndex(blocks.length);
    }
    setShowBlockSelector(true);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const newBlocks = [...blocks];
    const [dragged] = newBlocks.splice(dragIndex, 1);
    newBlocks.splice(targetIndex, 0, dragged);
    setBlocks(newBlocks);
    setSaved(false);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleAddClick = (key: GroupKey) => {
    setActiveGroup((prev) => (prev === key ? null : key));
    if (key === 'content') {
      setExpandedCategory(CONTENT_CATEGORIES[0]?.type ?? null);
    }
  };

  const updateBlocks = (nextBlocks: Block[]) => {
    setBlocks(nextBlocks);
    setSaved(false);
  };

  const updateBlock = (index: number, updatedBlock: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
    setSaved(false);
    sendToIframe('cms:update-block', { blockId: updatedBlock.id, data: updatedBlock.data, config: updatedBlock.config });
  };

  const removeBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    setBlocks(newBlocks);
    setSaved(false);
    if (blocks[index]?.id === selectedBlockId) setSelectedBlockId(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
    setSaved(false);
  };

  const duplicateBlock = (index: number) => {
    const block = blocks[index];
    const newBlock: Block = {
      ...block,
      id: `block-${Date.now()}`,
      data: JSON.parse(JSON.stringify(block.data)),
    } as Block;
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setSaved(false);
  };

  const addBlock = (type: BlockType, variantId?: string) => {
    const newBlock = createEmptyBlock(type, variantId);
    const newBlocks = [...blocks];
    if (insertIndex >= 0) {
      newBlocks.splice(insertIndex, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    setBlocks(newBlocks);
    setSaved(false);
    // Mantém o painel de inserção aberto e NÃO abre o painel de edição.
    // O painel de edição (direita) só abre ao clicar no componente no canvas.
    setInsertIndex(-1);
    // Fecha o painel de inserção (BlockSelector) ao inserir um elemento.
    setShowBlockSelector(false);
    // Fecha os painéis flutuantes (IA / SEO) ao inserir um elemento.
    setShowAiPanel(false);
    setShowSeoPanel(false);
    // Fecha o painel de edição do componente (direita), se aberto.
    setSelectedBlockId(null);
    setSelectedCardIndex(null);
    sendToIframe('cms:deselect', {});
  };

  const handleSelectTheme = (groupKey: GroupKey, type: BlockType, theme: number) => {
    const newBlock = createBlock(type, theme);
    const { hero, content, footer } = grouped;
    let next: Block[];
    if (groupKey === 'hero') {
      next = combineBlocks([newBlock], content, footer);
    } else if (groupKey === 'footer') {
      next = combineBlocks(hero, content, [newBlock]);
    } else {
      next = combineBlocks(hero, [...content, newBlock], footer);
    }
    updateBlocks(next);
    setActiveGroup(null);
  };

  const handleDeleteBlock = (blockId: string) => {
    updateBlocks(blocks.filter((b) => b.id !== blockId));
  };

  const handleDuplicateBlock = (blockId: string) => {
    const idx = blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const original = blocks[idx];
    if (HERO_SET.has(original.type) || FOOTER_SET.has(original.type)) {
      return;
    }
    const dup = duplicateBlockConfig(original);
    const next = [...blocks.slice(0, idx + 1), dup, ...blocks.slice(idx + 1)];
    updateBlocks(next);
  };

  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    const { hero, content, footer } = grouped;
    const idx = content.findIndex((b) => b.id === blockId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= content.length) return;
    const nextContent = [...content];
    [nextContent[idx], nextContent[targetIdx]] = [nextContent[targetIdx], nextContent[idx]];
    updateBlocks(combineBlocks(hero, nextContent, footer));
  };

  useEffect(() => {
    if (!activeGroup) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        structureSectionRef.current &&
        !structureSectionRef.current.contains(e.target as Node)
      ) {
        setActiveGroup(null);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveGroup(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [activeGroup]);

  if (loading) {
    return <div className={styles.loading}>Carregando editor...</div>;
  }

  if (!page) return null;

  const iframeSrc = `${LANDING_URL}/p/${page.slug}?edit=true`;

  const selIndex = selectedBlockId ? blocks.findIndex((b) => b.id === selectedBlockId) : -1;
  const selectedBlock = selIndex >= 0 ? blocks[selIndex] : null;

  const getBlocksForGroup = (key: GroupKey): Block[] => {
    if (key === 'hero') return grouped.hero;
    if (key === 'footer') return grouped.footer;
    return grouped.content;
  };

  return (
    <MediaProvider verticalId={page.vertical_id} verticalSlug={verticalSlug}>
    <div className={styles.editorLayout}>
      {/* Top bar */}
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <button className={styles.backBtn} onClick={() => router.push('/')}>
            <Icon name="chevron-left" size={20} />
          </button>
          <div>
            <h1 className={styles.pageTitle}>{page.name}</h1>
            <span className={styles.pageSlug}>/{page.slug}</span>
          </div>
        </div>

        {/* Centro: device + zoom */}
        <div className={styles.viewportBar}>
          <div className={styles.deviceGroup} role="group" aria-label="Dispositivo">
            {([
              { v: 'desktop', icon: 'monitor' },
              { v: 'tablet', icon: 'tablet' },
              { v: 'mobile', icon: 'smartphone' },
            ] as const).map((d) => (
              <button
                key={d.v}
                className={`${styles.deviceBtn} ${device === d.v ? styles.deviceBtnActive : ''}`}
                onClick={() => setDevice(d.v)}
                aria-label={d.v}
                aria-pressed={device === d.v}
              >
                <Icon name={d.icon} size={16} />
              </button>
            ))}
          </div>
          <span className={styles.viewportDivider} />
          <div className={styles.zoomDropdown}>
            <FilterDropdown
              options={[50, 75, 100, 125].map((z) => ({ value: String(z), label: `${z}%` }))}
              value={String(zoom)}
              onChange={(v) => setZoom(Number(v))}
            />
          </div>
        </div>

        <div className={styles.topBarRight}>
          {canEdit ? (
            <>
              <button
                className={styles.btnPreview}
                onClick={() => window.open(`${LANDING_URL}/p/${page.slug}?edit=true`, '_blank')}
                title="Abrir preview em nova aba"
              >
                <Icon name="eye-on" size={16} />
                Preview
              </button>
              <span className={styles.saveStatus}>
                {saving ? 'Salvando...' : saved ? 'Salvo' : 'Alterações não salvas'}
              </span>
              <button className={styles.btnPublish} onClick={handlePublish} disabled={saving}>
                Publicar
              </button>
            </>
          ) : (
            <span className={styles.readOnlyBadge}>
              <Icon name="eye-on" size={14} />
              Modo leitura
            </span>
          )}
        </div>
      </header>

      {/* Main editor area */}
      <div className={styles.editorBody}>
        {/* Rail esquerdo: adicionar + IA */}
        {canEdit && (
          <div className={styles.rail}>
            <button
              className={styles.railBtn}
              onClick={() => { setSelectedBlockId(null); openBlockSelector(); }}
              aria-label="Adicionar bloco"
            >
              <span className={styles.railIcon}><Icon name="plus-default" size={20} /></span>
              <span className={styles.railTooltip}>Adicionar bloco</span>
            </button>
            <button
              className={`${styles.railBtn} ${showAiPanel ? styles.railBtnActive : ''}`}
              onClick={() => setShowAiPanel((v) => !v)}
              aria-label="Personalização com IA"
            >
              <span className={styles.railIcon}><Icon name="bot" size={20} /></span>
              {aiEnabled && <span className={styles.railDot} />}
              <span className={styles.railTooltip}>Personalização com IA</span>
            </button>
            <button
              className={`${styles.railBtn} ${showSeoPanel ? styles.railBtnActive : ''}`}
              onClick={() => setShowSeoPanel((v) => !v)}
              aria-label="SEO da página"
            >
              <span className={styles.railIcon}><Icon name="search" size={20} /></span>
              <span className={styles.railTooltip}>SEO da página</span>
            </button>
          </div>
        )}

        {/* Canvas: iframe com device + zoom */}
        <div className={styles.canvas}>
          <div
            className={`${styles.frameWrap} ${styles[`frame_${device}`]}`}
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <iframe ref={iframeRef} src={iframeSrc} className={styles.iframe} title="Preview" />
            {!iframeReady && <div className={styles.iframeLoading}>Carregando preview...</div>}
          </div>
        </div>
      </div>

      {/* Painel de edição flutuante (abre ao clicar na seção no canvas) */}
      {canEdit && selectedBlock && selIndex >= 0 && (
        <aside className={styles.editPanel} aria-label="Editar seção">
          <div className={styles.editPanelHeader}>
            <span>
              {selectedBlock.type === 'beneficios' && selectedCardIndex !== null
                ? `Editar card ${selectedCardIndex + 1}`
                : 'Editar seção'}
            </span>
            <div className={styles.blockActions}>
              {/* Ações padronizadas da seção — ocultas só no modo card do Benefícios */}
              {!(selectedBlock.type === 'beneficios' && selectedCardIndex !== null) && (
                <>
                  <button
                    className={styles.blockActionBtn}
                    onClick={() => moveBlock(selIndex, 'up')}
                    disabled={selIndex === 0}
                    aria-label="Mover acima"
                    title="Mover acima"
                  >
                    <Icon name="chevron-big-up" size={16} />
                  </button>
                  <button
                    className={styles.blockActionBtn}
                    onClick={() => moveBlock(selIndex, 'down')}
                    disabled={selIndex === blocks.length - 1}
                    aria-label="Mover abaixo"
                    title="Mover abaixo"
                  >
                    <Icon name="chevron-big-down" size={16} />
                  </button>
                  <button
                    className={styles.blockActionBtn}
                    onClick={() => duplicateBlock(selIndex)}
                    aria-label="Duplicar"
                    title="Duplicar"
                  >
                    <Icon name="copy-default" size={16} />
                  </button>
                  <button
                    className={`${styles.blockActionBtn} ${styles.blockActionBtnDanger}`}
                    onClick={() => { removeBlock(selIndex); setSelectedBlockId(null); setSelectedCardIndex(null); sendToIframe('cms:deselect', {}); }}
                    aria-label="Deletar seção"
                    title="Deletar seção"
                  >
                    <Icon name="delete-dustbin-01" size={16} />
                  </button>
                </>
              )}
              <button
                className={styles.blockActionBtn}
                onClick={() => { setSelectedBlockId(null); setSelectedCardIndex(null); sendToIframe('cms:deselect', {}); }}
                aria-label="Fechar"
                title="Fechar"
              >
                <Icon name="close-x" size={16} />
              </button>
            </div>
          </div>
          <div className={styles.editPanelBody}>
            {selectedBlock.type === 'beneficios' ? (
              <BeneficiosEditor
                block={selectedBlock}
                onUpdate={(updated) => updateBlock(selIndex, updated)}
                cardIndex={selectedCardIndex}
                onCardIndexChange={(i) => {
                  setSelectedCardIndex(i);
                  sendToIframe('cms:select-card', { blockId: selectedBlock.id, cardIndex: i });
                }}
              />
            ) : selectedBlock.type === 'stacked' ? (
              <StackedEditor
                block={selectedBlock}
                onUpdate={(updated) => updateBlock(selIndex, updated)}
                cardIndex={selectedCardIndex}
                onCardIndexChange={(i) => {
                  setSelectedCardIndex(i);
                  sendToIframe('cms:select-card', { blockId: selectedBlock.id, cardIndex: i });
                }}
              />
            ) : (
              <BlockEditor
                block={selectedBlock}
                index={selIndex}
                total={blocks.length}
                isSelected
                chromeless
                onUpdate={(updated) => updateBlock(selIndex, updated)}
              />
            )}
          </div>
        </aside>
      )}

      {/* AI floating panel */}
      {canEdit && showAiPanel && (
        <aside className={styles.aiPanel} aria-label="Personalização com IA">
          <div className={styles.editPanelHeader}>
            <span>Personalização com IA</span>
            <button className={styles.addIconBtn} onClick={() => setShowAiPanel(false)} aria-label="Fechar">
              <Icon name="close-x" size={16} />
            </button>
          </div>
          <div className={styles.aiPanelBody}>
            <label className={styles.aiToggleRow}>
              <span className={styles.aiToggleLabel}>Adaptar conteúdo por UTM</span>
              <button
                className={`${styles.aiToggleSwitch} ${aiEnabled ? styles.aiToggleSwitchOn : ''}`}
                onClick={() => setAiEnabled(!aiEnabled)}
                role="switch"
                aria-checked={aiEnabled}
              >
                <span className={styles.aiToggleKnob} />
              </button>
            </label>
            {aiEnabled && (
              <div className={styles.aiPromptGroup}>
                <label className={styles.aiPromptLabel}>Instruções para a IA (opcional)</label>
                <textarea
                  className={styles.aiPromptInput}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: tom mais informal para redes sociais; destacar benefícios financeiros em Google Ads."
                  rows={4}
                />
              </div>
            )}
            <button className={styles.aiSaveBtn} onClick={saveAiConfig} disabled={aiSaving}>
              {aiSaving ? 'Salvando...' : 'Salvar configuração'}
            </button>
          </div>
        </aside>
      )}

      {/* SEO floating panel */}
      {canEdit && showSeoPanel && (
        <aside className={styles.aiPanel} aria-label="SEO da página">
          <div className={styles.editPanelHeader}>
            <span>SEO da página</span>
            <button className={styles.addIconBtn} onClick={() => setShowSeoPanel(false)} aria-label="Fechar">
              <Icon name="close-x" size={16} />
            </button>
          </div>
          <div className={styles.editPanelBody}>
            <div className={styles.cfgField}>
              <label className={styles.fieldLabel}>Meta title</label>
              <input
                className={styles.fieldInput}
                value={metaTitle}
                placeholder={page.name}
                onChange={(e) => setMetaTitle(e.target.value)}
              />
            </div>
            <div className={styles.cfgField} style={{ marginTop: 12 }}>
              <label className={styles.fieldLabel}>Meta description</label>
              <textarea
                className={styles.fieldTextarea}
                value={metaDescription}
                placeholder="Resumo da página para buscadores e redes sociais"
                rows={3}
                onChange={(e) => setMetaDescription(e.target.value)}
              />
            </div>
            <div className={styles.cfgField} style={{ marginTop: 12 }}>
              <ImageUpload label="Imagem de compartilhamento (OG)" value={ogImage} onChange={setOgImage} />
            </div>
            <button className={styles.aiSaveBtn} style={{ marginTop: 16 }} onClick={saveSeo} disabled={seoSaving}>
              {seoSaving ? 'Salvando...' : 'Salvar SEO'}
            </button>
          </div>
        </aside>
      )}

      {/* Block selector flutuante */}
      {canEdit && showBlockSelector && (
        <BlockSelector
          onSelect={addBlock}
          onClose={() => { setShowBlockSelector(false); setInsertIndex(-1); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.message}
        </div>
      )}
    </div>
    </MediaProvider>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}


function createEmptyBlock(type: BlockType, variantId?: string): Block {
  const id = `block-${type}-${Date.now()}`;
  if (type === 'hero') {
    return { id, type, data: heroDefaults((variantId as HeroVariant) || 'full') } as Block;
  }
  if (type === 'beneficios') {
    return { id, type, data: beneficiosDefaults((variantId as any) || 'cards') } as Block;
  }
  const templates: Record<BlockType, any> = {
    navbar: { logo: '', cta_text: 'CTA', cta_link: '#', items: [] },
    hero: heroDefaults('full'),
    beneficios: beneficiosDefaults('cards'),
    vision: { badge: 'Badge', title: ['Título'], ratings_count: '0', ratings_text: '', avatars: [], cards: [] },
    growth: { badge: 'Badge', title: ['Título'], tabs: [] },
    integrated: { badge: 'Badge', title: 'Título', image: '', features: [] },
    results: { badge: 'Badge', title: ['Título'], testimonials: [] },
    faq: { badge: 'FAQ', title: 'Perguntas frequentes', description: '', items: [] },
    footer: { logo: '', copyright: '', social_links: [], columns: [] },
  };
  return { id, type, data: templates[type] } as Block;
}
