"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ControlSliderProps {
  label: string;
  hint?: string;
  jp?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
  format?: (v: number) => string;
}

export function ControlSlider({
  label,
  hint,
  jp,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  className,
  format,
}: ControlSliderProps) {
  const display = format ? format(value) : `${value}${unit ?? ""}`;
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <Label className="text-xs font-medium tracking-wide text-foreground/80">
            {label}
          </Label>
          {jp && (
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70">
              {jp}
            </span>
          )}
        </div>
        <span className="font-mono text-[11px] text-foreground/90 tabular-nums">
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
        aria-label={label}
      />
      {hint && (
        <p className="text-[10px] leading-relaxed text-muted-foreground/80">
          {hint}
        </p>
      )}
    </div>
  );
}
