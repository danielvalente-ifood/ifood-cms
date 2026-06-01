'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { FolderCard } from '@/components/FolderCard/FolderCard';
import { fetchMediaFolders } from '@/lib/media';
import type { MediaFolder } from '@/lib/media';
import styles from './media.module.css';

export default function MediaIndexPage() {
  const router = useRouter();
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMediaFolders().then((f) => {
      setFolders(f);
      setLoading(false);
    });
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Biblioteca de Mídia</h1>
            <p>Pastas por vertical — imagens, vídeos e arquivos organizados</p>
          </div>
        </div>

        {loading ? (
          <div className={styles.empty}><p>Carregando…</p></div>
        ) : (
          <div className={styles.folderGrid}>
            {folders.map((folder) => (
              <FolderCard
                key={folder.slug}
                folder={folder}
                onClick={() => router.push(`/media/${folder.slug}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
