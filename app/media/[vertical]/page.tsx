'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Icon } from '@/components/Icon/Icon';
import { useAuth } from '@/components/AuthProvider';
import {
  uploadMedia,
  renameMedia,
  deleteMedia,
  fetchAssets,
  resolveFolderVertical,
  getMediaType,
  formatFileSize,
} from '@/lib/media';
import type { Asset } from '@/types/database';
import styles from '../media.module.css';

type ViewMode = 'grid' | 'list';
type TypeFilter = 'all' | 'image' | 'video' | 'pdf' | 'other';

interface UploadItem {
  name: string;
  status: 'uploading' | 'done' | 'error';
}

interface Toast {
  message: string;
  type: 'success' | 'error';
}

interface Folder {
  verticalId: string | null;
  name: string;
  slug: string;
}

export default function MediaFolderPage() {
  const params = useParams();
  const router = useRouter();
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
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Resolve folder from slug ----
  useEffect(() => {
    resolveFolderVertical(slug).then((f) => {
      if (!f) { setNotFound(true); setLoading(false); return; }
      setFolder(f);
    });
  }, [slug]);

  // ---- Load assets for this folder ----
  const loadAssets = useCallback(async () => {
    if (!folder) return;
    setLoading(true);
    setSelectedAsset(null);
    const data = await fetchAssets(folder.verticalId);
    setAssets(data);
    setLoading(false);
  }, [folder]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

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

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
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
    showToast('URL copiada!', 'success');
  };

  const renderThumb = (asset: Asset, size: 'sm' | 'lg' = 'sm') => {
    const type = getMediaType(asset.file_type);
    if (type === 'image') {
      return <img src={asset.file_url} alt={asset.alt_text ?? asset.file_name ?? ''} loading="lazy" />;
    }
    return (
      <span className={styles.assetThumbIcon}>
        <Icon name="file-default" size={size === 'lg' ? 40 : 28} />
      </span>
    );
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
        {/* Breadcrumb + header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <nav className={styles.breadcrumb} aria-label="Trilha">
              <Link href="/media" className={styles.breadcrumbLink}>
                <Icon name="chevron-left" size={14} /> Mídia
              </Link>
            </nav>
            <h1>{folder?.name ?? '…'}</h1>
            <p>Gerencie imagens, vídeos e arquivos desta pasta</p>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.btnUpload} onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" size={16} />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
        </div>

        {/* Upload progress */}
        {uploads.length > 0 && (
          <div className={styles.uploadProgress}>
            {uploads.map((u, i) => (
              <div key={i} className={styles.uploadItem}>
                <Icon name={u.status === 'done' ? 'eye-on' : u.status === 'error' ? 'close-x' : 'file-default'} size={14} />
                <span className={styles.uploadItemName}>{u.name}</span>
                <span className={styles.uploadItemStatus}>
                  {u.status === 'uploading' ? 'Enviando…' : u.status === 'done' ? 'Concluído' : 'Erro'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDragOver={e => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          aria-label="Área de upload — clique ou arraste arquivos aqui"
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <div className={styles.dropIcon}>
            <Icon name="upload" size={28} />
          </div>
          <p>Arraste arquivos aqui ou <strong>clique para selecionar</strong></p>
          <span>Imagens, vídeos e PDFs · máx. 50 MB por arquivo</span>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><Icon name="barchart-default" size={14} /></span>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Buscar por nome…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Buscar arquivos"
            />
          </div>

          <div className={styles.typeFilter} role="group" aria-label="Filtrar por tipo">
            {(['all', 'image', 'video', 'pdf'] as TypeFilter[]).map(t => {
              const labels: Record<TypeFilter, string> = { all: 'Todos', image: 'Imagens', video: 'Vídeos', pdf: 'PDFs', other: 'Outros' };
              return (
                <button
                  key={t}
                  className={`${styles.typeBtn} ${typeFilter === t ? styles.typeBtnActive : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {labels[t]}
                </button>
              );
            })}
          </div>

          <div className={styles.viewToggle} role="group" aria-label="Modo de exibição">
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('grid')}
              aria-label="Grade"
              title="Grade"
            >
              <Icon name="grid-dashboard-bento" size={16} />
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
              onClick={() => setViewMode('list')}
              aria-label="Lista"
              title="Lista"
            >
              <Icon name="file-default" size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className={styles.empty}><p>Carregando…</p></div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <Icon name="file-default" size={40} />
            <p>{search ? 'Nenhum arquivo encontrado para esta busca.' : 'Nenhum arquivo nesta pasta ainda.'}</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className={styles.grid}>
            {filtered.map(asset => (
              <div
                key={asset.id}
                className={`${styles.assetCard} ${selectedAsset?.id === asset.id ? styles.assetCardSelected : ''}`}
                onClick={() => selectAsset(asset)}
                role="button"
                tabIndex={0}
                aria-label={asset.file_name ?? 'arquivo'}
                onKeyDown={e => e.key === 'Enter' && selectAsset(asset)}
              >
                <div className={styles.assetThumb}>
                  {renderThumb(asset)}
                  <div className={styles.assetOverlay}>
                    <div className={styles.overlayActions}>
                      <button
                        className={styles.overlayBtn}
                        title="Copiar URL"
                        onClick={e => { e.stopPropagation(); copyUrl(asset.file_url); }}
                        aria-label="Copiar URL"
                      >
                        <Icon name="copy-default" size={14} />
                      </button>
                      <button
                        className={`${styles.overlayBtn} ${styles.overlayBtnDanger}`}
                        title="Excluir"
                        onClick={e => { e.stopPropagation(); setDeleteTarget(asset); }}
                        aria-label="Excluir arquivo"
                      >
                        <Icon name="delete-dustbin-01" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className={styles.assetInfo}>
                  <p className={styles.assetName}>{asset.file_name}</p>
                  <p className={styles.assetMeta}>{formatFileSize(asset.file_size)}</p>
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
                onClick={() => selectAsset(asset)}
                role="button"
                tabIndex={0}
                aria-label={asset.file_name ?? 'arquivo'}
                onKeyDown={e => e.key === 'Enter' && selectAsset(asset)}
              >
                <div className={styles.listThumb}>{renderThumb(asset, 'sm')}</div>
                <div className={styles.listInfo}>
                  <p className={styles.listName}>{asset.file_name}</p>
                  <p className={styles.listMeta}>
                    {getMediaType(asset.file_type).toUpperCase()} · {formatFileSize(asset.file_size)} · {new Date(asset.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className={styles.listActions}>
                  <button
                    className={styles.listAction}
                    title="Copiar URL"
                    onClick={e => { e.stopPropagation(); copyUrl(asset.file_url); }}
                    aria-label="Copiar URL"
                  >
                    <Icon name="copy-default" size={14} />
                  </button>
                  <button
                    className={`${styles.listAction} ${styles.listActionDanger}`}
                    title="Excluir"
                    onClick={e => { e.stopPropagation(); setDeleteTarget(asset); }}
                    aria-label="Excluir arquivo"
                  >
                    <Icon name="delete-dustbin-01" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail / rename panel */}
      {selectedAsset && (
        <aside className={styles.detailPanel} aria-label="Detalhes do arquivo">
          <div className={styles.detailClose}>
            <span>Detalhes</span>
            <button className={styles.detailCloseBtn} onClick={() => setSelectedAsset(null)} aria-label="Fechar painel">
              <Icon name="chevron-right" size={16} />
            </button>
          </div>

          <div className={styles.detailPreview}>
            {getMediaType(selectedAsset.file_type) === 'image'
              ? <img src={selectedAsset.file_url} alt={selectedAsset.alt_text ?? selectedAsset.file_name ?? ''} />
              : <span className={styles.detailPreviewIcon}><Icon name="file-default" size={48} /></span>
            }
          </div>

          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Nome do arquivo</span>
            <input
              className={styles.detailInput}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              aria-label="Renomear arquivo"
            />
          </div>

          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Tipo</span>
            <span className={styles.detailValue}>{selectedAsset.file_type}</span>
          </div>

          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Tamanho</span>
            <span className={styles.detailValue}>{formatFileSize(selectedAsset.file_size)}</span>
          </div>

          <div className={styles.detailField}>
            <span className={styles.detailLabel}>Enviado em</span>
            <span className={styles.detailValue}>
              {new Date(selectedAsset.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className={styles.detailField}>
            <span className={styles.detailLabel}>URL pública</span>
            <span className={styles.detailValue} style={{ fontSize: '11px', wordBreak: 'break-all' }}>
              {selectedAsset.file_url}
            </span>
          </div>

          <div className={styles.detailActions}>
            <button className={styles.btnCopyUrl} onClick={() => copyUrl(selectedAsset.file_url)}>
              <Icon name="copy-default" size={14} />
              {copied ? 'Copiado!' : 'Copiar URL'}
            </button>
            <button className={styles.btnSave} onClick={handleSave} disabled={saving}>
              <Icon name="eye-on" size={14} />
              {saving ? 'Salvando…' : 'Salvar nome'}
            </button>
            <button className={styles.btnDelete} onClick={() => setDeleteTarget(selectedAsset)} disabled={deleting}>
              <Icon name="delete-dustbin-01" size={14} />
              Excluir arquivo
            </button>
          </div>
        </aside>
      )}

      {/* Delete confirm dialog */}
      {deleteTarget && (
        <div className={styles.dialogOverlay} role="dialog" aria-modal="true" aria-label="Confirmar exclusão">
          <div className={styles.dialog}>
            <h3>Excluir arquivo?</h3>
            <p>
              <strong>{deleteTarget.file_name}</strong> será removido permanentemente do storage e do banco de dados. Esta ação não pode ser desfeita.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.btnCancel} onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button className={styles.btnConfirmDelete} onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
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
