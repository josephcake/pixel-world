import { HOUSES } from "./residential/house/index.js";
import { WAREHOUSES } from "./commercial/index.js";
import { LANDSCAPE } from "./landscape/index.js";

export const COLLECTIONS = {
  residential: { id: "residential", name: "Residential", items: HOUSES },
  commercial: { id: "commercial", name: "Commercial", items: WAREHOUSES },
  landscape: { id: "landscape", name: "Landscape", items: LANDSCAPE },
};

export const COLLECTION_LIST = [
  COLLECTIONS.residential,
  COLLECTIONS.commercial,
  COLLECTIONS.landscape,
];
