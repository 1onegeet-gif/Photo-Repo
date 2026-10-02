"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { PanelSection } from "./PanelSection";
import { ControlSlider } from "./ControlSlider";
import { ShapePicker } from "./ShapePicker";
import { SHAPE_OPTIONS } from "@/lib/shapes";
import {
  Grid3x3,
  Focus,
  Palette,
  Layers,
  Shuffle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ControlPanel() {
  const s = useMosaic();

  return (
    <div className="space-y-6">
      <PanelSection title="Pixel" jp="像素" icon={<Grid3x3 className="h-4 w-4" />}>
        <ControlSlider
          label="Density"
          jp="kōsoku"
          value={s.cellSize}
          min={3}
          max={80}
          onChange={s.setCellSize}
          hint="Smaller pixel = denser mosaic. Big = chunky retro."
          format={(v) => `${v}px`}
        />
        <ControlSlider
          label="Shape size"
          jp="kakushin"
          value={Math.round(s.shapeSize * 100)}
          min={5}
          max={100}
          onChange={(v) => s.setShapeSize(v / 100)}
          hint="Fraction of cell filled by the shape. Lower = sparse, paper shows through."
          format={(v) => `${v}%`}
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-foreground/80">
              Shape
            </Label>
            <span className="font-mono text-[11px] text-foreground/90">
              {SHAPE_OPTIONS.find((o) => o.value === s.shape)?.jp} ·{" "}
              {SHAPE_OPTIONS.find((o) => o.value === s.shape)?.label}
            </span>
          </div>
          <ShapePicker value={s.shape} onChange={s.setShape} />
        </div>
        <ControlSlider
          label="Rotation"
          jp="kaiten"
          value={s.rotation}
          min={-180}
          max={180}
          onChange={s.setRotation}
          format={(v) => `${v}°`}
        />
        <ControlSlider
          label="Jitter"
          jp="yuragi"
          value={Math.round(s.jitter * 100)}
          min={0}
          max={100}
          onChange={(v) => s.setJitter(v / 100)}
          hint="Adds organic randomness to position & angle — feels hand-placed."
          format={(v) => `${v}%`}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={s.reseed}
            className="h-8 flex-1 gap-1.5 text-xs"
          >
            <Shuffle className="h-3.5 w-3.5" /> Reseed
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={s.randomize}
            className="h-8 flex-1 gap-1.5 text-xs"
          >
            <Sparkles className="h-3.5 w-3.5" /> Surprise
          </Button>
        </div>
      </PanelSection>

      <PanelSection
        title="Variable density"
        jp="可変密度"
        icon={<Focus className="h-4 w-4" />}
        rightSlot={
          <div className="flex items-center gap-2">
            <Label htmlFor="focal-toggle" className="text-[10px] text-muted-foreground">
              {s.focal.enabled ? "on" : "off"}
            </Label>
            <Switch
              id="focal-toggle"
              checked={s.focal.enabled}
              onCheckedChange={(v) => s.setFocal({ enabled: v })}
            />
          </div>
        }
      >
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {s.focal.enabled
            ? "Drag on the canvas to move the focal point. Cell size varies smoothly with distance — fine detail near, chunky far (or vice versa)."
            : "Enable to vary pixel size across the image. The focal point sets where density is highest."}
        </p>
        <ControlSlider
          label="Falloff"
          jp="kobai"
          value={s.focal.falloff}
          min={0}
          max={4}
          step={0.1}
          onChange={(v) => s.setFocal({ falloff: v })}
          hint="How strongly density varies with distance from focal."
          format={(v) => `${v.toFixed(1)}×`}
        />
        <div className="flex gap-2">
          <ModeBtn
            active={s.focal.mode === "center"}
            onClick={() => s.setFocal({ mode: "center" })}
          >
            <span className="font-display">中心</span>
            <span className="text-[10px]">fine center</span>
          </ModeBtn>
          <ModeBtn
            active={s.focal.mode === "edge"}
            onClick={() => s.setFocal({ mode: "edge" })}
          >
            <span className="font-display">外周</span>
            <span className="text-[10px]">fine edge</span>
          </ModeBtn>
        </div>
      </PanelSection>

      <PanelSection
        title="Color"
        jp="彩色"
        icon={<Palette className="h-4 w-4" />}
        rightSlot={
          <Button
            variant="ghost"
            size="sm"
            onClick={s.resetAdjust}
            className="h-7 gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> reset
          </Button>
        }
      >
        <ControlSlider
          label="Brightness"
          jp="meido"
          value={s.adjust.brightness}
          min={-100}
          max={100}
          onChange={(v) => s.setAdjust({ brightness: v })}
          format={(v) => `${v > 0 ? "+" : ""}${v}`}
        />
        <ControlSlider
          label="Contrast"
          jp="kōdo"
          value={s.adjust.contrast}
          min={-100}
          max={100}
          onChange={(v) => s.setAdjust({ contrast: v })}
          format={(v) => `${v > 0 ? "+" : ""}${v}`}
        />
        <ControlSlider
          label="Saturation"
          jp="satō"
          value={s.adjust.saturation}
          min={-100}
          max={200}
          onChange={(v) => s.setAdjust({ saturation: v })}
          format={(v) => `${v > 0 ? "+" : ""}${v}`}
        />
        <ControlSlider
          label="Hue"
          jp="shikisō"
          value={s.adjust.hue}
          min={-180}
          max={180}
          onChange={(v) => s.setAdjust({ hue: v })}
          format={(v) => `${v > 0 ? "+" : ""}${v}°`}
        />
        <ControlSlider
          label="Color depth"
          jp="shokisū"
          value={s.quantizeLevels}
          min={2}
          max={256}
          step={2}
          onChange={s.setQuantize}
          hint="Reduce palette — fewer colors = more painterly / retro."
          format={(v) => (v >= 256 ? "256 (full)" : `${v}`)}
        />
        <div className="flex items-center justify-between rounded-md border border-border/60 bg-paper/40 px-3 py-2">
          <Label htmlFor="invert" className="text-xs text-foreground/80">
            Invert
          </Label>
          <Switch
            id="invert"
            checked={s.adjust.invert}
            onCheckedChange={(v) => s.setAdjust({ invert: v })}
          />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border/60 bg-paper/40 px-3 py-2">
          <div className="flex flex-col">
            <Label htmlFor="dither" className="text-xs text-foreground/80">
              Dither
            </Label>
            <span className="text-[10px] text-muted-foreground">Bayer ordered — retro grain</span>
          </div>
          <Switch
            id="dither"
            checked={s.dither}
            onCheckedChange={(v) => s.setDither(v)}
          />
        </div>
      </PanelSection>

      <PanelSection
        title="Background"
        jp="背景"
        icon={<Layers className="h-4 w-4" />}
      >
        <div className="grid grid-cols-4 gap-2">
          <BgBtn active={s.bgMode === "transparent"} onClick={() => s.setBgMode("transparent")}>
            <span className="font-display">透</span>
            <span className="text-[9px]">clear</span>
          </BgBtn>
          <BgBtn active={s.bgMode === "paper"} onClick={() => s.setBgMode("paper")}>
            <span className="font-display">紙</span>
            <span className="text-[9px]">paper</span>
          </BgBtn>
          <BgBtn active={s.bgMode === "ink"} onClick={() => s.setBgMode("ink")}>
            <span className="font-display">墨</span>
            <span className="text-[9px]">ink</span>
          </BgBtn>
          <BgBtn active={s.bgMode === "auto"} onClick={() => s.setBgMode("auto")}>
            <span className="font-display">自</span>
            <span className="text-[9px]">auto</span>
          </BgBtn>
        </div>
        {s.bgMode === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={`#${s.customBg
                .map((c) => c.toString(16).padStart(2, "0"))
                .join("")}`}
              onChange={(e) => {
                const v = e.target.value.slice(1);
                s.setCustomBg([
                  parseInt(v.slice(0, 2), 16),
                  parseInt(v.slice(2, 4), 16),
                  parseInt(v.slice(4, 6), 16),
                ]);
              }}
              className="h-8 w-12 cursor-pointer rounded border border-border bg-transparent"
            />
            <Label className="text-xs text-muted-foreground">Custom color</Label>
          </div>
        )}
      </PanelSection>
    </div>
  );
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 flex-1 flex-col items-center justify-center gap-0.5 rounded-md border transition-all",
        active
          ? "border-seal bg-seal/5"
          : "border-border/60 bg-paper/40 hover:bg-paper",
      )}
    >
      {children}
    </button>
  );
}

function BgBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border transition-all",
        active
          ? "border-seal bg-seal/5 shadow-[inset_0_0_0_1px_oklch(0.55_0.18_32/0.3)]"
          : "border-border/70 bg-paper/40 hover:bg-paper",
      )}
    >
      {children}
    </button>
  );
}
