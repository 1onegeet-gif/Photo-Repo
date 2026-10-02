"use client";

import {
  exportAscii,
  exportCss,
  exportHtml,
  exportJson,
  exportPng,
  ExportMeta,
} from "@/lib/export";
import { useMosaic } from "@/lib/mosaic-store";
import { toast } from "sonner";
import { Download, FileImage, Code2, Braces, FileText } from "lucide-react";
import { useState } from "react";

interface ExportBarProps {
  displayRef: React.RefObject<HTMLCanvasElement | null>;
}

export function ExportBar({ displayRef }: ExportBarProps) {
  const s = useMosaic();
  const [pending, setPending] = useState<string | null>(null);

  const gather = (): ExportMeta | null => {
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
        });
        window.removeEventListener("mosaic:cells", handler);
      };
      window.addEventListener("mosaic:cells", handler);
      window.dispatchEvent(new CustomEvent("mosaic:request-cells", { detail: { type: "get-cells" } }));
    });
  };

  const wrap = async (
    name: string,
    fn: () => void | Promise<void>,
  ) => {
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

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <ExportButton
        label="PNG"
        jp="画像"
        icon={<FileImage className="h-4 w-4" />}
        pending={pending === "png"}
        onClick={handlePng}
      />
      <ExportButton
        label="HTML"
        jp="HTML"
        icon={<Code2 className="h-4 w-4" />}
        pending={pending === "html"}
        onClick={handleHtml}
      />
      <ExportButton
        label="CSS"
        jp="CSS"
        icon={<Code2 className="h-4 w-4" />}
        pending={pending === "css"}
        onClick={handleCss}
      />
      <ExportButton
        label="JSON"
        jp="JSON"
        icon={<Braces className="h-4 w-4" />}
        pending={pending === "json"}
        onClick={handleJson}
      />
      <ExportButton
        label="ASCII"
        jp="TEXT"
        icon={<FileText className="h-4 w-4" />}
        pending={pending === "ascii"}
        onClick={handleAscii}
      />
      <div className="flex items-center justify-center rounded-md border border-dashed border-border/60 bg-paper/40 p-2 text-center text-[10px] leading-tight text-muted-foreground">
        <span>
          <Download className="mx-auto mb-0.5 h-3 w-3 text-seal" />
          codes & assets
        </span>
      </div>
    </div>
  );
}

function ExportButton({
  label,
  jp,
  icon,
  onClick,
  pending,
}: {
  label: string;
  jp: string;
  icon: React.ReactNode;
  onClick: () => void;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="group flex flex-col items-center justify-center gap-1 rounded-md border border-border/70 bg-paper/60 px-2 py-3 transition-all hover:border-seal/60 hover:bg-paper disabled:opacity-60"
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
