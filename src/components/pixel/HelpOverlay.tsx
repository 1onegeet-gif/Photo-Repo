"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { X, Sparkles, Upload, MousePointer2, Download, Keyboard } from "lucide-react";
import { useEffect } from "react";

export function HelpOverlay() {
  const s = useMosaic();
  const open = s.helpOpen;

  // Close on Esc
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") s.setHelpOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, s]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-6 backdrop-blur-sm"
      onClick={() => s.setHelpOpen(false)}
      role="dialog"
      aria-label="Quick tour"
    >
      <div
        className="modal-pop matte-card washi-texture relative max-w-lg rounded-xl p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="seigaiha-corner tl" aria-hidden />
        <span className="seigaiha-corner br" aria-hidden />
        <button
          type="button"
          onClick={() => s.setHelpOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-paper hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <span className="washi-tape tape-seal text-[10px] uppercase tracking-[0.25em] text-paper">
            ようこそ · welcome
          </span>
        </div>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Mosaic Atelier
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A washi-paper pixelation studio. Here's the quick tour.
        </p>

        <ol className="mt-5 space-y-4">
          <Step
            n="01"
            icon={<Upload className="h-4 w-4" />}
            title="Bring an image"
            jp="素材"
          >
            Drop a file, paste (⌘V), or click a sample (Fuji / Koi / Geo).
          </Step>
          <Step
            n="02"
            icon={<Sparkles className="h-4 w-4" />}
            title="Pick a preset or tune by hand"
            jp="設定"
          >
            Try the preset gallery, then refine density, shape, color &amp;
            focal-point density in the right panel.
          </Step>
          <Step
            n="03"
            icon={<MousePointer2 className="h-4 w-4" />}
            title="Compare & inspect"
            jp="比較"
          >
            Toggle Compare to see before/after side-by-side, or Inspect to
            hover over cells and read their exact color.
          </Step>
          <Step
            n="04"
            icon={<Download className="h-4 w-4" />}
            title="Export anywhere"
            jp="書き出し"
          >
            PNG, SVG (vector!), HTML, CSS, JSON, ASCII — or batch all six.
            Use Share to copy a link with your settings.
          </Step>
        </ol>

        <div className="mt-6 flex items-center gap-2 rounded-md border border-border/60 bg-paper/50 px-3 py-2">
          <Keyboard className="h-4 w-4 text-seal" />
          <span className="text-[11px] text-muted-foreground">
            Press <kbd className="kbd">?</kbd> anytime to see shortcuts.
          </span>
        </div>

        <button
          type="button"
          onClick={() => s.setHelpOpen(false)}
          className="mt-5 w-full rounded-md bg-seal px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-seal/90"
        >
          Begin · 始める
        </button>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  jp,
  children,
}: {
  n: string;
  icon: React.ReactNode;
  title: string;
  jp: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-seal/30 bg-seal/5 text-seal">
          {icon}
        </span>
        {n !== "04" && <span className="mt-1 w-px flex-1 bg-border/50" />}
      </div>
      <div className="flex-1 pb-1">
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">
            {title}
          </h3>
          <span className="font-display text-[10px] tracking-[0.3em] text-muted-foreground">
            {jp}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
    </li>
  );
}
