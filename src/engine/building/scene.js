import {
  createFramebuffer,
  clearFramebuffer,
  downsample,
  blit,
  strokeLine,
  setLineWidth,
} from "../framebuffer.js";
import {
  drawBuilding,
  measureBuilding,
  buildingFootprint,
  buildingHeight,
} from "./builder.js";
import { makeProjector, U, V, Z } from "./iso.js";
import { footprint as gridFootprint, TILE } from "./grid.js";
import { DEFAULT_THEME } from "./themes.js";

export function themeScale(t) {
  if (typeof t === "number") return t;
  return t?.scale ?? 1;
}

export function makeBuilding(spec) {
  const fp = buildingFootprint(spec);
  return {
    id: spec.id,
    name: spec.name,
    spec,
    footprint: fp,
    grid: gridFootprint(fp.w, fp.d),
    height: buildingHeight(spec),
    measure: (theme = DEFAULT_THEME) => measureBuilding(spec, themeScale(theme)),
    draw: (fb, theme, frame) => drawBuilding(fb, spec, theme, frame),
  };
}

export function cameraProject(scale, camera, width, height) {
  const u = U * scale;
  const v = V * scale;
  const z = Z * scale;
  const ox = width / 2 - (camera.x - camera.y) * u;
  const oy = height / 2 - (camera.x + camera.y) * v;
  const project = (x, y, zz = 0) => [ox + (x - y) * u, oy + (x + y) * v - zz * z];
  return { u, v, z, ox, oy, project };
}

export function rotatedFootprint(f, rot) {
  const r = ((rot % 4) + 4) % 4;
  return r % 2 === 0 ? { w: f.w, d: f.d } : { w: f.d, d: f.w };
}

// Ground-height items (roads, pavement, parking) always render under 3D objects.
function layerOf(p) {
  return (p.item.height ?? 0) > 0 ? 1 : 0;
}

export function sortByDepth(list) {
  return [...list].sort((a, b) => {
    const la = layerOf(a);
    const lb = layerOf(b);
    if (la !== lb) return la - lb;
    return a.x + a.y - (b.x + b.y);
  });
}

function rotateProject(project, f, rot, ox, oy) {
  const r = ((rot % 4) + 4) % 4;
  if (r === 0) return (x, y, z = 0) => project(x + ox, y + oy, z);
  // "side" view = horizontally mirrored (reverse the image) → swap x/y.
  if (r === 1) return (x, y, z = 0) => project(ox + y, oy + x, z);
  if (r === 2) return (x, y, z = 0) => project(ox + (f.w - x), oy + (f.d - y), z);
  return (x, y, z = 0) => project(ox + (f.d - y), oy + x, z);
}

export function renderViewport(placements, theme = DEFAULT_THEME, opts = {}) {
  const { camera, width, height, scale, grid } = opts;
  const { u, v, ox, oy, project } = cameraProject(scale, camera, width, height);
  const fb = createFramebuffer(width, height);
  if (theme.background) clearFramebuffer(fb, theme.background);
  else clearFramebuffer(fb, [0, 0, 0], 0);

  const corners = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ].map(([sx, sy]) => {
    const A = (sx - ox) / u;
    const B = (sy - oy) / v;
    return [(A + B) / 2, (B - A) / 2];
  });
  const cxs = corners.map((c) => c[0]);
  const cys = corners.map((c) => c[1]);
  const x0 = Math.floor(Math.min(...cxs)) - 1;
  const x1 = Math.ceil(Math.max(...cxs)) + 1;
  const y0 = Math.floor(Math.min(...cys)) - 1;
  const y1 = Math.ceil(Math.max(...cys)) + 1;

  if (grid) {
    const col = grid.color ?? [198, 202, 210];
    setLineWidth(grid.lineWidth ?? 1);
    const stepX = Math.max(1, Math.ceil((x1 - x0) / 400));
    const stepY = Math.max(1, Math.ceil((y1 - y0) / 400));
    for (let x = Math.ceil(x0 / stepX) * stepX; x <= x1; x += stepX) {
      strokeLine(fb, project(x, y0)[0], project(x, y0)[1], project(x, y1)[0], project(x, y1)[1], col);
    }
    for (let y = Math.ceil(y0 / stepY) * stepY; y <= y1; y += stepY) {
      strokeLine(fb, project(x0, y)[0], project(x0, y)[1], project(x1, y)[0], project(x1, y)[1], col);
    }
    setLineWidth(theme.lineWidth ?? 1);
  }

  const visible = sortByDepth(
    placements.filter((p) => {
      const f = p.item.footprint ?? { w: 1, d: 1 };
      const rf = rotatedFootprint(f, p.rotation);
      return p.x < x1 && p.x + rf.w > x0 && p.y < y1 && p.y + rf.d > y0;
    }),
  );

  for (const p of visible) {
    const f = p.item.footprint ?? { w: 1, d: 1 };
    const rot = p.rotation || 0;
    p.item.draw(fb, theme, {
      project: rotateProject(project, f, rot, p.x * TILE, p.y * TILE),
      ox: 0,
      oy: 0,
      plotMargin: 0,
    });
  }
  return fb;
}

export function composeItems(placements, theme = DEFAULT_THEME, opts = {}) {
  const scale = opts.scale ?? theme.scale ?? 1;
  const pm = opts.plotMargin ?? 0;
  let maxX = opts.size?.w ?? 0;
  let maxY = opts.size?.h ?? 0;
  let maxH = opts.totalH ?? 0;
  for (const p of placements) {
    const f = p.item.footprint ?? { w: 1, d: 1 };
    const rf = rotatedFootprint(f, p.rotation);
    maxX = Math.max(maxX, p.x * TILE + rf.w);
    maxY = Math.max(maxY, p.y * TILE + rf.d);
    if (opts.totalH == null) maxH = Math.max(maxH, p.item.height ?? 0);
  }
  const { project, width, height } = makeProjector(
    maxX,
    maxY,
    pm,
    maxH + (opts.extraSky ?? 0),
    scale,
  );
  const fb = createFramebuffer(width, height);
  if (theme.background) clearFramebuffer(fb, theme.background);
  else clearFramebuffer(fb, [0, 0, 0], 0);
  if (opts.grid) {
    const g = opts.grid;
    const col = g.color ?? [198, 202, 210];
    setLineWidth(g.lineWidth ?? 1);
    for (let x = 0; x <= g.w; x++) {
      strokeLine(fb, project(x, 0)[0], project(x, 0)[1], project(x, g.h)[0], project(x, g.h)[1], col);
    }
    for (let y = 0; y <= g.h; y++) {
      strokeLine(fb, project(0, y)[0], project(0, y)[1], project(g.w, y)[0], project(g.w, y)[1], col);
    }
    setLineWidth(theme.lineWidth ?? 1);
  }
  const sorted = sortByDepth(placements);
  for (const p of sorted) {
    const f = p.item.footprint ?? { w: 1, d: 1 };
    p.item.draw(fb, theme, {
      project: rotateProject(project, f, p.rotation || 0, p.x * TILE, p.y * TILE),
      ox: 0,
      oy: 0,
      plotMargin: pm,
    });
  }
  return fb;
}

export function renderHouse(house, theme = DEFAULT_THEME) {
  const scale = themeScale(theme);
  const { width, height } = house.measure(theme);
  const fb = createFramebuffer(width, height);
  if (theme.background) clearFramebuffer(fb, theme.background);
  else clearFramebuffer(fb, [0, 0, 0], 0);
  house.draw(fb, theme);
  if (house.noDownsample) return fb;
  if (theme.aaFactor && theme.aaFactor > 1) return downsample(fb, theme.aaFactor);
  return theme.downsample === false ? fb : downsample(fb, scale);
}

export const CELL = 96;
export const PAD = 8;

export function outputDivisor(theme) {
  if (theme.aaFactor && theme.aaFactor > 1) return theme.aaFactor;
  if (theme.downsample === false) return 1;
  return theme.scale ?? 1;
}

export function renderedSize(item, theme = DEFAULT_THEME) {
  const d = item.measure(theme);
  const div = item.noDownsample ? 1 : outputDivisor(theme);
  return { width: Math.ceil(d.width / div), height: Math.ceil(d.height / div) };
}

export function cellSize(items = [], theme = DEFAULT_THEME) {
  let max = 0;
  for (const item of items) {
    const d = renderedSize(item, theme);
    max = Math.max(max, d.width, d.height);
  }
  return Math.max(CELL, Math.round(max * 1.1));
}

export function renderSquare(item, theme, size) {
  const img = renderHouse(item, theme);
  const fb = createFramebuffer(size, size);
  if (theme.background) clearFramebuffer(fb, theme.background);
  else clearFramebuffer(fb, [0, 0, 0], 0);
  blit(fb, img, Math.floor((size - img.width) / 2), Math.floor((size - img.height) / 2));
  return fb;
}

export function renderGallery(items = [], cols = 3, theme = DEFAULT_THEME) {
  const size = cellSize(items, theme);
  const rows = Math.ceil(items.length / cols);
  const fb = createFramebuffer(PAD + cols * (size + PAD), PAD + rows * (size + PAD));
  clearFramebuffer(fb, [30, 38, 56]);
  items.forEach((item, i) => {
    const col = i % cols;
    const row = (i / cols) | 0;
    const cell = renderSquare(item, theme, size);
    blit(fb, cell, PAD + col * (size + PAD), PAD + row * (size + PAD));
  });
  return fb;
}

export { THEMES, PIXEL_THEME, ARCHITECTURAL_THEME, ILLUSTRATION_THEME, DEFAULT_THEME } from "./themes.js";
export { BG } from "./iso.js";
