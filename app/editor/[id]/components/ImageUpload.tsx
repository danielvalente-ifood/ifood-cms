'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { uploadMedia } from '@/lib/media';
import { useMediaContext } from './MediaContext';
import { MediaPicker } from './MediaPicker';
import styles from './ImageUpload.module.css';

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';

function resolveImageUrl(url: string): string {
  if (!url) return '';
  // Relative paths like /icons/foo.svg belong to the landing page
  if (url.startsWith('/')) return `${LANDING_URL}${url}`;
  return url;
}

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const { verticalId, verticalSlug } = useMediaContext();
  const { user } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const prevValueRef = useRef(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset error state when value changes (new image set)
  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    if (imgError) setImgError(false);
  }

  // Upload to the shared `media` bucket so it lands in the Media Library,
  // organized by the page's vertical and registered in the assets table.
  const uploadFile = async (file: File) => {
    setUploading(true);
    const { asset, error } = await uploadMedia({
      file,
      verticalId,
      verticalSlug,
      uploadedBy: user?.id ?? null,
    });
    setUploading(false);
    if (asset) onChange(asset.file_url);
    else console.error('Upload error:', error);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) uploadFile(file);
  };

  return (
    <div className={styles.container}>
      {label && <label className={styles.label}>{label}</label>}

      {value ? (
        <div className={styles.preview}>
          {imgError ? (
            <div className={styles.previewFallback}>
              <span className={styles.previewFallbackUrl}>{value}</span>
            </div>
          ) : (
            <img
              src={resolveImageUrl(value)}
              alt="Preview"
              className={styles.previewImage}
              onError={() => setImgError(true)}
            />
          )}
          {uploading && (
            <div className={styles.previewProgress}>
              <span className={styles.progressText}>Enviando…</span>
            </div>
          )}
          <div className={styles.previewActions}>
            <button className={styles.changeBtn} onClick={() => setPickerOpen(true)} disabled={uploading}>
              Biblioteca
            </button>
            <button className={styles.changeBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? 'Enviando…' : 'Upload'}
            </button>
            <button className={styles.removeBtn} onClick={() => onChange('')} disabled={uploading}>
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <span className={styles.progressText}>Enviando…</span>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.uploadIcon}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className={styles.dropText}>Clique ou arraste uma imagem</span>
              <button
                type="button"
                className={styles.libraryLink}
                onClick={(e) => { e.stopPropagation(); setPickerOpen(true); }}
              >
                ou escolher da biblioteca
              </button>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {pickerOpen && (
        <MediaPicker
          accept="image"
          onSelect={(url) => onChange(url)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
