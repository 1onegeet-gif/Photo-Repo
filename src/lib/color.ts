// Color helpers — HSL/RGB adjustments + palette quantization.
// All functions are pure & deterministic so the engine + export share one source of truth.

export type RGB = [number, number, number];

export function clamp(v: number, min = 0, max = 255) {
  return v < min ? min : v > max ? max : v;
}

export function rgbToCss([r, g, b]: RGB, a = 1): string {
  if (a >= 1) return `rgb(${r | 0},${g | 0},${b | 0})`;
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}

export function rgbToHex([r, g, b]: RGB): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => clamp(c | 0).toString(16).padStart(2, "0"))
      .join("")
  );
}

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h.split("").map((c) => c + c).join("");
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// ---- HSL conversions (standard, no external dep) ----
function rgbToHsl([r0, g0, b0]: RGB): [number, number, number] {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

// ---- Editable adjustments ----
export interface ColorAdjust {
  brightness: number; // -100..100  (0 = none)
  contrast: number;   // -100..100
  saturation: number; // -100..100
  hue: number;        // -180..180
  invert: boolean;
}

export const DEFAULT_ADJUST: ColorAdjust = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  invert: false,
};

/** Apply adjustments to a single RGB color. Returns a new RGB. */
export function applyAdjust(rgb: RGB, a: ColorAdjust): RGB {
  let [h, s, l] = rgbToHsl(rgb);

  // hue shift
  h = h + a.hue;

  // saturation boost/cut
  s = s * (1 + a.saturation / 100);
  s = Math.max(0, Math.min(100, s));

  // brightness (lightness)
  l = l + a.brightness * 0.5;
  l = Math.max(0, Math.min(100, l));

  let out = hslToRgb(h, s, l);

  // contrast (around 50% gray)
  const cf = 1 + a.contrast / 100;
  out = out.map((v) => (v - 128) * cf + 128) as RGB;

  if (a.invert) out = out.map((v) => 255 - v) as RGB;

  return out.map((v) => clamp(v)) as RGB;
}

// ---- Palette quantization ----
/** Reduce color depth. `levels` 2..32. Higher = more colors. */
export function quantize(rgb: RGB, levels: number): RGB {
  const n = Math.max(2, levels);
  const step = 255 / (n - 1);
  return rgb.map((v) => Math.round(Math.round(v / step) * step)) as RGB;
}

// ---- Background color computation (average luminance → paper tone) ----
export function averageColor(data: Uint8ClampedArray): RGB {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
  }
  if (n === 0) return [255, 255, 255];
  return [r / n, g / n, b / n];
}

// ---- Locked palette support ----
/** Find the nearest color in a palette to `c` (squared euclidean). */
export function nearestInPalette(c: RGB, palette: RGB[]): RGB {
  let best = palette[0];
  let bestD = Infinity;
  for (const p of palette) {
    const dr = c[0] - p[0];
    const dg = c[1] - p[1];
    const db = c[2] - p[2];
    const d = dr * dr + dg * dg + db * db;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

/**
 * Extract a dominant palette from image data using median-cut.
 * Returns up to `k` colors (k clamped to 2..16).
 * Sampled with a stride for speed on big images.
 */
export function extractPalette(
  data: Uint8ClampedArray,
  k = 8,
  maxSamples = 20000,
): RGB[] {
  const n = Math.max(2, Math.min(16, k));
  // Collect samples
  const pixels: RGB[] = [];
  const total = data.length / 4;
  const stride = Math.max(1, Math.floor(total / maxSamples));
  for (let i = 0; i < data.length; i += 4 * stride) {
    // Skip fully transparent pixels
    if (data[i + 3] < 8) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) return [[128, 128, 128]];

  // Median cut
  type Box = { pixels: RGB[] };
  const boxes: Box[] = [{ pixels }];
  while (boxes.length < n) {
    // Find the box with the largest channel range
    let targetIdx = -1;
    let targetRange = -1;
    let targetChannel = 0;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.pixels.length < 2) continue;
      const ranges = [0, 0, 0];
      for (let ch = 0; ch < 3; ch++) {
        let mn = Infinity, mx = -Infinity;
        for (const p of b.pixels) {
          if (p[ch] < mn) mn = p[ch];
          if (p[ch] > mx) mx = p[ch];
        }
        ranges[ch] = mx - mn;
      }
      const r = Math.max(ranges[0], ranges[1], ranges[2]);
      if (r > targetRange) {
        targetRange = r;
        targetIdx = i;
        targetChannel = ranges.indexOf(r);
      }
    }
    if (targetIdx === -1) break; // can't split further
    const box = boxes[targetIdx];
    box.pixels.sort((a, b) => a[targetChannel] - b[targetChannel]);
    const mid = Math.floor(box.pixels.length / 2);
    const a = box.pixels.slice(0, mid);
    const b = box.pixels.slice(mid);
    boxes.splice(targetIdx, 1, { pixels: a }, { pixels: b });
  }

  // Average each box
  const palette: RGB[] = [];
  for (const box of boxes) {
    if (box.pixels.length === 0) continue;
    let r = 0, g = 0, b = 0;
    for (const p of box.pixels) {
      r += p[0]; g += p[1]; b += p[2];
    }
    palette.push([
      Math.round(r / box.pixels.length),
      Math.round(g / box.pixels.length),
      Math.round(b / box.pixels.length),
    ]);
  }
  return palette;
}

/** Parse a comma/newline/space-separated list of hex colors. */
export function parseHexList(input: string): RGB[] {
  return input
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      try {
        return hexToRgb(t);
      } catch {
        return null;
      }
    })
    .filter((x): x is RGB => x !== null);
}

