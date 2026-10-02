"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { useCustomPresets } from "@/lib/useCustomPresets";
import { useState } from "react";
import { Bookmark, Trash2, Save, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import type { ParamSnapshot } from "@/lib/mosaic-store";

export function CustomPresetBar() {
  const s = useMosaic();
  const { presets, add, remove } = useCustomPresets();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");

  const snapshot = (): Partial<ParamSnapshot> => {
    // Capture all renderable params
    return {
      cellSize: s.cellSize,
      shapeSize: s.shapeSize,
      shape: s.shape,
      rotation: s.rotation,
      jitter: s.jitter,
      seed: s.seed,
      adjust: { ...s.adjust },
      quantizeLevels: s.quantizeLevels,
      focal: { ...s.focal },
      bgMode: s.bgMode,
      customBg: [...s.customBg] as [number, number, number],
      shapeMix: s.shapeMix,
      shapeMixShapes: [...s.shapeMixShapes],
      palette: s.palette ? { ...s.palette, colors: [...s.palette.colors] } : null,
      dither: s.dither,
    };
  };

  const onSave = () => {
    if (!name.trim()) {
      setNaming(true);
      return;
    }
    const preset = add({
      name: name.trim(),
      desc: `Saved ${new Date().toLocaleDateString()}`,
      patch: snapshot(),
    });
    toast.success(`Saved preset · ${preset.name}`);
    setName("");
    setNaming(false);
  };

  const onApply = (patch: Partial<ParamSnapshot>) => {
    s.applyPreset(patch);
    toast.success("Custom preset applied");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-3.5 w-3.5 text-seal" />
          <span className="font-display text-xs font-semibold text-foreground">
            Your presets
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {presets.length}/24
          </span>
        </div>
        {!naming ? (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className="flex items-center gap-1 rounded-md border border-border/60 bg-paper/50 px-2 py-1 text-[11px] text-foreground/80 transition-colors hover:border-seal/40 hover:bg-paper"
          >
            <Save className="h-3 w-3 text-seal" />
            Save current
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") {
                  setNaming(false);
                  setName("");
                }
              }}
              placeholder="preset name…"
              maxLength={24}
              className="w-32 rounded-md border border-border/60 bg-paper px-2 py-1 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-seal/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={onSave}
              className="rounded-md bg-seal px-2 py-1 text-[11px] text-paper hover:bg-seal/90"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {presets.length === 0 ? (
        <p className="rounded-md border border-dashed border-border/50 bg-paper/30 px-3 py-3 text-center text-[11px] text-muted-foreground">
          No saved presets yet. Tune your mosaic, then{" "}
          <span className="text-seal">Save current</span> to keep it.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {presets.map((p) => (
            <div
              key={p.id}
              className={cn(
                "preset-card group relative flex flex-col gap-1 rounded-md border border-border/60 bg-paper/60 p-2.5",
              )}
            >
              <button
                type="button"
                onClick={() => onApply(p.patch)}
                className="flex flex-col items-start gap-0.5 text-left"
              >
                <span className="flex w-full items-center gap-1">
                  <Star className="h-3 w-3 shrink-0 text-seal/70" />
                  <span className="truncate font-display text-[11px] font-semibold text-foreground">
                    {p.name}
                  </span>
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {p.desc}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  remove(p.id);
                  toast.info(`Removed · ${p.name}`);
                }}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded text-muted-foreground/50 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                aria-label={`Delete ${p.name}`}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
