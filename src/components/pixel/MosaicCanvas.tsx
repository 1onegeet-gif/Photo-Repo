"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { makeRng, pixelate, renderCells, Cell } from "@/lib/pixelate";
import { useMosaicEngine } from "@/lib/useMosaicEngine";
import { Crosshair, Eye, ImageOff, SplitSquareVertical, Microscope } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rgbToHex } from "@/lib/color";

interface MosaicCanvasProps {
  sourceRef: React.RefObject<HTMLCanvasElement | null>;
  displayRef: React.RefObject<HTMLCanvasElement | null>;
  onStats?: (stats: { cells: number; renderMs: number; palette: string[] }) => void;
}

interface HoverInfo {
  x: number;
  y: number;
  cell: Cell | null;
}

export function MosaicCanvas({ sourceRef, displayRef, onStats }: MosaicCanvasProps) {
  const state = useMosaic();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const compareRef = useRef<HTMLCanvasElement | null>(null);
  const imgWrapRef = useRef<HTMLDivElement | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [busy, setBusy] = useState(false);
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [lightbox, setLightbox] = useState(false);

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

  // Compare slider drag — moves the split position
  const onComparePointer = useCallback(
    (e: React.PointerEvent) => {
      if (!state.compareMode) return;
      const wrap = imgWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      state.setSplitPos(Math.max(0.02, Math.min(0.98, x)));
    },
    [state],
  );

  // Cell inspection — find the cell under the cursor
  const onInspectMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.inspectMode || cells.length === 0) {
        setHover(null);
        return;
      }
      const wrap = imgWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      // Convert display coords → source canvas coords
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      const sx = nx * state.sourceWidth;
      const sy = ny * state.sourceHeight;
      // Linear search for the cell containing (sx, sy)
      let found: Cell | null = null;
      for (const c of cells) {
        if (sx >= c.x && sx < c.x + c.w && sy >= c.y && sy < c.y + c.h) {
          found = c;
          break;
        }
      }
      setHover({ x: e.clientX - rect.left, y: e.clientY - rect.top, cell: found });
    },
    [state.inspectMode, cells, state.sourceWidth, state.sourceHeight],
  );

  // Draw the original image to the compare canvas when compareMode is on
  useEffect(() => {
    if (!state.compareMode) return;
    const cmp = compareRef.current;
    const src = sourceRef.current;
    if (!cmp || !src) return;
    cmp.width = state.sourceWidth;
    cmp.height = state.sourceHeight;
    const cctx = cmp.getContext("2d");
    if (!cctx) return;
    cctx.clearRect(0, 0, cmp.width, cmp.height);
    cctx.drawImage(src, 0, 0);
  }, [state.compareMode, state.sourceWidth, state.sourceHeight, state.hasImage]);

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
        <div className="flex items-center gap-1">
          <ToggleButton
            active={state.compareMode}
            onClick={() => {
              state.setCompareMode(!state.compareMode);
              if (!state.compareMode) state.setShowOriginal(false);
            }}
            icon={<SplitSquareVertical className="h-3.5 w-3.5" />}
            label="Compare"
          />
          <ToggleButton
            active={state.inspectMode}
            onClick={() => state.setInspectMode(!state.inspectMode)}
            icon={<Microscope className="h-3.5 w-3.5" />}
            label="Inspect"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => state.setShowOriginal(!state.showOriginal)}
            className={cn(
              "h-7 gap-1.5 text-xs hover:text-foreground",
              state.showOriginal ? "text-seal" : "text-muted-foreground",
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            {state.showOriginal ? "Show mosaic" : "Peek original"}
          </Button>
        </div>
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
            ref={imgWrapRef}
            className="relative"
            style={{
              aspectRatio: `${aspect}`,
              width: "100%",
              maxWidth: "min(100%, calc((100vh - 16rem) * " + aspect + "))",
              cursor: state.compareMode || state.inspectMode ? "crosshair" : "zoom-in",
            }}
            onPointerMove={
              state.compareMode
                ? onComparePointer
                : state.inspectMode
                  ? onInspectMove
                  : undefined
            }
            onPointerDown={state.compareMode ? onComparePointer : undefined}
            onPointerLeave={() => setHover(null)}
            onClick={() =>
              state.inspectMode || state.compareMode ? undefined : setLightbox(true)
            }
          >
            <canvas
              ref={displayRef}
              className="absolute inset-0 h-full w-full rounded"
              style={{ imageRendering: "auto" }}
            />
            {/* Compare overlay — original image clipped to left of split */}
            {state.compareMode && (
              <canvas
                ref={compareRef}
                className="pointer-events-none absolute inset-0 h-full w-full rounded"
                style={{
                  clipPath: `inset(0 ${(1 - state.splitPos) * 100}% 0 0)`,
                }}
              />
            )}
            {/* Compare split handle */}
            {state.compareMode && (
              <CompareHandle pos={state.splitPos} />
            )}
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
            {/* Inspect tooltip */}
            {state.inspectMode && hover?.cell && (
              <InspectTooltip hover={hover} />
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

      {/* Lightbox modal */}
      {lightbox && state.hasImage && (
        <Lightbox sourceCanvasRef={displayRef} onClose={() => setLightbox(false)} />
      )}
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
        <div className="enso enso-animated" aria-hidden />
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

function ToggleButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-7 gap-1.5 text-xs hover:text-foreground",
        active ? "text-seal bg-seal/5" : "text-muted-foreground",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function CompareHandle({ pos }: { pos: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-10 flex items-center"
      style={{ left: `${pos * 100}%`, transform: "translateX(-50%)" }}
    >
      {/* vertical line */}
      <div className="absolute inset-y-0 w-0.5 bg-seal/50" />
      {/* handle knob */}
      <div className="compare-handle-knob relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-seal bg-paper shadow-md">
        <SplitSquareVertical className="h-3.5 w-3.5 text-seal" />
      </div>
      {/* labels */}
      <span className="pointer-events-none absolute left-2 top-2 rounded bg-paper/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
        original
      </span>
      <span className="pointer-events-none absolute right-2 top-2 rounded bg-paper/80 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-seal">
        mosaic
      </span>
    </div>
  );
}

function InspectTooltip({ hover }: { hover: HoverInfo }) {
  const c = hover.cell;
  if (!c) return null;
  const hex = rgbToHex(c.color);
  // Position tooltip near cursor, flip if near right edge
  const left = hover.x + 12;
  const top = hover.y + 12;
  return (
    <div
      className="pointer-events-none absolute z-20 flex items-center gap-2 rounded-md border border-border bg-paper/95 px-2 py-1.5 shadow-lg backdrop-blur"
      style={{ left, top, maxWidth: 200 }}
    >
      <span
        className="h-7 w-7 shrink-0 rounded border border-border"
        style={{ background: hex }}
      />
      <div className="flex flex-col text-[10px] leading-tight">
        <span className="font-mono text-foreground">{hex}</span>
        <span className="text-muted-foreground">
          {c.shape} · {c.w.toFixed(0)}×{c.h.toFixed(0)}px
        </span>
        <span className="text-muted-foreground">
          rgb({c.color[0] | 0},{c.color[1] | 0},{c.color[2] | 0})
        </span>
      </div>
    </div>
  );
}

function Lightbox({
  sourceCanvasRef,
  onClose,
}: {
  sourceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onClose: () => void;
}) {
  const localRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const src = sourceCanvasRef.current;
    const dst = localRef.current;
    if (!src || !dst) return;
    dst.width = src.width;
    dst.height = src.height;
    const dctx = dst.getContext("2d");
    if (!dctx) return;
    dctx.drawImage(src, 0, 0);
  }, [sourceCanvasRef]);

  // Close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Zoomed mosaic"
    >
      <div
        className="relative max-h-full max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <canvas
          ref={localRef}
          className="max-h-[88vh] max-w-[88vw] rounded-lg border-4 border-paper shadow-2xl"
          style={{ imageRendering: "auto" }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-paper text-ink shadow-lg transition-transform hover:scale-110"
          aria-label="Close zoom"
        >
          ✕
        </button>
        <div className="pointer-events-none absolute -bottom-8 left-0 right-0 text-center text-[10px] uppercase tracking-[0.3em] text-paper/70">
          click outside or press esc to close · 墨絵拡大
        </div>
      </div>
    </div>
  );
}
