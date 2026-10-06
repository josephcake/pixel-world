export { ROADS } from "./road/index.js";
export { PAVEMENT } from "./pavement/index.js";
export { PARKING } from "./parking/index.js";

import { ROADS } from "./road/index.js";
import { PAVEMENT } from "./pavement/index.js";
import { PARKING } from "./parking/index.js";

export const LANDSCAPE = [...ROADS, ...PAVEMENT, ...PARKING];
