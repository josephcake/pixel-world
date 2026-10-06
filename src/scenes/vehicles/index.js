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

const v = (id, name, type, w, d, height, color) => asset({ id, name, kind: "vehicle", type, w, d, height, color });

export const VEHICLES = [
  v("sedan", "Sedan", "sedan", 3.4, 1.3, 1.16, [200, 70, 70]),
  v("compact", "Compact Car", "compact", 2.4, 1.2, 1.2, [230, 190, 60]),
  v("pickup", "Pickup Truck", "pickup", 3.8, 1.5, 1.7, [70, 110, 90]),
  v("minivan", "Minivan", "minivan", 3.8, 1.5, 1.75, [180, 180, 190]),
  v("police-car", "Police Car", "police-car", 3.4, 1.3, 1.35, [236, 236, 240]),
  v("ambulance", "Ambulance", "ambulance", 4.2, 1.6, 2.1, [240, 240, 242]),
  v("fire-engine", "Fire Engine", "fire-engine", 4.8, 1.7, 2.4, [200, 60, 50]),
  v("taxi", "Taxi", "taxi", 3.4, 1.3, 1.34, [240, 200, 60]),
  v("delivery-van", "Delivery Van", "delivery-van", 3.2, 1.4, 1.8, [225, 225, 230]),
  v("motorcycle", "Motorcycle", "motorcycle", 1.7, 0.45, 1.0, [120, 60, 60]),
];
