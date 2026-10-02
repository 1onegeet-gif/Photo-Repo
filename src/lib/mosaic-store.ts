"use client";

import { create } from "zustand";
import type { ShapeKind } from "@/lib/shapes";
import type { ColorAdjust } from "@/lib/color";
import { DEFAULT_ADJUST } from "@/lib/color";
import { DEFAULT_FOCAL, FocalConfig } from "@/lib/pixelate";

export type BgMode = "transparent" | "paper" | "ink" | "auto" | "custom";

export interface MosaicState {
  // Source image
  hasImage: boolean;
  sourceWidth: number;
  sourceHeight: number;
  fileName: string;
  // Pixel
  cellSize: number;        // 4..80
  shapeSize: number;       // 0.05..1 (fraction)
  shape: ShapeKind;
  rotation: number;        // -180..180
  jitter: number;          // 0..1
  seed: number;            // PRNG seed
  // Color
  adjust: ColorAdjust;
  quantizeLevels: number;  // 2..256
  // Variable density
  focal: FocalConfig;
  // Background
  bgMode: BgMode;
  customBg: [number, number, number]; // RGB
  // UI
  showOriginal: boolean;
  showFocal: boolean;

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
}

export const useMosaic = create<MosaicState>((set) => ({
  hasImage: false,
  sourceWidth: 0,
  sourceHeight: 0,
  fileName: "",
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
  showOriginal: false,
  showFocal: false,

  setHasImage: (v, w, h, name) =>
    set({ hasImage: v, sourceWidth: w, sourceHeight: h, fileName: name }),
  setCellSize: (v) => set({ cellSize: v }),
  setShapeSize: (v) => set({ shapeSize: v }),
  setShape: (s) => set({ shape: s }),
  setRotation: (v) => set({ rotation: v }),
  setJitter: (v) => set({ jitter: v }),
  setSeed: (v) => set({ seed: v }),
  reseed: () => set((s) => ({ seed: (Math.random() * 1e9) | 0 })),
  setAdjust: (a) => set((s) => ({ adjust: { ...s.adjust, ...a } })),
  setQuantize: (v) => set({ quantizeLevels: v }),
  setFocal: (f) => set((s) => ({ focal: { ...s.focal, ...f } })),
  setBgMode: (b) => set({ bgMode: b }),
  setCustomBg: (rgb) => set({ customBg: rgb }),
  setShowOriginal: (v) => set({ showOriginal: v }),
  resetAdjust: () => set({ adjust: { ...DEFAULT_ADJUST } }),
  randomize: () =>
    set((s) => ({
      cellSize: 4 + Math.floor(Math.random() * 30),
      shapeSize: 0.4 + Math.random() * 0.6,
      rotation: Math.random() < 0.3 ? Math.floor(Math.random() * 90 - 45) : 0,
      jitter: Math.random() < 0.5 ? 0 : Math.random() * 0.4,
      seed: (Math.random() * 1e9) | 0,
    })),
}));
