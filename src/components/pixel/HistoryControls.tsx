"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HistoryControls() {
  const past = useMosaic((s) => s.past.length);
  const future = useMosaic((s) => s.future.length);
  const undo = useMosaic((s) => s.undo);
  const redo = useMosaic((s) => s.redo);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={undo}
        disabled={past === 0}
        className={cn(
          "h-8 gap-1.5 px-2 text-xs",
          past === 0
            ? "text-muted-foreground/40"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Undo (U)"
      >
        <Undo2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">undo</span>
        {past > 0 && (
          <span className="font-mono text-[10px] text-muted-foreground/70">{past}</span>
        )}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={redo}
        disabled={future === 0}
        className={cn(
          "h-8 gap-1.5 px-2 text-xs",
          future === 0
            ? "text-muted-foreground/40"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Redo (Shift+U)"
      >
        <Redo2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">redo</span>
        {future > 0 && (
          <span className="font-mono text-[10px] text-muted-foreground/70">{future}</span>
        )}
      </Button>
    </div>
  );
}
