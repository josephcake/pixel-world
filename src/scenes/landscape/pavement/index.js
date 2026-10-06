import { fillPoly, strokeLine, setLineWidth } from "../../../engine/framebuffer.js";
import { makeProjector } from "../../../engine/building/iso.js";
import { footprint as gridFootprint } from "../../../engine/building/grid.js";
import { PIXEL_THEME } from "../../../engine/building/themes.js";

// Neutral paved surface — walkable for pedestrians, cars, bikes, everything.
// No road markings; a subtle paver joint grid that tiles seamlessly.
const PAVING = [[150, 150, 148], [162, 162, 160]];
const JOINT = [124, 124, 122];

const VIEW = 16;

function viewScale(theme) {
  return VIEW * (theme?.aaFactor ?? 1);
}

function drawPavement(fb, spec, theme, frame) {
  let project;
  let ox = 0;
  let oy = 0;
  if (frame) {
    project = frame.project;
    ox = frame.ox ?? 0;
    oy = frame.oy ?? 0;
  } else {
    ({ project } = makeProjector(spec.w, spec.d, 0.1, 0.6, viewScale(theme), 0.5));
  }
  setLineWidth(theme.lineWidth ?? 1);
  const P = (x, y, z = 0) => project(x + ox, y + oy, z);
  const W = spec.w;
  const D = spec.d;

  fillPoly(fb, [P(0, 0), P(W, 0), P(W, D), P(0, D)], theme.fill(spec.paving ?? PAVING));

  if (spec.joints !== false) {
    const joint = theme.fill(spec.joint ?? JOINT);
    setLineWidth(Math.max(1, theme.aaFactor ?? 1));
    for (let x = 0.5; x < W; x += 0.5) {
      strokeLine(fb, P(x, 0)[0], P(x, 0)[1], P(x, D)[0], P(x, D)[1], joint);
    }
    for (let y = 0.5; y < D; y += 0.5) {
      strokeLine(fb, P(0, y)[0], P(0, y)[1], P(W, y)[0], P(W, y)[1], joint);
    }
  }
  setLineWidth(theme.lineWidth ?? 1);
}

function pavementItem(spec) {
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
    draw: (fb, theme = PIXEL_THEME, frame = null) => drawPavement(fb, spec, theme, frame),
  };
}

export const PAVEMENT = [
  pavementItem({ id: "pavement", name: "Pavement", w: 2, d: 2 }),
];

// 1×1 plain asphalt, no joints — used by blueprint generators to fill empty space.
export const PAVEMENT_FILL = [
  pavementItem({ id: "pavement-fill", name: "Pavement", w: 1, d: 1, joints: false }),
];
