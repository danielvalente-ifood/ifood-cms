'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { Sidebar } from '@/components/Sidebar';
import { FolderCard } from '@/components/FolderCard/FolderCard';
import { Icon } from '@/components/Icon/Icon';
import { Button } from '@/components/ui/button';
import {
  fetchMediaFolders,
  fetchAssets,
  renameMedia,
  replaceMedia,
  deleteMedia,
  updateAssetTags,
  downloadAsset,
  getMediaType,
  formatFileSize,
} from '@/lib/media';
import type { MediaFolder } from '@/lib/media';
import type { Asset } from '@/types/database';
import styles from './media.module.css';

type ViewMode = 'grid' | 'list';
type TypeFilter = 'all' | 'image' | 'video' | 'pdf' | 'other';

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function MediaIndexPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset[] | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [copied, setCopied] = useState(false);
  const [dimensions, setDimensions] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [busted, setBusted] = useState<Record<string, number>>({});

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const activeAsset = selectedAsset?.[0] || null;

  const loadData = useCallback(async () => {
    setLoading(true);
    const [f, a] = await Promise.all([
      fetchMediaFolders(),
      fetchAssets(undefined)
    ]);
    setFolders(f);
    setAssets(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // src com cache-bust (após substituir) e ?ar=1 p/ SVG
  const srcFor = (a: Asset) => {
    const params: string[] = [];
    if (a.file_type === 'image/svg+xml') params.push('ar=1');
    if (busted[a.id]) params.push(`t=${busted[a.id]}`);
    return params.length ? `${a.file_url}?${params.join('&')}` : a.file_url;
  };

  // ---- Animação de abertura do painel (GSAP) ----
  const isOpen = !!activeAsset;
  useEffect(() => {
    if (isOpen && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { xPercent: -8, autoAlpha: 0 },
        { xPercent: 0, autoAlpha: 1, duration: 0.4, ease: 'power3.out' },
      );
    }
  }, [isOpen]);

  // Fecha com animação de saída e só então desmonta
  const requestClose = useCallback(() => {
    const el = panelRef.current;
    if (!el) { setSelectedAsset(null); return; }
    gsap.to(el, {
      xPercent: -8,
      autoAlpha: 0,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => setSelectedAsset(null),
    });
  }, []);

  // ---- Fecha o painel ao clicar fora (ignora cliques em cards/diálogos) ----
  useEffect(() => {
    if (!activeAsset) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current?.contains(target)) return;
      if (target.closest('[data-asset-card]')) return;
      if (target.closest('[role="dialog"]')) return;
      requestClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [activeAsset, requestClose]);

  // ---- Compute image dimensions when a new asset is selected ----
  useEffect(() => {
    setDimensions(null);
    if (activeAsset && getMediaType(activeAsset.file_type) === 'image') {
      const img = new window.Image();
      img.onload = () => setDimensions(`${img.naturalWidth} × ${img.naturalHeight} px`);
      img.src = srcFor(activeAsset);
    }
  }, [activeAsset, busted]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = assets.filter(a => {
    const matchSearch = !search || (a.file_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || getMediaType(a.file_type) === typeFilter;
    return matchSearch && matchType;
  });

  const showToast = (message: string, type: Toast['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const selectAsset = (asset: Asset) => {
    setSelectedAsset([asset]);
    const base = asset.file_name?.includes('.')
      ? asset.file_name.slice(0, asset.file_name.lastIndexOf('.'))
      : asset.file_name ?? '';
    setEditName(base);
  };

  const handleSave = async () => {
    if (!activeAsset || !editName.trim()) return;
    setSaving(true);
    const folder = folders.find(f => f.vertical?.id === activeAsset.vertical_id);
    const verticalSlug = folder ? folder.slug : null;
    const { error } = await renameMedia(activeAsset, editName.trim(), verticalSlug);
    setSaving(false);
    if (error) { showToast('Erro ao renomear: ' + error, 'error'); return; }
    showToast('Renomeado com sucesso', 'success');
    await loadData();
    setSelectedAsset(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await deleteMedia(deleteTarget);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) { showToast('Erro ao excluir: ' + error, 'error'); return; }
    showToast('Arquivo excluído', 'success');
    if (activeAsset?.id === deleteTarget.id) setSelectedAsset(null);
    await loadData();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Link copiado!', 'success');
  };

  const handleDownload = async () => {
    if (!activeAsset) return;
    setDownloading(true);
    try { await downloadAsset(activeAsset.file_url, activeAsset.file_name ?? 'download'); }
    catch { showToast('Erro ao baixar', 'error'); }
    setDownloading(false);
  };

  const handleReplace = async (files: FileList | null) => {
    if (!files || files.length === 0 || !activeAsset) return;
    setReplacing(true);
    const { error } = await replaceMedia(activeAsset, files[0]);
    setReplacing(false);
    if (error) { showToast('Erro ao substituir: ' + error, 'error'); return; }
    const updated = { ...activeAsset, file_size: files[0].size, file_type: files[0].type };
    setBusted(prev => ({ ...prev, [updated.id]: Date.now() }));
    setSelectedAsset([updated]);
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    setDimensions(null);
    showToast('Imagem substituída — aplicada onde estiver em uso', 'success');
  };

  const persistTags = async (asset: Asset, tags: string[]) => {
    setSelectedAsset([{ ...asset, tags }]);
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, tags } : a));
    const { error } = await updateAssetTags(asset.id, tags);
    if (error) showToast('Erro ao salvar tag', 'error');
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || !activeAsset) return;
    if (!activeAsset.tags.includes(t)) persistTags(activeAsset, [...activeAsset.tags, t]);
    setTagInput('');
    setAddingTag(false);
  };

  const removeTag = (t: string) => {
    if (!activeAsset) return;
    persistTags(activeAsset, activeAsset.tags.filter(x => x !== t));
  };

  const fitOnLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const box = img.parentElement;
    if (!box) return;
    const fill = img.naturalWidth >= box.clientWidth && img.naturalHeight >= box.clientHeight;
    img.style.objectFit = fill ? 'cover' : 'none';
  };

  const renderThumb = (asset: Asset, size: 'sm' | 'lg' = 'sm') => {
    if (getMediaType(asset.file_type) === 'image') {
      const isSvg = asset.file_type === 'image/svg+xml';
      return (
        <img
          src={srcFor(asset)}
          alt={asset.alt_text ?? asset.file_name ?? ''}
          loading="lazy"
          onLoad={isSvg ? undefined : fitOnLoad}
          style={isSvg ? { width: '55%', height: '55%', objectFit: 'contain' } : undefined}
        />
      );
    }
    return <span className={styles.assetThumbIcon}><Icon name="file-default" size={size === 'lg' ? 40 : 28} /></span>;
  };

  const isSearching = !!search || typeFilter !== 'all';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Biblioteca de Mídia</h1>
            <p>{assets.length} {assets.length === 1 ? 'asset' : 'assets'} no total — Imagens, vídeos e arquivos organizados por vertical</p>
          </div>
          {isSearching && (
            <div className={styles.headerRight}>
              <div className={styles.viewToggle} role="group" aria-label="Modo de exibição">
                <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('grid')} aria-label="Grade" title="Grade">
                  <Icon name="grid-dashboard-bento" size={16} />
                </button>
                <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')} aria-label="Lista" title="Lista">
                  <Icon name="file-default" size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toolbar: busca + tipo */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><Icon name="search" size={14} /></span>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Buscar em todas as pastas…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar arquivos"
            />
          </div>
          <div className={styles.typeFilter} role="group" aria-label="Filtrar por tipo">
            {(['all', 'image', 'video', 'pdf'] as TypeFilter[]).map(t => {
              const labels: Record<TypeFilter, string> = { all: 'Todos', image: 'Imagens', video: 'Vídeos', pdf: 'PDFs', other: 'Outros' };
              return (
                <button key={t} className={`${styles.typeBtn} ${typeFilter === t ? styles.typeBtnActive : ''}`} onClick={() => setTypeFilter(t)}>
                  {labels[t]}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className={styles.empty}><p>Carregando…</p></div>
        ) : !isSearching ? (
          <div className={styles.folderGrid}>
            {folders.map((folder) => (
              <FolderCard
                key={folder.slug}
                folder={folder}
                onClick={() => router.push(`/media/${folder.slug}`)}
              />
            ))}
          </div>
        ) : (
          /* Seção de resultados da busca */
          <div className={styles.dropArea}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>
                <Icon name="folder" size={40} />
                <p>Nenhum arquivo encontrado.</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className={styles.grid}>
                {filtered.map(asset => (
                  <div
                    key={asset.id}
                    className={`${styles.assetCard} ${activeAsset?.id === asset.id ? styles.assetCardSelected : ''}`}
                    data-asset-card
                    onClick={() => selectAsset(asset)}
                    role="button" tabIndex={0}
                    aria-label={asset.file_name ?? 'arquivo'}
                    onKeyDown={e => e.key === 'Enter' && selectAsset(asset)}
                  >
                    <div className={styles.assetThumb}>
                      {renderThumb(asset)}
                      {activeAsset?.id === asset.id && (
                        <span className={styles.selectedCheck}><Icon name="check" size={14} /></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.listView}>
                {filtered.map(asset => (
                  <div
                    key={asset.id}
                    className={`${styles.listRow} ${activeAsset?.id === asset.id ? styles.listRowSelected : ''}`}
                    data-asset-card
                    onClick={() => selectAsset(asset)}
                    role="button" tabIndex={0}
                    aria-label={asset.file_name ?? 'arquivo'}
                    onKeyDown={e => e.key === 'Enter' && selectAsset(asset)}
                  >
                    <div className={styles.listThumb}>{renderThumb(asset, 'sm')}</div>
                    <div className={styles.listInfo}>
                      <p className={styles.listName}>{asset.file_name}</p>
                      <p className={styles.listMeta}>{getMediaType(asset.file_type).toUpperCase()} · {formatFileSize(asset.file_size)} · {new Date(asset.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Painel Asset Details */}
      {activeAsset && (
        <aside ref={panelRef} className={styles.detailPanel} aria-label="Detalhes do arquivo">
          <div className={styles.detailHeader}>
            <span className={styles.detailHeaderTitle}>Detalhes do Asset</span>
            <button className={styles.detailCloseBtn} onClick={requestClose} aria-label="Fechar painel">
              <Icon name="close-x" size={16} />
            </button>
          </div>

          <div className={styles.detailPreview}>
            {getMediaType(activeAsset.file_type) === 'image'
              ? <img
                src={srcFor(activeAsset)}
                alt={activeAsset.alt_text ?? activeAsset.file_name ?? ''}
                style={activeAsset.file_type === 'image/svg+xml' ? { width: '55%', height: '55%', objectFit: 'contain' } : undefined}
              />
              : <span className={styles.detailPreviewIcon}><Icon name="file-default" size={48} /></span>}
          </div>

          {/* Nome (rename inline) */}
          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Nome</span>
            <input className={styles.detailInput} value={editName} onChange={e => setEditName(e.target.value)} onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} aria-label="Renomear arquivo" />
          </div>

          {/* Pasta originária */}
          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Pasta</span>
            <span className={styles.detailValue}>
              {folders.find(f => f.vertical?.id === activeAsset.vertical_id)?.name || 'Global'}
            </span>
          </div>

          {/* Tamanho + Tipo */}
          <div className={styles.detailRow}>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Tamanho</span>
              <span className={styles.detailValue}>{formatFileSize(activeAsset.file_size)}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Tipo</span>
              <span className={styles.detailValue}>{activeAsset.file_type}</span>
            </div>
          </div>

          {/* Dimensões */}
          {getMediaType(activeAsset.file_type) === 'image' && (
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Dimensões</span>
              <span className={styles.detailValue}>{dimensions ?? '…'}</span>
            </div>
          )}

          {/* Criado */}
          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Criado</span>
            <span className={styles.detailValue}>{new Date(activeAsset.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Tags */}
          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Tags</span>
            <div className={styles.tagList}>
              {activeAsset.tags.map(t => (
                <span key={t} className={styles.tag}>
                  {t}
                  <button className={styles.tagRemove} onClick={() => removeTag(t)} aria-label={`Remover tag ${t}`}>
                    <Icon name="close-x" size={10} />
                  </button>
                </span>
              ))}
              {addingTag ? (
                <input
                  className={styles.tagInput}
                  value={tagInput}
                  autoFocus
                  placeholder="nova tag"
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addTag(); if (e.key === 'Escape') { setAddingTag(false); setTagInput(''); } }}
                  onBlur={addTag}
                />
              ) : (
                <button className={styles.tagAdd} onClick={() => setAddingTag(true)}>
                  Adicionar tag
                </button>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className={styles.detailActions}>
            <Button variant="primary" className={styles.fullBtn} onClick={() => replaceInputRef.current?.click()} loading={replacing}>
              <Icon name="upload" size={14} />
              Substituir imagem
            </Button>
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              style={{ display: 'none' }}
              onChange={e => { handleReplace(e.target.files); e.target.value = ''; }}
            />
            <Button variant="secondary" className={styles.fullBtn} onClick={handleDownload} loading={downloading}>
              <Icon name="upload" size={14} />
              Baixar arquivo
            </Button>
            <Button variant="secondary" className={styles.fullBtn} onClick={() => copyUrl(activeAsset.file_url)}>
              <Icon name="copy-default" size={14} />
              {copied ? 'Copiado!' : 'Copiar link'}
            </Button>
            <Button variant="danger" className={styles.fullBtn} onClick={() => setDeleteTarget(activeAsset)} disabled={deleting}>
              <Icon name="delete-dustbin-01" size={14} />
              Mover para lixeira
            </Button>
          </div>
        </aside>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-label="Confirmar exclusão">
          <div className={styles.dialog}>
            <h3>Excluir arquivo?</h3>
            <p><strong>{deleteTarget.file_name}</strong> será removido permanentemente do storage e do banco de dados. Esta ação não pode ser desfeita.</p>
            <div className={styles.dialogActions}>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>{toast.message}</div>
      )}
    </div>
  );
}
