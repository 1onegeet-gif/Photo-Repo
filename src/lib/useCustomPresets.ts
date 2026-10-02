"use client";

import { useCallback, useState } from "react";
import type { ParamSnapshot } from "./mosaic-store";

const STORAGE_KEY = "mosaic.customPresets.v1";

export interface CustomPreset {
  id: string;
  name: string;
  jp?: string;
  desc: string;
  createdAt: number;
  patch: Partial<ParamSnapshot>;
}

function loadAll(): CustomPreset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as CustomPreset[];
  } catch {
    return [];
  }
}

function saveAll(list: CustomPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}

export function useCustomPresets() {
  // Lazy-initialize from localStorage on first render (client-only).
  const [presets, setPresets] = useState<CustomPreset[]>(() => loadAll());

  const add = useCallback((p: Omit<CustomPreset, "id" | "createdAt">): CustomPreset => {
    const full: CustomPreset = {
      ...p,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    setPresets((prev) => {
      const next = [full, ...prev].slice(0, 24); // cap at 24
      saveAll(next);
      return next;
    });
    return full;
  }, []);

  const remove = useCallback((id: string) => {
    setPresets((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveAll(next);
      return next;
    });
  }, []);

  const rename = useCallback((id: string, name: string) => {
    setPresets((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, name } : p));
      saveAll(next);
      return next;
    });
  }, []);

  /** Export all custom presets as a JSON string. */
  const exportJson = useCallback((): string => {
    return JSON.stringify(
      { format: "mosaic-atelier-presets/v1", presets },
      null,
      2,
    );
  }, [presets]);

  /** Import presets from a JSON string, merging with existing. Returns count added. */
  const importJson = useCallback((raw: string): number => {
    try {
      const parsed = JSON.parse(raw);
      const incoming: CustomPreset[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.presets)
          ? parsed.presets
          : [];
      if (incoming.length === 0) return 0;
      setPresets((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = incoming
          .filter((p) => p && p.id && p.name && p.patch)
          .map((p) => ({
            ...p,
            // Re-id to avoid collisions
            id: existingIds.has(p.id)
              ? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
              : p.id,
            createdAt: p.createdAt || Date.now(),
          }));
        const next = [...fresh, ...prev].slice(0, 24);
        saveAll(next);
        return next;
      });
      return incoming.length;
    } catch {
      return 0;
    }
  }, []);

  return { presets, add, remove, rename, exportJson, importJson };
}

