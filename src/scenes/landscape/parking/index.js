import { fillPoly, strokeLine, setLineWidth } from "../../../engine/framebuffer.js";
import { makeProjector } from "../../../engine/building/iso.js";
import { footprint as gridFootprint } from "../../../engine/building/grid.js";
import { PIXEL_THEME } from "../../../engine/building/themes.js";

// A single parking stall: 1 tile wide × 2 deep, with painted "U" markings.
const ASPHALT = [[64, 68, 74], [74, 78, 84]];
const PAINT = [232, 232, 226];

const VIEW = 16;

function viewScale(theme) {
  return VIEW * (theme?.aaFactor ?? 1);
}

function drawParking(fb, spec, theme, frame) {
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

  fillPoly(fb, [P(0, 0), P(W, 0), P(W, D), P(0, D)], theme.fill(spec.asphalt ?? ASPHALT));

  const paint = theme.neon ? theme.neonEdge : theme.fill(spec.paint ?? PAINT);
  setLineWidth(Math.max(1, Math.round((theme.aaFactor ?? 1) * 1.5)));
  const inset = 0.14;
  strokeLine(fb, P(inset, inset)[0], P(inset, inset)[1], P(inset, D - inset)[0], P(inset, D - inset)[1], paint);
  strokeLine(fb, P(W - inset, inset)[0], P(W - inset, inset)[1], P(W - inset, D - inset)[0], P(W - inset, D - inset)[1], paint);
  strokeLine(fb, P(inset, inset)[0], P(inset, inset)[1], P(W - inset, inset)[0], P(W - inset, inset)[1], paint);
  setLineWidth(theme.lineWidth ?? 1);
}

function parkingItem(spec) {
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
    draw: (fb, theme = PIXEL_THEME, frame = null) => drawParking(fb, spec, theme, frame),
  };
}

export const PARKING = [
  parkingItem({ id: "parking-spot", name: "Parking Spot", w: 1, d: 2 }),
];
