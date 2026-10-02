"use client";

import { useImageTray, TrayImage } from "@/lib/useImageTray";
import { cn } from "@/lib/utils";
import { Images, X } from "lucide-react";
import { toast } from "sonner";

interface ImageTrayProps {
  onPick: (img: TrayImage) => void;
}

export function ImageTray({ onPick }: ImageTrayProps) {
  const { images, activeId, setActive, remove } = useImageTray();

  if (images.length === 0) return null;

  return (
    <div className="flex items-center gap-2 rounded-md border border-border/50 bg-paper/40 px-2 py-1.5">
      <span className="flex shrink-0 items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Images className="h-3 w-3 text-seal" />
        tray
      </span>
      <div className="flex flex-1 gap-1.5 overflow-x-auto">
        {images.map((img) => (
          <div
            key={img.id}
            className={cn(
              "tray-tile group relative shrink-0 cursor-pointer overflow-hidden rounded border-2 transition-all",
              activeId === img.id
                ? "border-seal"
                : "border-border/50 hover:border-seal/40",
            )}
            onClick={() => {
              setActive(img.id);
              onPick(img);
            }}
            title={img.name}
          >
            {/* Tray thumbnail */}
            <img
              src={img.thumb}
              alt={img.name}
              className="h-10 w-10 object-cover"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                remove(img.id);
                toast.info(`Removed ${img.name} from tray`);
              }}
              className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center bg-ink/60 text-paper opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Remove ${img.name}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>
      <span className="shrink-0 text-[9px] text-muted-foreground/50">
        {images.length}/6
      </span>
    </div>
  );
}
