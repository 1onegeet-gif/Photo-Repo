// Export utilities — turn a list of cells into downloadable artifacts.
// PNG via the live canvas, HTML/CSS/JSON via string templates.

import { Cell } from "./pixelate";
import { RGB, rgbToHex, rgbToCss } from "./color";

export type ExportFormat = "png" | "html" | "css" | "json" | "ascii";

export interface ExportMeta {
  width: number;
  height: number;
  cells: Cell[];
  background: RGB | null;
  shape: string;
  shapeSize: number;
}

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

/** Export PNG from the live canvas (preserves the exact rendered look). */
export function exportPng(canvas: HTMLCanvasElement, name = "mosaic.png") {
  canvas.toBlob((blob) => {
    if (!blob) return;
    download(name, blob, "image/png");
  }, "image/png");
}

/** Build a single-file HTML using a CSS grid of divs (each cell is a colored box). */
export function exportHtml(meta: ExportMeta, name = "mosaic.html") {
  const { width, height, cells, background, shape, shapeSize } = meta;
  const bg = background ? rgbToCss(background) : "transparent";
  const cellDivs = cells
    .map((c) => {
      const x = +c.x.toFixed(1);
      const y = +c.y.toFixed(1);
      const w = +c.w.toFixed(1);
      const h = +c.h.toFixed(1);
      const col = rgbToHex(c.color);
      // Use absolute positioning so variable-size cells render correctly
      return `      <i style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${col}"></i>`;
    })
    .join("\n");

  const html = `<!doctype html>
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
  download(name, html, "text/html");
}

/** Build a CSS file using a single element with a giant `box-shadow` list. */
export function exportCss(meta: ExportMeta, name = "mosaic.css") {
  const { width, height, cells, background } = meta;
  const bg = background ? rgbToHex(background) : "transparent";
  // box-shadow format: offsetX offsetY blur(0) spread(colorW) color
  // Each cell rendered as a tiny rect of size w×h at (x,y).
  // We use `inset` so the spread starts at the box itself, sized 1×1, so
  // the offset/scale equals the cell position. Easier: use a 1px canvas.
  const shadows = cells
    .map((c) => {
      const x = +c.x.toFixed(1);
      const y = +c.y.toFixed(1);
      const w = +c.w.toFixed(1);
      const h = +c.h.toFixed(1);
      // box-shadow: <x> <y> 0 0 <w>×<h>? CSS box-shadow spread is uniform,
      // so we approximate with the smaller dimension as spread and use the
      // larger dimension via... actually CSS box-shadow can't do rectangles
      // of differing w/h. We'll emit a comment + use `outline` trick: instead
      // use the average spread and emit accurate positions. For a true
      // rectangle we'd need multiple shadows. Compromise: spread = w (assume
      // square-ish cells), and document this in a header comment.
      const spread = Math.min(w, h);
      return `${x}px ${y}px 0 ${spread}px ${rgbToHex(c.color)}`;
    })
    .join(",\n    ");

  const css = `/*
  Mosaic Atelier — CSS export
  Shape: ${meta.shape} · shapeSize ${Math.round(meta.shapeSize * 100)}%
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
  download(name, css, "text/css");
}

/** JSON export — full reconstruction data (cells + metadata). */
export function exportJson(meta: ExportMeta, name = "mosaic.json") {
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
  download(name, JSON.stringify(payload, null, 2), "application/json");
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

function uniquePalette(cells: Cell[]): string[] {
  const set = new Set<string>();
  for (const c of cells) set.add(rgbToHex(c.color));
  return Array.from(set);
}
