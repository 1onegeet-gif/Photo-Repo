"use client";

import { PanelSection } from "./PanelSection";
import { BarChart3 } from "lucide-react";

export interface ColorEntry {
  hex: string;
  count: number;
  pct: number; // 0..1
}

export interface Stats {
  cells: number;
  renderMs: number;
  palette: string[];
  /** Top colors by frequency (sorted desc). */
  colorFreq?: ColorEntry[];
}

interface StatsPanelProps {
  stats: Stats | null;
  width: number;
  height: number;
}

export function StatsPanel({ stats, width, height }: StatsPanelProps) {
  const top = stats?.colorFreq?.slice(0, 12) ?? [];
  const maxCount = top.length > 0 ? top[0].count : 1;

  return (
    <PanelSection title="Stats" jp="統計" icon={<BarChart3 className="h-4 w-4" />}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Cells" value={stats ? fmt(stats.cells) : "—"} />
        <StatTile label="Render" value={stats ? `${stats.renderMs.toFixed(1)}ms` : "—"} />
        <StatTile label="Colors" value={stats ? fmt(stats.palette.length) : "—"} />
        <StatTile label="Canvas" value={width && height ? `${width}×${height}` : "—"} />
      </div>

      {top.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Color frequency
            </span>
            <span className="text-[9px] text-muted-foreground/60">
              top {top.length} of {stats?.palette.length ?? 0}
            </span>
          </div>
          {/* Horizontal bar histogram */}
          <div className="space-y-1">
            {top.map((c, i) => (
              <div
                key={c.hex + i}
                className="group flex items-center gap-2"
                title={`${c.hex} · ${c.count} cells · ${(c.pct * 100).toFixed(1)}%`}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-sm border border-border/60"
                  style={{ background: c.hex }}
                />
                <div className="relative h-4 flex-1 overflow-hidden rounded-sm bg-muted/40">
                  <div
                    className="stat-pulse h-full rounded-sm"
                    style={{
                      width: `${Math.max(2, (c.count / maxCount) * 100)}%`,
                      background: c.hex,
                      opacity: 0.85,
                    }}
                    key={c.hex + c.count}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                  {(c.pct * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats && stats.palette.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Dominant palette
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stats.palette.slice(0, 24).map((hex, i) => (
              <span key={i} className="palette-chip">
                <span className="swatch" style={{ background: hex }} />
                {hex}
              </span>
            ))}
            {stats.palette.length > 24 && (
              <span className="palette-chip">+{stats.palette.length - 24}</span>
            )}
          </div>
        </div>
      )}
    </PanelSection>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  // `key={value}` on the span remounts it when value changes,
  // re-triggering the CSS pulse animation — no effect needed.
  return (
    <div className="stat-tile">
      <span key={value} className="stat-value stat-pulse">
        {value}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(2)}k`;
  return String(n);
}
