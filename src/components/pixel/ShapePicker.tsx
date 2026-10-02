"use client";

import { SHAPE_OPTIONS, ShapeKind, drawShape } from "@/lib/shapes";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

interface ShapePickerProps {
  value: ShapeKind;
  onChange: (s: ShapeKind) => void;
}

export function ShapePicker({ value, onChange }: ShapePickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {SHAPE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          title={`${opt.label} · ${opt.jp}`}
          className={cn(
            "group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border p-2 transition-all",
            value === opt.value
              ? "border-seal bg-seal/5 shadow-[inset_0_0_0_1px_oklch(0.55_0.18_32/0.3)]"
              : "border-border/70 bg-paper/60 hover:border-seal/40 hover:bg-paper",
          )}
        >
          <ShapeThumb shape={opt.value} active={value === opt.value} />
          <span
            className={cn(
              "text-[9px] tracking-wider",
              value === opt.value ? "text-seal font-medium" : "text-muted-foreground",
            )}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function ShapeThumb({ shape, active }: { shape: ShapeKind; active: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const size = 28;
    c.width = size * dpr;
    c.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    drawShape(ctx, shape, 2, 2, size - 4, active ? "oklch(0.55 0.18 32)" : "oklch(0.35 0.04 50 / 0.85)", 1, 0);
  }, [shape, active]);
  return <canvas ref={ref} style={{ width: 28, height: 28 }} />;
}
