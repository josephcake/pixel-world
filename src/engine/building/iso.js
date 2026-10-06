import { fillPoly, strokePoly, strokeLine } from "../framebuffer.js";

export const U = 2;
export const V = 1;
export const Z = 2;
export const MARGIN = 3;

export const BG = [30, 38, 56];

export function makeProjector(w, d, plotMargin, totalHeight, scale = 1, marginUnits = MARGIN) {
  const pm = plotMargin;
  const u = U * scale;
  const v = V * scale;
  const z = Z * scale;
  const margin = marginUnits * scale;
  const spanX = (w + d + 4 * pm) * u;
  const spanY = (w + d + 2 * pm) * v;
  const top = Math.max(totalHeight * z, 2 * pm * v);
  const width = Math.round(spanX + 2 * margin);
  const height = Math.round(top + spanY + 2 * margin);
  const ox = (d + 2 * pm) * u + margin;
  const oy = top + margin;
  const project = (x, y, zz = 0) => [ox + (x - y) * u, oy + (x + y) * v - zz * z];
  return { project, width, height, ox, oy };
}

export const check2 = (a, b) => (x, y) =>
  (((x >> 1) + (y >> 1)) & 1) ? a : b;

export const dither = (a, b, size = 2) => (x, y) =>
  ((Math.floor(x / size) + Math.floor(y / size)) & 1) ? a : b;

export function toColor(c) {
  if (!c) return [255, 0, 255];
  if (Array.isArray(c) && c.length === 2) return dither(c[0], c[1]);
  return c;
}

export function drawGround(fb, project, w, d, pm, colors, theme) {
  const g = [
    project(-pm, -pm),
    project(w + pm, -pm),
    project(w + pm, d + pm),
    project(-pm, d + pm),
  ];
  const fill =
    theme && theme.patterns === false
      ? theme.fill(colors.grassA)
      : dither(colors.grassA, colors.grassB);
  fillPoly(fb, g, fill);
  strokePoly(
    fb,
    g,
    theme?.neon ? theme.neonBase : theme ? theme.fill(colors.grassEdge) : colors.grassEdge,
  );
}

export function drawShadow(fb, project, ox, oy, w, d, dx, dy, color) {
  const s = [
    project(ox, oy).map((v, i) => v + (i === 0 ? dx : dy)),
    project(ox + w, oy).map((v, i) => v + (i === 0 ? dx : dy)),
    project(ox + w, oy + d).map((v, i) => v + (i === 0 ? dx : dy)),
    project(ox, oy + d).map((v, i) => v + (i === 0 ? dx : dy)),
  ];
  fillPoly(fb, s, color);
}

export function drawPath(fb, project, x0, x1, y0, y1, colors, theme) {
  const p = [
    project(x0, y0),
    project(x1, y0),
    project(x1, y1),
    project(x0, y1),
  ];
  fillPoly(fb, p, theme ? theme.fill(colors.path) : colors.path);
  strokePoly(fb, p, theme ? theme.fill(colors.pathEdge) : colors.pathEdge);
}

export function drawWindowQuad(fb, quad, colors) {
  fillPoly(fb, quad, colors.glass);
  if (colors.frame) strokePoly(fb, quad, colors.frame);
  if (colors.hi) {
    strokeLine(fb, quad[0][0], quad[0][1], quad[1][0], quad[1][1], colors.hi);
  }
}
