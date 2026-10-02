// Shape primitives for the mosaic engine.
// Each shape is drawn centered inside a cell of size `s` at canvas position (x, y).
// `fill` is a CSS color string, `gap` shrinks the visible shape to leave background.

export type ShapeKind =
  | "square"
  | "circle"
  | "triangle"
  | "hexagon"
  | "diamond"
  | "cross"
  | "heart"
  | "star";

export const SHAPE_OPTIONS: { value: ShapeKind; label: string; jp: string }[] = [
  { value: "square", label: "Square", jp: "四角" },
  { value: "circle", label: "Circle", jp: "円" },
  { value: "triangle", label: "Triangle", jp: "三角" },
  { value: "hexagon", label: "Hexagon", jp: "六角" },
  { value: "diamond", label: "Diamond", jp: "菱" },
  { value: "cross", label: "Cross", jp: "十字" },
  { value: "heart", label: "Heart", jp: "心" },
  { value: "star", label: "Star", jp: "星" },
];

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: ShapeKind,
  x: number,
  y: number,
  s: number,
  fill: string,
  gap = 0,
  rotation = 0,
) {
  const r = Math.max(0.5, s / 2 - gap);
  const cx = x + s / 2;
  const cy = y + s / 2;

  ctx.save();
  ctx.fillStyle = fill;
  ctx.translate(cx, cy);
  if (rotation) ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-cx, -cy);

  ctx.beginPath();
  switch (shape) {
    case "square": {
      ctx.rect(x + gap, y + gap, s - gap * 2, s - gap * 2);
      break;
    }
    case "circle": {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    }
    case "triangle": {
      // upward triangle, fits in bounding box
      ctx.moveTo(cx, y + gap);
      ctx.lineTo(x + s - gap, y + s - gap);
      ctx.lineTo(x + gap, y + s - gap);
      ctx.closePath();
      break;
    }
    case "hexagon": {
      // flat-top hexagon inscribed in cell
      const w = s - gap * 2;
      const h = w * Math.sqrt(3) / 2;
      const ox = x + gap;
      const oy = cy - h / 2;
      const tw = w / 4;
      const th = h / 2;
      ctx.moveTo(ox, oy + th);
      ctx.lineTo(ox + tw, oy);
      ctx.lineTo(ox + tw * 3, oy);
      ctx.lineTo(ox + w, oy + th);
      ctx.lineTo(ox + tw * 3, oy + h);
      ctx.lineTo(ox + tw, oy + h);
      ctx.closePath();
      break;
    }
    case "diamond": {
      ctx.moveTo(cx, y + gap);
      ctx.lineTo(x + s - gap, cy);
      ctx.lineTo(cx, y + s - gap);
      ctx.lineTo(x + gap, cy);
      ctx.closePath();
      break;
    }
    case "cross": {
      // plus/cross
      const arm = s / 3;
      const o = (s - arm) / 2;
      ctx.rect(x + o, y + gap, arm, s - gap * 2);
      ctx.rect(x + gap, y + o, s - gap * 2, arm);
      break;
    }
    case "heart": {
      // simple heart path inside the cell
      const w = s - gap * 2;
      const top = y + gap + w * 0.3;
      const bottom = y + s - gap;
      const mx = cx;
      ctx.moveTo(mx, bottom);
      ctx.bezierCurveTo(
        mx - w * 0.55, bottom - w * 0.45,
        x + gap, top + w * 0.1,
        mx, top - w * 0.15,
      );
      ctx.bezierCurveTo(
        x + s - gap, top + w * 0.1,
        mx + w * 0.55, bottom - w * 0.45,
        mx, bottom,
      );
      ctx.closePath();
      break;
    }
    case "star": {
      // 5-point star
      const outer = r;
      const inner = r * 0.45;
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? outer : inner;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        const px = cx + Math.cos(a) * rad;
        const py = cy + Math.sin(a) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
  }
  ctx.fill();
  ctx.restore();
}

export function shapeOutlineHint(shape: ShapeKind): string {
  // A short label used by the shape picker tooltip
  switch (shape) {
    case "square": return "kaku";
    case "circle": return "wa";
    case "triangle": return "sankaku";
    case "hexagon": return "rokkaku";
    case "diamond": return "hishi";
    case "cross": return "juji";
    case "heart": return "kokoro";
    case "star": return "hoshi";
  }
}
