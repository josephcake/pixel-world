import { BUILD_SPECS } from "./specs.js";
import { makeBuilding } from "../../../engine/building/scene.js";

export const HOUSES = BUILD_SPECS.map(makeBuilding);

export * from "../../../engine/building/scene.js";
export {
  makeIllustrationFamilyHouse,
  ILLUSTRATION_HOUSES,
  DEFAULT_HOUSE_PALETTE,
  PALETTE_PRESETS,
} from "./illustration.js";
