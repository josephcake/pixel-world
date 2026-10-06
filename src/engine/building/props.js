import {
  fillPoly,
  strokePoly,
  strokeLine,
  setPixel,
} from "../framebuffer.js";
import { dither } from "./iso.js";

export function fillCircle(fb, cx, cy, r, color) {
  const cf = typeof color === "function" ? color : () => color;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    const dy = y + 0.5 - cy;
    const t = r * r - dy * dy;
    if (t < 0) continue;
    const span = Math.sqrt(t);
    for (let x = Math.ceil(cx - span - 0.5); x <= Math.floor(cx + span - 0.5); x++) {
      setPixel(fb, x, y, cf(x, y));
    }
  }
}

export function drawTree(fb, project, x, y, scale = 1) {
  const base = project(x, y, 0);
  const trunkH = Math.round(4 * scale);
  const trunkW = Math.max(1, Math.round(scale));
  fillPoly(
    fb,
    [
      [base[0] - trunkW / 2, base[1]],
      [base[0] + trunkW / 2, base[1]],
      [base[0] + trunkW / 2, base[1] - trunkH],
      [base[0] - trunkW / 2, base[1] - trunkH],
    ],
    [96, 68, 44],
  );
  const cy = base[1] - trunkH - 4 * scale;
  const r = 5 * scale;
  fillCircle(fb, base[0] + 1, cy + 1, r + 0.5, [42, 84, 40]);
  fillCircle(fb, base[0], cy, r, [56, 110, 52]);
  fillCircle(fb, base[0] - r * 0.5, cy + r * 0.45, r * 0.72, [64, 122, 60]);
  fillCircle(fb, base[0] + r * 0.5, cy + r * 0.45, r * 0.72, [64, 122, 60]);
  fillCircle(fb, base[0] - r * 0.35, cy - r * 0.35, r * 0.5, [86, 148, 74]);
}

export function drawBush(fb, project, x, y, scale = 1) {
  const base = project(x, y, 0);
  const r = 3 * scale;
  fillCircle(fb, base[0] + 1, base[1] - r * 0.4, r + 0.5, [40, 80, 38]);
  fillCircle(fb, base[0], base[1] - r * 0.5, r, [58, 112, 54]);
  fillCircle(fb, base[0] - r * 0.35, base[1] - r * 0.9, r * 0.5, [84, 146, 72]);
}

export function drawFence(fb, project, x0, y0, x1, y1, opts = {}) {
  const ph = opts.height ?? 3;
  const rails = opts.rails ?? [1.4, 2.4];
  const post = opts.post ?? [150, 120, 84];
  const rail = opts.rail ?? [176, 146, 104];
  const len = Math.hypot(x1 - x0, y1 - y0);
  const n = Math.max(1, Math.round(len));
  for (const z of rails) {
    const a = project(x0, y0, z);
    const b = project(x1, y1, z);
    const a2 = project(x0, y0, z + 0.5);
    const b2 = project(x1, y1, z + 0.5);
    fillPoly(fb, [a, b, b2, a2], rail);
  }
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = x0 + (x1 - x0) * t;
    const py = y0 + (y1 - y0) * t;
    const b = project(px, py, 0);
    const tp = project(px, py, ph);
    strokeLine(fb, b[0], b[1], tp[0], tp[1], post);
  }
}

export function drawHedge(fb, project, x0, y0, x1, y1, h = 2, theme) {
  const a0 = project(x0, y0, 0);
  const b0 = project(x1, y1, 0);
  const a1 = project(x0, y0, h);
  const b1 = project(x1, y1, h);
  fillPoly(fb, [a0, b0, b1, a1], theme ? theme.fill([[52, 104, 50], [64, 120, 58]]) : dither([52, 104, 50], [64, 120, 58]));
  strokeLine(fb, a1[0], a1[1], b1[0], b1[1], [92, 150, 78]);
}

export function drawDriveway(fb, project, x0, x1, y0, y1, theme) {
  const q = [
    project(x0, y0),
    project(x1, y0),
    project(x1, y1),
    project(x0, y1),
  ];
  fillPoly(fb, q, theme ? theme.fill([[156, 156, 158], [144, 144, 146]]) : dither([156, 156, 158], [144, 144, 146]));
  strokePoly(fb, q, [120, 120, 122]);
}

export function drawPatio(fb, project, x0, y0, x1, y1, theme) {
  const q = [
    project(x0, y0),
    project(x1, y0),
    project(x1, y1),
    project(x0, y1),
  ];
  fillPoly(fb, q, theme ? theme.fill([[182, 176, 164], [168, 162, 150]]) : dither([182, 176, 164], [168, 162, 150]));
  strokePoly(fb, q, [140, 134, 122]);
}

export function drawPool(fb, project, x0, y0, x1, y1, theme) {
  const deck = [
    project(x0 - 0.7, y0 - 0.7),
    project(x1 + 0.7, y0 - 0.7),
    project(x1 + 0.7, y1 + 0.7),
    project(x0 - 0.7, y1 + 0.7),
  ];
  fillPoly(fb, deck, [208, 200, 182]);
  strokePoly(fb, deck, [152, 144, 126]);
  const water = [
    project(x0, y0),
    project(x1, y0),
    project(x1, y1),
    project(x0, y1),
  ];
  fillPoly(fb, water, theme ? theme.fill([[84, 166, 196], [96, 182, 208]]) : dither([84, 166, 196], [96, 182, 208]));
  strokePoly(fb, water, [60, 128, 156]);
  const midY = (y0 + y1) / 2;
  const r1 = project(x0 + 0.6, midY - 0.6);
  const r2 = project(x1 - 0.6, midY - 0.6);
  strokeLine(fb, r1[0], r1[1], r2[0], r2[1], [170, 220, 236]);
}

export function drawFountain(fb, project, x, y, r = 2.2, px = 1) {
  const base = project(x, y, 0);
  fillCircle(fb, base[0], base[1], r * px, [200, 192, 176]);
  fillCircle(fb, base[0], base[1], (r - 1) * px, [92, 172, 200]);
  fillCircle(fb, base[0] - px, base[1] - px, (r - 1.8) * px, [150, 210, 230]);
  fillPoly(
    fb,
    [
      [base[0] - px, base[1]],
      [base[0] + px, base[1]],
      [base[0] + px, base[1] - 5 * px],
      [base[0] - px, base[1] - 5 * px],
    ],
    [196, 188, 172],
  );
  fillCircle(fb, base[0], base[1] - 6 * px, 2 * px, [196, 214, 224]);
}

export function drawPortico(fb, project, cx, y, span, colH) {
  const half = span / 2;
  for (const side of [-1, 1]) {
    const px = cx + side * half;
    const hw = 0.4;
    fillPoly(
      fb,
      [
        project(px - hw, y + hw, 0),
        project(px + hw, y + hw, 0),
        project(px + hw, y + hw, colH),
        project(px - hw, y + hw, colH),
      ],
      [216, 208, 190],
    );
    fillPoly(
      fb,
      [
        project(px + hw, y - hw, 0),
        project(px + hw, y + hw, 0),
        project(px + hw, y + hw, colH),
        project(px + hw, y - hw, colH),
      ],
      [190, 182, 164],
    );
    fillPoly(
      fb,
      [
        project(px - hw, y - hw, colH),
        project(px + hw, y - hw, colH),
        project(px + hw, y + hw, colH),
        project(px - hw, y + hw, colH),
      ],
      [230, 222, 204],
    );
  }
  const capTop = colH + 1.2;
  const cq = [
    project(cx - half - 0.7, y - 0.7, capTop),
    project(cx + half + 0.7, y - 0.7, capTop),
    project(cx + half + 0.7, y + 0.7, capTop),
    project(cx - half - 0.7, y + 0.7, capTop),
  ];
  const cqf = [
    project(cx - half - 0.7, y + 0.7, capTop),
    project(cx + half + 0.7, y + 0.7, capTop),
    project(cx + half + 0.7, y + 0.7, colH),
    project(cx - half - 0.7, y + 0.7, colH),
  ];
  fillPoly(fb, cqf, [186, 178, 160]);
  fillPoly(fb, cq, [224, 216, 198]);
  strokePoly(fb, cq, [150, 142, 126]);
  const apex = project(cx, y + 0.7, capTop + 3.2);
  const ped = [
    project(cx - half - 0.7, y + 0.7, capTop),
    project(cx + half + 0.7, y + 0.7, capTop),
    apex,
  ];
  fillPoly(fb, ped, [212, 204, 186]);
  strokePoly(fb, ped, [150, 142, 126]);
}

export function drawMailbox(fb, project, x, y, px = 1) {
  const base = project(x, y, 0);
  fillPoly(
    fb,
    [
      [base[0], base[1]],
      [base[0] + px, base[1]],
      [base[0] + px, base[1] - 5 * px],
      [base[0], base[1] - 5 * px],
    ],
    [120, 92, 64],
  );
  fillPoly(
    fb,
    [
      [base[0] - 2 * px, base[1] - 5 * px],
      [base[0] + 2 * px, base[1] - 5 * px],
      [base[0] + 2 * px, base[1] - 8 * px],
      [base[0] - 2 * px, base[1] - 8 * px],
    ],
    [196, 196, 198],
  );
  strokeLine(fb, base[0] - 2 * px, base[1] - 8 * px, base[0] + 2 * px, base[1] - 8 * px, [140, 140, 142]);
}

const PROP_DRAWERS = {
  tree: (fb, project, p, theme) => drawTree(fb, project, p.x, p.y, (p.scale ?? 1) * (theme?.scale ?? 1)),
  bush: (fb, project, p, theme) => drawBush(fb, project, p.x, p.y, (p.scale ?? 1) * (theme?.scale ?? 1)),
  fence: (fb, project, p) => drawFence(fb, project, p.x0, p.y0, p.x1, p.y1, p),
  hedge: (fb, project, p, theme) => drawHedge(fb, project, p.x0, p.y0, p.x1, p.y1, p.h ?? 2, theme),
  driveway: (fb, project, p, theme) => drawDriveway(fb, project, p.x0, p.x1, p.y0, p.y1, theme),
  patio: (fb, project, p, theme) => drawPatio(fb, project, p.x0, p.y0, p.x1, p.y1, theme),
  pool: (fb, project, p, theme) => drawPool(fb, project, p.x0, p.y0, p.x1, p.y1, theme),
  fountain: (fb, project, p, theme) => drawFountain(fb, project, p.x, p.y, p.r ?? 2.2, theme?.scale ?? 1),
  portico: (fb, project, p) => drawPortico(fb, project, p.cx, p.y, p.span, p.colH),
  mailbox: (fb, project, p, theme) => drawMailbox(fb, project, p.x, p.y, theme?.scale ?? 1),
};

export function drawProp(fb, project, p, theme) {
  const fn = PROP_DRAWERS[p.type];
  if (fn) fn(fb, project, p, theme);
}
