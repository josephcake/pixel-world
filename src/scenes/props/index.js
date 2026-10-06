import { footprint as gridFootprint } from "../../engine/building/grid.js";

function asset(spec) {
  return {
    id: spec.id,
    name: spec.name,
    spec,
    footprint: { w: spec.w, d: spec.d },
    grid: gridFootprint(spec.w, spec.d),
    height: spec.height,
    measure: () => ({ width: spec.w * 2, height: spec.height * 2 }),
    draw: () => {},
  };
}

const p = (id, name, type, w, d, height, extra = {}) =>
  asset({ id, name, kind: "prop", type, w, d, height, ...extra });

export const PROPS = [
  p("fire-hydrant", "Fire Hydrant", "fire-hydrant", 0.5, 0.5, 0.7, { color: [200, 70, 55] }),
  p("mailbox", "Mailbox", "mailbox", 0.6, 0.6, 1.55, { color2: [70, 96, 130] }),
  p("traffic-light", "Traffic Light", "traffic-light", 0.8, 0.8, 4.5),
  p("street-light", "Street Light", "street-light", 1.3, 0.8, 6.0),
  p("trash-can", "Trash Can", "trash-can", 0.7, 0.7, 1.2, { color2: [70, 110, 90] }),
];
