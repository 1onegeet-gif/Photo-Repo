// Core pixelation / mosaic engine.
// Pure function: takes source pixel data + options, returns a list of cells.
// The caller is responsible for drawing cells to a target canvas (so the same
// data can power the on-screen canvas AND exports to PNG / HTML / CSS / JSON).

import { ShapeKind, drawShape } from "./shapes";
import {
  RGB,
  applyAdjust,
  averageColor,
  clamp,
  DEFAULT_ADJUST,
  quantize,
  nearestInPalette,
  ColorAdjust,
} from "./color";

export interface FocalConfig {
  enabled: boolean;
  /** Normalized focal point, 0..1 */
  x: number;
  y: number;
  /** 0 = uniform, 4 = very strong variation */
  falloff: number;
  /** which end is fine: 'center' = fine near focal, 'edge' = coarse near focal */
  mode: "center" | "edge";
}

export interface PixelateOptions {
  /** Source canvas 2d context — must contain the image at its native size */
  source: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Grid cell size in px — smaller = denser. Range ~4..80 */
  cellSize: number;
  /** 0..1 — fraction of cell filled by shape */
  shapeSize: number;
  shape: ShapeKind;
  adjust: ColorAdjust;
  /** Color depth: 2..256 */
  quantizeLevels: number;
  /** Rotate each shape by this many degrees */
  rotation: number;
  focal: FocalConfig;
  /** Seed for slight per-cell jitter of shape size/rotation (0 = off) */
  jitter: number;
  /** Seedable pseudo-random — defaults to Math.random */
  rand?: () => number;
  /** When non-null, every cell color snaps to nearest palette color. */
  palette?: RGB[] | null;
  /** Apply Bayer ordered dithering before quantization (retro feel). */
  dither?: boolean;
  /** When "luminance" or "random", pick shape per-cell from `shapeMixShapes`. */
  shapeMix?: "single" | "luminance" | "random";
  shapeMixShapes?: ShapeKind[];
}

export interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  color: RGB;
  /** Per-cell shape (resolved by mix mode). */
  shape: ShapeKind;
}

export const DEFAULT_FOCAL: FocalConfig = {
  enabled: false,
  x: 0.5,
  y: 0.5,
  falloff: 1.5,
  mode: "center",
};

/** Simple fast hash-based PRNG (mulberry32) — deterministic per seed. */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Compute the cell size at a given normalized position, taking the focal
 * variation into account. Returns size in px.
 */
function cellSizeAt(
  nx: number,
  ny: number,
  base: number,
  focal: FocalConfig,
): number {
  if (!focal.enabled || focal.falloff <= 0) return base;
  const dx = nx - focal.x;
  const dy = ny - focal.y;
  // normalize distance 0..~1.414; clamp to 1
  const d = Math.min(1, Math.sqrt(dx * dx + dy * dy));
  // factor in [1/(1+falloff), 1+falloff]
  let factor: number;
  if (focal.mode === "center") {
    // fine at focal (factor 1) → coarse far (factor 1+falloff*d)
    factor = 1 + focal.falloff * d;
  } else {
    // coarse near focal, fine far
    factor = 1 + focal.falloff * (1 - d);
  }
  return Math.max(2, base * factor);
}

/** Average RGB over a rectangular region of source ImageData. */
function sampleRegion(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  x0: number,
  y0: number,
  w: number,
  h: number,
): RGB {
  let r = 0, g = 0, b = 0, count = 0;
  const xi0 = Math.max(0, Math.floor(x0));
  const yi0 = Math.max(0, Math.floor(y0));
  const xi1 = Math.min(sw, Math.floor(x0 + w));
  const yi1 = Math.min(sh, Math.floor(y0 + h));
  const stride = Math.max(1, Math.floor(Math.max(w, h) / 24) || 1); // sample stride for big cells
  for (let y = yi0; y < yi1; y += stride) {
    for (let x = xi0; x < xi1; x += stride) {
      const idx = (y * sw + x) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }
  }
  if (count === 0) return [128, 128, 128];
  return [r / count, g / count, b / count];
}

export interface PixelateResult {
  cells: Cell[];
  /** Average bg color (for CSS export fallback) */
  bg: RGB;
}

/** 4×4 Bayer ordered dithering matrix (values 0..15). */
const BAYER_4X4 = [
  0, 8, 2, 10,
  12, 4, 14, 6,
  3, 11, 1, 9,
  15, 7, 13, 5,
];

/** Pick a shape for a cell based on the mix mode. */
function resolveShape(
  mix: "single" | "luminance" | "random",
  shapes: ShapeKind[],
  fallback: ShapeKind,
  lum: number,
  rand: () => number,
): ShapeKind {
  if (mix === "single" || shapes.length === 0) return fallback;
  if (mix === "random") return shapes[Math.floor(rand() * shapes.length)];
  // luminance: split [0,1] into len(shapes) bands, dark→light
  const idx = Math.min(shapes.length - 1, Math.floor(lum * shapes.length));
  return shapes[idx];
}

export function pixelate(opts: PixelateOptions): PixelateResult {
  const {
    source,
    width,
    height,
    cellSize,
    shapeSize,
    shape,
    adjust,
    quantizeLevels,
    rotation,
    focal,
    jitter,
    rand = Math.random,
    palette = null,
    dither = false,
    shapeMix = "single",
    shapeMixShapes = [shape],
  } = opts;

  const sourceData = source.getImageData(0, 0, width, height);
  const data = sourceData.data;
  const sw = width;
  const sh = height;

  const cells: Cell[] = [];
  let y = 0;
  while (y < height) {
    const ny = (y + cellSize / 2) / height;
    const ch = cellSizeAt(ny, 0.5, cellSize, focal);
    let x = 0;
    while (x < width) {
      const nx = (x + ch / 2) / width;
      const cw = cellSizeAt(nx, ny, cellSize, focal);
      const color = sampleRegion(data, sw, sh, x, y, cw, ch);
      const adj = applyAdjust(color, adjust);

      // Optional Bayer dithering — nudge the color before quantizing.
      let work = adj;
      if (dither) {
        const bx = Math.floor(x) & 3;
        const by = Math.floor(y) & 3;
        const t = (BAYER_4X4[by * 4 + bx] - 7.5) / 16; // -0.5..+0.5
        const amp = 32; // dither strength
        work = [
          clamp(adj[0] + t * amp),
          clamp(adj[1] + t * amp),
          clamp(adj[2] + t * amp),
        ];
      }

      let quant: RGB;
      if (palette && palette.length > 0) {
        quant = nearestInPalette(work, palette);
      } else {
        quant = quantize(work, quantizeLevels);
      }

      const lum =
        (quant[0] * 0.3 + quant[1] * 0.59 + quant[2] * 0.11) / 255;
      const cellShape = resolveShape(shapeMix, shapeMixShapes, shape, lum, rand);

      cells.push({ x, y, w: cw, h: ch, color: quant, shape: cellShape });
      x += cw;
    }
    y += ch;
  }

  const bg = averageColor(data);
  return { cells, bg: applyAdjust(bg, adjust) };
}

/** Render cells into a target 2D context. Each cell carries its own shape. */
export function renderCells(
  ctx: CanvasRenderingContext2D,
  cells: Cell[],
  shape: ShapeKind,
  shapeSize: number,
  rotation: number,
  jitter: number,
  rand: () => number,
  background: RGB | null,
  width: number,
  height: number,
) {
  if (background) {
    ctx.fillStyle = `rgb(${background[0] | 0},${background[1] | 0},${background[2] | 0})`;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.clearRect(0, 0, width, height);
  }

  const fillFraction = clamp(Math.round(shapeSize * 100) / 100, 0.05, 1);
  for (const cell of cells) {
    const s = Math.min(cell.w, cell.h);
    const gap = (1 - fillFraction) * (s / 2);
    const j = jitter * (rand() - 0.5) * s * 0.3;
    const jr = jitter * (rand() - 0.5) * 40;
    const css = `rgb(${cell.color[0] | 0},${cell.color[1] | 0},${cell.color[2] | 0})`;
    const useShape = cell.shape ?? shape;
    drawShape(
      ctx,
      useShape,
      cell.x + (rand() - 0.5) * j,
      cell.y + (rand() - 0.5) * j,
      s,
      css,
      gap,
      rotation + jr,
    );
  }
}

export { DEFAULT_ADJUST };
