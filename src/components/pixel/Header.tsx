"use client";

import { Brush, HelpCircle, RotateCcw } from "lucide-react";
import { HistoryControls } from "./HistoryControls";
import { ShareButton } from "./ShareButton";
import { useMosaic } from "@/lib/mosaic-store";
import { toast } from "sonner";

export function Header() {
  const setHelpOpen = useMosaic((s) => s.setHelpOpen);
  const resetAll = useMosaic((s) => s.resetAll);
  return (
    <header className="header-strip sticky top-0 z-30 border-b border-border/50 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="seal-stamp flex h-9 w-9 items-center justify-center text-[11px]">
            墨
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="ink-underline font-display text-base font-semibold tracking-wide text-foreground">
              Mosaic Atelier
            </h1>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              pixel · washi · studio
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1.5">
          <a
            href="#presets"
            className="ink-underline rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-paper hover:text-foreground"
          >
            Presets
          </a>
          <a
            href="#how"
            className="ink-underline hidden rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-paper hover:text-foreground sm:block"
          >
            How
          </a>
          <a
            href="#export"
            className="ink-underline hidden rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-paper hover:text-foreground sm:block"
          >
            Export
          </a>
          <div className="mx-1 hidden h-5 w-px bg-border/60 sm:block" />
          <HistoryControls />
          <ShareButton />
          <button
            type="button"
            onClick={() => {
              resetAll();
              toast.success("All settings reset to defaults");
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-paper hover:text-seal"
            aria-label="Reset all settings"
            title="Reset all (⇧R)"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="help-btn flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-paper hover:text-seal"
            aria-label="Help"
            title="Help (?)"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
          <span
            className="ml-1 hidden items-center gap-1 rounded-full border border-border/70 bg-paper/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:inline-flex"
          >
            <Brush className="h-3 w-3 text-seal" /> 100% client-side
          </span>
        </nav>
      </div>
    </header>
  );
}

