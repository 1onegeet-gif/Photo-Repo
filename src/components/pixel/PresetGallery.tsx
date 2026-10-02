"use client";

import { PRESETS, Preset } from "@/lib/presets";
import { useMosaic } from "@/lib/mosaic-store";
import { makeRng, pixelate, renderCells } from "@/lib/pixelate";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PresetGalleryProps {
  sampleSrc: string;
  onStats?: (stats: { cells: number; renderMs: number; palette: string[] }) => void;
}

export function PresetGallery({ sampleSrc }: PresetGalleryProps) {
  const applyPreset = useMosaic((s) => s.applyPreset);
  const [active, setActive] = useState<string | null>(null);

  const onApply = (p: Preset) => {
    applyPreset(p.patch);
    setActive(p.id);
    toast.success(`Preset · ${p.name}`, { description: p.desc });
    setTimeout(() => setActive(null), 1400);
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {PRESETS.map((p) => (
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
