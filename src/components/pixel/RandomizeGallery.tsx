"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { useMosaic } from "@/lib/mosaic-store";
import { makeRng, pixelate, renderCells } from "@/lib/pixelate";
import { PRESETS } from "@/lib/presets";
import { Shuffle, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ShapeKind } from "@/lib/shapes";
import type { ColorAdjust } from "@/lib/color";
import type { FocalConfig } from "@/lib/pixelate";
import type { ParamSnapshot } from "@/lib/mosaic-store";

const SHAPES: ShapeKind[] = ["square", "circle", "triangle", "hexagon", "diamond", "cross", "heart", "star"];

interface Variation {
  id: number;
  patch: Partial<ParamSnapshot>;
  label: string;
}

function randomVariation(seed: number): Variation {
  const rng = makeRng(seed);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const range = (min: number, max: number) => Math.round(min + rng() * (max - min));

  // 40% chance: start from a random preset; 60%: fully random
  const usePreset = rng() < 0.4;
  const base = usePreset ? pick(PRESETS).patch : {};

  const shape = (base.shape ?? pick(SHAPES)) as ShapeKind;
  const cellSize = base.cellSize ?? range(5, 22);
  const shapeSize = base.shapeSize ?? (0.5 + rng() * 0.5);
  const rotation = rng() < 0.3 ? range(-45, 45) : 0;
  const jitter = rng() < 0.5 ? 0 : rng() * 0.4;
  const quantize = rng() < 0.4 ? range(4, 32) : 256;
  const dither = rng() < 0.25;
  const bgMode = rng() < 0.2 ? "ink" : "paper";

  const adjust: ColorAdjust = {
    brightness: rng() < 0.3 ? range(-15, 15) : 0,
    contrast: rng() < 0.4 ? range(-10, 25) : 0,
    saturation: rng() < 0.4 ? range(-20, 40) : 0,
    hue: rng() < 0.2 ? range(-60, 60) : 0,
    invert: false,
  };

  // 15% chance: enable focal
  const focal: FocalConfig = rng() < 0.15
    ? { enabled: true, x: 0.5, y: 0.5, falloff: 1 + rng() * 2, mode: rng() < 0.5 ? "center" : "edge" }
    : { enabled: false, x: 0.5, y: 0.5, falloff: 1.5, mode: "center" };

  // 20% chance: shape mix
  const shapeMix = rng() < 0.2 ? "luminance" : "single";
  const shapeMixShapes = shapeMix === "luminance"
    ? [pick(SHAPES), pick(SHAPES), pick(SHAPES)].filter((v, i, a) => a.indexOf(v) === i)
    : [shape];

  return {
    id: seed,
    label: usePreset ? "preset·rand" : "pure·rand",
    patch: {
      cellSize, shapeSize, shape, rotation, jitter, quantizeLevels: quantize, dither, bgMode,
      adjust, focal, shapeMix, shapeMixShapes,
      seed: (rng() * 1e9) | 0,
    },
  };
}

interface RandomizeGalleryProps {
  sampleSrc: string;
}

export function RandomizeGallery({ sampleSrc }: RandomizeGalleryProps) {
  const applyPreset = useMosaic((s) => s.applyPreset);
  // Lazy-initialize variations on first render (no effect needed)
  const [variations, setVariations] = useState<Variation[]>(() => {
    const base = (Date.now() % 1000000) | 0;
    return [0, 1, 2, 3].map((i) => randomVariation(base + i * 1000));
  });
  const [active, setActive] = useState<number | null>(null);

  const [rolling, setRolling] = useState(false);

  const regenerate = useCallback(() => {
    setRolling(true);
    const base = (Date.now() % 1000000) | 0;
    setVariations([0, 1, 2, 3].map((i) => randomVariation(base + i * 1000)));
    setTimeout(() => setRolling(false), 500);
  }, []);

  const onApply = (v: Variation) => {
    applyPreset(v.patch);
    setActive(v.id);
    toast.success("Variation applied", { description: "Tune further in the controls panel." });
    setTimeout(() => setActive(null), 1400);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-seal" />
          <span className="font-display text-xs font-semibold text-foreground">
            Roll the dice
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            4 variations
          </span>
        </div>
        <button
          type="button"
          onClick={regenerate}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-paper/50 px-2 py-1 text-[11px] text-foreground/80 transition-colors hover:border-seal/40 hover:bg-paper"
        >
          <Shuffle className={cn("h-3 w-3 text-seal", rolling && "dice-rolling")} />
          Reroll
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {variations.map((v, i) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onApply(v)}
            className={cn(
              "preset-card tile-pop group relative flex flex-col gap-1 rounded-md border border-border/60 bg-paper/60 p-1.5 text-left",
              active === v.id && "ring-2 ring-seal/60",
            )}
            style={{ animationDelay: `${i * 60}ms` }}
            title="Click to apply this variation"
          >
            <div className="variation-thumb-wrap">
              <VariationThumb patch={v.patch} sampleSrc={sampleSrc} seed={v.id} />
            </div>
            <div className="flex items-center justify-between px-0.5">
              <span className="font-display text-[9px] font-medium text-muted-foreground">
                {v.label}
              </span>
              {active === v.id && (
                <Check className="h-3 w-3 text-seal" />
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Four random parameter combinations. Click any tile to apply it, or
        <span className="text-seal"> Reroll </span>
        for fresh ideas. Mixes presets + pure-random params.
      </p>
    </div>
  );
}

/** A tiny live-rendered thumbnail of the variation applied to a sample image. */
function VariationThumb({
  patch,
  sampleSrc,
  seed,
}: {
  patch: Partial<ParamSnapshot>;
  sampleSrc: string;
  seed: number;
}) {
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

    const W = 140;
    const H = 105;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const octx = off.getContext("2d", { willReadFrequently: true });
    if (!octx) return;
    const ir = img.width / img.height;
    const cr = W / H;
    let dw = W, dh = H, dx = 0, dy = 0;
    if (ir > cr) {
      dh = H; dw = H * ir; dx = (W - dw) / 2;
    } else {
      dw = W; dh = W / ir; dy = (H - dh) / 2;
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
        cellSize: patch.cellSize ?? 12,
        shapeSize: patch.shapeSize ?? 1,
        shape: patch.shape ?? "square",
        adjust: patch.adjust ?? { brightness: 0, contrast: 0, saturation: 0, hue: 0, invert: false },
        quantizeLevels: patch.quantizeLevels ?? 256,
        rotation: patch.rotation ?? 0,
        focal: patch.focal ?? { enabled: false, x: 0.5, y: 0.5, falloff: 1.5, mode: "center" },
        jitter: patch.jitter ?? 0,
        rand: makeRng(seed),
        palette: patch.palette?.colors ?? null,
        dither: patch.dither ?? false,
        shapeMix: patch.shapeMix ?? "single",
        shapeMixShapes: patch.shapeMixShapes ?? ["square"],
      });
      renderCells(
        dctx, cells, patch.shape ?? "square",
        patch.shapeSize ?? 1, patch.rotation ?? 0,
        patch.jitter ?? 0, makeRng(seed + 1),
        patch.bgMode === "ink" ? [34, 28, 18] : [245, 238, 220],
        W, H,
      );
    } catch {
      // ignore
    }
  }, [patch, ready, seed]);

  return (
    <canvas
      ref={ref}
      className="preset-thumb"
      style={{ imageRendering: "auto" }}
      aria-label="Variation preview"
    />
  );
}
