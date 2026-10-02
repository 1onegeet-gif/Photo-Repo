"use client";

import { useEffect, useRef, useState } from "react";
import { PanelSection } from "./PanelSection";
import { Activity } from "lucide-react";

interface LevelsPanelProps {
  sourceRef: React.RefObject<HTMLCanvasElement | null>;
  hasImage: boolean;
  width: number;
  height: number;
}

interface Levels {
  r: number[]; // 32 buckets
  g: number[];
  b: number[];
  l: number[]; // luminance
  mean: { r: number; g: number; b: number; l: number };
}

const BUCKETS = 32;

function computeLevels(data: Uint8ClampedArray): Levels {
  const r = new Array(BUCKETS).fill(0);
  const g = new Array(BUCKETS).fill(0);
  const b = new Array(BUCKETS).fill(0);
  const l = new Array(BUCKETS).fill(0);
  let sumR = 0, sumG = 0, sumB = 0, sumL = 0, n = 0;
  // Stride for performance on large images
  const stride = Math.max(1, Math.floor(data.length / 4 / 40000));
  for (let i = 0; i < data.length; i += 4 * stride) {
    if (data[i + 3] < 8) continue;
    const R = data[i], G = data[i + 1], B = data[i + 2];
    r[Math.min(BUCKETS - 1, Math.floor((R / 255) * BUCKETS))]++;
    g[Math.min(BUCKETS - 1, Math.floor((G / 255) * BUCKETS))]++;
    b[Math.min(BUCKETS - 1, Math.floor((B / 255) * BUCKETS))]++;
    const L = (R * 0.3 + G * 0.59 + B * 0.11) / 255;
    l[Math.min(BUCKETS - 1, Math.floor(L * BUCKETS))]++;
    sumR += R; sumG += G; sumB += B; sumL += L * 255;
    n++;
  }
  if (n === 0) n = 1;
  return {
    r, g, b, l,
    mean: { r: sumR / n, g: sumG / n, b: sumB / n, l: sumL / n },
  };
}

export function LevelsPanel({ sourceRef, hasImage, width, height }: LevelsPanelProps) {
  const [levels, setLevels] = useState<Levels | null>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    // No image → clear via derived state, not direct setState in effect
    if (!hasImage || !width || !height) return;
    // Debounce — recompute after a short delay to avoid thrashing on every render
    const id = ++tickRef.current;
    const t = setTimeout(() => {
      if (tickRef.current !== id) return;
      const src = sourceRef.current;
      if (!src) return;
      const sctx = src.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      try {
        const data = sctx.getImageData(0, 0, src.width, src.height).data;
        setLevels(computeLevels(data));
      } catch {
        // ignore — canvas may be tainted
      }
    }, 200);
    return () => clearTimeout(t);
  }, [hasImage, width, height, sourceRef]);

  // Derive display state: clear levels when no image
  const display = hasImage ? levels : null;

  return (
    <PanelSection title="Levels" jp="階調" icon={<Activity className="h-4 w-4" />}>
      {!display ? (
        <p className="text-[11px] text-muted-foreground">
          {hasImage ? "Analyzing source image…" : "Load an image to see its RGB distribution."}
        </p>
      ) : (
        <div className="space-y-3">
          <Histogram label="R" jp="赤" data={display.r} color="oklch(0.6 0.2 25)" mean={display.mean.r} />
          <Histogram label="G" jp="緑" data={display.g} color="oklch(0.6 0.15 145)" mean={display.mean.g} />
          <Histogram label="B" jp="青" data={display.b} color="oklch(0.55 0.2 260)" mean={display.mean.b} />
          <Histogram label="L" jp="輝度" data={display.l} color="oklch(0.4 0.02 50)" mean={display.mean.l} />
        </div>
      )}
    </PanelSection>
  );
}

function Histogram({
  label,
  jp,
  data,
  color,
  mean,
}: {
  label: string;
  jp: string;
  data: number[];
  color: string;
  mean: number;
}) {
  const max = Math.max(1, ...data);
  const meanPct = (mean / 255) * 100;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          <span className="font-mono font-semibold text-foreground/80">{label}</span>
          <span className="font-display text-[9px] text-muted-foreground/60">{jp}</span>
        </span>
        <span className="font-mono text-muted-foreground">μ {mean.toFixed(0)}</span>
      </div>
      <div className="relative flex h-10 items-end gap-px overflow-hidden rounded-sm border border-border/40 bg-paper/30 px-1 py-1">
        {data.map((v, i) => (
          <div
            key={i}
            className="levels-bar flex-1 rounded-t-sm transition-all"
            style={{
              height: `${Math.max(1, (v / max) * 100)}%`,
              background: color,
              opacity: 0.6 + (v / max) * 0.4,
              animationDelay: `${i * 8}ms`,
            }}
          />
        ))}
        {/* mean line */}
        <div
          className="mean-line pointer-events-none absolute top-0 bottom-0 w-px bg-foreground/60"
          style={{ left: `${meanPct}%` }}
        />
      </div>
    </div>
  );
}
