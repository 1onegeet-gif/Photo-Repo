// Export utilities — turn a list of cells into downloadable artifacts.
// PNG via the live canvas, HTML/CSS/JSON/SVG/ASCII via string templates.

import { Cell } from "./pixelate";
import { RGB, rgbToHex, rgbToCss } from "./color";
import { shapeToSvg, ShapeKind } from "./shapes";

export type ExportFormat = "png" | "html" | "css" | "json" | "svg" | "ascii";

export interface ExportMeta {
  width: number;
  height: number;
  cells: Cell[];
  background: RGB | null;
  shape: string;
  shapeSize: number;
  /** Per-cell rotation in degrees (used by SVG export). */
  rotation?: number;
  /** Per-cell jitter strength 0..1 (used by SVG export). */
  jitter?: number;
  /** Seed for jitter RNG (used by SVG export). */
  seed?: number;
  /** Optional SVG filter effect to apply to the mosaic group. */
  filter?: SvgFilterKind;
}

export type SvgFilterKind = "none" | "soft-blur" | "emboss" | "posterize" | "grain" | "glow";

function download(filename: string, content: string | Blob, mime: string) {
  const blob =
    typeof content === "string"
      ? new Blob([content], { type: mime })
      : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Copy text to clipboard with a fallback for older browsers. Returns success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy method
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Build a CSS custom-properties string from a list of RGB colors. */
export function buildPaletteCssVars(colors: RGB[], prefix = "--mosaic"): string {
  const lines = colors.map((c, i) => `  ${prefix}-${i + 1}: ${rgbToHex(c)};`);
  return `:root {
${lines.join("\n")}
}`;
}

/** Copy a palette as CSS custom properties. Returns success. */
export async function copyPaletteCssVars(colors: RGB[], prefix?: string): Promise<boolean> {
  return copyToClipboard(buildPaletteCssVars(colors, prefix));
}

/** Build a Tailwind config color extension string from a palette. */
export function buildPaletteTailwind(colors: RGB[], prefix = "mosaic"): string {
  const lines = colors.map((c, i) => `        "${prefix}-${i + 1}": "${rgbToHex(c)}",`);
  return `// tailwind.config.js — Mosaic Atelier palette
module.exports = {
  theme: {
    extend: {
      colors: {
${lines.join("\n").replace(/,\n$/, "\n")}
      },
    },
  },
};`;
}

/** Copy a palette as a Tailwind config snippet. Returns success. */
export async function copyPaletteTailwind(colors: RGB[], prefix?: string): Promise<boolean> {
  return copyToClipboard(buildPaletteTailwind(colors, prefix));
}

/** Build the HTML export string (shared between download + clipboard). */
function buildHtmlString(meta: ExportMeta): string {
  const { width, height, cells, background, shape, shapeSize } = meta;
  const bg = background ? rgbToCss(background) : "transparent";
  const cellDivs = cells
    .map((c) => {
      const x = +c.x.toFixed(1);
      const y = +c.y.toFixed(1);
      const w = +c.w.toFixed(1);
      const h = +c.h.toFixed(1);
      const col = rgbToHex(c.color);
      return `      <i style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${col}"></i>`;
    })
    .join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Mosaic Atelier — ${shape} ${Math.round(shapeSize * 100)}%</title>
  <style>
    :root { color-scheme: light; }
    body { margin:0; min-height:100vh; display:grid; place-items:center;
           background:#f5eedc; font-family: ui-sans-serif,system-ui,sans-serif; }
    .mosaic { position:relative; width:${width}px; height:${height}px;
              background:${bg}; box-shadow:0 12px 40px -16px rgba(40,28,12,.45);
              overflow:hidden; border:1px solid #d8c9a1; border-radius:4px; }
    .mosaic i { position:absolute; display:block; content:""; border-radius:0; }
    footer { position:fixed; bottom:14px; right:18px; color:#8a7a4a; font-size:12px;
             letter-spacing:.18em; text-transform:uppercase; }
  </style>
</head>
<body>
  <figure class="mosaic">
${cellDivs}
  </figure>
  <footer>Mosaic Atelier · ${shape} · ${cells.length} cells</footer>
</body>
</html>
`;
}

/** Build the CSS export string (shared between download + clipboard). */
function buildCssString(meta: ExportMeta): string {
  const { width, height, cells, background, shape, shapeSize } = meta;
  const bg = background ? rgbToHex(background) : "transparent";
  const shadows = cells
    .map((c) => {
      const x = +c.x.toFixed(1);
      const y = +c.y.toFixed(1);
      const w = +c.w.toFixed(1);
      const h = +c.h.toFixed(1);
      const spread = Math.min(w, h);
      return `${x}px ${y}px 0 ${spread}px ${rgbToHex(c.color)}`;
    })
    .join(",\n    ");
  return `/*
  Mosaic Atelier — CSS export
  Shape: ${shape} · shapeSize ${Math.round(shapeSize * 100)}%
  Canvas: ${width}×${height} · ${cells.length} cells
  Note: box-shadow spread is uniform, so non-square cells are rendered as
  squares using the smaller dimension. For true rectangles use the HTML export.
*/
.mosaic {
  position: relative;
  width: 1px;
  height: 1px;
  margin: 0;
  padding: 0;
  background: ${bg};
  box-shadow:
    ${shadows};
}
`;
}

/** Build the JSON export string (shared between download + clipboard). */
function buildJsonString(meta: ExportMeta): string {
  const payload = {
    format: "mosaic-atelier/v1",
    width: meta.width,
    height: meta.height,
    shape: meta.shape,
    shapeSize: meta.shapeSize,
    background: meta.background
      ? {
          r: Math.round(meta.background[0]),
          g: Math.round(meta.background[1]),
          b: Math.round(meta.background[2]),
          hex: rgbToHex(meta.background),
        }
      : null,
    palette: uniquePalette(meta.cells),
    cellCount: meta.cells.length,
    cells: meta.cells.map((c) => ({
      x: +c.x.toFixed(2),
      y: +c.y.toFixed(2),
      w: +c.w.toFixed(2),
      h: +c.h.toFixed(2),
      shape: c.shape,
      r: Math.round(c.color[0]),
      g: Math.round(c.color[1]),
      b: Math.round(c.color[2]),
      hex: rgbToHex(c.color),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

/** Build the SVG export string (shared between download + clipboard). */
function buildSvgString(meta: ExportMeta): string {
  const { width, height, cells, background, shape, shapeSize, rotation = 0, jitter = 0, seed = 1, filter = "none" } = meta;
  const bg = background ? rgbToHex(background) : "transparent";
  let a = (seed >>> 0) || 1;
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const fillFraction = Math.max(0.05, Math.min(1, shapeSize));
  const parts: string[] = cells.map((c) => {
    const s = Math.min(c.w, c.h);
    const gap = (1 - fillFraction) * (s / 2);
    const j = jitter * (rand() - 0.5) * s * 0.3;
    const jr = jitter * (rand() - 0.5) * 40;
    const hex = rgbToHex(c.color);
    const useShape = (c.shape ?? shape) as ShapeKind;
    return shapeToSvg(useShape, c.x + (rand() - 0.5) * j, c.y + (rand() - 0.5) * j, s, hex, gap, rotation + jr);
  });
  const { filterDefs, filterAttr } = buildSvgFilter(filter);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="geometricPrecision">
  <defs>${filterDefs}</defs>
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <g${filterAttr}>
${parts.map((p) => "    " + p).join("\n")}
  </g>
</svg>
`;
}

/** Export PNG from the live canvas (preserves the exact rendered look). */
export function exportPng(canvas: HTMLCanvasElement, name = "mosaic.png") {
  canvas.toBlob((blob) => {
    if (!blob) return;
    download(name, blob, "image/png");
  }, "image/png");
}

/** Export HTML (download). */
export function exportHtml(meta: ExportMeta, name = "mosaic.html") {
  download(name, buildHtmlString(meta), "text/html");
}

/** Copy HTML to clipboard. Returns success. */
export async function copyHtml(meta: ExportMeta): Promise<boolean> {
  return copyToClipboard(buildHtmlString(meta));
}

/** Export CSS (download). */
export function exportCss(meta: ExportMeta, name = "mosaic.css") {
  download(name, buildCssString(meta), "text/css");
}

/** Copy CSS to clipboard. */
export async function copyCss(meta: ExportMeta): Promise<boolean> {
  return copyToClipboard(buildCssString(meta));
}

/** Export JSON (download). */
export function exportJson(meta: ExportMeta, name = "mosaic.json") {
  download(name, buildJsonString(meta), "application/json");
}

/** Copy JSON to clipboard. */
export async function copyJson(meta: ExportMeta): Promise<boolean> {
  return copyToClipboard(buildJsonString(meta));
}

/** ASCII export — terminal-friendly, downsamples to ~120 cols. */
export function exportAscii(meta: ExportMeta, name = "mosaic.txt") {
  const targetCols = 120;
  const step = Math.max(1, Math.round(meta.width / targetCols));
  const cols = Math.floor(meta.width / step);
  const rows = Math.floor(meta.height / step);
  const ramp = "@%#*+=-:. ";
  // Re-sample using nearest cell (cheap spatial lookup via grid)
  const grid: Cell[][] = Array.from({ length: rows }, () => []);
  for (const c of meta.cells) {
    const cx = Math.floor((c.x + c.w / 2) / step);
    const cy = Math.floor((c.y + c.h / 2) / step);
    if (cy >= 0 && cy < rows && cx >= 0 && cx < cols) grid[cy][cx] = c;
  }
  const lines: string[] = [];
  for (let y = 0; y < rows; y++) {
    let line = "";
    for (let x = 0; x < cols; x++) {
      const c = grid[y][x];
      if (!c) {
        line += " ";
        continue;
      }
      const lum = (c.color[0] * 0.3 + c.color[1] * 0.59 + c.color[2] * 0.11) / 255;
      const idx = Math.min(ramp.length - 1, Math.floor((1 - lum) * ramp.length));
      line += ramp[idx];
    }
    lines.push(line);
  }
  download(name, lines.join("\n"), "text/plain");
}

/** SVG export — download. */
export function exportSvg(meta: ExportMeta, name = "mosaic.svg") {
  download(name, buildSvgString(meta), "image/svg+xml");
}

/** Copy SVG to clipboard. */
export async function copySvg(meta: ExportMeta): Promise<boolean> {
  return copyToClipboard(buildSvgString(meta));
}

/** Build an SVG `<filter>` definition for the given effect kind. */
function buildSvgFilter(kind: SvgFilterKind): { filterDefs: string; filterAttr: string } {
  if (kind === "none") return { filterDefs: "", filterAttr: "" };
  const id = `fx-${kind}`;
  const filterAttr = ` filter="url(#${id})"`;
  let defs = "";
  switch (kind) {
    case "soft-blur":
      defs = `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="0.6"/></filter>`;
      break;
    case "emboss":
      defs = `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0"/></filter>`;
      break;
    case "posterize":
      // feComponentTransfer with discrete table — posterize to ~6 levels
      defs = `<filter id="${id}"><feComponentTransfer><feFuncR table="0 0.2 0.4 0.6 0.8 1" type="discrete"/><feFuncG table="0 0.2 0.4 0.6 0.8 1" type="discrete"/><feFuncB table="0 0.2 0.4 0.6 0.8 1" type="discrete"/></feComponentTransfer></filter>`;
      break;
    case "grain":
      // feTurbulence + composite for film grain
      defs = `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0" result="grain"/><feComposite in="grain" in2="SourceGraphic" operator="in" result="masked"/><feBlend in="SourceGraphic" in2="masked" mode="multiply"/></filter>`;
      break;
    case "glow":
      defs = `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
      break;
  }
  return { filterDefs: defs, filterAttr };
}

function uniquePalette(cells: Cell[]): string[] {
  const set = new Set<string>();
  for (const c of cells) set.add(rgbToHex(c.color));
  return Array.from(set);
}

export interface BatchProgress {
  done: number;
  total: number;
  current: string;
}

/**
 * Run every export in sequence with a small delay between downloads so the
 * browser doesn't block. Reports progress via the callback.
 */
export async function exportAll(
  canvas: HTMLCanvasElement,
  meta: ExportMeta,
  slug: string,
  onProgress?: (p: BatchProgress) => void,
) {
  const formats: { key: ExportFormat; label: string; fn: () => void | Promise<void> }[] = [
    { key: "png", label: "PNG", fn: () => exportPng(canvas, `${slug}.png`) },
    { key: "svg", label: "SVG", fn: () => exportSvg(meta, `${slug}.svg`) },
    { key: "html", label: "HTML", fn: () => exportHtml(meta, `${slug}.html`) },
    { key: "css", label: "CSS", fn: () => exportCss(meta, `${slug}.css`) },
    { key: "json", label: "JSON", fn: () => exportJson(meta, `${slug}.json`) },
    { key: "ascii", label: "ASCII", fn: () => exportAscii(meta, `${slug}.txt`) },
  ];
  let done = 0;
  for (const f of formats) {
    onProgress?.({ done, total: formats.length, current: f.label });
    await new Promise((r) => setTimeout(r, 350)); // give browser time between downloads
    await f.fn();
    done++;
  }
  onProgress?.({ done, total: formats.length, current: "done" });
}

