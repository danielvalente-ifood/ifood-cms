// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/hooks/useRole';
import type { Page, PageContent, Block, BlockType } from '@/types/database';
import { BlockEditor } from './components/BlockEditor';
import { BlockSelector } from './components/BlockSelector';
import { Icon } from '@/components/Icon/Icon';
import styles from './editor.module.css';

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3001';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { canEdit } = useRole();
  const pageId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [page, setPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [iframeReady, setIframeReady] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number>(-1);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // AI adaptation config
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSaving, setAiSaving] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Send message to iframe
  const sendToIframe = useCallback((type: string, payload: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type, payload }, '*');
    }
  }, []);

  // Sync blocks to iframe whenever they change
  useEffect(() => {
    if (iframeReady) {
      sendToIframe('cms:update-all-blocks', { blocks });
    }
  }, [blocks, iframeReady, sendToIframe]);

  // Sync selected block to iframe
  useEffect(() => {
    if (iframeReady && selectedBlockId) {
      sendToIframe('cms:select-block', { blockId: selectedBlockId });
    } else if (iframeReady) {
      sendToIframe('cms:deselect', {});
    }
  }, [selectedBlockId, iframeReady, sendToIframe]);

  // Listen for messages from iframe
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      switch (type) {
        case 'landing:ready':
          setIframeReady(true);
          break;
        case 'landing:block-selected':
          setSelectedBlockId(payload.blockId);
          // Scroll panel to the block editor
          const el = document.getElementById(`panel-block-${payload.blockId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          break;
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

  // Save draft
  const saveDraft = useCallback(async (updatedBlocks: Block[]) => {
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
      showToast('Rascunho salvo', 'success');
    }
    setSaving(false);
  }, [pageId, showToast]);

  // Publish
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
    showToast('Página publicada!', 'success');

    const { data } = await supabase.from('pages').select('*').eq('id', pageId).single();
    if (data) setPage(data);

    // Reload iframe to show published version
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Block operations
  const updateBlock = (index: number, updatedBlock: Block) => {
    const newBlocks = [...blocks];
    newBlocks[index] = updatedBlock;
    setBlocks(newBlocks);
    setSaved(false);

    // Live update in iframe
    sendToIframe('cms:update-block', {
      blockId: updatedBlock.id,
      data: updatedBlock.data,
    });
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

  const openBlockSelector = (index?: number) => {
    setInsertIndex(index !== undefined ? index : blocks.length);
    setShowBlockSelector(true);
  };

  // Drag and drop
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

  // Save AI adaptation config
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

  if (loading) {
    return <div className={styles.loading}>Carregando editor...</div>;
  }

  if (!page) return null;

  const iframeSrc = `${LANDING_URL}/p/${page.slug}?edit=true`;

  return (
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
        <div className={styles.topBarRight}>
          {canEdit ? (
            <>
              <span className={styles.saveStatus}>
                {saving ? 'Salvando...' : saved ? 'Salvo' : 'Alterações não salvas'}
              </span>
              <button className={styles.btnOutline} onClick={() => saveDraft(blocks)} disabled={saving || saved}>
                Salvar rascunho
              </button>
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

      {/* Main editor area: iframe + panel */}
      <div className={styles.editorBody}>
        {/* Iframe preview */}
        <div className={styles.iframeContainer}>
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className={styles.iframe}
            title="Preview"
          />
          {!iframeReady && (
            <div className={styles.iframeLoading}>Carregando preview...</div>
          )}
        </div>

        {/* Side panel */}
        <div className={`${styles.sidePanel} ${panelCollapsed ? styles.sidePanelCollapsed : ''}`}>
          <div className={styles.panelHeader}>
            <button className={styles.panelToggle} onClick={() => setPanelCollapsed(!panelCollapsed)} title={panelCollapsed ? 'Expandir' : 'Recolher'}>
              <Icon name={panelCollapsed ? 'chevron-left' : 'chevron-right'} size={16} />
            </button>
            {!panelCollapsed && <span className={styles.panelTitle}>Blocos</span>}
          </div>

          {!panelCollapsed && (
            <div className={styles.panelContent}>
              {/* AI Adaptation Config — only for editors */}
              {canEdit && (
                <div className={styles.aiSection}>
                  <button
                    className={styles.aiSectionToggle}
                    onClick={() => setShowAiPanel(!showAiPanel)}
                  >
                    <Icon name="bot" size={16} />
                    <span>Personalização com IA</span>
                    <span className={`${styles.aiStatusDot} ${aiEnabled ? styles.aiStatusActive : ''}`} />
                    <span style={{ marginLeft: 'auto', transform: showAiPanel ? 'rotate(180deg)' : 'none', transition: 'transform 150ms', display: 'inline-flex' }}>
                      <Icon name="chevron-down" size={12} />
                    </span>
                  </button>

                  {showAiPanel && (
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
                        <>
                          <div className={styles.aiPromptGroup}>
                            <label className={styles.aiPromptLabel}>Instruções para a IA (opcional)</label>
                            <textarea
                              className={styles.aiPromptInput}
                              value={aiPrompt}
                              onChange={(e) => setAiPrompt(e.target.value)}
                              placeholder="Ex: Adapte o tom para ser mais informal quando a campanha for de redes sociais. Destaque benefícios financeiros para campanhas de Google Ads."
                              rows={4}
                            />
                            <span className={styles.aiPromptHint}>
                              A IA usará os UTM params (source, campaign, medium) para adaptar textos automaticamente.
                            </span>
                          </div>

                          <button
                            className={styles.aiSaveBtn}
                            onClick={saveAiConfig}
                            disabled={aiSaving}
                          >
                            {aiSaving ? 'Salvando...' : 'Salvar configuração'}
                          </button>
                        </>
                      )}

                      {!aiEnabled && (
                        <button
                          className={styles.aiSaveBtn}
                          onClick={saveAiConfig}
                          disabled={aiSaving}
                        >
                          {aiSaving ? 'Salvando...' : 'Salvar'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {blocks.length === 0 ? (
                <div className={styles.emptyEditor}>
                  <p>Nenhum bloco</p>
                  {canEdit && (
                    <button className={styles.addBlockBtn} onClick={() => openBlockSelector()}>
                      + Adicionar
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {blocks.map((block, index) => (
                    <div key={block.id} id={`panel-block-${block.id}`} className={styles.blockWrapper}>
                      <BlockEditor
                        block={block}
                        index={index}
                        total={blocks.length}
                        isSelected={selectedBlockId === block.id}
                        onSelect={() => {
                          setSelectedBlockId(block.id);
                          sendToIframe('cms:select-block', { blockId: block.id });
                        }}
                        onUpdate={canEdit ? (updated) => updateBlock(index, updated) : undefined}
                        onRemove={canEdit ? () => removeBlock(index) : undefined}
                        onMove={canEdit ? (dir) => moveBlock(index, dir) : undefined}
                        onDuplicate={canEdit ? () => duplicateBlock(index) : undefined}
                        isDragging={dragIndex === index}
                        isDragOver={dragOverIndex === index}
                        onDragStart={canEdit ? () => handleDragStart(index) : undefined}
                        onDragEnd={canEdit ? handleDragEnd : undefined}
                        onDragOver={canEdit ? (e) => handleDragOver(e, index) : undefined}
                        onDrop={canEdit ? () => handleDrop(index) : undefined}
                      />
                    </div>
                  ))}

                  {canEdit && (
                    <button className={styles.addBlockBtn} onClick={() => openBlockSelector()}>
                      + Adicionar bloco
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Block selector modal */}
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
  );
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
