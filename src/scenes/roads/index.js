import { footprint as gridFootprint } from "../../engine/building/grid.js";

const TILE = 4;

function road(id, name, roadType) {
  const spec = { id, name, kind: "road", roadType, w: TILE, d: TILE, height: 0.2 };
  return {
    id,
    name,
    spec,
    footprint: { w: TILE, d: TILE },
    grid: gridFootprint(TILE, TILE),
    height: 0.2,
    measure: () => ({ width: TILE * 2, height: TILE * 2 }),
    draw: () => {},
  };
}

export const ROADS = [
  road("road-straight-z", "Straight (Vertical)", "straight-z"),
  road("road-straight-x", "Straight (Horizontal)", "straight-x"),
  road("road-corner-bl", "Corner Bottom-Left", "corner-bl"),
  road("road-corner-br", "Corner Bottom-Right", "corner-br"),
  road("road-corner-tl", "Corner Top-Left", "corner-tl"),
  road("road-corner-tr", "Corner Top-Right", "corner-tr"),
  road("road-cross", "Crossroad", "cross"),
  road("road-tee-z", "T-Junction (Vertical)", "tee-z"),
  road("road-tee-x", "T-Junction (Horizontal)", "tee-x"),
  road("road-intersection", "Intersection (Turning)", "intersection"),
  road("road-staggered", "Offset Intersection", "staggered"),
  road("road-dead-end", "Dead End", "dead-end"),
  road("road-y", "Y-Junction", "y-junction"),
  road("road-roundabout", "Roundabout", "roundabout"),
  road("road-transition", "Road Transition", "transition"),
];
