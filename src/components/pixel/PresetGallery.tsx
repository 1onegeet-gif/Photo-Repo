"use client";

import { PRESETS, Preset } from "@/lib/presets";
import { useMosaic } from "@/lib/mosaic-store";
import { makeRng, pixelate, renderCells } from "@/lib/pixelate";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Search, X } from "lucide-react";

interface PresetGalleryProps {
  sampleSrc: string;
  onStats?: (stats: { cells: number; renderMs: number; palette: string[] }) => void;
}

/** Derive a loose category tag from a preset's patch. */
function categoryOf(p: Preset): string {
  const cell = p.patch.cellSize ?? 12;
  const q = p.patch.quantizeLevels ?? 256;
  if (q <= 4) return "bold";
  if (p.patch.bgMode === "ink") return "dark";
  if (p.patch.shapeMix && p.patch.shapeMix !== "single") return "mix";
  if (cell <= 7) return "fine";
  return "classic";
}

const CATEGORIES: { value: string; label: string; jp: string }[] = [
  { value: "all", label: "All", jp: "全て" },
  { value: "fine", label: "Fine", jp: "細密" },
  { value: "bold", label: "Bold", jp: "大胆" },
  { value: "dark", label: "Dark", jp: "暗調" },
  { value: "mix", label: "Mix", jp: "混合" },
  { value: "classic", label: "Classic", jp: "古典" },
];

export function PresetGallery({ sampleSrc }: PresetGalleryProps) {
  const applyPreset = useMosaic((s) => s.applyPreset);
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRESETS.filter((p) => {
      const matchesCat = category === "all" || categoryOf(p) === category;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.jp.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        (p.patch.shape ?? "").includes(q)
      );
    });
  }, [query, category]);

  const onApply = (p: Preset) => {
    applyPreset(p.patch);
    setActive(p.id);
    toast.success(`Preset · ${p.name}`, { description: p.desc });
    setTimeout(() => setActive(null), 1400);
  };

  return (
    <div className="space-y-3">
      {/* Search + filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search presets…"
            className="w-full rounded-md border border-border/60 bg-paper/60 py-1 pl-6 pr-6 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-seal/50 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={cn(
                "filter-chip flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-all",
                category === c.value
                  ? "bg-seal text-paper"
                  : "bg-paper/60 text-muted-foreground hover:bg-paper hover:text-foreground",
              )}
              title={c.label}
            >
              <span>{c.label}</span>
              <span className="font-display text-[9px] opacity-70">{c.jp}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/50 bg-paper/30 px-3 py-4 text-center text-[11px] text-muted-foreground">
          No presets match <span className="font-mono">“{query}”</span>. Try a different search.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onApply(p)}
              className={cn(
                "preset-card group flex flex-col gap-1.5 rounded-md border border-border/60 bg-paper/60 p-2 text-left",
                active === p.id && "ring-2 ring-seal/60",
              )}
              title={p.desc}
            >
              <PresetThumb preset={p} sampleSrc={sampleSrc} />
              <span className="preset-kanji-stamp">{p.jp}</span>
              <div className="flex items-baseline justify-between gap-1 px-0.5">
                <span className="font-display text-[11px] font-semibold leading-tight text-foreground">
                  {p.name}
                </span>
                <span className="font-display text-[9px] tracking-wider text-muted-foreground/70">
                  {p.jp}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A tiny live-rendered thumbnail of the preset applied to a small sample image. */
function PresetThumb({ preset, sampleSrc }: { preset: Preset; sampleSrc: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setReady(true);
    };
    img.onerror = () => setReady(false);
    img.src = sampleSrc;
  }, [sampleSrc]);

  useEffect(() => {
    if (!ready) return;
    const img = imgRef.current;
    const canvas = ref.current;
    if (!img || !canvas) return;

    // Render at small size
    const W = 160;
    const H = 120;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!octx) return;
    // cover-fit
    const ir = img.width / img.height;
    const cr = W / H;
    let dw = W, dh = H, dx = 0, dy = 0;
    if (ir > cr) {
      dh = H;
      dw = H * ir;
      dx = (W - dw) / 2;
    } else {
      dw = W;
      dh = W / ir;
      dy = (H - dh) / 2;
    }
    octx.fillStyle = "#f5eedc";
    octx.fillRect(0, 0, W, H);
    octx.drawImage(img, dx, dy, dw, dh);

    canvas.width = W;
    canvas.height = H;
    const dctx = canvas.getContext("2d");
    if (!dctx) return;

    try {
      const { cells } = pixelate({
        source: octx,
        width: W,
        height: H,
        cellSize: preset.patch.cellSize ?? 12,
        shapeSize: preset.patch.shapeSize ?? 1,
        shape: preset.patch.shape ?? "square",
        adjust: preset.patch.adjust ?? {
          brightness: 0, contrast: 0, saturation: 0, hue: 0, invert: false,
        },
        quantizeLevels: preset.patch.quantizeLevels ?? 256,
        rotation: preset.patch.rotation ?? 0,
        focal: preset.patch.focal ?? { enabled: false, x: 0.5, y: 0.5, falloff: 1.5, mode: "center" },
        jitter: preset.patch.jitter ?? 0,
        rand: makeRng(42),
        palette: preset.patch.palette?.colors ?? null,
        dither: preset.patch.dither ?? false,
        shapeMix: preset.patch.shapeMix ?? "single",
        shapeMixShapes: preset.patch.shapeMixShapes ?? ["square"],
      });
      renderCells(
        dctx, cells, preset.patch.shape ?? "square",
        preset.patch.shapeSize ?? 1, preset.patch.rotation ?? 0,
        preset.patch.jitter ?? 0, makeRng(43),
        preset.patch.bgMode === "ink" ? [34, 28, 18] : [245, 238, 220],
        W, H,
      );
    } catch {
      // ignore — thumbnail is non-critical
    }
  }, [preset, ready]);

  return (
    <canvas
      ref={ref}
      className="preset-thumb"
      style={{ imageRendering: "auto" }}
      aria-label={`${preset.name} preview`}
    />
  );
}
