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

export const NATURE = [
  asset({ id: "tree-small", name: "Small Tree", kind: "nature", type: "tree-small", w: 1.2, d: 1.2, height: 1.7 }),
  asset({ id: "tree-small-b", name: "Small Conical Tree", kind: "nature", type: "tree-small-b", w: 1.1, d: 1.1, height: 1.9 }),
  asset({ id: "tree-medium", name: "Medium Tree", kind: "nature", type: "tree-medium", w: 1.8, d: 1.8, height: 2.7 }),
  asset({ id: "tree-medium-b", name: "Columnar Tree", kind: "nature", type: "tree-medium-b", w: 1.4, d: 1.4, height: 3.2 }),
  asset({ id: "tree-large", name: "Large Tree", kind: "nature", type: "tree-large", w: 2.6, d: 2.6, height: 4.0 }),
  asset({ id: "tree-large-b", name: "Umbrella Tree", kind: "nature", type: "tree-large-b", w: 4.0, d: 4.0, height: 3.7 }),
  asset({ id: "tree-conifer", name: "Conifer", kind: "nature", type: "tree-conifer", w: 2.0, d: 2.0, height: 4.3 }),
  asset({ id: "tree-conifer-b", name: "Cypress", kind: "nature", type: "tree-conifer-b", w: 1.2, d: 1.2, height: 4.5 }),
  asset({ id: "tree-blossom", name: "Cherry Blossom", kind: "nature", type: "tree-blossom", w: 2.2, d: 2.2, height: 2.9 }),
  asset({ id: "tree-blossom-b", name: "Spreading Blossom", kind: "nature", type: "tree-blossom-b", w: 2.8, d: 2.8, height: 2.4 }),
  asset({ id: "tree-blossom-white", name: "White Blossom", kind: "nature", type: "tree-blossom-white", w: 2.0, d: 2.0, height: 2.8 }),
  asset({ id: "tree-blossom-white-b", name: "Columnar Blossom", kind: "nature", type: "tree-blossom-white-b", w: 1.4, d: 1.4, height: 3.3 }),
  asset({ id: "bush", name: "Bush", kind: "nature", type: "bush", w: 0.8, d: 0.8, height: 0.6 }),
  asset({ id: "grass-patch", name: "Grass Patch", kind: "nature", type: "grass-patch", w: 0.6, d: 0.6, height: 0.3 }),
  asset({ id: "weed-cluster", name: "Weed Cluster", kind: "nature", type: "weed-cluster", w: 0.7, d: 0.7, height: 0.9 }),
];
