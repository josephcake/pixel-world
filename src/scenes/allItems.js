import { HOUSES } from "./residential/house/index.js";
import { WAREHOUSES } from "./commercial/index.js";
import { LANDSCAPE } from "./landscape/index.js";

export const ALL_GROUPS = [
  { id: "residential", name: "Residential", items: HOUSES },
  { id: "commercial", name: "Commercial", items: WAREHOUSES },
  { id: "landscape", name: "Landscape", items: LANDSCAPE },
];

export const ALL_ITEMS = ALL_GROUPS.flatMap((g) => g.items);
