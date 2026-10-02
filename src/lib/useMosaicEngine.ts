"use client";

import { useEffect, useRef } from "react";
import { useMosaic } from "@/lib/mosaic-store";

/**
 * Debounced re-render trigger.
 * Calls `fn` whenever any relevant store field changes.
 */
export function useMosaicEngine(fn: () => void) {
  const state = useMosaic();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  // Pull all params that affect rendering
  const {
    cellSize,
    shapeSize,
    shape,
    rotation,
    jitter,
    seed,
    adjust,
    quantizeLevels,
    focal,
    bgMode,
    customBg,
    showOriginal,
    hasImage,
    sourceWidth,
    sourceHeight,
    palette,
    dither,
    shapeMix,
    shapeMixShapes,
  } = state;

  useEffect(() => {
    if (!hasImage || !sourceWidth || !sourceHeight) return;
    if (firstRun.current) {
      firstRun.current = false;
      // Render immediately on first paint so there's no flash
      fn();
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fn();
    }, 80);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [
    cellSize,
    shapeSize,
    shape,
    rotation,
    jitter,
    seed,
    adjust.brightness,
    adjust.contrast,
    adjust.saturation,
    adjust.hue,
    adjust.invert,
    quantizeLevels,
    focal.enabled,
    focal.x,
    focal.y,
    focal.falloff,
    focal.mode,
    bgMode,
    customBg,
    showOriginal,
    hasImage,
    sourceWidth,
    sourceHeight,
    palette,
    dither,
    shapeMix,
    shapeMixShapes,
    fn,
  ]);

  return state;
}
