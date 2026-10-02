"use client";

import { useEffect } from "react";
import { useMosaic } from "@/lib/mosaic-store";
import { SHAPE_OPTIONS } from "@/lib/shapes";

/**
 * Global keyboard shortcuts:
 *  1-8      → pick shape 1..8
 *  [ / ]    → density -/+  (cell size)
 *  , / .    → shape size -/+ 10%
 *  - / =    → shape size -/+ 10%  (alias)
 *  d        → toggle dither
 *  f        → toggle focal (variable density)
 *  o        → toggle peek original
 *  r        → reseed jitter
 *  u        → undo
 *  U (shift+u) → redo
 *  p        → open presets (scroll to preset section)
 *  c        → toggle compare (before/after slider)
 *  i        → toggle inspect (hover cell tooltip)
 *  ?        → toggle help
 */
export function useKeyboardShortcuts() {
  const s = useMosaic();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't hijack typing
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      const k = e.key;

      // Shape number keys 1-8
      if (k >= "1" && k <= "8") {
        const idx = parseInt(k, 10) - 1;
        const opt = SHAPE_OPTIONS[idx];
        if (opt) {
          e.preventDefault();
          s.setShape(opt.value);
        }
        return;
      }

      switch (k) {
        case "[":
          e.preventDefault();
          s.setCellSize(Math.max(3, s.cellSize - 2));
          break;
        case "]":
          e.preventDefault();
          s.setCellSize(Math.min(80, s.cellSize + 2));
          break;
        case ",":
        case "-":
          e.preventDefault();
          s.setShapeSize(Math.max(0.05, s.shapeSize - 0.1));
          break;
        case ".":
        case "=":
          e.preventDefault();
          s.setShapeSize(Math.min(1, s.shapeSize + 0.1));
          break;
        case "d":
          e.preventDefault();
          s.setDither(!s.dither);
          break;
        case "f":
          e.preventDefault();
          s.setFocal({ enabled: !s.focal.enabled });
          break;
        case "o":
          e.preventDefault();
          s.setShowOriginal(!s.showOriginal);
          break;
        case "r":
          e.preventDefault();
          s.reseed();
          break;
        case "u":
          e.preventDefault();
          if (e.shiftKey) s.redo();
          else s.undo();
          break;
        case "p": {
          e.preventDefault();
          const el = document.getElementById("presets");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          break;
        }
        case "c":
          e.preventDefault();
          s.setCompareMode(!s.compareMode);
          break;
        case "i":
          e.preventDefault();
          s.setInspectMode(!s.inspectMode);
          break;
        case "?":
        case "h":
          e.preventDefault();
          s.setHelpOpen(!s.helpOpen);
          break;
        case "x":
          e.preventDefault();
          s.flipH();
          break;
        case "y":
          e.preventDefault();
          s.flipV();
          break;
        case "t":
          e.preventDefault();
          s.rotate90();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [s]);
}
