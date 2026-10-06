export { ROADS } from "./road/index.js";
export { PAVEMENT } from "./pavement/index.js";
export { PARKING } from "./parking/index.js";

import { PAVEMENT } from "./pavement/index.js";
import { PARKING } from "./parking/index.js";

// The old 2D road tiles (ROADS) are superseded by the modular 3D Road System
// (src/scenes/roads). They remain exported above only for the blueprint
// generator; only pavement + parking are catalogued now.
export const LANDSCAPE = [...PAVEMENT, ...PARKING];
