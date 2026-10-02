"use client";

import { useMosaic } from "@/lib/mosaic-store";
import { Upload, Clipboard, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface UploadZoneProps {
  onImage: (img: HTMLImageElement, name: string) => void;
  samples: { src: string; label: string; jp: string }[];
}

const MAX_DIM = 900;

export function UploadZone({ onImage, samples }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const state = useMosaic();

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please drop an image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => onImage(img, file.name);
        img.onerror = () => toast.error("Could not decode that image.");
        img.src = reader.result as string;
      };
      reader.onerror = () => toast.error("Could not read that file.");
      reader.readAsDataURL(file);
    },
    [onImage],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  // Paste from clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const f = items[i].getAsFile();
          if (f) {
            handleFile(f);
            toast.success("Pasted image from clipboard");
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  const loadSample = useCallback(
    async (src: string, label: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => onImage(img, label);
      img.onerror = () => toast.error("Sample image failed to load.");
      img.src = src;
    },
    [onImage],
  );

  return (
    <div className="flex flex-col gap-3">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-center transition-all",
          dragging
            ? "border-seal bg-seal/5"
            : "border-border hover:border-seal/50 hover:bg-paper/50",
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 text-seal transition-transform group-hover:scale-105">
          <Upload className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-sm text-foreground">
            Drop an image · click to browse
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <Clipboard className="h-3 w-3" /> or press <kbd className="rounded border border-border bg-paper px-1 font-mono text-[10px]">⌘V</kbd> to paste
          </p>
        </div>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-seal" /> samples
        </span>
        {samples.map((s) => (
          <Button
            key={s.src}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadSample(s.src, s.label)}
            className="h-8 gap-2 border-border/60 bg-paper/60 px-2 text-xs hover:bg-paper"
          >
            <span className="font-display tracking-wide">{s.jp}</span>
            <span className="text-muted-foreground">{s.label}</span>
          </Button>
        ))}
        {state.hasImage && (
          <span className="ml-auto truncate text-[11px] text-muted-foreground">
            {state.fileName}
          </span>
        )}
      </div>
    </div>
  );
}

export { MAX_DIM };
