// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/hooks/useRole';
import type { Page, PageContent, Block, BlockType } from '@/types/database';
import { BlockEditor } from './components/BlockEditor';
import { MediaProvider } from './components/MediaContext';
import { BlockSelector } from './components/BlockSelector';
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
  type GroupKey,
  type ContentType,
} from './block-config';

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

  const addBlock = (type: BlockType) => {
    const newBlock = createEmptyBlock(type);
    const newBlocks = [...blocks];
    if (insertIndex >= 0) {
      newBlocks.splice(insertIndex, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    setBlocks(newBlocks);
    setShowBlockSelector(false);
    setInsertIndex(-1);
    setSaved(false);
    setSelectedBlockId(newBlock.id);
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
              { v: 'desktop', icon: 'window-fullscreen' },
              { v: 'tablet', icon: 'window-dock-top' },
              { v: 'mobile', icon: 'window-dock-bottom' },
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
          <select
            className={styles.zoomSelect}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
          >
            {[50, 75, 100, 125].map((z) => <option key={z} value={z}>{z}%</option>)}
          </select>
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
              title="Adicionar bloco"
            >
              <Icon name="plus-default" size={24} />
            </button>
            <button
              className={`${styles.railBtn} ${showAiPanel ? styles.railBtnActive : ''}`}
              onClick={() => setShowAiPanel((v) => !v)}
              aria-label="Personalização com IA"
              title="Personalização com IA"
            >
              <Icon name="bot" size={20} />
              {aiEnabled && <span className={styles.railDot} />}
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
            <span>Editar seção</span>
            <button
              className={styles.addIconBtn}
              onClick={() => { setSelectedBlockId(null); sendToIframe('cms:deselect', {}); }}
              aria-label="Fechar"
            >
              <Icon name="close-x" size={16} />
            </button>
          </div>
          <div className={styles.editPanelBody}>
            <BlockEditor
              block={selectedBlock}
              index={selIndex}
              total={blocks.length}
              isSelected
              onUpdate={(updated) => updateBlock(selIndex, updated)}
              onRemove={() => { removeBlock(selIndex); setSelectedBlockId(null); }}
              onMove={(dir) => moveBlock(selIndex, dir)}
              onDuplicate={() => duplicateBlock(selIndex)}
            />
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


function createEmptyBlock(type: BlockType): Block {
  const id = `block-${type}-${Date.now()}`;
  const templates: Record<BlockType, any> = {
    navbar: { logo: '', cta_text: 'CTA', cta_link: '#', items: [] },
    hero: { title: ['Título principal'], description: 'Descrição do hero', cta_text: 'Saiba mais', cta_link: '#', background_image: '', logo_decoration: '' },
    vision: { badge: 'Badge', title: ['Título'], ratings_count: '0', ratings_text: '', avatars: [], cards: [] },
    growth: { badge: 'Badge', title: ['Título'], tabs: [] },
    integrated: { badge: 'Badge', title: 'Título', image: '', features: [] },
    results: { badge: 'Badge', title: ['Título'], testimonials: [] },
    faq: { badge: 'FAQ', title: 'Perguntas frequentes', description: '', items: [] },
    footer: { logo: '', copyright: '', social_links: [], columns: [] },
  };
  return { id, type, data: templates[type] } as Block;
}
