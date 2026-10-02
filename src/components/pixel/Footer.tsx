"use client";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-paper/60">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <span className="seal-stamp flex h-5 w-5 items-center justify-center text-[8px]">
            墨
          </span>
          <span>
            <span className="font-display tracking-wide">Mosaic Atelier</span>
            <span className="mx-1.5 text-border">·</span>
            crafted with canvas &amp; washi paper
          </span>
        </div>
        <p className="text-[11px]">
          All processing happens in your browser — your image never leaves.
        </p>
      </div>
    </footer>
  );
}
