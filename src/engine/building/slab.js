import { fillPoly, strokePoly } from "../framebuffer.js";

export function roundedRect(w, d, r, segs = 5) {
  const rr = Math.max(0, Math.min(r, w / 2, d / 2));
  const pts = [];
  const arc = (cx, cy, a0, a1) => {
    for (let i = 0; i <= segs; i++) {
      const a = a0 + (a1 - a0) * (i / segs);
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  };
  arc(w - rr, rr, -Math.PI / 2, 0);
  arc(w - rr, d - rr, 0, Math.PI / 2);
  arc(rr, d - rr, Math.PI / 2, Math.PI);
  arc(rr, rr, Math.PI, Math.PI * 1.5);
  return pts;
}

export function extrude(fb, project, pts, zTop, zBot, colors) {
  const n = pts.length;
  const top = pts.map((p) => project(p[0], p[1], zTop));
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    fillPoly(
      fb,
      [
        project(a[0], a[1], zTop),
        project(b[0], b[1], zTop),
        project(b[0], b[1], zBot),
        project(a[0], a[1], zBot),
      ],
      colors.side,
    );
  }
  fillPoly(fb, top, colors.top);
  if (colors.edge) strokePoly(fb, top, colors.edge);
}
