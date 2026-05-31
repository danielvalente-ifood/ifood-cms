'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@/components/Icon/Icon';
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

export function MediaPicker({ onSelect, onClose, accept = 'image' }: MediaPickerProps) {
  const { verticalId, verticalSlug } = useMediaContext();
  const { user } = useAuth();

  const [scope, setScope] = useState<Scope>(verticalId ? 'vertical' : 'global');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
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

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const useVertical = scope === 'vertical';
    const { asset } = await uploadMedia({
      file: files[0],
      verticalId: useVertical ? verticalId : null,
      verticalSlug: useVertical ? verticalSlug : null,
      uploadedBy: user?.id ?? null,
    });
    setUploading(false);
    if (asset) {
      onSelect(asset.file_url);
      onClose();
    } else {
      await load();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
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

          <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Icon name="add-plus-circle" size={14} />
            {uploading ? 'Enviando…' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept === 'image' ? 'image/*' : 'image/*,video/*,application/pdf'}
            style={{ display: 'none' }}
            onChange={e => handleUpload(e.target.files)}
          />
        </div>

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
