"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { FlipHorizontal, FlipVertical, RotateCw, RotateCcw, Crop, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { PanelSection } from "./PanelSection";

interface TransformBarProps {
  /** Re-applies the original image with the current transform. Called after transform changes. */
  onTransformChange?: () => void;
}

export function TransformBar({ onTransformChange }: TransformBarProps) {
  const s = useMosaic();
  const { flipH, flipV, rotate90 } = s.transform;
  const dirty = flipH || flipV || rotate90 !== 0;

  const wrap = (fn: () => void) => () => {
    fn();
    onTransformChange?.();
  };

  return (
    <PanelSection
      title="Transform"
      jp="変形"
      icon={<Crop className="h-4 w-4" />}
      rightSlot={
        dirty ? (
          <button
            type="button"
            onClick={wrap(s.resetTransform)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RefreshCcw className="h-3 w-3" />
            reset
          </button>
        ) : (
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            identity
          </span>
        )
      }
    >
      <div className="grid grid-cols-4 gap-2">
        <TransformBtn
          active={flipH}
          onClick={wrap(s.flipH)}
          icon={<FlipHorizontal className="h-4 w-4" />}
          label="Flip H"
          jp="左右"
        />
        <TransformBtn
          active={flipV}
          onClick={wrap(s.flipV)}
          icon={<FlipVertical className="h-4 w-4" />}
          label="Flip V"
          jp="上下"
        />
        <TransformBtn
          active={rotate90 === 90 || rotate90 === 270}
          onClick={wrap(s.rotate90)}
          icon={<RotateCw className="h-4 w-4" />}
          label="Rotate"
          jp="回転"
          badge={rotate90 ? `${rotate90}°` : undefined}
        />
        <TransformBtn
          active={rotate90 === 180 || rotate90 === 270}
          onClick={wrap(() => {
            s.rotate90();
            s.rotate90();
            s.rotate90();
          })}
          icon={<RotateCcw className="h-4 w-4" />}
          label="Rotate −"
          jp="逆回"
        />
      </div>
      {dirty && (
        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Applied to source — the mosaic re-pixelates with the transformed image.
        </p>
      )}
    </PanelSection>
  );
}

function TransformBtn({
  active,
  onClick,
  icon,
  label,
  jp,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  jp: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border transition-all",
        active
          ? "border-seal bg-seal/5 text-seal"
          : "border-border/70 bg-paper/40 text-muted-foreground hover:bg-paper hover:text-foreground",
      )}
    >
      {icon}
      <span className="text-[9px] tracking-wider">{label}</span>
      <span className="font-display text-[8px] tracking-[0.2em] opacity-70">{jp}</span>
      {badge && (
        <span className="transform-badge absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-seal px-1 text-[8px] font-bold text-paper">
          {badge}
        </span>
      )}
    </button>
  );
}
