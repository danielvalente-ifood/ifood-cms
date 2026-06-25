'use client';

import { useState, useEffect, useCallback, useRef, type DragEvent } from 'react';
import { Icon } from '@/components/Icon/Icon';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/AuthProvider';
import {
  fetchAssets,
  uploadMedia,
  getMediaType,
  formatFileSize,
} from '@/lib/media';
import type { Asset } from '@/types/database';
import { useMediaContext } from './MediaContext';
import styles from './MediaPicker.module.css';

interface MediaPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  /** Only images by default (editors set image fields) */
  accept?: 'image' | 'all';
}

type Scope = 'vertical' | 'global';

interface FileProgress {
  name: string;
  status: 'uploading' | 'done' | 'error';
}

const DROP_ACCEPT: Record<string, string> = {
  image: 'image/*',
  all: 'image/*,video/*,application/pdf',
};

export function MediaPicker({ onSelect, onClose, accept = 'image' }: MediaPickerProps) {
  const { verticalId, verticalSlug } = useMediaContext();
  const { user } = useAuth();

  const [scope, setScope] = useState<Scope>(verticalId ? 'vertical' : 'global');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<FileProgress[]>([]);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const vid = scope === 'vertical' ? verticalId : null;
    const data = await fetchAssets(vid);
    setAssets(data);
    setLoading(false);
  }, [scope, verticalId]);

  useEffect(() => { load(); }, [load]);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = assets.filter(a => {
    const matchType = accept === 'all' || getMediaType(a.file_type) === 'image';
    const matchSearch = !search || (a.file_name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  /** Accepts files from both the file input and drag-and-drop */
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileArr = Array.from(files);
    setUploading(true);
    setQueue(fileArr.map(f => ({ name: f.name, status: 'uploading' as const })));

    const useVertical = scope === 'vertical';
    let autoSelect: string | null = null;

    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      const { asset } = await uploadMedia({
        file,
        verticalId: useVertical ? verticalId : null,
        verticalSlug: useVertical ? verticalSlug : null,
        uploadedBy: user?.id ?? null,
      });
      setQueue(prev => prev.map((q, idx) =>
        idx === i ? { ...q, status: asset ? 'done' : 'error' } : q,
      ));

      // If only one file was uploaded, auto-select it (legacy behavior)
      if (asset && fileArr.length === 1) {
        autoSelect = asset.file_url;
      }
    }

    setUploading(false);

    // Clear queue after a short delay so the user can see all "done" badges
    setTimeout(() => setQueue([]), 2000);
    await load();

    if (autoSelect) {
      onSelect(autoSelect);
      onClose();
    }
  }, [scope, verticalId, verticalSlug, user, load, onSelect, onClose]);

  // ── Drag-and-drop handlers ────────────────────────────────────────────

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items?.length) setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragOver(false);
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files?.length) handleFiles(files);
  }, [handleFiles]);

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className={styles.dropZone}>
          <Icon name="upload" size={32} />
          <p>Soltar arquivo{queue.length > 0 ? 's' : ''} para upload</p>
        </div>
      )}

      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Selecionar mídia">
        {/* Header */}
        <div className={styles.header}>
          <h2>Biblioteca de mídia</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            <Icon name="eye-off" size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.scopeTabs} role="tablist">
            <button
              role="tab"
              aria-selected={scope === 'vertical'}
              className={`${styles.scopeTab} ${scope === 'vertical' ? styles.scopeTabActive : ''}`}
              onClick={() => setScope('vertical')}
              disabled={!verticalId}
              title={!verticalId ? 'Página sem vertical' : undefined}
            >
              Vertical
            </button>
            <button
              role="tab"
              aria-selected={scope === 'global'}
              className={`${styles.scopeTab} ${scope === 'global' ? styles.scopeTabActive : ''}`}
              onClick={() => setScope('global')}
            >
              Global
            </button>
          </div>

          <input
            className={styles.search}
            type="search"
            placeholder="Buscar…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Buscar mídia"
          />

          <Button variant="primary" onClick={() => fileInputRef.current?.click()} loading={uploading}>
            <Icon name="upload" size={14} />
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={DROP_ACCEPT[accept]}
            multiple
            style={{ display: 'none' }}
            onChange={e => { if (e.target.files) handleFiles(e.target.files); }}
          />
        </div>

        {/* Upload queue banner */}
        {queue.length > 0 && (
          <div className={styles.queue}>
            {queue.map((f, i) => (
              <div key={i} className={`${styles.queueItem} ${styles[`queueItem--${f.status}`]}`}>
                <Icon name={f.status === 'done' ? 'check' : f.status === 'error' ? 'close-x' : 'upload'} size={14} />
                <span className={styles.queueName}>{f.name}</span>
                {f.status === 'uploading' && <span className={styles.queuePill}>Enviando…</span>}
                {f.status === 'done' && <span className={styles.queuePill}>Pronto</span>}
                {f.status === 'error' && <span className={styles.queuePill}>Erro</span>}
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className={styles.body}>
          {loading ? (
            <div className={styles.empty}>Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="file-default" size={32} />
              <p>{search ? 'Nada encontrado.' : 'Sem mídia aqui ainda. Faça upload.'}</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(asset => (
                <button
                  key={asset.id}
                  className={styles.item}
                  onClick={() => { onSelect(asset.file_url); onClose(); }}
                  title={asset.file_name ?? ''}
                >
                  <div className={styles.thumb}>
                    {getMediaType(asset.file_type) === 'image' ? (
                      <img src={asset.file_url} alt={asset.alt_text ?? asset.file_name ?? ''} loading="lazy" />
                    ) : (
                      <Icon name="file-default" size={28} />
                    )}
                  </div>
                  <span className={styles.itemName}>{asset.file_name}</span>
                  <span className={styles.itemMeta}>{formatFileSize(asset.file_size)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
