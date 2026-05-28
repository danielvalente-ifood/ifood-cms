// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

type Period = '7d' | '14d' | '30d';

interface ClickPoint {
  x_pct: number;
  y_pct: number;
  element_tag: string | null;
  element_text: string | null;
}

interface ScrollEntry {
  scroll_depth_pct: number;
}

interface UseHeatmapDataReturn {
  clicks: ClickPoint[];
  scrollDepths: ScrollEntry[];
  loading: boolean;
  error: string | null;
  totalEvents: number;
  uniqueSessions: number;
}

function getDateThreshold(period: Period): string {
  const d = new Date();
  const days = parseInt(period);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function useHeatmapData(
  pageId: string | null,
  period: Period,
  deviceFilter: string
): UseHeatmapDataReturn {
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [scrollDepths, setScrollDepths] = useState<ScrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [uniqueSessions, setUniqueSessions] = useState(0);

  const fetchData = useCallback(async () => {
    if (!pageId) {
      setClicks([]);
      setScrollDepths([]);
      setTotalEvents(0);
      setUniqueSessions(0);
      return;
    }

    setLoading(true);
    setError(null);

    const dateThreshold = getDateThreshold(period);

    try {
      // Build click query
      let clickQuery = supabase
        .from('page_events')
        .select('x_pct, y_pct, element_tag, element_text, session_id')
        .eq('page_id', pageId)
        .eq('event_type', 'click')
        .gte('created_at', dateThreshold);

      if (deviceFilter && deviceFilter !== 'all') {
        clickQuery = clickQuery.eq('device_type', deviceFilter);
      }

      // Build scroll query
      let scrollQuery = supabase
        .from('page_events')
        .select('scroll_depth_pct, session_id')
        .eq('page_id', pageId)
        .eq('event_type', 'scroll')
        .gte('created_at', dateThreshold);

      if (deviceFilter && deviceFilter !== 'all') {
        scrollQuery = scrollQuery.eq('device_type', deviceFilter);
      }

      const [clickResult, scrollResult] = await Promise.all([
        clickQuery.limit(5000),
        scrollQuery.limit(5000),
      ]);

      if (clickResult.error) throw new Error(clickResult.error.message);
      if (scrollResult.error) throw new Error(scrollResult.error.message);

      const clickData = (clickResult.data || []).map((row) => ({
        x_pct: row.x_pct ?? 0,
        y_pct: row.y_pct ?? 0,
        element_tag: row.element_tag,
        element_text: row.element_text,
      }));

      const scrollData = (scrollResult.data || []).map((row) => ({
        scroll_depth_pct: row.scroll_depth_pct ?? 0,
      }));

      // Count unique sessions across both datasets
      const sessions = new Set<string>();
      (clickResult.data || []).forEach((r) => { if (r.session_id) sessions.add(r.session_id); });
      (scrollResult.data || []).forEach((r) => { if (r.session_id) sessions.add(r.session_id); });

      setClicks(clickData);
      setScrollDepths(scrollData);
      setTotalEvents(clickData.length + scrollData.length);
      setUniqueSessions(sessions.size);
      setLoading(false);
    } catch (err: any) {
      console.error('[Heatmap] Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [pageId, period, deviceFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { clicks, scrollDepths, loading, error, totalEvents, uniqueSessions };
}
