import { WAREHOUSE_SPECS } from "./specs.js";
import { makeBuilding } from "../../../engine/building/scene.js";

export const WAREHOUSES = WAREHOUSE_SPECS.map(makeBuilding);
