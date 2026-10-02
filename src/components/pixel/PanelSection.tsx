"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PanelSectionProps {
  title: string;
  jp?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  rightSlot?: ReactNode;
}

export function PanelSection({
  title,
  jp,
  icon,
  children,
  className,
  rightSlot,
}: PanelSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-seal/80">{icon}</span>}
          <h3 className="font-display text-sm font-semibold tracking-wide text-foreground">
            {title}
          </h3>
          {jp && (
            <span className="font-display text-[10px] tracking-[0.3em] text-muted-foreground/70">
              {jp}
            </span>
          )}
        </div>
        {rightSlot}
      </header>
      <div className="ink-divider" />
      <div className="space-y-4">{children}</div>
    </section>
  );
}
