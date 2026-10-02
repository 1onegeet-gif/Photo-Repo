"use client";

import { useState, useEffect, useRef } from "react";
import { Eye, X, Copy, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  copyCss,
  copyHtml,
  copyJson,
  copySvg,
  ExportMeta,
} from "@/lib/export";

interface PreviewModalProps {
  open: boolean;
  format: "html" | "css" | "svg" | "json" | null;
  meta: ExportMeta | null;
  onClose: () => void;
  onDownload: (format: "html" | "css" | "svg" | "json") => void;
}

export function PreviewModal({
  open,
  format,
  meta,
  onClose,
  onDownload,
}: PreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLPreElement | null>(null);

  // Derive code string from props (no setState in effect needed)
  const code = open && format && meta ? buildPreview(format, meta) : "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !format) return null;

  const onCopy = async () => {
    let ok = false;
    if (format === "html") ok = await copyHtml(meta!);
    else if (format === "css") ok = await copyCss(meta!);
    else if (format === "svg") ok = await copySvg(meta!);
    else if (format === "json") ok = await copyJson(meta!);
    if (ok) {
      setCopied(true);
      toast.success(`${format.toUpperCase()} copied to clipboard`);
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Clipboard not available");
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label={`${format.toUpperCase()} preview`}
    >
      <div
        className="modal-pop matte-card washi-texture relative flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-seal" />
            <span className="font-display text-sm font-semibold text-foreground">
              {format.toUpperCase()} preview
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {lineCount} lines · {code.length} chars
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-paper hover:text-foreground"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Code body */}
        <div className="relative flex-1 overflow-auto">
          <pre
            ref={codeRef}
            className="m-0 max-h-[60vh] overflow-auto bg-paper/40 p-4 font-mono text-[11px] leading-relaxed text-foreground/90"
          >
            <code>{code}</code>
          </pre>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 border-t border-border/50 px-5 py-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {format === "svg" ? "vector · scales infinitely" : format === "html" ? "self-contained page" : format === "css" ? "box-shadow mosaic" : "structured data"}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1.5 rounded-md border border-border/60 bg-paper/60 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-seal/40 hover:bg-paper"
            >
              <Copy className={cn("h-3 w-3", copied ? "text-matcha" : "text-seal")} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={() => onDownload(format)}
              className="flex items-center gap-1.5 rounded-md bg-seal px-3 py-1.5 text-xs font-medium text-paper transition-colors hover:bg-seal/90"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Build a preview string for the given format (minimal inline versions). */
function buildPreview(format: string, meta: ExportMeta): string {
  const { width, height, cells, background, shape, shapeSize } = meta;
  const bg = background ? `#${[background[0], background[1], background[2]].map((v) => (v | 0).toString(16).padStart(2, "0")).join("")}` : "transparent";

  if (format === "json") {
    return JSON.stringify(
      {
        format: "mosaic-atelier/v1",
        width, height, shape, shapeSize,
        cellCount: cells.length,
        cells: cells.slice(0, 8).map((c) => ({
          x: +c.x.toFixed(1), y: +c.y.toFixed(1),
          w: +c.w.toFixed(1), h: +c.h.toFixed(1),
          shape: c.shape,
          hex: `#${[c.color[0], c.color[1], c.color[2]].map((v) => (v | 0).toString(16).padStart(2, "0")).join("")}`,
        })),
        "…": `+ ${cells.length - 8} more cells`,
      },
      null,
      2,
    );
  }

  if (format === "css") {
    const shadows = cells.slice(0, 12).map((c) => {
      const hex = `#${[c.color[0], c.color[1], c.color[2]].map((v) => (v | 0).toString(16).padStart(2, "0")).join("")}`;
      return `  ${c.x.toFixed(1)}px ${c.y.toFixed(1)}px 0 ${Math.min(c.w, c.h).toFixed(1)}px ${hex}`;
    }).join(",\n");
    return `/*
  Mosaic Atelier — CSS export
  ${shape} · ${cells.length} cells · ${width}×${height}
  (showing first 12 of ${cells.length} shadows)
*/
.mosaic {
  position: relative;
  width: 1px;
  height: 1px;
  background: ${bg};
  box-shadow:
${shadows}${cells.length > 12 ? "," : ""}
  … + ${Math.max(0, cells.length - 12)} more
;
}`;
  }

  if (format === "html") {
    const divs = cells.slice(0, 6).map((c) => {
      const hex = `#${[c.color[0], c.color[1], c.color[2]].map((v) => (v | 0).toString(16).padStart(2, "0")).join("")}`;
      return `      <i style="left:${c.x.toFixed(1)}px;top:${c.y.toFixed(1)}px;width:${c.w.toFixed(1)}px;height:${c.h.toFixed(1)}px;background:${hex}"></i>`;
    }).join("\n");
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Mosaic Atelier — ${shape}</title>
  <style>
    .mosaic { position:relative; width:${width}px; height:${height}px;
              background:${bg}; overflow:hidden; }
    .mosaic i { position:absolute; display:block; }
  </style>
</head>
<body>
  <figure class="mosaic">
${divs}
    <!-- + ${Math.max(0, cells.length - 6)} more cells -->
  </figure>
</body>
</html>`;
  }

  if (format === "svg") {
    const parts = cells.slice(0, 8).map((c) => {
      const hex = `#${[c.color[0], c.color[1], c.color[2]].map((v) => (v | 0).toString(16).padStart(2, "0")).join("")}`;
      const s = Math.min(c.w, c.h);
      return `    <rect x="${c.x.toFixed(1)}" y="${c.y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${hex}"/>`;
    }).join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <g>
${parts}
    <!-- + ${Math.max(0, cells.length - 8)} more cells -->
  </g>
</svg>`;
  }

  return "";
}
