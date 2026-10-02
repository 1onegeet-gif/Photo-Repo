"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { makeRng, pixelate, renderCells, Cell } from "@/lib/pixelate";
import { useMosaicEngine } from "@/lib/useMosaicEngine";
import { Crosshair, Eye, ImageOff } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MosaicCanvasProps {
  sourceRef: React.RefObject<HTMLCanvasElement | null>;
  displayRef: React.RefObject<HTMLCanvasElement | null>;
  onStats?: (stats: { cells: number; renderMs: number; palette: string[] }) => void;
}

export function MosaicCanvas({ sourceRef, displayRef, onStats }: MosaicCanvasProps) {
  const state = useMosaic();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [busy, setBusy] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });

  // Re-render the display canvas from current store state
  const rerender = useCallback(() => {
    const display = displayRef.current;
    const source = sourceRef.current;
    if (!display || !source) return;
    const w = state.sourceWidth;
    const h = state.sourceHeight;
    if (!w || !h) return;

    const sctx = source.getContext("2d", { willReadFrequently: true });
    const dctx = display.getContext("2d");
    if (!sctx || !dctx) return;

    display.width = w;
    display.height = h;

    // Original preview
    if (state.showOriginal) {
      dctx.clearRect(0, 0, w, h);
      dctx.drawImage(source, 0, 0);
      setCells([]);
      return;
    }

    setBusy(true);
    const t0 = performance.now();
    // Run pixelation
    const { cells: newCells, bg } = pixelate({
      source: sctx,
      width: w,
      height: h,
      cellSize: state.cellSize,
      shapeSize: state.shapeSize,
      shape: state.shape,
      adjust: state.adjust,
      quantizeLevels: state.quantizeLevels,
      rotation: state.rotation,
      focal: state.focal,
      jitter: state.jitter,
      rand: makeRng(state.seed),
      palette: state.palette?.colors ?? null,
      dither: state.dither,
      shapeMix: state.shapeMix,
      shapeMixShapes: state.shapeMixShapes,
    });

    let bgRGB: [number, number, number] | null = null;
    if (state.bgMode === "paper") bgRGB = [245, 238, 220];
    else if (state.bgMode === "ink") bgRGB = [34, 28, 18];
    else if (state.bgMode === "auto") bgRGB = bg;
    else if (state.bgMode === "custom") bgRGB = state.customBg;

    renderCells(
      dctx,
      newCells,
      state.shape,
      state.shapeSize,
      state.rotation,
      state.jitter,
      makeRng(state.seed + 1),
      bgRGB,
      w,
      h,
    );
    const renderMs = performance.now() - t0;
    setCells(newCells);
    setBusy(false);

    // Emit stats
    if (onStats) {
      const paletteSet = new Set<string>();
      for (const c of newCells) {
        paletteSet.add(
          `#${[c.color[0], c.color[1], c.color[2]]
            .map((v) => (v | 0).toString(16).padStart(2, "0"))
            .join("")}`,
        );
        if (paletteSet.size > 64) break;
      }
      onStats({
        cells: newCells.length,
        renderMs,
        palette: Array.from(paletteSet),
      });
    }
  }, [displayRef, sourceRef, state, onStats]);

  useMosaicEngine(rerender);

  // Track display size for focal overlay positioning
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setDisplaySize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Focal point drag
  const onFocalPointer = useCallback(
    (e: React.PointerEvent) => {
      if (!state.focal.enabled) return;
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      state.setFocal({
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
      });
    },
    [state],
  );

  // Expose cells + meta for export via a custom event bus (window)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { type: "get-cells" }
        | undefined;
      if (detail?.type === "get-cells") {
        window.dispatchEvent(
          new CustomEvent("mosaic:cells", {
            detail: {
              cells,
              width: state.sourceWidth,
              height: state.sourceHeight,
              shape: state.shape,
              shapeSize: state.shapeSize,
              bgMode: state.bgMode,
              bg:
                state.bgMode === "paper"
                  ? [245, 238, 220]
                  : state.bgMode === "ink"
                    ? [34, 28, 18]
                    : state.bgMode === "custom"
                      ? state.customBg
                      : null,
            },
          }),
        );
      }
    };
    window.addEventListener("mosaic:request-cells", handler);
    return () => window.removeEventListener("mosaic:request-cells", handler);
  }, [cells, state]);

  const aspect = state.sourceWidth && state.sourceHeight
    ? state.sourceWidth / state.sourceHeight
    : 16 / 9;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">
            {state.sourceWidth}×{state.sourceHeight}
          </span>
          <span className="text-border">·</span>
          <span>{cells.length} cells</span>
          {state.focal.enabled && (
            <>
              <span className="text-border">·</span>
              <span className="text-seal">variable density</span>
            </>
          )}
          {state.palette && (
            <>
              <span className="text-border">·</span>
              <span className="text-matcha">locked palette · {state.palette.colors.length}</span>
            </>
          )}
          {state.dither && (
            <>
              <span className="text-border">·</span>
              <span className="text-matcha">dither</span>
            </>
          )}
          {state.shapeMix !== "single" && (
            <>
              <span className="text-border">·</span>
              <span className="text-matcha">mix · {state.shapeMix}</span>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => state.setShowOriginal(!state.showOriginal)}
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          {state.showOriginal ? "Show mosaic" : "Peek original"}
        </Button>
      </div>

      <div
        ref={wrapRef}
        className={cn(
          "relative flex flex-1 items-center justify-center overflow-hidden rounded-lg",
          "matte-card washi-texture p-4",
          busy && "ink-loader",
        )}
        style={{ minHeight: 360 }}
        onPointerMove={state.focal.enabled ? onFocalPointer : undefined}
        onPointerDown={state.focal.enabled ? onFocalPointer : undefined}
      >
        {/* Seigaiha wave corner ornaments */}
        <span className="seigaiha-corner tl" aria-hidden />
        <span className="seigaiha-corner tr" aria-hidden />
        <span className="seigaiha-corner bl" aria-hidden />
        <span className="seigaiha-corner br" aria-hidden />

        {state.hasImage ? (
          <div
            className="relative"
            style={{
              aspectRatio: `${aspect}`,
              width: "100%",
              maxWidth: "min(100%, calc((100vh - 16rem) * " + aspect + "))",
            }}
          >
            <canvas
              ref={displayRef}
              className="absolute inset-0 h-full w-full rounded"
              style={{ imageRendering: "auto" }}
            />
            {/* paper inner shadow */}
            <div
              className="pointer-events-none absolute inset-0 rounded"
              style={{
                boxShadow:
                  "inset 0 0 24px -8px oklch(0.4 0.04 50 / 0.18), inset 0 0 0 1px oklch(0.5 0.04 40 / 0.08)",
              }}
            />
            {/* Vertical kanji watermark */}
            <span className="kanji-watermark" aria-hidden>墨絵工房</span>
            {/* Hanko seal stamp */}
            <span className="hanko" aria-hidden title="Mosaic Atelier seal">墨</span>
            {state.focal.enabled && (
              <FocalHandle
                x={state.focal.x}
                y={state.focal.y}
                mode={state.focal.mode}
                displaySize={displaySize}
              />
            )}
            {busy && (
              <div className="pointer-events-none absolute right-2 top-2 rounded bg-paper/85 px-2 py-0.5 text-[10px] text-muted-foreground">
                rendering…
              </div>
            )}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function FocalHandle({
  x,
  y,
  mode,
  displaySize,
}: {
  x: number;
  y: number;
  mode: "center" | "edge";
  displaySize: { w: number; h: number };
}) {
  // Show a faint gradient ring + crosshair
  const size = Math.min(displaySize.w, displaySize.h) * 0.8;
  return (
    <>
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          left: `calc(${x * 100}% - ${size / 2}px)`,
          top: `calc(${y * 100}% - ${size / 2}px)`,
          width: size,
          height: size,
          background: mode === "center"
            ? "radial-gradient(circle, oklch(0.55 0.18 32 / 0.18), transparent 70%)"
            : "radial-gradient(circle, transparent 30%, oklch(0.55 0.18 32 / 0.18) 100%)",
          border: "1px dashed oklch(0.55 0.18 32 / 0.4)",
        }}
      />
      <div
        className="pointer-events-none absolute flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-seal text-paper shadow-md"
        style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      >
        <Crosshair className="h-3 w-3" />
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="relative flex items-center justify-center">
        <div className="enso" aria-hidden />
        <ImageOff className="absolute h-5 w-5 text-muted-foreground/70" />
      </div>
      <div>
        <p className="font-display text-base text-foreground/80">
          The canvas awaits
        </p>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          Drop a file, paste from clipboard, or pick a sample above.
          Everything stays in your browser.
        </p>
      </div>
      <div className="washi-tape tape-susutake mt-1 text-[10px] uppercase tracking-[0.25em] text-ink/70">
        空白 · blank
      </div>
    </div>
  );
}
