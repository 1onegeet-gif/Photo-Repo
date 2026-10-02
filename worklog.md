# Project Worklog — Pixel Mosaic Studio (Mosaic Atelier)

A creative pixelation studio where users upload an image, tune pixel density/size/shape, adjust color, apply variable focal-point density, lock a palette, mix shapes by luminance, and export to PNG / HTML / CSS / JSON / ASCII.

## Project Brief
- Single route `/` (Next.js 16 App Router)
- Pure client-side canvas pixelation engine (no backend needed)
- Aesthetic: cream / pale yellow washi paper, matte finish, ancient Japanese UI texture
- Shapes: square, circle, triangle, hexagon, diamond, cross, heart, star
- Color edits: brightness, contrast, saturation, hue, invert, color-depth, dither
- Variable pixel density via draggable focal point (fine near, coarse far — or vice versa)
- Export: PNG, HTML grid, CSS box-shadow, JSON palette, ASCII text

## Architecture
- `src/lib/color.ts` — RGB/HSL conversions, color adjustments, quantization, median-cut palette extraction, nearest-color lookup, hex-list parser
- `src/lib/shapes.ts` — 8 shape primitives (square/circle/triangle/hexagon/diamond/cross/star/heart)
- `src/lib/pixelate.ts` — core engine: marching-grid pixelation with focal-point variable density, locked palette snapping, Bayer dithering, per-cell shape mix (luminance/random)
- `src/lib/export.ts` — PNG/HTML/CSS/JSON/ASCII exporters (JSON now includes per-cell shape)
- `src/lib/presets.ts` — 12 one-click preset definitions (Retro 8-bit, Pointillism, Ukiyo-e, Halftone, Sumi-e, Cross-stitch, Heart-burst, Starfield, Hex Mosaic, Luminance Mix, Paper Cut, Kaleido)
- `src/lib/mosaic-store.ts` — Zustand store with full undo/redo history (50-deep), palette lock, shape mix, dither
- `src/lib/useMosaicEngine.ts` — debounced re-render effect hook (watches all new fields)
- `src/lib/useKeyboardShortcuts.ts` — global keyboard shortcuts
- `src/components/pixel/*` — Header, Footer, UploadZone, MosaicCanvas, ControlPanel, ExportBar, PanelSection, ShapePicker, ControlSlider, PresetGallery, PaletteLockPanel, ShapeMixPanel, StatsPanel, HistoryControls
- `src/app/page.tsx` — single-route orchestration with all panels wired
- `src/app/globals.css` — washi paper texture, matte cards, ink dividers, seal stamps, seigaiha corner ornaments, hanko stamp, enso empty state, washi tape, ink loader, palette chips, stat tiles, kbd styling, focus rings, Next.js dev-indicator hidden
- `public/samples/{fuji,koi,geo}.png` — AI-generated washi-aesthetic sample images

---
Task ID: 1
Agent: main (Z.ai Code)
Task: Initialize worklog and set up cream/Japanese aesthetic theme

Work Log:
- Inspected project structure (Next.js 16, shadcn/ui, Tailwind 4, slider component available)
- Set up todos for the full build pipeline
- Theme tokens: cream washi background (#F5EEDC / oklch 0.965 0.018 85), sumi ink text (#231C12), vermillion seal accent (#B23A2C), muted matcha/gold secondaries
- Paper texture via layered CSS gradients + SVG noise data-URI (cheap, GPU-friendly)
- Added Shippori Mincho display font for Japanese kanji

Stage Summary:
- Theme tokens + washi paper texture utility classes done
- Fonts: Geist Sans/Mono + Shippori Mincho (display)

---
Task ID: 2-7
Agent: main (Z.ai Code)
Task: Build the full pixelation studio (engine, shapes, color, exports, UI)

Work Log:
- Built `color.ts`: HSL/RGB conversions + adjustments + quantization
- Built `shapes.ts`: 8 shape primitives
- Built `pixelate.ts`: marching-grid engine with focal-point variable density
- Built `export.ts`: PNG/HTML/CSS/JSON/ASCII exporters
- Built Zustand store, debounced engine hook, all UI components
- Generated 3 AI sample images
- Added Sonner Toaster to layout

Stage Summary:
- Full app built, compiles cleanly, lint passes
- Agent-browser verified: rendering, shape switching, variable density, PNG/HTML exports all working

---
Task ID: 8 (bug fix)
Agent: main (Z.ai Code)
Task: Fix runtime ReferenceError found during agent-browser verification

Work Log:
- Fixed `yi1 is not defined` in `sampleRegion()` — added `sh` param + `yi1` declaration

Stage Summary:
- Critical engine bug fixed

---
Task ID: 9 (cron round 1)
Agent: main (Z.ai Code)
Task: QA review + add features + improve styling

Work Log:
- QA via agent-browser + VLM: found Next.js dev "N" badge overlaying canvas; empty state sparse; missing presets/palette/stats/undo features
- Fixed: hid Next.js dev indicator via CSS (`nextjs-dev-indicator { display: none !important }`)
- Added 12 presets in `src/lib/presets.ts` (Retro 8-bit, Pointillism, Ukiyo-e, Halftone, Sumi-e, Cross-stitch, Heart-burst, Starfield, Hex Mosaic, Luminance Mix, Paper Cut, Kaleido) — each sets cellSize/shapeSize/shape/rotation/jitter/adjust/quantize/focal/bgMode/dither
- Built `PresetGallery` component with live canvas-thumbnail previews (each tile renders the preset applied to a 160×120 sample)
- Added palette lock: `extractPalette()` median-cut in `color.ts`; `PaletteLockPanel` component with extract-from-image (k=2..16 slider), paste-custom-hex, add/remove color swatches, clear
- Updated `pixelate.ts` engine: `palette` option snaps cells to nearest palette color; `dither` option applies 4×4 Bayer matrix; `shapeMix` option ("single"/"luminance"/"random") + `shapeMixShapes` picks per-cell shape; Cell now carries its own `shape` field
- Built `ShapeMixPanel` with multi-select shape grid + luminance/random mode toggle
- Added `StatsPanel` (cells, render ms, colors, canvas dimensions + dominant palette chips)
- Added undo/redo: store now keeps `past`/`future` snapshots (50-deep), every setter pushes history; `HistoryControls` component in header
- Added keyboard shortcuts: 1-8 shapes, [ ] density, , . shape size, D dither, F focal, O peek, R reseed, U undo, ⇧U redo, P presets
- Added `Dither` toggle in Color section
- Styling flourishes in globals.css:
  - Washi tape strips (3 color variants) with torn edges
  - Seigaiha (青海波) wave corner ornaments (SVG data-URI)
  - Hanko vermillion seal stamp on canvas bottom-right
  - Vertical kanji watermark (墨絵工房) on canvas left
  - Enso circle empty state with ink texture
  - Shape picker hover-lift animation
  - Preset card hover lift + rotate
  - Ink-sweep loading animation on canvas card
  - Stamp-down animation keyframe
  - Palette chip + stat tile components
  - Keyboard kbd styling
  - Focus-visible ring tuned for cream theme
  - Custom scrollbar already present

Verification:
- agent-browser + VLM confirmed all new features work:
  - Preset gallery: 12 live thumbnails render, clicking applies preset + toast
  - Ukiyo-e preset: triangles + reduced palette applied to canvas
  - Palette lock: "Extracted 8 colors from image" toast, canvas snaps to 8-color palette
  - Undo: palette reverts from 8 locked → 25 full via U key
  - Stats panel: 3.23k cells, 18.9ms render, 39 colors, 900×514 — all live
  - Shape mix: selected square+circle+star, enabled luminance mode — dark areas get squares, bright areas get stars (VLM confirmed)
  - PNG export: success toast
  - Next.js "N" badge: gone
  - Hanko seal + seigaiha corners: visible on canvas card
  - Full-page VLM review: 5/5 polish, 11 sections listed, no bugs, aesthetic consistent
- Lint: 0 errors / 0 warnings
- Dev server: healthy (200 responses)

Stage Summary:
- Round 1 complete: 7 new features + extensive styling improvements
- All features verified working in browser
- VLM polish rating: 5/5

---
Current project status description/assessment
- Mosaic Atelier is now a feature-rich pixelation studio with 12 presets, palette lock (extract/paste/custom), shape mix by luminance/random, Bayer dithering, undo/redo history, live stats, keyboard shortcuts
- Aesthetic: cream washi paper with seigaiha corner ornaments, hanko seal stamp, vertical kanji watermark, enso empty state, washi tape accents, ink-sweep loader, matte cards
- 100% client-side — no backend, no API routes needed
- VLM-rated 5/5 aesthetic polish

Current goals / completed modifications / verification results
- DONE: hide dev badge, presets, palette lock, shape mix, stats, undo/redo, dither, keyboard shortcuts, styling flourishes
- Verification: lint clean, dev server healthy, agent-browser confirms all features, VLM 5/5

Unresolved issues or risks, priority recommendations for next phase
- CSS box-shadow export still uses uniform spread for non-square cells (documented)
- No dark mode toggle wired (next-themes available but light-only fits the cream aesthetic)
- Could add: side-by-side compare view, preset favoriting, save/load state to URL, batch export, SVG export, cell-level hover inspection
- The recurring 15-min webDevReview cron will continue iterating
