import { blendPixel } from "../framebuffer.js";

function distToSegment(px, py, ax, ay, bx, by) {
  const vx = bx - ax;
  const vy = by - ay;
  const wx = px - ax;
  const wy = py - ay;
  const len2 = vx * vx + vy * vy;
  let t = len2 === 0 ? 0 : (vx * wx + vy * wy) / len2;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (ax + t * vx);
  const dy = py - (ay + t * vy);
  return Math.sqrt(dx * dx + dy * dy);
}

function pointInPoly(px, py, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function softShadowPoly(fb, pts, opts = {}) {
  const color = opts.color ?? [24, 30, 46];
  const alpha = opts.alpha ?? 0.18;
  const blur = Math.max(1, opts.blur ?? 8);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }
  const x0 = Math.max(0, Math.floor(minX - blur));
  const x1 = Math.min(fb.width - 1, Math.ceil(maxX + blur));
  const y0 = Math.max(0, Math.floor(minY - blur));
  const y1 = Math.min(fb.height - 1, Math.ceil(maxY + blur));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let d = Infinity;
      for (let i = 0, n = pts.length; i < n; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % n];
        const dd = distToSegment(px, py, a[0], a[1], b[0], b[1]);
        if (dd < d) d = dd;
      }
      const inside = pointInPoly(px, py, pts);
      let t = inside ? 1 : Math.max(0, 1 - d / blur);
      t = t * t * (3 - 2 * t);
      if (t <= 0.004) continue;
      blendPixel(fb, x, y, color, alpha * t);
    }
  }
}
