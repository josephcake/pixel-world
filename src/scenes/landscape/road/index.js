import { fillPoly, strokePoly, strokeLine, setLineWidth } from "../../../engine/framebuffer.js";
import { makeProjector } from "../../../engine/building/iso.js";
import { footprint as gridFootprint } from "../../../engine/building/grid.js";
import { PIXEL_THEME } from "../../../engine/building/themes.js";

const ASPHALT = [[70, 74, 80], [80, 84, 90]];
const SIDEWALK = [[202, 198, 190], [212, 208, 200]];
const CURB = [166, 168, 172];
const LINE = [226, 212, 118];
const JOINT = [184, 180, 172];
const EDGE = [56, 60, 66];

const VIEW = 24;
const SW = 0.42;
const CURB_W = 0.1;
const LINE_W = 0.05;

const EDGES = ["N", "E", "S", "W"];

function viewScale(theme) {
  return VIEW * (theme?.aaFactor ?? 1);
}

function dashes(len) {
  const out = [];
  for (let k = 0; k * 0.5 < len; k++) {
    const a = k * 0.5 + 0.06;
    const b = Math.min(len, k * 0.5 + 0.3);
    if (a < len) out.push([a, b]);
  }
  return out;
}

function drawRoad(fb, spec, theme, frame) {
  let project;
  let ox = 0;
  let oy = 0;
  if (frame) {
    project = frame.project;
    ox = frame.ox ?? 0;
    oy = frame.oy ?? 0;
    setLineWidth(theme.lineWidth ?? 1);
  } else {
    ({ project } = makeProjector(spec.w, spec.d, 0.1, 0.6, viewScale(theme), 0.5));
    setLineWidth(theme.lineWidth ?? 1);
  }
  const P = (x, y, z = 0) => project(x + ox, y + oy, z);
  const W = spec.w;
  const D = spec.d;
  const asphalt = theme.fill(spec.asphalt ?? ASPHALT);
  const sidewalk = theme.fill(spec.sidewalk ?? SIDEWALK);
  const curb = theme.fill(spec.curb ?? CURB);
  const line = theme.fill(spec.line ?? LINE);
  const joint = theme.fill(spec.joint ?? JOINT);

  const cell = [P(0, 0), P(W, 0), P(W, D), P(0, D)];
  fillPoly(fb, cell, asphalt);
  if (!frame) strokePoly(fb, cell, theme.fill(spec.edge ?? EDGE));

  const strip = (x0, y0, x1, y1, color) =>
    fillPoly(fb, [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], color);

  const jw = Math.max(1, Math.round((theme.lineWidth ?? 1) / 2));
  const vJoints = () => {
    setLineWidth(jw);
    for (let x = 0; x <= W + 0.001; x += 0.5) {
      strokeLine(fb, P(x, 0.04)[0], P(x, 0.04)[1], P(x, SW - 0.04)[0], P(x, SW - 0.04)[1], joint);
      strokeLine(fb, P(x, D - SW + 0.04)[0], P(x, D - SW + 0.04)[1], P(x, D - 0.04)[0], P(x, D - 0.04)[1], joint);
    }
  };
  const hJoints = () => {
    setLineWidth(jw);
    for (let y = 0; y <= D + 0.001; y += 0.5) {
      strokeLine(fb, P(0.04, y)[0], P(0.04, y)[1], P(SW - 0.04, y)[0], P(SW - 0.04, y)[1], joint);
      strokeLine(fb, P(W - SW + 0.04, y)[0], P(W - SW + 0.04, y)[1], P(W - 0.04, y)[0], P(W - 0.04, y)[1], joint);
    }
  };
  const sideBand = (edge) => {
    if (edge === "N") {
      strip(0, 0, W, SW, sidewalk);
      strip(0, SW, W, SW + CURB_W, curb);
    } else if (edge === "S") {
      strip(0, D - SW, W, D, sidewalk);
      strip(0, D - SW - CURB_W, W, D - SW, curb);
    } else if (edge === "W") {
      strip(0, 0, SW, D, sidewalk);
      strip(SW, 0, SW + CURB_W, D, curb);
    } else {
      strip(W - SW, 0, W, D, sidewalk);
      strip(W - SW - CURB_W, 0, W - SW, D, curb);
    }
  };

  if (spec.kind === "h") {
    sideBand("N");
    sideBand("S");
    vJoints();
    for (const [a, b] of dashes(W)) strip(a, D / 2 - LINE_W, b, D / 2 + LINE_W, line);
  } else if (spec.kind === "v") {
    sideBand("W");
    sideBand("E");
    hJoints();
    for (const [a, b] of dashes(D)) strip(W / 2 - LINE_W, a, W / 2 + LINE_W, b, line);
  } else if (spec.kind === "turn") {
    const open = spec.open;
    for (const e of EDGES) if (!open.includes(e)) sideBand(e);
    const cx = open.includes("W") ? 0 : W;
    const cy = open.includes("N") ? 0 : D;
    strip(cx === 0 ? 0 : W - SW, cy === 0 ? 0 : D - SW, cx === 0 ? SW : W, cy === 0 ? SW : D, sidewalk);
    const [a0, a1] = spec.arc;
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = a0 + (a1 - a0) * (i / 10);
      pts.push([cx + 1.1 * Math.cos(a), cy + 1.1 * Math.sin(a)]);
    }
    for (let i = 10; i >= 0; i--) {
      const a = a0 + (a1 - a0) * (i / 10);
      pts.push([cx + 0.9 * Math.cos(a), cy + 0.9 * Math.sin(a)]);
    }
    fillPoly(fb, pts.map((p) => P(p[0], p[1])), line);
  } else {
    const s = Math.min(W, D);
    const c = SW;
    const arm = 0.3 * s;
    strip(0, 0, c, c, curb);
    strip(W - c, 0, W, c, curb);
    strip(0, D - c, c, D, curb);
    strip(W - c, D - c, W, D, curb);
    const m = s / 2;
    strip(m - 0.08, m - arm, m + 0.08, m + arm, line);
    strip(m - arm, m - 0.08, m + arm, m + 0.08, line);
  }
}

function roadItem(spec) {
  return {
    id: spec.id,
    name: spec.name,
    spec,
    footprint: { w: spec.w, d: spec.d },
    grid: gridFootprint(spec.w, spec.d),
    height: 0,
    measure(theme = PIXEL_THEME) {
      const p = makeProjector(spec.w, spec.d, 0.1, 0.6, viewScale(theme), 0.5);
      return { width: p.width, height: p.height };
    },
    draw: (fb, theme = PIXEL_THEME, frame = null) => drawRoad(fb, spec, theme, frame),
  };
}

export const ROADS = [
  roadItem({ id: "road-front", name: "Road (Front)", kind: "h", w: 2, d: 2 }),
  roadItem({ id: "road-side", name: "Road (Side)", kind: "v", w: 2, d: 2 }),
  roadItem({ id: "road-cross", name: "Crossroad", kind: "cross", w: 2, d: 2 }),
  roadItem({ id: "turn-front-left", name: "Turn (Front→Left)", kind: "turn", open: ["W", "N"], arc: [Math.PI / 2, 0], w: 2, d: 2 }),
  roadItem({ id: "turn-front-right", name: "Turn (Front→Right)", kind: "turn", open: ["W", "S"], arc: [-Math.PI / 2, 0], w: 2, d: 2 }),
  roadItem({ id: "turn-side-left", name: "Turn (Side→Left)", kind: "turn", open: ["N", "E"], arc: [Math.PI, Math.PI / 2], w: 2, d: 2 }),
  roadItem({ id: "turn-side-right", name: "Turn (Side→Right)", kind: "turn", open: ["S", "E"], arc: [Math.PI, Math.PI * 1.5], w: 2, d: 2 }),
];
