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

// ── Color map: alpha → heat color ──

function alphaToHeatColor(alpha: number): [number, number, number, number] {
  // Maps alpha 0→1 to: transparent → blue → cyan → green → yellow → red
  const t = Math.min(1, Math.max(0, alpha));

  let r = 0, g = 0, b = 0;

  if (t < 0.25) {
    // Blue → Cyan
    const s = t / 0.25;
    r = 0;
    g = Math.round(255 * s);
    b = 255;
  } else if (t < 0.5) {
    // Cyan → Green
    const s = (t - 0.25) / 0.25;
    r = 0;
    g = 255;
    b = Math.round(255 * (1 - s));
  } else if (t < 0.75) {
    // Green → Yellow
    const s = (t - 0.5) / 0.25;
    r = Math.round(255 * s);
    g = 255;
    b = 0;
  } else {
    // Yellow → Red
    const s = (t - 0.75) / 0.25;
    r = 255;
    g = Math.round(255 * (1 - s));
    b = 0;
  }

  // Output alpha based on intensity
  const a = Math.round(Math.min(220, t * 280));

  return [r, g, b, a];
}

// ── Click heatmap renderer ──

function renderClickHeatmap(
  ctx: CanvasRenderingContext2D,
  clicks: ClickPoint[],
  width: number,
  height: number
) {
  if (clicks.length === 0) return;

  // Step 1: Draw alpha circles on offscreen canvas
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const offCtx = offscreen.getContext('2d')!;

  // Radius scales with density — fewer clicks = larger radius for visibility
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

  // Step 2: Apply blur
  ctx.filter = `blur(${Math.round(radius * 0.4)}px)`;
  ctx.drawImage(offscreen, 0, 0);
  ctx.filter = 'none';

  // Step 3: Color map the alpha channel
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Find max alpha for normalization
  let maxAlpha = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] > maxAlpha) maxAlpha = pixels[i];
  }

  if (maxAlpha === 0) return;

  for (let i = 0; i < pixels.length; i += 4) {
    const normalizedAlpha = pixels[i + 3] / maxAlpha;

    if (normalizedAlpha > 0.02) {
      const [r, g, b, a] = alphaToHeatColor(normalizedAlpha);
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = a;
    } else {
      pixels[i + 3] = 0; // transparent
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── Scroll depth renderer ──

function renderScrollHeatmap(
  ctx: CanvasRenderingContext2D,
  scrollData: ScrollEntry[],
  width: number,
  height: number
) {
  if (scrollData.length === 0) return;

  // Count sessions per depth band (0-10%, 10-20%, etc.)
  const bands = new Array(10).fill(0); // 10 bands of 10%
  const totalSessions = scrollData.length;

  scrollData.forEach((entry) => {
    const depth = Math.min(100, Math.max(0, entry.scroll_depth_pct));
    // Count this session for all bands up to its depth
    for (let i = 0; i < 10; i++) {
      const bandMax = (i + 1) * 10;
      if (depth >= bandMax) {
        bands[i]++;
      } else if (depth > i * 10) {
        bands[i] += (depth - i * 10) / 10; // partial band
      }
    }
  });

  // Draw horizontal bands
  const bandHeight = height / 10;

  bands.forEach((count, i) => {
    const ratio = count / totalSessions;
    const y = i * bandHeight;

    // Green (100% reached) → Yellow (50%) → Red (low %)
    let r: number, g: number, b: number;
    if (ratio > 0.5) {
      // Green → Yellow
      const t = (ratio - 0.5) / 0.5;
      r = Math.round(255 * (1 - t));
      g = Math.round(180 + 75 * t);
      b = Math.round(50 * (1 - t));
    } else {
      // Yellow → Red
      const t = ratio / 0.5;
      r = 255;
      g = Math.round(180 * t);
      b = 0;
    }

    const alpha = Math.max(0.08, ratio * 0.5);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.fillRect(0, y, width, bandHeight);

    // Draw percentage label
    const pct = Math.round(ratio * 100);
    if (pct > 0) {
      ctx.fillStyle = `rgba(${r > 200 ? 255 : 0}, ${g > 200 ? 255 : 0}, ${b > 200 ? 255 : 0}, 0.9)`;
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(
        `${pct}% dos visitantes`,
        width - 16,
        y + bandHeight / 2 + 4
      );
    }

    // Band separator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y + bandHeight);
    ctx.lineTo(width, y + bandHeight);
    ctx.stroke();
  });
}

// ── Component ──

export function HeatmapCanvas({ clicks, scrollData, type, width, height }: HeatmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width <= 0 || height <= 0) return;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width, height);

    if (type === 'clicks') {
      renderClickHeatmap(ctx, clicks, width, height);
    } else {
      renderScrollHeatmap(ctx, scrollData, width, height);
    }
  }, [clicks, scrollData, type, width, height]);

  if (width <= 0 || height <= 0) return null;

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      style={{ width, height }}
    />
  );
}
