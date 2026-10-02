"use client";

import { useCallback, useRef, useState } from "react";
import { Header } from "@/components/pixel/Header";
import { Footer } from "@/components/pixel/Footer";
import { UploadZone, MAX_DIM } from "@/components/pixel/UploadZone";
import { MosaicCanvas } from "@/components/pixel/MosaicCanvas";
import { ControlPanel } from "@/components/pixel/ControlPanel";
import { ExportBar } from "@/components/pixel/ExportBar";
import { PanelSection } from "@/components/pixel/PanelSection";
import { PresetGallery } from "@/components/pixel/PresetGallery";
import { PaletteLockPanel } from "@/components/pixel/PaletteLockPanel";
import { ShapeMixPanel } from "@/components/pixel/ShapeMixPanel";
import { StatsPanel, Stats } from "@/components/pixel/StatsPanel";
import { useMosaic } from "@/lib/mosaic-store";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import {
  Download,
  BookOpen,
  Lightbulb,
  Sparkles,
  Keyboard,
} from "lucide-react";

const SAMPLES = [
  { src: "/samples/fuji.png", label: "Fuji", jp: "富士" },
  { src: "/samples/koi.png", label: "Koi", jp: "鯉" },
  { src: "/samples/geo.png", label: "Geo", jp: "幾何" },
];

export default function Home() {
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const displayRef = useRef<HTMLCanvasElement | null>(null);
  const state = useMosaic();
  const [stats, setStats] = useState<Stats | null>(null);

  // Install keyboard shortcuts
  useKeyboardShortcuts();

  const onImage = useCallback(
    (img: HTMLImageElement, name: string) => {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      const maxDim = MAX_DIM;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      w = Math.round(w * scale);
      h = Math.round(h * scale);

      // Source canvas — hidden, holds the working image
      const src = sourceRef.current;
      if (!src) return;
      src.width = w;
      src.height = h;
      const sctx = src.getContext("2d", { willReadFrequently: true });
      if (!sctx) return;
      sctx.clearRect(0, 0, w, h);
      sctx.drawImage(img, 0, 0, w, h);

      state.setHasImage(true, w, h, name);

      // Wait one tick so MosaicCanvas effect picks up new dimensions
      requestAnimationFrame(() => {
        state.setShowOriginal(false);
      });
    },
    [state],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
        {/* Intro strip */}
        <section className="brush-in">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="washi-tape tape-seal text-[10px] uppercase tracking-[0.25em] text-paper">
                  mosaïque · 墨絵
                </span>
              </div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Pixelate, then export as code.
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
                Drop in a reference, tune density &amp; shape, add a focal
                point for variable refinement, lock a palette, then export to
                PNG, HTML, CSS, JSON or ASCII. A washi-paper atelier for the
                curious eye.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="seal-stamp flex h-6 w-6 items-center justify-center text-[9px]">
                  作
                </span>
                <span>atelier · studio</span>
              </div>
            </div>
          </div>
        </section>

        {/* Upload */}
        <section className="matte-card washi-texture corner-fold relative rounded-lg p-4">
          <span className="seigaiha-corner tl" aria-hidden />
          <span className="seigaiha-corner br" aria-hidden />
          <UploadZone onImage={onImage} samples={SAMPLES} />
        </section>

        {/* Presets */}
        <section id="presets" className="matte-card washi-texture relative rounded-lg p-4">
          <PanelSection
            title="Presets"
            jp="雰囲気"
            icon={<Sparkles className="h-4 w-4" />}
          >
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              One-click styles. Each tile is a live preview of that preset applied to a sample.
              <span className="ml-1 text-seal">Press</span>{" "}
              <kbd className="kbd">P</kbd> to jump here.
            </p>
            <PresetGallery sampleSrc="/samples/fuji.png" />
          </PanelSection>
        </section>

        {/* Workspace: canvas + controls */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="flex flex-col gap-4">
            <MosaicCanvas
              sourceRef={sourceRef}
              displayRef={displayRef}
              onStats={setStats}
            />
            {/* Stats panel under the canvas */}
            <div className="matte-card washi-texture rounded-lg p-4">
              <StatsPanel
                stats={stats}
                width={state.sourceWidth}
                height={state.sourceHeight}
              />
            </div>
          </div>
          <aside className="lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-92px)] lg:overflow-y-auto lg:pr-1">
            <div className="matte-card washi-texture rounded-lg p-4">
              <ControlPanel />
              <div className="mt-6">
                <ShapeMixPanel />
              </div>
              <div className="mt-6">
                <PaletteLockPanel sourceRef={sourceRef} />
              </div>
            </div>
          </aside>
        </section>

        {/* Export */}
        <section id="export" className="matte-card washi-texture relative rounded-lg p-4">
          <span className="seigaiha-corner tr" aria-hidden />
          <PanelSection
            title="Export"
            jp="書き出し"
            icon={<Download className="h-4 w-4" />}
          >
            <ExportBar displayRef={displayRef} />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              PNG gives you a pixel-perfect raster. HTML renders the mosaic as
              a self-contained page of colored boxes — drop it anywhere. CSS
              uses a single element + box-shadow list. JSON carries the full
              cell grid + palette. ASCII is a fun text-portrait.
            </p>
          </PanelSection>
        </section>

        {/* How-to + shortcuts */}
        <section id="how" className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <HowCard
            n="01"
            jp="素材"
            title="Bring a reference"
            icon={<BookOpen className="h-4 w-4" />}
          >
            Drag a photo onto the upload card, paste from clipboard, or pick a
            washi sample. Everything runs locally in your browser — the image
            never leaves this tab.
          </HowCard>
          <HowCard
            n="02"
            jp="像素"
            title="Tune the mosaic"
            icon={<Lightbulb className="h-4 w-4" />}
          >
            Smaller density = finer pixels. Pick a shape (square, circle,
            triangle, hexagon, diamond, cross, heart, star). Add jitter for
            hand-placed texture. Rotate for kinetic energy.
          </HowCard>
          <HowCard
            n="03"
            jp="焦点"
            title="Variable density"
            icon={<Lightbulb className="h-4 w-4" />}
          >
            Toggle variable density, then drag on the canvas to plant a focal
            point. Pixels stay tiny near the focus and grow coarse toward the
            edges — refinement where the eye should rest.
          </HowCard>
        </section>

        {/* Keyboard shortcuts */}
        <section className="matte-card washi-texture rounded-lg p-4">
          <PanelSection
            title="Shortcuts"
            jp="操作"
            icon={<Keyboard className="h-4 w-4" />}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 md:grid-cols-4">
              <Shortcut keys={["1","8"]} label="Pick shape" />
              <Shortcut keys={["[","]"]} label="Density −/+" />
              <Shortcut keys={[",","."]} label="Shape size −/+" />
              <Shortcut keys={["D"]} label="Toggle dither" />
              <Shortcut keys={["F"]} label="Toggle focal" />
              <Shortcut keys={["O"]} label="Peek original" />
              <Shortcut keys={["R"]} label="Reseed" />
              <Shortcut keys={["U"]} label="Undo" />
              <Shortcut keys={["⇧","U"]} label="Redo" />
              <Shortcut keys={["P"]} label="Jump to presets" />
            </div>
          </PanelSection>
        </section>
      </main>
      <Footer />

      {/* Hidden source canvas — holds the working image data */}
      <canvas ref={sourceRef} className="hidden" aria-hidden="true" />
    </div>
  );
}

function HowCard({
  n,
  jp,
  title,
  icon,
  children,
}: {
  n: string;
  jp: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="matte-card washi-texture relative overflow-hidden rounded-lg p-5">
      <span className="seigaiha-corner tr" aria-hidden />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-seal">
          {icon}
          <span className="font-mono text-xs tracking-widest">{n}</span>
        </div>
        <span className="font-display text-xs tracking-[0.3em] text-muted-foreground">
          {jp}
        </span>
      </div>
      <h3 className="font-display text-sm font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {children}
      </p>
    </article>
  );
}

function Shortcut({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-0.5">
        {keys.map((k, i) => (
          <kbd key={i} className="kbd">{k}</kbd>
        ))}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}
