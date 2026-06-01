'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Icon } from '@/components/Icon/Icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import {
  uploadMedia,
  renameMedia,
  replaceMedia,
  deleteMedia,
  fetchAssets,
  resolveFolderVertical,
  updateAssetTags,
  downloadAsset,
  getMediaType,
  formatFileSize,
} from '@/lib/media';
import type { Asset } from '@/types/database';
import styles from '../media.module.css';

type ViewMode = 'grid' | 'list';
type TypeFilter = 'all' | 'image' | 'video' | 'pdf' | 'other';

interface UploadItem { name: string; status: 'uploading' | 'done' | 'error'; }
interface Toast { message: string; type: 'success' | 'error'; }
interface Folder { verticalId: string | null; name: string; slug: string; }

export default function MediaFolderPage() {
  const params = useParams();
  const slug = params.vertical as string;
  const { user } = useAuth();

  const [folder, setFolder] = useState<Folder | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [copied, setCopied] = useState(false);
  const [dimensions, setDimensions] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [busted, setBusted] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const panelRef = useRef<HTMLElement>(null);

  // src com cache-bust (após substituir) e ?ar=1 p/ SVG
  const srcFor = (a: Asset) => {
    const params: string[] = [];
    if (a.file_type === 'image/svg+xml') params.push('ar=1');
    if (busted[a.id]) params.push(`t=${busted[a.id]}`);
    return params.length ? `${a.file_url}?${params.join('&')}` : a.file_url;
  };

  // ---- Fecha o painel ao clicar fora (ignora cliques em cards/diálogos) ----
  useEffect(() => {
    if (!selectedAsset) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (panelRef.current?.contains(target)) return;       // dentro do painel
      if (target.closest('[data-asset-card]')) return;       // clicou num card (troca seleção)
      if (target.closest('[role="dialog"]')) return;         // diálogo de exclusão
      setSelectedAsset(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [selectedAsset]);

  // ---- Resolve folder ----
  useEffect(() => {
    resolveFolderVertical(slug).then((f) => {
      if (!f) { setNotFound(true); setLoading(false); return; }
      setFolder(f);
    });
  }, [slug]);

  // ---- Load assets ----
  const loadAssets = useCallback(async () => {
    if (!folder) return;
    setLoading(true);
    setSelectedAsset(null);
    const data = await fetchAssets(folder.verticalId);
    setAssets(data);
    setLoading(false);
  }, [folder]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  // ---- Compute image dimensions when a new asset is selected ----
  useEffect(() => {
    setDimensions(null);
    if (selectedAsset && getMediaType(selectedAsset.file_type) === 'image') {
      const img = new window.Image();
      img.onload = () => setDimensions(`${img.naturalWidth} × ${img.naturalHeight} px`);
      img.src = srcFor(selectedAsset);
    }
  }, [selectedAsset, busted]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = assets.filter(a => {
    const matchSearch = !search || (a.file_name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || getMediaType(a.file_type) === typeFilter;
    return matchSearch && matchType;
  });

  const showToast = (message: string, type: Toast['type']) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !folder) return;
    const items: UploadItem[] = Array.from(files).map(f => ({ name: f.name, status: 'uploading' }));
    setUploads(items);
    for (let i = 0; i < files.length; i++) {
      const { error } = await uploadMedia({
        file: files[i],
        verticalId: folder.verticalId,
        verticalSlug: folder.verticalId ? folder.slug : null,
        uploadedBy: user?.id ?? null,
      });
      setUploads(prev => prev.map((u, idx) => idx === i ? { ...u, status: error ? 'error' : 'done' } : u));
    }
    await loadAssets();
    setTimeout(() => setUploads([]), 2000);
    showToast(`${files.length} arquivo(s) enviado(s)`, 'success');
  };

  // ---- Drag & drop sobre o grid (estilo Drive) ----
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) { dragCounter.current++; setIsDragging(true); }
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) { setIsDragging(false); dragCounter.current = 0; }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    handleFiles(e.dataTransfer.files);
  };

  const selectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    const base = asset.file_name?.includes('.')
      ? asset.file_name.slice(0, asset.file_name.lastIndexOf('.'))
      : asset.file_name ?? '';
    setEditName(base);
  };

  const handleSave = async () => {
    if (!selectedAsset || !editName.trim() || !folder) return;
    setSaving(true);
    const { error } = await renameMedia(selectedAsset, editName.trim(), folder.verticalId ? folder.slug : null);
    setSaving(false);
    if (error) { showToast('Erro ao renomear: ' + error, 'error'); return; }
    showToast('Renomeado com sucesso', 'success');
    await loadAssets();
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
    if (selectedAsset?.id === deleteTarget.id) setSelectedAsset(null);
    await loadAssets();
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Link copiado!', 'success');
  };

  const handleDownload = async () => {
    if (!selectedAsset) return;
    setDownloading(true);
    try { await downloadAsset(selectedAsset.file_url, selectedAsset.file_name ?? 'download'); }
    catch { showToast('Erro ao baixar', 'error'); }
    setDownloading(false);
  };

  const handleReplace = async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedAsset) return;
    setReplacing(true);
    const { error } = await replaceMedia(selectedAsset, files[0]);
    setReplacing(false);
    if (error) { showToast('Erro ao substituir: ' + error, 'error'); return; }
    const updated = { ...selectedAsset, file_size: files[0].size, file_type: files[0].type };
    setBusted(prev => ({ ...prev, [updated.id]: Date.now() }));
    setSelectedAsset(updated);
    setAssets(prev => prev.map(a => a.id === updated.id ? updated : a));
    setDimensions(null);
    showToast('Imagem substituída — aplicada onde estiver em uso', 'success');
  };

  // ---- Tags ----
  const persistTags = async (asset: Asset, tags: string[]) => {
    setSelectedAsset({ ...asset, tags });
    setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, tags } : a));
    const { error } = await updateAssetTags(asset.id, tags);
    if (error) showToast('Erro ao salvar tag', 'error');
  };
  const addTag = () => {
    const t = tagInput.trim();
    if (!t || !selectedAsset) return;
    if (!selectedAsset.tags.includes(t)) persistTags(selectedAsset, [...selectedAsset.tags, t]);
    setTagInput('');
    setAddingTag(false);
  };
  const removeTag = (t: string) => {
    if (!selectedAsset) return;
    persistTags(selectedAsset, selectedAsset.tags.filter(x => x !== t));
  };

  // Imagem maior que o container → cover (preenche, corta um pouco).
  // Imagem menor → tamanho natural centralizada (não amplia/estoura).
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
      // SVG: sempre contain (preserva proporção, nunca estica). Raster:
      // cover/natural via fitOnLoad. srcFor adiciona ?ar=1/cache-bust.
      return (
        <img
          src={srcFor(asset)}
          alt={asset.alt_text ?? asset.file_name ?? ''}
          loading="lazy"
          onLoad={isSvg ? undefined : fitOnLoad}
          // SVG: tamanho modesto centralizado (não preenche o container)
          style={isSvg ? { width: '55%', height: '55%', objectFit: 'contain' } : undefined}
        />
      );
    }
    return <span className={styles.assetThumbIcon}><Icon name="file-default" size={size === 'lg' ? 40 : 28} /></span>;
  };

  if (notFound) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}>
          <div className={styles.empty}>
            <Icon name="folder" size={40} />
            <p>Pasta não encontrada.</p>
            <Link href="/media" className={styles.breadcrumbLink}>← Voltar para Mídia</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <nav className={styles.breadcrumb} aria-label="Trilha">
              <Link href="/media" className={styles.breadcrumbLink}>
                <Icon name="chevron-left" size={14} /> Mídia
              </Link>
            </nav>
            <h1>{folder?.name ?? '…'}</h1>
            <p>{assets.length} {assets.length === 1 ? 'asset no total' : 'assets no total'}</p>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.viewToggle} role="group" aria-label="Modo de exibição">
              <button className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('grid')} aria-label="Grade" title="Grade">
                <Icon name="grid-dashboard-bento" size={16} />
              </button>
              <button className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setViewMode('list')} aria-label="Lista" title="Lista">
                <Icon name="file-default" size={16} />
              </button>
            </div>
            <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" size={16} />
              Upload
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*,application/pdf" multiple style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
          </div>
        </div>

        {/* Toolbar: busca + tipo */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><Icon name="search" size={14} /></span>
            <input className={styles.searchInput} type="search" placeholder="Buscar por nome…" value={search} onChange={e => setSearch(e.target.value)} aria-label="Buscar arquivos" />
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

        {/* Upload progress */}
        {uploads.length > 0 && (
          <div className={styles.uploadProgress}>
            {uploads.map((u, i) => (
              <div key={i} className={styles.uploadItem}>
                <Icon name={u.status === 'done' ? 'eye-on' : u.status === 'error' ? 'close-x' : 'file-default'} size={14} />
                <span className={styles.uploadItemName}>{u.name}</span>
                <span className={styles.uploadItemStatus}>{u.status === 'uploading' ? 'Enviando…' : u.status === 'done' ? 'Concluído' : 'Erro'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Área de conteúdo = drop target estilo Drive */}
        <div
          className={styles.dropArea}
          onDragEnter={onDragEnter}
          onDragOver={e => e.preventDefault()}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {isDragging && (
            <div className={styles.dropOverlay}>
              <Icon name="upload" size={32} />
              <p>Solte os arquivos para enviar para <strong>{folder?.name}</strong></p>
            </div>
          )}

          {loading ? (
            <div className={styles.empty}><p>Carregando…</p></div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="folder" size={40} />
              <p>{search ? 'Nenhum arquivo encontrado.' : 'Pasta vazia — arraste arquivos aqui ou use Upload.'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className={styles.grid}>
              {filtered.map(asset => (
                <div
                  key={asset.id}
                  className={`${styles.assetCard} ${selectedAsset?.id === asset.id ? styles.assetCardSelected : ''}`}
                  data-asset-card
                  onClick={() => selectAsset(asset)}
                  role="button" tabIndex={0}
                  aria-label={asset.file_name ?? 'arquivo'}
                  onKeyDown={e => e.key === 'Enter' && selectAsset(asset)}
                >
                  <div className={styles.assetThumb}>
                    {renderThumb(asset)}
                    {selectedAsset?.id === asset.id && (
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
                  className={`${styles.listRow} ${selectedAsset?.id === asset.id ? styles.listRowSelected : ''}`}
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
      </main>

      {/* Painel Asset Details */}
      {selectedAsset && (
        <aside ref={panelRef} className={styles.detailPanel} aria-label="Detalhes do arquivo">
          <div className={styles.detailHeader}>
            <span className={styles.detailHeaderTitle}>Detalhes do Asset</span>
            <button className={styles.detailCloseBtn} onClick={() => setSelectedAsset(null)} aria-label="Fechar painel">
              <Icon name="close-x" size={16} />
            </button>
          </div>

          <div className={styles.detailPreview}>
            {getMediaType(selectedAsset.file_type) === 'image'
              ? <img
                  src={srcFor(selectedAsset)}
                  alt={selectedAsset.alt_text ?? selectedAsset.file_name ?? ''}
                  style={selectedAsset.file_type === 'image/svg+xml' ? { width: '55%', height: '55%', objectFit: 'contain' } : undefined}
                />
              : <span className={styles.detailPreviewIcon}><Icon name="file-default" size={48} /></span>}
          </div>

          {/* Nome (rename inline) */}
          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Nome</span>
            <input className={styles.detailInput} value={editName} onChange={e => setEditName(e.target.value)} onBlur={handleSave} onKeyDown={e => e.key === 'Enter' && handleSave()} aria-label="Renomear arquivo" />
          </div>

          {/* Tamanho + Tipo */}
          <div className={styles.detailRow}>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Tamanho</span>
              <span className={styles.detailValue}>{formatFileSize(selectedAsset.file_size)}</span>
            </div>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Tipo</span>
              <span className={styles.detailValue}>{selectedAsset.file_type}</span>
            </div>
          </div>

          {/* Dimensões */}
          {getMediaType(selectedAsset.file_type) === 'image' && (
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Dimensões</span>
              <span className={styles.detailValue}>{dimensions ?? '…'}</span>
            </div>
          )}

          {/* Criado */}
          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Criado</span>
            <span className={styles.detailValue}>{new Date(selectedAsset.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          {/* Tags */}
          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Tags</span>
            <div className={styles.tagList}>
              {selectedAsset.tags.map(t => (
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
            <Button variant="secondary" className={styles.fullBtn} onClick={() => copyUrl(selectedAsset.file_url)}>
              <Icon name="copy-default" size={14} />
              {copied ? 'Copiado!' : 'Copiar link'}
            </Button>
            <Button variant="danger" className={styles.fullBtn} onClick={() => setDeleteTarget(selectedAsset)} disabled={deleting}>
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
