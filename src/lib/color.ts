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
