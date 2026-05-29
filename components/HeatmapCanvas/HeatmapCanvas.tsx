'use client';

import { useRef, useEffect } from 'react';
import styles from './HeatmapCanvas.module.css';

interface ClickPoint {
  x_pct: number;
  y_pct: number;
}

interface ScrollEntry {
  scroll_depth_pct: number;
}

interface HeatmapCanvasProps {
  clicks: ClickPoint[];
  scrollData: ScrollEntry[];
  type: 'clicks' | 'scroll';
  width: number;
  height: number;
}

function alphaToHeatColor(alpha: number): [number, number, number, number] {
  const t = Math.min(1, Math.max(0, alpha));
  let r = 0, g = 0, b = 0;

  if (t < 0.25) {
    const s = t / 0.25;
    r = 0;
    g = Math.round(255 * s);
    b = 255;
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    r = 0;
    g = 255;
    b = Math.round(255 * (1 - s));
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    r = Math.round(255 * s);
    g = 255;
    b = 0;
  } else {
    const s = (t - 0.75) / 0.25;
    r = 255;
    g = Math.round(255 * (1 - s));
    b = 0;
  }

  const a = Math.round(Math.min(220, t * 280));
  return [r, g, b, a];
}

function renderClickHeatmap(
  ctx: CanvasRenderingContext2D,
  clicks: ClickPoint[],
  width: number,
  height: number
) {
  if (clicks.length === 0) return;

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d')!;

  const radius = Math.max(20, Math.min(60, 600 / Math.sqrt(clicks.length)));

  clicks.forEach((point) => {
    const x = (point.x_pct / 100) * width;
    const y = (point.y_pct / 100) * height;

    const gradient = offCtx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    offCtx.fillStyle = gradient;
    offCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  });

  ctx.filter = `blur(${Math.round(radius * 0.4)}px)`;
  ctx.drawImage(offscreen, 0, 0);
  ctx.filter = 'none';

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 0) {
      const [r, g, b, a] = alphaToHeatColor(alpha / 255);
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function renderScrollHeatmap(
  ctx: CanvasRenderingContext2D,
  scrollData: ScrollEntry[],
  width: number,
  height: number
) {
  if (scrollData.length === 0) return;

  const bands: Record<number, number> = {};
  scrollData.forEach(entry => {
    const band = Math.floor(entry.scroll_depth_pct / 10) * 10;
    bands[band] = (bands[band] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(bands));

  Object.entries(bands).forEach(([band, count]) => {
    const bandNum = parseInt(band);
    const bandY = (bandNum / 100) * height;
    const bandHeight = (10 / 100) * height;
    const intensity = count / maxCount;

    const [r, g, b, a] = alphaToHeatColor(intensity);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    ctx.fillRect(0, bandY, width, bandHeight);
  });
}

export function HeatmapCanvas({ clicks, scrollData, type, width, height }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and render
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    if (type === 'clicks') {
      renderClickHeatmap(ctx, clicks, width, height);
    } else {
      renderScrollHeatmap(ctx, scrollData, width, height);
    }
  }, [clicks, scrollData, type, width, height]);

  // Handle scroll to move canvas position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.style.top = `${target.scrollTop}px`;
      }
    };

    // Get the scrollable parent (the iframe body or the div containing the iframe)
    const parent = container.parentElement;
    if (parent) {
      parent.addEventListener('scroll', handleScroll);
      return () => parent.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width, height }}>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
