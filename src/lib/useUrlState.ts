"use client";

import { useEffect, useRef } from "react";
import { useMosaic, ParamSnapshot } from "@/lib/mosaic-store";

/**
 * Sync renderable params to/from the URL hash so configs are shareable.
 * Reads on mount AND on hashchange (so back/forward & manual edits work).
 * Writes (debounced) on state change.
 *
 * Format: #cell=14&shape=circle&size=0.8&rot=0&jit=0&seed=1337&...
 */
export function useUrlState() {
  const s = useMosaic();
  const suppressWrite = useRef(true); // suppress writes until first read done
  const reading = useRef(false);      // suppress writes during a read

  const readHash = (hash: string) => {
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const patch: Partial<ParamSnapshot> = {};
    const n = (k: string) => {
      const v = params.get(k);
      return v === null ? null : Number(v);
    };
    const cellSize = n("cell");
    if (cellSize !== null) patch.cellSize = cellSize;
    const shapeSize = n("size");
    if (shapeSize !== null) patch.shapeSize = shapeSize / 100;
    const shape = params.get("shape") as ParamSnapshot["shape"] | null;
    if (shape) patch.shape = shape;
    const rotation = n("rot");
    if (rotation !== null) patch.rotation = rotation;
    const jitter = n("jit");
    if (jitter !== null) patch.jitter = jitter / 100;
    const seed = n("seed");
    if (seed !== null) patch.seed = seed;
    const quantize = n("q");
    if (quantize !== null) patch.quantizeLevels = quantize;
    const bg = params.get("bg") as ParamSnapshot["bgMode"] | null;
    if (bg) patch.bgMode = bg;
    const shapeMix = params.get("mix") as ParamSnapshot["shapeMix"] | null;
    if (shapeMix) patch.shapeMix = shapeMix;
    const mixShapes = params.get("mixShapes");
    if (mixShapes) {
      patch.shapeMixShapes = mixShapes.split(",") as ParamSnapshot["shapeMixShapes"];
    }
    const dither = params.get("dither");
    if (dither === "1") patch.dither = true;
    const br = n("br");
    const co = n("co");
    const sa = n("sa");
    const hu = n("hu");
    if (br !== null || co !== null || sa !== null || hu !== null) {
      patch.adjust = {
        brightness: br ?? 0,
        contrast: co ?? 0,
        saturation: sa ?? 0,
        hue: hu ?? 0,
        invert: dither === "inv",
      };
    }
    if (Object.keys(patch).length > 0) {
      s.replaceParams(patch, { silent: true });
    }
  };

  // Read on mount + listen for hashchange (back/forward, manual edits)
  useEffect(() => {
    readHash(window.location.hash.slice(1));
    suppressWrite.current = false;
    const onHash = () => {
      reading.current = true;
      readHash(window.location.hash.slice(1));
      // allow writes again after a beat
      setTimeout(() => { reading.current = false; }, 50);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Write to URL (debounced)
  useEffect(() => {
    if (suppressWrite.current || reading.current) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams();
      p.set("cell", String(s.cellSize));
      p.set("size", String(Math.round(s.shapeSize * 100)));
      p.set("shape", s.shape);
      p.set("rot", String(s.rotation));
      p.set("jit", String(Math.round(s.jitter * 100)));
      p.set("seed", String(s.seed));
      p.set("q", String(s.quantizeLevels));
      p.set("bg", s.bgMode);
      if (s.shapeMix !== "single") {
        p.set("mix", s.shapeMix);
        p.set("mixShapes", s.shapeMixShapes.join(","));
      }
      if (s.dither) p.set("dither", "1");
      if (s.adjust.brightness) p.set("br", String(s.adjust.brightness));
      if (s.adjust.contrast) p.set("co", String(s.adjust.contrast));
      if (s.adjust.saturation) p.set("sa", String(s.adjust.saturation));
      if (s.adjust.hue) p.set("hu", String(s.adjust.hue));
      if (s.adjust.invert) p.set("dither", "inv");
      const hash = "#" + p.toString();
      if (hash !== window.location.hash) {
        history.replaceState(null, "", hash);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [
    s.cellSize, s.shapeSize, s.shape, s.rotation, s.jitter, s.seed,
    s.quantizeLevels, s.bgMode, s.shapeMix, s.shapeMixShapes, s.dither,
    s.adjust, s.replaceParams,
  ]);
}
