-- ============================================================
-- Heatmap Tracking: page_events table for click/scroll analytics
-- ============================================================

CREATE TABLE public.page_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'scroll')),

  -- Click data
  x_pct NUMERIC(5,2),
  y_pct NUMERIC(7,2),
  element_tag TEXT,
  element_text TEXT,

  -- Scroll data
  scroll_depth_pct SMALLINT,

  -- Context
  viewport_width SMALLINT,
  device_type TEXT,
  session_id TEXT,
  page_slug TEXT,

  -- A/B context
  experiment_id UUID,
  variant_id UUID,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_page_events_page_id ON public.page_events(page_id);
CREATE INDEX idx_page_events_created_at ON public.page_events(created_at);
CREATE INDEX idx_page_events_page_type ON public.page_events(page_id, event_type);

-- Enable RLS
ALTER TABLE public.page_events ENABLE ROW LEVEL SECURITY;

-- Anon can INSERT (landing app uses anon key to write events)
CREATE POLICY "Anon can insert page events"
  ON public.page_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated users can SELECT (CMS users can read heatmap data)
CREATE POLICY "Authenticated users can read page events"
  ON public.page_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Admin can DELETE (data cleanup)
CREATE POLICY "Admin can delete page events"
  ON public.page_events
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- NOTE: For data retention, consider setting up pg_cron to delete events older than 90 days:
-- SELECT cron.schedule('cleanup-page-events', '0 3 * * 0',
--   $$DELETE FROM public.page_events WHERE created_at < now() - interval '90 days'$$
-- );
