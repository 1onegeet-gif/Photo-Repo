"use client";

import { create } from "zustand";
import type { ShapeKind } from "@/lib/shapes";
import type { ColorAdjust } from "@/lib/color";
import { DEFAULT_ADJUST, RGB } from "@/lib/color";
import { DEFAULT_FOCAL, FocalConfig } from "@/lib/pixelate";

export type BgMode = "transparent" | "paper" | "ink" | "auto" | "custom";

/** A shape-mix rule: choose shape based on luminance band. */
export type ShapeMixMode = "single" | "luminance" | "random";

/** A locked palette — when non-null, cells snap to nearest palette color. */
export interface LockedPalette {
  colors: RGB[];     // length 2..32
  source: "image" | "custom" | "preset";
  name?: string;
}

/** Snapshot of all renderable params — used for undo/redo. */
export interface ParamSnapshot {
  cellSize: number;
  shapeSize: number;
  shape: ShapeKind;
  rotation: number;
  jitter: number;
  seed: number;
  adjust: ColorAdjust;
  quantizeLevels: number;
  focal: FocalConfig;
  bgMode: BgMode;
  customBg: [number, number, number];
  shapeMix: ShapeMixMode;
  shapeMixShapes: ShapeKind[];
  palette: LockedPalette | null;
  dither: boolean;
}

export interface MosaicState extends ParamSnapshot {
  // Source image
  hasImage: boolean;
  sourceWidth: number;
  sourceHeight: number;
  fileName: string;
  // Transform applied to source (cumulative via re-draw from original)
  transform: {
    flipH: boolean;
    flipV: boolean;
    rotate90: number; // 0, 90, 180, 270
  };
  // UI
  showOriginal: boolean;
  showFocal: boolean;
  compareMode: boolean;
  splitPos: number;        // 0..1 — compare slider position
  inspectMode: boolean;    // hover-to-inspect cells
  helpOpen: boolean;
  // History
  past: ParamSnapshot[];
  future: ParamSnapshot[];

  // Actions
  setHasImage: (v: boolean, w: number, h: number, name: string) => void;
  setCellSize: (v: number) => void;
  setShapeSize: (v: number) => void;
  setShape: (s: ShapeKind) => void;
  setRotation: (v: number) => void;
  setJitter: (v: number) => void;
  setSeed: (v: number) => void;
  reseed: () => void;
  setAdjust: (a: Partial<ColorAdjust>) => void;
  setQuantize: (v: number) => void;
  setFocal: (f: Partial<FocalConfig>) => void;
  setBgMode: (b: BgMode) => void;
  setCustomBg: (rgb: [number, number, number]) => void;
  setShowOriginal: (v: boolean) => void;
  resetAdjust: () => void;
  randomize: () => void;
  // New
  setShapeMix: (m: ShapeMixMode) => void;
  setShapeMixShapes: (shapes: ShapeKind[]) => void;
  setPalette: (p: LockedPalette | null) => void;
  setDither: (v: boolean) => void;
  applyPreset: (p: Partial<ParamSnapshot>) => void;
  undo: () => void;
  redo: () => void;
  /** Replace params WITHOUT pushing history (for preset/undo/redo themselves). */
  replaceParams: (p: Partial<ParamSnapshot>, opts?: { silent?: boolean }) => void;
  // Compare + inspect
  setCompareMode: (v: boolean) => void;
  setSplitPos: (v: number) => void;
  setInspectMode: (v: boolean) => void;
  // Transform
  setTransform: (t: Partial<{ flipH: boolean; flipV: boolean; rotate90: number }>) => void;
  flipH: () => void;
  flipV: () => void;
  rotate90: () => void;
  resetTransform: () => void;
  // Help
  setHelpOpen: (v: boolean) => void;
}

const INITIAL: ParamSnapshot = {
  cellSize: 14,
  shapeSize: 1,
  shape: "square",
  rotation: 0,
  jitter: 0,
  seed: 1337,
  adjust: { ...DEFAULT_ADJUST },
  quantizeLevels: 256,
  focal: { ...DEFAULT_FOCAL },
  bgMode: "paper",
  customBg: [245, 238, 220],
  shapeMix: "single",
  shapeMixShapes: ["square"],
  palette: null,
  dither: false,
};

/** Snapshot only the renderable params (not history/UI). */
function snapshot(s: MosaicState): ParamSnapshot {
  return {
    cellSize: s.cellSize,
    shapeSize: s.shapeSize,
    shape: s.shape,
    rotation: s.rotation,
    jitter: s.jitter,
    seed: s.seed,
    adjust: { ...s.adjust },
    quantizeLevels: s.quantizeLevels,
    focal: { ...s.focal },
    bgMode: s.bgMode,
    customBg: [...s.customBg] as [number, number, number],
    shapeMix: s.shapeMix,
    shapeMixShapes: [...s.shapeMixShapes],
    palette: s.palette ? { ...s.palette, colors: [...s.palette.colors] } : null,
    dither: s.dither,
  };
}

/** Push current params to history (called before any param mutation). */
function withHistory(set: (fn: (s: MosaicState) => Partial<MosaicState>) => void) {
  set((s) => ({
    past: [...s.past, snapshot(s)].slice(-50), // cap at 50
    future: [],
  }));
}

export const useMosaic = create<MosaicState>((set, get) => ({
  ...INITIAL,
  hasImage: false,
  sourceWidth: 0,
  sourceHeight: 0,
  fileName: "",
  transform: { flipH: false, flipV: false, rotate90: 0 },
  showOriginal: false,
  showFocal: false,
  compareMode: false,
  splitPos: 0.5,
  inspectMode: false,
  helpOpen: false,
  past: [],
  future: [],

  setHasImage: (v, w, h, name) =>
    set({ hasImage: v, sourceWidth: w, sourceHeight: h, fileName: name }),

  setCellSize: (v) => {
    withHistory(set);
    set({ cellSize: v });
  },
  setShapeSize: (v) => {
    withHistory(set);
    set({ shapeSize: v });
  },
  setShape: (s) => {
    withHistory(set);
    set({ shape: s, shapeMix: "single", shapeMixShapes: [s] });
  },
  setRotation: (v) => {
    withHistory(set);
    set({ rotation: v });
  },
  setJitter: (v) => {
    withHistory(set);
    set({ jitter: v });
  },
  setSeed: (v) => {
    withHistory(set);
    set({ seed: v });
  },
  reseed: () => {
    withHistory(set);
    set({ seed: (Math.random() * 1e9) | 0 });
  },
  setAdjust: (a) => {
    withHistory(set);
    set((s) => ({ adjust: { ...s.adjust, ...a } }));
  },
  setQuantize: (v) => {
    withHistory(set);
    set({ quantizeLevels: v });
  },
  setFocal: (f) => {
    withHistory(set);
    set((s) => ({ focal: { ...s.focal, ...f } }));
  },
  setBgMode: (b) => {
    withHistory(set);
    set({ bgMode: b });
  },
  setCustomBg: (rgb) => {
    withHistory(set);
    set({ customBg: rgb });
  },
  setShowOriginal: (v) => set({ showOriginal: v }),
  resetAdjust: () => {
    withHistory(set);
    set({ adjust: { ...DEFAULT_ADJUST } });
  },
  randomize: () => {
    withHistory(set);
    set((s) => ({
      cellSize: 4 + Math.floor(Math.random() * 30),
      shapeSize: 0.4 + Math.random() * 0.6,
      rotation: Math.random() < 0.3 ? Math.floor(Math.random() * 90 - 45) : 0,
      jitter: Math.random() < 0.5 ? 0 : Math.random() * 0.4,
      seed: (Math.random() * 1e9) | 0,
      shapeMix: s.shapeMix,
      shapeMixShapes: s.shapeMixShapes,
    }));
  },

  // New actions
  setShapeMix: (m) => {
    withHistory(set);
    set((s) => ({
      shapeMix: m,
      shapeMixShapes:
        s.shapeMixShapes.length === 0 ? [s.shape] : s.shapeMixShapes,
    }));
  },
  setShapeMixShapes: (shapes) => {
    withHistory(set);
    set({ shapeMixShapes: shapes, shapeMix: shapes.length > 1 ? "luminance" : "single" });
  },
  setPalette: (p) => {
    withHistory(set);
    set({ palette: p });
  },
  setDither: (v) => {
    withHistory(set);
    set({ dither: v });
  },

  applyPreset: (p) => {
    withHistory(set);
    set({ ...p });
  },

  replaceParams: (p, opts) => {
    if (!opts?.silent) withHistory(set);
    set({ ...p });
  },

  undo: () => {
    const s = get();
    if (s.past.length === 0) return;
    const prev = s.past[s.past.length - 1];
    set({
      ...prev,
      past: s.past.slice(0, -1),
      future: [snapshot(s), ...s.future].slice(0, 50),
    });
  },
  redo: () => {
    const s = get();
    if (s.future.length === 0) return;
    const next = s.future[0];
    set({
      ...next,
      past: [...s.past, snapshot(s)].slice(-50),
      future: s.future.slice(1),
    });
  },

  setCompareMode: (v) => set({ compareMode: v }),
  setSplitPos: (v) => set({ splitPos: Math.max(0, Math.min(1, v)) }),
  setInspectMode: (v) => set({ inspectMode: v }),
  setTransform: (t) => set((s) => ({ transform: { ...s.transform, ...t } })),
  flipH: () => set((s) => ({ transform: { ...s.transform, flipH: !s.transform.flipH } })),
  flipV: () => set((s) => ({ transform: { ...s.transform, flipV: !s.transform.flipV } })),
  rotate90: () =>
    set((s) => ({
      transform: { ...s.transform, rotate90: (s.transform.rotate90 + 90) % 360 },
    })),
  resetTransform: () => set({ transform: { flipH: false, flipV: false, rotate90: 0 } }),
  setHelpOpen: (v) => set({ helpOpen: v }),
}));
