// @ts-nocheck
'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Experiment, ExperimentVariant, Block, PageContent } from '@/types/database';
import { HeroEditor } from '../../editor/[id]/components/editors/HeroEditor';
import { VisionEditor } from '../../editor/[id]/components/editors/VisionEditor';
import { GrowthEditor } from '../../editor/[id]/components/editors/GrowthEditor';
import { IntegratedEditor } from '../../editor/[id]/components/editors/IntegratedEditor';
import { ResultsEditor } from '../../editor/[id]/components/editors/ResultsEditor';
import { FAQEditor } from '../../editor/[id]/components/editors/FAQEditor';
import { NavbarEditor } from '../../editor/[id]/components/editors/NavbarEditor';
import { FooterEditor } from '../../editor/[id]/components/editors/FooterEditor';
import { Icon } from '@/components/Icon/Icon';
import { BrandMark } from '@/components/Brand/BrandMark';
import { StatusBadge } from '@/components/ui/status-badge';
import type { StatusType } from '@/components/ui/status-badge';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';
import styles from './experiment-detail.module.css';

const LANDING_URL = 'http://localhost:3001';

const typeLabels: Record<string, string> = {
  navbar: 'Navbar',
  hero: 'Hero banner',
  vision: 'Social Proof',
  growth: 'Growth',
  integrated: 'Features',
  results: 'Depoimentos',
  faq: 'FAQ',
  footer: 'Footer',
};

const typeIcons: Record<string, string> = {
  navbar: 'burger-menu-three',
  hero: 'photo-image-default',
  vision: 'star',
  growth: 'rocket-ship',
  integrated: 'plugin-addon-puzzle',
  results: 'text-quotes-paragraph',
  faq: 'file-02-question-mark',
  footer: 'window-dock-bottom',
};


export default function ExperimentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const experimentId = params.id as string;

  const [experiment, setExperiment] = useState<Experiment | null>(null);
  const [variants, setVariants] = useState<ExperimentVariant[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pageSlug, setPageSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast } = useToast();

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [variantBlockData, setVariantBlockData] = useState<any>(null);
  const [trafficPct, setTrafficPct] = useState(50);
  const [savingTraffic, setSavingTraffic] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Editable name
  const [editName, setEditName] = useState('');
  const nameTimeout = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    async function load() {
      const { data: exp } = await supabase
        .from('experiments')
        .select('*')
        .eq('id', experimentId)
        .single();

      if (!exp) { router.push('/experiments'); return; }
      setExperiment(exp);
      setEditName(exp.name);
      setTrafficPct(exp.traffic_percentage);

      // Fetch page slug for preview
      const { data: pageData } = await supabase
        .from('pages')
        .select('slug')
        .eq('id', exp.page_id)
        .single();
      if (pageData) setPageSlug(pageData.slug);

      const { data: vars } = await supabase
        .from('experiment_variants')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('is_control', { ascending: false });

      setVariants((vars as any) || []);

      let versionData = await supabase
        .from('page_versions')
        .select('content')
        .eq('page_id', exp.page_id)
        .eq('version_type', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!versionData.data) {
        const pubVersionData = await supabase
          .from('page_versions')
          .select('content')
          .eq('page_id', exp.page_id)
          .eq('version_type', 'published')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        versionData = pubVersionData;
      }

      const content = (versionData.data as any)?.content as PageContent | null;
      setBlocks(content?.blocks ?? []);

      const variantB = ((vars as any) || []).find((v: any) => !v.is_control);
      if (variantB?.target_block_id) {
        setSelectedBlockId(variantB.target_block_id);
        if (variantB.block_data) {
          setVariantBlockData(variantB.block_data);
        } else {
          const originalBlock = (content?.blocks ?? []).find(b => b.id === variantB.target_block_id);
          if (originalBlock) setVariantBlockData(JSON.parse(JSON.stringify(originalBlock.data)));
        }
      }

      setLoading(false);
    }

    load();
  }, [experimentId, router]);

  const handleSelectBlock = (blockId: string) => {
    setSelectedBlockId(blockId);
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      setVariantBlockData(JSON.parse(JSON.stringify(block.data)));
    }
  };

  const handleSave = async () => {
    const variantB = variants.find(v => !v.is_control);
    if (!variantB || !selectedBlockId || !variantBlockData) return;

    setSaving(true);

    const { error } = await (supabase as any)
      .from('experiment_variants')
      .update({
        target_block_id: selectedBlockId,
        block_data: variantBlockData,
      })
      .eq('id', variantB.id);

    if (error) {
      showToast('Erro ao salvar variante', 'error');
    } else {
      showToast('Variante salva', 'success');
    }

    setSaving(false);
  };

  const trafficTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTrafficChange = (value: number) => {
    setTrafficPct(value);

    // Debounce: save only after user stops dragging for 500ms
    if (trafficTimerRef.current) clearTimeout(trafficTimerRef.current);
    trafficTimerRef.current = setTimeout(async () => {
      setSavingTraffic(true);
      await (supabase as any)
        .from('experiments')
        .update({ traffic_percentage: value })
        .eq('id', experimentId);

      const controlVariant = variants.find(v => v.is_control);
      const varB = variants.find(v => !v.is_control);
      if (controlVariant) {
        await (supabase as any)
          .from('experiment_variants')
          .update({ weight: value })
          .eq('id', controlVariant.id);
      }
      if (varB) {
        await (supabase as any)
          .from('experiment_variants')
          .update({ weight: 100 - value })
          .eq('id', varB.id);
      }

      setExperiment(prev => prev ? { ...prev, traffic_percentage: value } : prev);
      setSavingTraffic(false);
    }, 500);
  };

  // Reset variant B to original block data
  const handleUndo = () => {
    if (!selectedBlockId) return;
    const block = blocks.find(b => b.id === selectedBlockId);
    if (block) {
      setVariantBlockData(JSON.parse(JSON.stringify(block.data)));
      showToast('Variante restaurada ao original', 'success');
    }
    setShowUndoModal(false);
  };

  // Delete experiment + variants and redirect
  const handleDelete = async () => {
    setDeleting(true);

    // Delete variants first (FK constraint)
    await (supabase as any)
      .from('experiment_variants')
      .delete()
      .eq('experiment_id', experimentId);

    // Delete experiment
    const { error } = await (supabase as any)
      .from('experiments')
      .delete()
      .eq('id', experimentId);

    if (error) {
      showToast('Erro ao excluir experimento', 'error');
      setDeleting(false);
      setShowDeleteModal(false);
      return;
    }

    router.push('/experiments');
  };

  // Rename experiment (debounced)
  const handleNameChange = (value: string) => {
    setEditName(value);
    if (nameTimeout.current) clearTimeout(nameTimeout.current);
    nameTimeout.current = setTimeout(async () => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const { error } = await (supabase as any)
        .from('experiments')
        .update({ name: trimmed })
        .eq('id', experimentId);
      if (!error) {
        setExperiment(prev => prev ? { ...prev, name: trimmed } : prev);
      }
    }, 600);
  };

  // Change experiment status
  const handleStatusChange = async (newStatus: StatusType) => {
    const updates: any = { status: newStatus };
    if (newStatus === 'running') updates.started_at = new Date().toISOString();
    if (newStatus === 'completed') updates.ended_at = new Date().toISOString();

    const { error } = await (supabase as any)
      .from('experiments')
      .update(updates)
      .eq('id', experimentId);

    if (error) {
      showToast('Erro ao alterar status', 'error');
    } else {
      setExperiment(prev => prev ? { ...prev, status: newStatus } : prev);
      const labels: Record<string, string> = { draft: 'Rascunho', running: 'Rodando', paused: 'Pausado', completed: 'Concluído' };
      showToast(`Status alterado para ${labels[newStatus] || newStatus}`, 'success');
    }
  };

  // Open preview with variant B applied
  const handlePreview = () => {
    if (!pageSlug) {
      showToast('Página não encontrada', 'error');
      return;
    }
    // Pass experiment ID + variant param so the landing can apply the variant
    const url = `${LANDING_URL}/p/${pageSlug}?experiment=${experimentId}&variant=b`;
    window.open(url, '_blank');
  };

  const renderEditor = (block: Block, data: any, onUpdate: (b: Block) => void) => {
    const fakeBlock = { ...block, data } as Block;
    switch (block.type) {
      case 'hero': return <HeroEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      case 'vision': return <VisionEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      case 'growth': return <GrowthEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      case 'integrated': return <IntegratedEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      case 'results': return <ResultsEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      case 'faq': return <FAQEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      case 'navbar': return <NavbarEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      case 'footer': return <FooterEditor block={fakeBlock as any} onUpdate={onUpdate as any} />;
      default: return <p>Editor indisponível</p>;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  if (!experiment) return null;

  const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        {/* ====== SIDEBAR ====== */}
        <div className={styles.sidebar}>
          {/* Header */}
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTopRow}>
              <BrandMark size={20} />
              <div className={styles.topRowSpacer} />
              <button className={styles.topBtn} onClick={handlePreview} title="Preview">
                <Icon name="eye-on" size={18} />
              </button>
              <button className={styles.topBtn} onClick={() => router.push('/experiments')} title="Fechar">
                <Icon name="close-x" size={18} />
              </button>
            </div>

            <div className={styles.aboutRow}>
              <input
                className={styles.experimentTitle}
                value={editName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                spellCheck={false}
              />
              <StatusBadge
                status={experiment.status as StatusType}
                size="md"
                onStatusChange={(s) => handleStatusChange(s)}
              />
            </div>

            <div className={styles.trafficCard}>
              <div className={styles.trafficHeader}>
                <span className={styles.trafficLabel}>Distribuição de tráfego</span>
                {savingTraffic && <span className={styles.trafficSaving}>Salvando...</span>}
              </div>
              <div className={styles.trafficBarContainer}>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={trafficPct}
                  onChange={(e) => handleTrafficChange(parseInt(e.target.value))}
                  className={styles.trafficRange}
                  style={{
                    background: `linear-gradient(to right, #eb0033 0%, #eb0033 ${((trafficPct - 10) / 80) * 100}%, rgba(120,120,120,0.2) ${((trafficPct - 10) / 80) * 100}%, rgba(120,120,120,0.2) 100%)`,
                  }}
                />
                <span className={styles.trafficText}>
                  {trafficPct}% controle &nbsp;|&nbsp; {100 - trafficPct}% variante
                </span>
              </div>
            </div>
          </div>

          {/* Block list */}
          <div className={styles.blockListSection}>
            <span className={styles.blockListLabel}>Selecione um bloco</span>
            <div className={styles.blockList}>
              {blocks.map((block) => (
                <button
                  key={block.id}
                  className={`${styles.blockItem} ${selectedBlockId === block.id ? styles.blockItemActive : ''}`}
                  onClick={() => handleSelectBlock(block.id)}
                >
                  <span className={styles.blockIcon}>
                    <Icon name={typeIcons[block.type] || 'grid-dashboard-bento'} size={20} />
                  </span>
                  <div className={styles.blockInfo}>
                    <span className={styles.blockName}>{typeLabels[block.type] || block.type}</span>
                    <span className={styles.blockId}>{block.id}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer — floating with blur */}
          <div className={styles.sidebarFooter}>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving || !selectedBlockId}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <div className={styles.footerSecondaryRow}>
              <button
                className={styles.undoBtn}
                onClick={() => setShowUndoModal(true)}
                disabled={!selectedBlockId || !variantBlockData}
              >
                Desfazer
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => setShowDeleteModal(true)}
              >
                Excluir teste
              </button>
            </div>
          </div>
        </div>

        {/* ====== MAIN AREA ====== */}
        <div className={styles.mainArea}>
          {selectedBlock ? (
            <>
              {/* Panel A — Controle */}
              <div className={styles.editorPanel}>
                <div className={styles.panelLabel}>
                  <span className={styles.panelBadgeA}>A</span>
                  Controle (original)
                </div>
                <div className={styles.panelBody}>
                  <div className={styles.panelDisabled}>
                    {renderEditor(selectedBlock, selectedBlock.data, () => {})}
                  </div>
                </div>
              </div>

              {/* Panel B — Variante */}
              <div className={styles.editorPanel}>
                <div className={styles.panelLabel}>
                  <span className={styles.panelBadgeB}>B</span>
                  Variante
                </div>
                <div className={styles.panelBody}>
                  {variantBlockData && renderEditor(
                    selectedBlock,
                    variantBlockData,
                    (updated: Block) => setVariantBlockData(updated.data)
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.editorPanel}>
                <span className={styles.emptyHint}>Selecione um bloco na barra lateral para visualizar o conteúdo original</span>
              </div>
              <div className={styles.editorPanel}>
                <span className={styles.emptyHint}>A variante editável aparecerá aqui após selecionar um bloco</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Undo confirmation modal */}
      <Modal
        open={showUndoModal}
        onClose={() => setShowUndoModal(false)}
        title="Desfazer alterações?"
        description="A variante B será restaurada ao conteúdo original do bloco. As edições não salvas serão perdidas."
        icon={<Icon name="chevron-left" size={22} />}
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowUndoModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleUndo}>Restaurar original</Button>
          </>
        }
      />

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => !deleting && setShowDeleteModal(false)}
        title="Excluir experimento?"
        description={`O experimento ${experiment?.name} e todas as suas variantes serão excluídos permanentemente. Essa ação não pode ser desfeita.`}
        icon={<Icon name="chevron-down" size={22} />}
        variant="danger"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Excluindo...' : 'Excluir'}</Button>
          </>
        }
      />

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}
