"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { PanelSection } from "./PanelSection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ControlSlider } from "./ControlSlider";
import { Lock, Unlock, Wand2, X, Plus, Pipette } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  extractPalette,
  parseHexList,
  rgbToHex,
  hexToRgb,
  RGB,
} from "@/lib/color";

interface PaletteLockPanelProps {
  sourceRef: React.RefObject<HTMLCanvasElement | null>;
}

export function PaletteLockPanel({ sourceRef }: PaletteLockPanelProps) {
  const s = useMosaic();
  const [hexInput, setHexInput] = useState("");
  const [k, setK] = useState(8);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const extractFromImage = useCallback(() => {
    const src = sourceRef.current;
    if (!src) {
      toast.error("Load an image first.");
      return;
    }
    const sctx = src.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;
    const data = sctx.getImageData(0, 0, src.width, src.height).data;
    const palette = extractPalette(data, k);
    s.setPalette({ colors: palette, source: "image", name: `image·${k}` });
    toast.success(`Extracted ${palette.length} colors from image`);
  }, [sourceRef, s, k]);

  const applyCustom = useCallback(() => {
    const colors = parseHexList(hexInput);
    if (colors.length < 2) {
      toast.error("Paste at least 2 hex colors (comma/space separated).");
      return;
    }
    s.setPalette({ colors, source: "custom", name: "custom" });
    toast.success(`Locked ${colors.length} custom colors`);
  }, [hexInput, s]);

  const clear = () => {
    s.setPalette(null);
    toast.info("Palette unlocked");
  };

  const removeColor = (i: number) => {
    if (!s.palette) return;
    const next = s.palette.colors.slice();
    next.splice(i, 1);
    if (next.length < 2) {
      clear();
    } else {
      s.setPalette({ ...s.palette, colors: next });
    }
  };

  const addColor = (hex: string) => {
    try {
      const rgb = hexToRgb(hex);
      if (!s.palette) {
        s.setPalette({ colors: [rgb], source: "custom", name: "custom" });
      } else {
        s.setPalette({ ...s.palette, colors: [...s.palette.colors, rgb] });
      }
    } catch {
      toast.error("Invalid hex color");
    }
  };

  return (
    <PanelSection
      title="Palette lock"
      jp="色制限"
      icon={<Lock className="h-4 w-4" />}
      rightSlot={
        s.palette ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Unlock className="h-3 w-3" /> unlock
          </Button>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            off
          </span>
        )
      }
    >
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {s.palette
          ? `Every cell snaps to the nearest of ${s.palette.colors.length} locked colors. ${s.palette.source === "image" ? "Extracted from your image." : "Custom palette."}`
          : "Lock the mosaic to a fixed palette. Extract dominant colors from your image, or paste your own hex list."}
      </p>

      {/* Extract from image */}
      <div className="space-y-2">
        <ControlSlider
          label="Extract count"
          jp="k"
          value={k}
          min={2}
          max={16}
          onChange={setK}
          format={(v) => `${v} colors`}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={extractFromImage}
            className="h-8 flex-1 gap-1.5 text-xs"
          >
            <Wand2 className="h-3.5 w-3.5 text-matcha" />
            Extract
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => s.setSourcePickMode(!s.sourcePickMode)}
            aria-pressed={s.sourcePickMode}
            className={
              s.sourcePickMode
                ? "pipette-active h-8 flex-1 gap-1.5 border-seal/50 bg-seal/10 text-xs text-seal"
                : "h-8 flex-1 gap-1.5 text-xs"
            }
            title="Click any pixel on the canvas to add its original color to the palette"
          >
            <Pipette className="h-3.5 w-3.5 text-seal" />
            {s.sourcePickMode ? "Picking…" : "Pick pixel"}
          </Button>
        </div>
        {s.sourcePickMode && (
          <p className="text-[10px] leading-relaxed text-seal">
            Click anywhere on the canvas to sample the original image pixel
            and add it to your palette.
          </p>
        )}
      </div>

      {/* Custom hex input */}
      <div className="space-y-2">
        <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Or paste hex colors
        </Label>
        <textarea
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          placeholder="#b23a2c, #f5eedc, #231c12, #587249"
          rows={2}
          className="w-full resize-none rounded-md border border-border/70 bg-paper/60 px-2 py-1.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:border-seal/50 focus:outline-none"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={applyCustom}
            className="h-8 flex-1 gap-1.5 text-xs"
          >
            <Lock className="h-3.5 w-3.5 text-seal" />
            Lock custom
          </Button>
        </div>
      </div>

      {/* Locked palette display */}
      {s.palette && (
        <div className="space-y-2 rounded-md border border-border/60 bg-paper/40 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {s.palette.name} · {s.palette.colors.length}
            </span>
            <label className="flex cursor-pointer items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
              <Plus className="h-3 w-3" /> add
              <input
                type="color"
                className="sr-only"
                onChange={(e) => addColor(e.target.value)}
                value="#b23a2c"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {s.palette.colors.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => removeColor(i)}
                className="group relative h-7 w-7 rounded border border-border/70 transition-transform hover:scale-110"
                style={{ background: rgbToCss(c) }}
                title={`${rgbToHex(c)} — click to remove`}
              >
                <X className="absolute inset-0 m-auto h-3 w-3 text-paper opacity-0 transition-opacity group-hover:opacity-100 drop-shadow" />
              </button>
            ))}
          </div>
        </div>
      )}
    </PanelSection>
  );
}

function rgbToCss([r, g, b]: RGB): string {
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
