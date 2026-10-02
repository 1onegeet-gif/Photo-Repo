"use client";

import { useCallback, useRef, useState, useEffect } from "react";
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
import { TransformBar } from "@/components/pixel/TransformBar";
import { CustomPresetBar } from "@/components/pixel/CustomPresetBar";
import { HelpOverlay } from "@/components/pixel/HelpOverlay";
import { useMosaic } from "@/lib/mosaic-store";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import { useUrlState } from "@/lib/useUrlState";
import { useScrollReveal } from "@/lib/useScrollReveal";
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
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const state = useMosaic();
  const [stats, setStats] = useState<Stats | null>(null);

  // Install keyboard shortcuts
  useKeyboardShortcuts();
  // Sync params to URL hash for shareable configs
  useUrlState();

  // Apply transform to the source canvas from the original image.
  // Called on image load AND whenever the transform changes.
  const applyTransform = useCallback(() => {
    const img = originalImgRef.current;
    const src = sourceRef.current;
    if (!img || !src) return;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    const maxDim = MAX_DIM;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    w = Math.round(w * scale);
    h = Math.round(h * scale);

    const { flipH, flipV, rotate90 } = state.transform;
    // Swap dimensions if rotated 90/270
    const rotated = rotate90 === 90 || rotate90 === 270;
    const outW = rotated ? h : w;
    const outH = rotated ? w : h;
    src.width = outW;
    src.height = outH;
    const sctx = src.getContext("2d", { willReadFrequently: true });
    if (!sctx) return;
    sctx.clearRect(0, 0, outW, outH);
    sctx.save();
    sctx.translate(outW / 2, outH / 2);
    sctx.rotate((rotate90 * Math.PI) / 180);
    sctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    sctx.drawImage(img, -w / 2, -h / 2, w, h);
    sctx.restore();
    state.setHasImage(true, outW, outH, state.fileName || "image");
    requestAnimationFrame(() => state.setShowOriginal(false));
  }, [state]);

  const onImage = useCallback(
    (img: HTMLImageElement, name: string) => {
      originalImgRef.current = img;
      state.resetTransform();
      // applyTransform reads originalImgRef + state.transform (now identity)
      // Defer one tick so resetTransform has flushed
      requestAnimationFrame(() => {
        // Set name first
        state.setHasImage(true, 1, 1, name);
        applyTransform();
      });
    },
    [state, applyTransform],
  );

  // Re-apply transform whenever transform changes
  useEffect(() => {
    if (!originalImgRef.current) return;
    applyTransform();
  }, [state.transform.flipH, state.transform.flipV, state.transform.rotate90]);

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

        {/* Custom presets (localStorage) */}
        <section className="matte-card washi-texture rounded-lg p-4">
          <CustomPresetBar />
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
                <TransformBar />
              </div>
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
              <Shortcut keys={["C"]} label="Compare slider" />
              <Shortcut keys={["I"]} label="Inspect cells" />
              <Shortcut keys={["R"]} label="Reseed" />
              <Shortcut keys={["U"]} label="Undo" />
              <Shortcut keys={["⇧","U"]} label="Redo" />
              <Shortcut keys={["P"]} label="Jump to presets" />
              <Shortcut keys={["?"]} label="Toggle help" />
            </div>
          </PanelSection>
        </section>
      </main>
      <Footer />

      {/* Help overlay (first-time onboarding) */}
      <HelpOverlay />

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
  const ref = useScrollReveal<HTMLElement>();
  return (
    <article
      ref={ref}
      className="reveal matte-card washi-texture relative overflow-hidden rounded-lg p-5"
    >
      <span className="seigaiha-corner tr" aria-hidden />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-seal">
          {icon}
          <span className="section-num">{n}</span>
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
