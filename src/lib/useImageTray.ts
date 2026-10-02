"use client";

import { create } from "zustand";

const MAX_TRAY = 6;

export interface TrayImage {
  id: string;
  dataUrl: string;
  name: string;
  width: number;
  height: number;
  thumb: string; // small data URL for the tray preview
}

interface TrayState {
  images: TrayImage[];
  activeId: string | null;
  add: (img: TrayImage) => void;
  remove: (id: string) => void;
  setActive: (id: string) => void;
  clear: () => void;
}

function makeThumb(dataUrl: string, maxDim = 80): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export const useImageTray = create<TrayState>((set, get) => ({
  images: [],
  activeId: null,
  add: (img) =>
    set((s) => {
      // Dedupe by name + dimensions
      const dupe = s.images.find(
        (x) => x.name === img.name && x.width === img.width && x.height === img.height,
      );
      if (dupe) {
        return { images: s.images, activeId: dupe.id };
      }
      const next = [img, ...s.images].slice(0, MAX_TRAY);
      return { images: next, activeId: img.id };
    }),
  remove: (id) =>
    set((s) => {
      const next = s.images.filter((x) => x.id !== id);
      const activeId =
        s.activeId === id ? (next[0]?.id ?? null) : s.activeId;
      return { images: next, activeId };
    }),
  setActive: (id) => set({ activeId: id }),
  clear: () => set({ images: [], activeId: null }),
}));

export { makeThumb, MAX_TRAY };
