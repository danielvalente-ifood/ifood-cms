'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import styles from './analytics.module.css';

type Period = '7d' | '14d' | '30d' | '90d';

interface MetricCard {
  label: string;
  value: string;
  change?: number;
}

interface DeviceData {
  name: string;
  sessions: number;
  color: string;
}

interface PageData {
  path: string;
  views: number;
  users: number;
}

interface EventData {
  name: string;
  count: number;
}

interface DailyData {
  date: string;
  sessions: number;
  pageviews: number;
}

interface FunnelStep {
  label: string;
  count: number;
}

const periodLabels: Record<Period, string> = {
  '7d': '7 dias',
  '14d': '14 dias',
  '30d': '30 dias',
  '90d': '90 dias',
};

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString('pt-BR');
}

function getDateRange(period: Period): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  const days = parseInt(period);
  start.setDate(end.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

async function fetchReport(body: {
  dateRange: { startDate: string; endDate: string };
  metrics: string[];
  dimensions?: string[];
}, googleToken: string) {
  const res = await fetch('/api/analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${googleToken}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.details || err.error || 'Failed to fetch analytics');
  }
  return res.json();
}

export default function AnalyticsPage() {
  const { user, signOut, providerToken } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRelogin, setNeedsRelogin] = useState(false);

  // Data
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [topPages, setTopPages] = useState<PageData[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);

  const loadData = useCallback(async () => {
    if (!providerToken) {
      setNeedsRelogin(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsRelogin(false);

    const dateRange = getDateRange(period);
    const tok = providerToken;

    try {
      const [overviewRes, devicesRes, pagesRes, eventsRes, dailyRes, funnelRes] = await Promise.all([
        // 1. Overview metrics
        fetchReport({
          dateRange,
          metrics: ['sessions', 'totalUsers', 'screenPageViews', 'bounceRate', 'averageSessionDuration'],
        }, tok),
        // 2. Devices
        fetchReport({
          dateRange,
          metrics: ['sessions'],
          dimensions: ['deviceCategory'],
        }, tok),
        // 3. Top pages
        fetchReport({
          dateRange,
          metrics: ['screenPageViews', 'totalUsers'],
          dimensions: ['pagePath'],
        }, tok),
        // 4. Events
        fetchReport({
          dateRange,
          metrics: ['eventCount'],
          dimensions: ['eventName'],
        }, tok),
        // 5. Daily sessions
        fetchReport({
          dateRange,
          metrics: ['sessions', 'screenPageViews'],
          dimensions: ['date'],
        }, tok),
        // 6. Section funnel (section_view events)
        fetchReport({
          dateRange,
          metrics: ['eventCount'],
          dimensions: ['customEvent:section'],
        }, tok).catch(() => null), // May not have data yet
      ]);

      // Parse overview
      const ov = overviewRes.rows?.[0]?.metricValues || [];
      setMetrics([
        { label: 'Sessões', value: formatNumber(parseInt(ov[0]?.value || '0')) },
        { label: 'Usuários', value: formatNumber(parseInt(ov[1]?.value || '0')) },
        { label: 'Pageviews', value: formatNumber(parseInt(ov[2]?.value || '0')) },
        { label: 'Bounce Rate', value: (parseFloat(ov[3]?.value || '0') * 100).toFixed(1) + '%' },
      ]);

      // Parse devices
      const deviceColors: Record<string, string> = { desktop: '#EB0033', mobile: '#3b82f6', tablet: '#f59e0b' };
      const devRows = (devicesRes.rows || []).map((r: any) => ({
        name: r.dimensionValues[0].value,
        sessions: parseInt(r.metricValues[0].value),
        color: deviceColors[r.dimensionValues[0].value] || '#737373',
      }));
      setDevices(devRows.sort((a: DeviceData, b: DeviceData) => b.sessions - a.sessions));

      // Parse top pages
      const pgRows = (pagesRes.rows || [])
        .map((r: any) => ({
          path: r.dimensionValues[0].value,
          views: parseInt(r.metricValues[0].value),
          users: parseInt(r.metricValues[1].value),
        }))
        .sort((a: PageData, b: PageData) => b.views - a.views)
        .slice(0, 10);
      setTopPages(pgRows);

      // Parse events
      const evRows = (eventsRes.rows || [])
        .map((r: any) => ({
          name: r.dimensionValues[0].value,
          count: parseInt(r.metricValues[0].value),
        }))
        .sort((a: EventData, b: EventData) => b.count - a.count)
        .filter((e: EventData) => !['page_view', 'session_start', 'first_visit', 'user_engagement'].includes(e.name))
        .slice(0, 12);
      setEvents(evRows);

      // Parse daily
      const dRows = (dailyRes.rows || [])
        .map((r: any) => ({
          date: r.dimensionValues[0].value,
          sessions: parseInt(r.metricValues[0].value),
          pageviews: parseInt(r.metricValues[1].value),
        }))
        .sort((a: DailyData, b: DailyData) => a.date.localeCompare(b.date));
      setDailyData(dRows);

      // Parse funnel
      if (funnelRes?.rows) {
        const sectionOrder = ['hero', 'vision', 'growth', 'integrated', 'results', 'faq', 'footer'];
        const sectionLabels: Record<string, string> = {
          hero: 'Hero', vision: 'Social Proof', growth: 'Growth',
          integrated: 'Features', results: 'Depoimentos', faq: 'FAQ', footer: 'Footer',
        };
        const fMap = new Map<string, number>();
        funnelRes.rows.forEach((r: any) => {
          fMap.set(r.dimensionValues[0].value, parseInt(r.metricValues[0].value));
        });
        const fSteps = sectionOrder
          .filter(s => fMap.has(s))
          .map(s => ({ label: sectionLabels[s] || s, count: fMap.get(s) || 0 }));
        setFunnel(fSteps);
      }

      setLoading(false);
    } catch (err: any) {
      console.error('[Analytics] Error loading data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [period, providerToken]);

  useEffect(() => { loadData(); }, [loadData]);

  // Build sparkline SVG path
  function buildSparkline(data: DailyData[], key: 'sessions' | 'pageviews'): string {
    if (data.length < 2) return '';
    const values = data.map(d => d[key]);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 100;
    const h = 100;
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h * 0.85) - h * 0.05;
      return `${x},${y}`;
    });
    return `M${points.join(' L')}`;
  }

  const maxDevice = Math.max(...devices.map(d => d.sessions), 1);

  return (
    <div className={styles.layout}>
      <Sidebar />

      {/* Main */}
      <main className={styles.main}>
        <div className={styles.headerRow}>
          <div className={styles.header}>
            <h1>Analytics</h1>
            <p>Dados do Google Analytics 4</p>
          </div>
          <div className={styles.periodSelector}>
            {(Object.keys(periodLabels) as Period[]).map(p => (
              <button
                key={p}
                className={`${styles.periodBtn} ${period === p ? styles.periodBtnActive : ''}`}
                onClick={() => setPeriod(p)}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>

        {needsRelogin && (
          <div className={styles.error}>
            <div className={styles.errorTitle}>Sessão do Google expirada</div>
            Para acessar os dados do Analytics, faça logout e login novamente para autorizar o acesso.
            <button onClick={signOut} style={{ marginTop: 12, padding: '8px 16px', background: 'var(--brand)', color: 'var(--text-inverse)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              Fazer login novamente
            </button>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <div className={styles.errorTitle}>Erro ao carregar dados</div>
            {error}
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>
            <span className={styles.spinner} />
            Carregando dados do GA4...
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className={styles.cardsGrid}>
              {metrics.map((m, i) => (
                <div key={i} className={styles.card}>
                  <div className={styles.cardLabel}>{m.label}</div>
                  <div className={styles.cardValue}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Charts row: sessions over time + devices */}
            <div className={styles.chartsRow}>
              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>Sessões por dia</div>
                <div className={styles.chartContainer}>
                  {dailyData.length > 1 ? (
                    <svg className={styles.chartSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Grid lines */}
                      {[0, 25, 50, 75, 100].map(y => (
                        <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--border-default)" strokeWidth="0.3" />
                      ))}
                      {/* Area fill */}
                      <path
                        d={`${buildSparkline(dailyData, 'sessions')} L100,100 L0,100 Z`}
                        fill="url(#gradient)"
                        opacity="0.3"
                      />
                      {/* Line */}
                      <path
                        d={buildSparkline(dailyData, 'sessions')}
                        fill="none"
                        stroke="#EB0033"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EB0033" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#EB0033" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: 13 }}>
                      Sem dados suficientes para o gráfico
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartTitle}>Dispositivos</div>
                <div className={styles.deviceList}>
                  {devices.map((d, i) => (
                    <div key={i}>
                      <div className={styles.deviceItem}>
                        <span className={styles.deviceDot} style={{ background: d.color }} />
                        <span className={styles.deviceName}>{d.name}</span>
                        <span className={styles.deviceValue}>{formatNumber(d.sessions)}</span>
                      </div>
                      <div className={styles.deviceBar}>
                        <div
                          className={styles.deviceBarFill}
                          style={{ width: `${(d.sessions / maxDevice) * 100}%`, background: d.color }}
                        />
                      </div>
                    </div>
                  ))}
                  {devices.length === 0 && (
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sem dados</div>
                  )}
                </div>
              </div>
            </div>

            {/* Top pages + Events */}
            <div className={styles.tablesRow}>
              <div className={styles.tableCard}>
                <div className={styles.chartTitle}>Top páginas</div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Página</th>
                      <th>Views</th>
                      <th>Usuários</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((p, i) => (
                      <tr key={i}>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.path}</td>
                        <td>{formatNumber(p.views)}</td>
                        <td>{formatNumber(p.users)}</td>
                      </tr>
                    ))}
                    {topPages.length === 0 && (
                      <tr><td colSpan={3} style={{ color: 'var(--text-tertiary)' }}>Sem dados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.tableCard}>
                <div className={styles.chartTitle}>Funil de engajamento</div>
                {funnel.length > 0 ? (
                  <div className={styles.funnel}>
                    {funnel.map((step, i) => {
                      const maxCount = funnel[0].count || 1;
                      const pct = Math.round((step.count / maxCount) * 100);
                      return (
                        <div key={i} className={styles.funnelStep}>
                          <span className={styles.funnelLabel}>{step.label}</span>
                          <div className={styles.funnelBar} style={{ width: `${Math.max(pct, 8)}%` }}>
                            <span className={styles.funnelBarLabel}>{formatNumber(step.count)}</span>
                          </div>
                          <span className={styles.funnelPct}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 13, padding: '20px 0' }}>
                    Dados do funil aparecem após section_view events serem registrados
                  </div>
                )}
              </div>
            </div>

            {/* Custom events */}
            <div className={styles.tableCard}>
              <div className={styles.chartTitle}>Eventos customizados</div>
              {events.length > 0 ? (
                <div className={styles.eventsGrid}>
                  {events.map((e, i) => (
                    <div key={i} className={styles.eventCard}>
                      <div className={styles.eventName}>{e.name}</div>
                      <div className={styles.eventCount}>{formatNumber(e.count)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Sem eventos customizados registrados</div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
