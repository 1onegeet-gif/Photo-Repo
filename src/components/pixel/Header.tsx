"use client";

import { Brush } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="seal-stamp flex h-9 w-9 items-center justify-center text-[11px]">
            墨
          </div>
          <div className="flex flex-col leading-none">
            <h1 className="font-display text-base font-semibold tracking-wide text-foreground">
              Mosaic Atelier
            </h1>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              pixel · washi · studio
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1.5">
          <a
            href="#how"
            className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-paper hover:text-foreground"
          >
            How
          </a>
          <a
            href="#export"
            className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-paper hover:text-foreground"
          >
            Export
          </a>
          <span
            className="ml-1 hidden items-center gap-1 rounded-full border border-border/70 bg-paper/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:inline-flex"
          >
            <Brush className="h-3 w-3 text-seal" /> 100% client-side
          </span>
        </nav>
      </div>
    </header>
  );
}
