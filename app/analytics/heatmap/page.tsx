// @ts-nocheck
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { HeatmapCanvas } from '@/components/HeatmapCanvas/HeatmapCanvas';
import { useHeatmapData } from '@/hooks/useHeatmapData';
import styles from './heatmap.module.css';

type Period = '7d' | '14d' | '30d';
type HeatmapType = 'clicks' | 'scroll';

const LANDING_URL = process.env.NEXT_PUBLIC_LANDING_URL || 'http://localhost:3000';

const periodLabels: Record<Period, string> = {
  '7d': '7 dias',
  '14d': '14 dias',
  '30d': '30 dias',
};

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('pt-BR');
}

export default function HeatmapPage() {
  const router = useRouter();

  // Controls
  const [pages, setPages] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const [period, setPeriod] = useState<Period>('30d');
  const [deviceFilter, setDeviceFilter] = useState('all');
  const [heatmapType, setHeatmapType] = useState<HeatmapType>('clicks');
  const [loadingPages, setLoadingPages] = useState(true);

  // Iframe dimensions
  const [iframeDimensions, setIframeDimensions] = useState({ width: 0, height: 0 });
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Get selected page slug
  const selectedPage = pages.find((p) => p.id === selectedPageId);
  const selectedSlug = selectedPage?.slug || '';

  // Fetch heatmap data
  const { clicks, scrollDepths, loading: dataLoading, totalEvents, uniqueSessions } =
    useHeatmapData(selectedPageId || null, period, deviceFilter);

  // Fetch published pages
  useEffect(() => {
    async function fetchPages() {
      const { data } = await supabase
        .from('pages')
        .select('id, name, slug')
        .eq('status', 'published')
        .order('name');

      setPages(data || []);
      setLoadingPages(false);
    }
    fetchPages();
  }, []);

  // Listen for page dimensions from iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const { type, payload } = event.data || {};
      if (type === 'landing:page-dimensions' && payload) {
        setIframeDimensions({
          width: payload.scrollWidth || 0,
          height: payload.scrollHeight || 0,
        });
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update canvas size based on wrapper
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!wrapperRef.current || !iframeLoaded) return;

    const updateSize = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        // Use the wrapper width but the full iframe content height
        const w = rect.width;
        const h = iframeDimensions.height > 0
          ? (iframeDimensions.height / iframeDimensions.width) * w
          : rect.height;

        setCanvasSize({ width: Math.round(w), height: Math.round(h) });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [iframeLoaded, iframeDimensions]);

  // Reset state when page changes
  useEffect(() => {
    setIframeLoaded(false);
    setIframeDimensions({ width: 0, height: 0 });
  }, [selectedPageId]);

  const handlePageChange = (value: string) => {
    setSelectedPageId(value);
  };

  const pageOptions = [
    { value: '', label: 'Selecione uma pagina' },
    ...pages.map((p) => ({ value: p.id, label: p.name })),
  ];

  const deviceOptions = [
    { value: 'all', label: 'Todos os devices' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'mobile', label: 'Mobile' },
    { value: 'tablet', label: 'Tablet' },
  ];

  return (
    <div className={styles.layout}>
      <Sidebar />

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.header}>
            <h1>Analytics</h1>
            <p>Heatmap de interacoes das landing pages</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabBar}>
          <button
            className={styles.tab}
            onClick={() => router.push('/analytics')}
          >
            Visao Geral
          </button>
          <button className={`${styles.tab} ${styles.tabActive}`}>
            Heatmap
          </button>
        </div>

        {/* Controls */}
        <div className={styles.controlsRow}>
          <FilterDropdown
            value={selectedPageId}
            onChange={handlePageChange}
            placeholder="Selecione uma pagina"
            options={pageOptions}
          />
          <FilterDropdown
            value={deviceFilter}
            onChange={setDeviceFilter}
            placeholder="Todos os devices"
            options={deviceOptions}
          />
          <div className={styles.periodSelector}>
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ''}`}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
          <div className={styles.typeToggle}>
            <button
              className={`${styles.periodBtn} ${heatmapType === 'clicks' ? styles.periodBtnActive : ''}`}
              onClick={() => setHeatmapType('clicks')}
            >
              Clicks
            </button>
            <button
              className={`${styles.periodBtn} ${heatmapType === 'scroll' ? styles.periodBtnActive : ''}`}
              onClick={() => setHeatmapType('scroll')}
            >
              Scroll Depth
            </button>
          </div>
        </div>

        {/* Metrics summary */}
        {selectedPageId && (
          <div className={styles.metricsRow}>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Total de eventos</div>
              <div className={styles.metricValue}>
                {dataLoading ? '...' : formatNumber(totalEvents)}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Sessoes unicas</div>
              <div className={styles.metricValue}>
                {dataLoading ? '...' : formatNumber(uniqueSessions)}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Clicks</div>
              <div className={styles.metricValue}>
                {dataLoading ? '...' : formatNumber(clicks.length)}
              </div>
            </div>
            <div className={styles.metricCard}>
              <div className={styles.metricLabel}>Scroll Events</div>
              <div className={styles.metricValue}>
                {dataLoading ? '...' : formatNumber(scrollDepths.length)}
              </div>
            </div>
          </div>
        )}

        {/* Viewer */}
        {!selectedPageId ? (
          <div className={styles.viewerCard}>
            <div className={styles.emptyState}>
              <h3>Selecione uma pagina</h3>
              <p>Escolha uma pagina publicada para visualizar o heatmap</p>
            </div>
          </div>
        ) : (
          <div className={styles.viewerCard}>
            <div ref={wrapperRef} className={styles.iframeWrapper}>
              <iframe
                ref={iframeRef}
                src={`${LANDING_URL}/p/${selectedSlug}?edit=true`}
                className={styles.heatmapIframe}
                onLoad={() => setIframeLoaded(true)}
                title={`Heatmap - ${selectedPage?.name}`}
              />
              {iframeLoaded && !dataLoading && canvasSize.width > 0 && (
                <HeatmapCanvas
                  clicks={clicks}
                  scrollData={scrollDepths}
                  type={heatmapType}
                  width={canvasSize.width}
                  height={canvasSize.height}
                />
              )}
              {dataLoading && iframeLoaded && (
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 16px',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-secondary)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span className={styles.spinner} />
                  Carregando dados...
                </div>
              )}
            </div>
            {/* Legend */}
            <div className={styles.legend}>
              <span className={styles.legendLabel}>
                {heatmapType === 'clicks' ? 'Frio' : 'Menos visto'}
              </span>
              <div className={heatmapType === 'clicks' ? styles.legendGradient : styles.legendGradientScroll} />
              <span className={styles.legendLabel}>
                {heatmapType === 'clicks' ? 'Quente' : 'Mais visto'}
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
