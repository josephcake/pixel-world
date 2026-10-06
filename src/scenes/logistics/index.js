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

export const LOGISTICS = [
  asset({
    id: "semi-truck",
    name: "Semi Truck",
    type: "semi-truck",
    w: 4.8,
    d: 0.9,
    height: 1.55,
    cabColor: [58, 110, 168],
    boxColor: [228, 231, 235],
  }),
  asset({
    id: "box-truck",
    name: "Box Truck",
    type: "box-truck",
    w: 2.9,
    d: 0.9,
    height: 1.35,
    cabColor: [60, 160, 150],
    boxColor: [232, 234, 236],
  }),
  asset({
    id: "container",
    name: "Shipping Container",
    type: "container",
    w: 3.0,
    d: 1.0,
    height: 1.15,
    color: [52, 110, 170],
  }),
  asset({ id: "pallet", name: "Pallet", type: "pallet", w: 1.2, d: 1.0, height: 0.16, wood: [182, 138, 86] }),
  asset({ id: "crate", name: "Crate", type: "crate", w: 1.0, d: 0.9, height: 0.9, wood: [170, 122, 72] }),
  asset({ id: "cardboard-box-sm", name: "Cardboard Box (S)", type: "cardboard-box", w: 0.5, d: 0.5, height: 0.5, color: [196, 150, 100] }),
  asset({ id: "cardboard-box-lg", name: "Cardboard Box (L)", type: "cardboard-box", w: 0.8, d: 0.8, height: 0.7, color: [196, 150, 100] }),
  asset({ id: "forklift", name: "Forklift", type: "forklift", w: 2.2, d: 1.0, height: 1.9, color: [240, 178, 40] }),
  asset({ id: "reach-truck", name: "Reach Truck", type: "reach-truck", w: 1.9, d: 0.95, height: 2.6, color: [232, 120, 52] }),
  asset({ id: "yard-tractor", name: "Yard Tractor", type: "yard-tractor", w: 2.8, d: 1.1, height: 1.5, color: [60, 150, 120] }),
  asset({ id: "tower-crane", name: "Tower Crane", type: "tower-crane", w: 8, d: 1.6, height: 8, color: [236, 182, 60] }),
];
