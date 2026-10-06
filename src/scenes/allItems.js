import { HOUSES } from "./residential/house/index.js";
import { WAREHOUSES } from "./commercial/index.js";
import { LOGISTICS } from "./logistics/index.js";
import { NATURE } from "./nature/index.js";
import { VEHICLES } from "./vehicles/index.js";
import { PROPS } from "./props/index.js";
import { ROADS } from "./roads/index.js";

export const ALL_GROUPS = [
  { id: "residential", name: "Residential", items: HOUSES },
  { id: "commercial", name: "Commercial", items: WAREHOUSES },
  { id: "roads", name: "Road System", items: ROADS },
  { id: "logistics", name: "Logistics", items: LOGISTICS },
  { id: "vehicles", name: "Vehicles", items: VEHICLES },
  { id: "nature", name: "Nature", items: NATURE },
  { id: "props", name: "Props", items: PROPS },
];

export const ALL_ITEMS = ALL_GROUPS.flatMap((g) => g.items);
