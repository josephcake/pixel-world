import { writeFileSync } from "node:fs";
import {
  createFramebuffer,
  clearFramebuffer,
  blit,
  setPixel,
} from "../src/engine/framebuffer.js";
import {
  renderGallery,
  renderHouse,
  composeItems,
  THEMES,
  BG,
} from "../src/engine/building/scene.js";
import { HOUSES } from "../src/scenes/residential/house/index.js";
import { WAREHOUSES } from "../src/scenes/commercial/index.js";
import { ROADS, LANDSCAPE } from "../src/scenes/landscape/index.js";
import { encodePNG } from "./png.mjs";

const out = process.argv[2] || "gallery.png";
const scale = Number(process.argv[3] || 3);
const cols = Number(process.argv[4] || 3);
const start = Number(process.argv[5] || 0);
const count = Number(process.argv[6] || 0);
const theme = THEMES[process.argv[7] || "pixel"] || THEMES.pixel;
const raw = process.argv[8] === "raw";
const source = process.argv[9] || "residential";

const all =
  source === "commercial"
    ? WAREHOUSES
    : source === "landscape"
      ? LANDSCAPE
      : HOUSES;
const items = count > 0 ? all.slice(start, start + count) : all;

let fb;
if (source === "roadnet") {
  const roadH = ROADS[0];
  const roadV = ROADS[1];
  const cross = ROADS[2];
  const turnFR = ROADS.find((r) => r.id === "turn-front-right");
  const placements = [
    { item: roadH, x: 0, y: 2 },
    { item: roadH, x: 2, y: 2 },
    { item: cross, x: 4, y: 2 },
    { item: roadH, x: 6, y: 2 },
    { item: roadV, x: 4, y: 0 },
    { item: roadH, x: 0, y: 6 },
    { item: turnFR, x: 2, y: 6 },
    { item: roadV, x: 2, y: 8 },
  ];
  fb = composeItems(placements, theme);
} else if (source === "compose") {
  const find = (id) => HOUSES.find((h) => h.id === id);
  const family = find("family");
  const tower = find("tower");
  const roadH = ROADS[0];
  const roadV = ROADS[1];
  const cross = ROADS[2];
  const placements = [
    { item: family, x: 0, y: 0 },
    { item: roadV, x: 4, y: 0 },
    { item: tower, x: 6, y: 0 },
    { item: roadH, x: 0, y: 2 },
    { item: roadH, x: 2, y: 2 },
    { item: cross, x: 4, y: 2 },
    { item: WAREHOUSES[0], x: 0, y: 4 },
  ];
  fb = composeItems(placements, theme);
} else {
  fb = raw ? renderHouse(items[0], theme) : renderGallery(items, cols, theme);
}

const bg = createFramebuffer(fb.width, fb.height);
clearFramebuffer(bg, raw ? [34, 44, 66] : BG);
blit(bg, fb, 0, 0);

const smooth = theme.id !== "pixel";
const big = createFramebuffer(fb.width * scale, fb.height * scale);
const at = (x, y) => {
  const cx = Math.min(Math.max(x, 0), bg.width - 1);
  const cy = Math.min(Math.max(y, 0), bg.height - 1);
  const i = (cy * bg.width + cx) * 4;
  return [bg.data[i], bg.data[i + 1], bg.data[i + 2]];
};
for (let y = 0; y < big.height; y++) {
  for (let x = 0; x < big.width; x++) {
    if (!smooth) {
      setPixel(big, x, y, at((x / scale) | 0, (y / scale) | 0));
      continue;
    }
    const fx = x / scale - 0.5;
    const fy = y / scale - 0.5;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const c00 = at(x0, y0);
    const c10 = at(x0 + 1, y0);
    const c01 = at(x0, y0 + 1);
    const c11 = at(x0 + 1, y0 + 1);
    const mix = (a, b, t) => a + (b - a) * t;
    const col = [0, 1, 2].map((k) =>
      mix(mix(c00[k], c10[k], tx), mix(c01[k], c11[k], tx), ty),
    );
    setPixel(big, x, y, col);
  }
}

writeFileSync(out, encodePNG(big.data, big.width, big.height));
console.log(`wrote ${out} (${big.width}x${big.height}), theme=${theme.id}, ${source}`);
