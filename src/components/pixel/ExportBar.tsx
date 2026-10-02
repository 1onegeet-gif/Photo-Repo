"use client";

import {
  exportAll,
  exportAscii,
  exportCss,
  exportHtml,
  exportJson,
  exportPng,
  exportSvg,
  copySvg,
  copyHtml,
  copyCss,
  copyJson,
  ExportMeta,
  SvgFilterKind,
} from "@/lib/export";
import { useMosaic } from "@/lib/mosaic-store";
import { toast } from "sonner";
import {
  Download,
  FileImage,
  Code2,
  Braces,
  FileText,
  Spline,
  Layers,
  Sparkles,
  Copy,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PreviewModal } from "./PreviewModal";

interface ExportBarProps {
  displayRef: React.RefObject<HTMLCanvasElement | null>;
}

const SVG_FILTERS: { value: SvgFilterKind; label: string; jp: string }[] = [
  { value: "none", label: "None", jp: "無" },
  { value: "soft-blur", label: "Soft blur", jp: "暈し" },
  { value: "emboss", label: "Emboss", jp: "浮彫" },
  { value: "posterize", label: "Posterize", jp: "段調" },
  { value: "grain", label: "Grain", jp: "粒子" },
  { value: "glow", label: "Glow", jp: "光彩" },
];

export function ExportBar({ displayRef }: ExportBarProps) {
  const s = useMosaic();
  const [pending, setPending] = useState<string | null>(null);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [svgFilter, setSvgFilter] = useState<SvgFilterKind>("none");
  const [previewFormat, setPreviewFormat] = useState<"html" | "css" | "svg" | "json" | null>(null);
  const [previewMeta, setPreviewMeta] = useState<ExportMeta | null>(null);

  const gather = async (): Promise<ExportMeta | null> => {
    if (!s.hasImage) {
      toast.error("Load an image first.");
      return null;
    }
    return new Promise<ExportMeta>((resolve) => {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        resolve({
          width: detail.width,
          height: detail.height,
          cells: detail.cells,
          background: detail.bg,
          shape: detail.shape,
          shapeSize: detail.shapeSize,
          rotation: s.rotation,
          jitter: s.jitter,
          seed: s.seed,
          filter: svgFilter,
        });
        window.removeEventListener("mosaic:cells", handler);
      };
      window.addEventListener("mosaic:cells", handler);
      window.dispatchEvent(
        new CustomEvent("mosaic:request-cells", { detail: { type: "get-cells" } }),
      );
    });
  };

  const wrap = async (name: string, fn: () => void | Promise<void>) => {
    setPending(name);
    try {
      await fn();
      toast.success(`${name.toUpperCase()} exported`);
    } catch (e) {
      toast.error(`Export failed: ${(e as Error).message}`);
    } finally {
      setPending(null);
    }
  };

  const handlePng = () =>
    wrap("png", () => {
      const c = displayRef.current;
      if (!c) throw new Error("Canvas not ready");
      exportPng(c, `mosaic-${slug(s.fileName)}.png`);
    });

  const handleSvg = async () => {
    const meta = await gather();
    if (!meta) return;
    wrap("svg", () => exportSvg(meta, `mosaic-${slug(s.fileName)}.svg`));
  };

  const handleHtml = async () => {
    const meta = await gather();
    if (!meta) return;
    wrap("html", () => exportHtml(meta, `mosaic-${slug(s.fileName)}.html`));
  };

  const handleCss = async () => {
    const meta = await gather();
    if (!meta) return;
    wrap("css", () => exportCss(meta, `mosaic-${slug(s.fileName)}.css`));
  };

  const handleJson = async () => {
    const meta = await gather();
    if (!meta) return;
    wrap("json", () => exportJson(meta, `mosaic-${slug(s.fileName)}.json`));
  };

  const handleAscii = async () => {
    const meta = await gather();
    if (!meta) return;
    wrap("ascii", () => exportAscii(meta, `mosaic-${slug(s.fileName)}.txt`));
  };

  // --- Copy-to-clipboard handlers ---
  const wrapCopy = async (name: string, fn: () => Promise<boolean>) => {
    setPending("copy-" + name);
    try {
      const ok = await fn();
      if (ok) toast.success(`${name.toUpperCase()} copied to clipboard`);
      else toast.error("Clipboard not available — use download instead");
    } catch (e) {
      toast.error(`Copy failed: ${(e as Error).message}`);
    } finally {
      setPending(null);
    }
  };

  const handleCopySvg = async () => {
    const meta = await gather();
    if (!meta) return;
    wrapCopy("svg", () => copySvg(meta));
  };
  const handleCopyHtml = async () => {
    const meta = await gather();
    if (!meta) return;
    wrapCopy("html", () => copyHtml(meta));
  };
  const handleCopyCss = async () => {
    const meta = await gather();
    if (!meta) return;
    wrapCopy("css", () => copyCss(meta));
  };
  const handleCopyJson = async () => {
    const meta = await gather();
    if (!meta) return;
    wrapCopy("json", () => copyJson(meta));
  };

  // --- Preview handlers ---
  const handlePreview = async (fmt: "html" | "css" | "svg" | "json") => {
    const meta = await gather();
    if (!meta) return;
    setPreviewMeta(meta);
    setPreviewFormat(fmt);
  };

  const handleDownloadFromPreview = (fmt: "html" | "css" | "svg" | "json") => {
    const meta = previewMeta;
    if (!meta) return;
    const slugName = slug(s.fileName);
    if (fmt === "html") exportHtml(meta, `mosaic-${slugName}.html`);
    else if (fmt === "css") exportCss(meta, `mosaic-${slugName}.css`);
    else if (fmt === "svg") exportSvg(meta, `mosaic-${slugName}.svg`);
    else if (fmt === "json") exportJson(meta, `mosaic-${slugName}.json`);
    toast.success(`${fmt.toUpperCase()} downloaded`);
    setPreviewFormat(null);
  };

  const handleBatch = async () => {
    const meta = await gather();
    if (!meta) return;
    const c = displayRef.current;
    if (!c) {
      toast.error("Canvas not ready");
      return;
    }
    setPending("batch");
    setBatchProgress("starting…");
    try {
      await exportAll(c, meta, `mosaic-${slug(s.fileName)}`, (p) => {
        setBatchProgress(
          p.current === "done"
            ? "done"
            : `${p.current} (${p.done + 1}/${p.total})`,
        );
      });
      toast.success("All formats exported", {
        description: "PNG · SVG · HTML · CSS · JSON · ASCII",
      });
    } catch (e) {
      toast.error(`Batch failed: ${(e as Error).message}`);
    } finally {
      setPending(null);
      setBatchProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        <ExportButton
          label="PNG"
          jp="画像"
          icon={<FileImage className="h-4 w-4" />}
          pending={pending === "png"}
          onClick={handlePng}
        />
        <ExportButton
          label="SVG"
          jp="vector"
          icon={<Spline className="h-4 w-4" />}
          pending={pending === "svg"}
          onClick={handleSvg}
          onCopy={handleCopySvg}
          copyPending={pending === "copy-svg"}
          onPreview={() => handlePreview("svg")}
        />
        <ExportButton
          label="HTML"
          jp="HTML"
          icon={<Code2 className="h-4 w-4" />}
          pending={pending === "html"}
          onClick={handleHtml}
          onCopy={handleCopyHtml}
          copyPending={pending === "copy-html"}
          onPreview={() => handlePreview("html")}
        />
        <ExportButton
          label="CSS"
          jp="CSS"
          icon={<Code2 className="h-4 w-4" />}
          pending={pending === "css"}
          onClick={handleCss}
          onCopy={handleCopyCss}
          copyPending={pending === "copy-css"}
          onPreview={() => handlePreview("css")}
        />
        <ExportButton
          label="JSON"
          jp="JSON"
          icon={<Braces className="h-4 w-4" />}
          pending={pending === "json"}
          onClick={handleJson}
          onCopy={handleCopyJson}
          copyPending={pending === "copy-json"}
          onPreview={() => handlePreview("json")}
        />
        <ExportButton
          label="ASCII"
          jp="TEXT"
          icon={<FileText className="h-4 w-4" />}
          pending={pending === "ascii"}
          onClick={handleAscii}
        />
      </div>

      {/* SVG filter selector — applies to SVG export only */}
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-paper/40 px-3 py-2">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-seal" />
          SVG filter
        </span>
        <div className="flex flex-wrap gap-1">
          {SVG_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setSvgFilter(f.value)}
              aria-pressed={svgFilter === f.value}
              className={cn(
                "filter-chip flex items-center gap-1 rounded px-2 py-0.5 text-[10px] transition-all",
                svgFilter === f.value
                  ? "bg-seal text-paper"
                  : "bg-paper/60 text-muted-foreground hover:bg-paper hover:text-foreground",
              )}
              title={f.label}
            >
              <span>{f.label}</span>
              <span className="font-display text-[9px] opacity-70">{f.jp}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleBatch}
        disabled={pending !== null}
        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-md border border-seal/40 bg-seal/5 px-3 py-2.5 text-sm font-medium text-seal transition-all hover:bg-seal/10 disabled:opacity-60"
      >
        {pending === "batch" ? (
          <>
            <span className="ink-loader absolute inset-0" />
            <span className="relative z-10">
              {batchProgress ? `Exporting ${batchProgress}` : "Exporting…"}
            </span>
          </>
        ) : (
          <>
            <Layers className="h-4 w-4" />
            <span>Export all 6 formats</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-seal/60">
              一括
            </span>
          </>
        )}
      </button>

      {/* Preview modal */}
      <PreviewModal
        open={previewFormat !== null}
        format={previewFormat}
        meta={previewMeta}
        onClose={() => setPreviewFormat(null)}
        onDownload={handleDownloadFromPreview}
      />
    </div>
  );
}

function ExportButton({
  label,
  jp,
  icon,
  onClick,
  onCopy,
  onPreview,
  pending,
  copyPending,
}: {
  label: string;
  jp: string;
  icon: React.ReactNode;
  onClick: () => void;
  onCopy?: () => void;
  onPreview?: () => void;
  pending: boolean;
  copyPending?: boolean;
}) {
  return (
    <div className="export-card group relative flex flex-col items-center justify-center gap-1 rounded-md border border-border/70 bg-paper/60 px-2 py-3 transition-all hover:border-seal/60 hover:bg-paper">
      <button
        type="button"
        onClick={onClick}
        disabled={pending || copyPending}
        className="flex flex-col items-center gap-1 disabled:opacity-60"
      >
        <span className="text-foreground/80 transition-colors group-hover:text-seal">
          {icon}
        </span>
        <span className="font-display text-xs font-semibold tracking-wide">
          {label}
        </span>
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">
          {jp}
        </span>
      </button>
      <div className="absolute right-1 top-1 flex gap-0.5">
        {onPreview && (
          <button
            type="button"
            onClick={onPreview}
            disabled={pending || copyPending}
            title="Preview code"
            aria-label={`Preview ${label}`}
            className="export-copy-btn flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 transition-all hover:bg-matcha/10 hover:text-matcha disabled:opacity-40"
          >
            <Eye className="h-3 w-3" />
          </button>
        )}
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            disabled={pending || copyPending}
            title="Copy to clipboard"
            aria-label={`Copy ${label} to clipboard`}
            className={cn(
              "export-copy-btn flex h-5 w-5 items-center justify-center rounded text-muted-foreground/40 transition-all hover:bg-seal/10 hover:text-seal disabled:opacity-40",
              copyPending && "animate-pulse text-seal opacity-100",
            )}
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "untitled"
  );
}
