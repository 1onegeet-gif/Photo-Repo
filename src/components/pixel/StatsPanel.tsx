"use client";

import { PanelSection } from "./PanelSection";
import { BarChart3 } from "lucide-react";

export interface Stats {
  cells: number;
  renderMs: number;
  palette: string[];
}

interface StatsPanelProps {
  stats: Stats | null;
  width: number;
  height: number;
}

export function StatsPanel({ stats, width, height }: StatsPanelProps) {
  return (
    <PanelSection title="Stats" jp="統計" icon={<BarChart3 className="h-4 w-4" />}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Cells" value={stats ? fmt(stats.cells) : "—"} />
        <StatTile label="Render" value={stats ? `${stats.renderMs.toFixed(1)}ms` : "—"} />
        <StatTile label="Colors" value={stats ? fmt(stats.palette.length) : "—"} />
        <StatTile label="Canvas" value={width && height ? `${width}×${height}` : "—"} />
      </div>

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
