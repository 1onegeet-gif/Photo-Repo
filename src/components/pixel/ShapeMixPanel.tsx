"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { PanelSection } from "./PanelSection";
import { ControlSlider } from "./ControlSlider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shapes, Shuffle } from "lucide-react";
import { SHAPE_OPTIONS, ShapeKind } from "@/lib/shapes";
import { cn } from "@/lib/utils";

export function ShapeMixPanel() {
  const s = useMosaic();

  const toggleShape = (shape: ShapeKind) => {
    const cur = s.shapeMixShapes;
    if (cur.includes(shape)) {
      const next = cur.filter((x) => x !== shape);
      s.setShapeMixShapes(next.length ? next : [shape]);
    } else {
      s.setShapeMixShapes([...cur, shape]);
    }
  };

  return (
    <PanelSection
      title="Shape mix"
      jp="形状mix"
      icon={<Shapes className="h-4 w-4" />}
      rightSlot={
        <div className="flex items-center gap-2">
          <Label className="text-[10px] text-muted-foreground">
            {s.shapeMix === "single" ? "off" : s.shapeMix}
          </Label>
          <Switch
            checked={s.shapeMix !== "single"}
            onCheckedChange={(v) => s.setShapeMix(v ? "luminance" : "single")}
          />
        </div>
      }
    >
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {s.shapeMix === "single"
          ? "Pick multiple shapes, then distribute them by luminance band (dark→light) or at random."
          : s.shapeMix === "luminance"
            ? "Shapes are banded by luminance — darkest cells get the first shape, lightest get the last."
            : "Each cell gets a random shape from your selection."}
      </p>

      <div className="grid grid-cols-4 gap-2">
        {SHAPE_OPTIONS.map((opt) => {
          const active = s.shapeMixShapes.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleShape(opt.value)}
              aria-pressed={active}
              title={`${opt.label} · ${opt.jp}`}
              className={cn(
                "shape-tile flex aspect-square flex-col items-center justify-center gap-1 rounded-md border p-2",
                active
                  ? "border-seal bg-seal/5"
                  : "border-border/70 bg-paper/50 opacity-60 hover:opacity-100",
              )}
            >
              <ShapeMini shape={opt.value} active={active} />
              <span className={cn(
                "text-[9px] tracking-wider",
                active ? "text-seal font-medium" : "text-muted-foreground",
              )}>
                {opt.jp}
              </span>
            </button>
          );
        })}
      </div>

      {s.shapeMix !== "single" && (
        <div className="flex gap-2">
          <ModeBtn
            active={s.shapeMix === "luminance"}
            onClick={() => s.setShapeMix("luminance")}
          >
            <span className="font-display">光度</span>
            <span className="text-[10px]">by luminance</span>
          </ModeBtn>
          <ModeBtn
            active={s.shapeMix === "random"}
            onClick={() => s.setShapeMix("random")}
          >
            <Shuffle className="h-3 w-3" />
            <span className="font-display">乱数</span>
            <span className="text-[10px]">random</span>
          </ModeBtn>
        </div>
      )}
    </PanelSection>
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
        "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border transition-all",
        active
          ? "border-seal bg-seal/5"
          : "border-border/60 bg-paper/40 hover:bg-paper",
      )}
    >
      {children}
    </button>
  );
}

function ShapeMini({ shape, active }: { shape: ShapeKind; active: boolean }) {
  // Tiny inline SVG to avoid canvas setup overhead in a grid
  const color = active ? "oklch(0.55 0.18 32)" : "oklch(0.35 0.04 50 / 0.85)";
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill={color}>
      <ShapePath shape={shape} />
    </svg>
  );
}

function ShapePath({ shape }: { shape: ShapeKind }) {
  switch (shape) {
    case "square":
      return <rect x="2" y="2" width="18" height="18" rx="1" />;
    case "circle":
      return <circle cx="11" cy="11" r="9" />;
    case "triangle":
      return <polygon points="11,2 21,20 1,20" />;
    case "hexagon":
      return <polygon points="11,1 20,6 20,16 11,21 2,16 2,6" />;
    case "diamond":
      return <polygon points="11,1 21,11 11,21 1,11" />;
    case "cross": {
      return (
        <>
          <rect x="8" y="2" width="6" height="18" />
          <rect x="2" y="8" width="18" height="6" />
        </>
      );
    }
    case "heart":
      return (
        <path d="M11 20 C 2 13, 2 4, 7 4 C 9 4, 11 6, 11 8 C 11 6, 13 4, 15 4 C 20 4, 20 13, 11 20 Z" />
      );
    case "star":
      return (
        <polygon points="11,1 13.5,8 21,8 15,12.5 17.5,20 11,15.5 4.5,20 7,12.5 1,8 8.5,8" />
      );
  }
}
