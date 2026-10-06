export const TILE = 1;

export const MODULES = [1, 2, 4, 6, 8, 12];

export const SIZE_CLASSES = [
  { name: "small", max: 2 },
  { name: "medium", max: 4 },
  { name: "large", max: 8 },
  { name: "mega", max: Infinity },
];

export function isModule(v) {
  return MODULES.includes(v);
}

export function snapModule(v) {
  const up = MODULES.find((m) => m >= v);
  const down = [...MODULES].reverse().find((m) => m <= v);
  if (up === undefined) return down ?? MODULES[MODULES.length - 1];
  if (down === undefined) return up;
  return up - v <= v - down ? up : down;
}

export function sizeClass(w, d) {
  const m = Math.max(w, d);
  const found = SIZE_CLASSES.find((c) => m <= c.max);
  return found ? found.name : "mega";
}

export function footprint(w, d) {
  const gw = Math.max(1, snapModule(w / TILE));
  const gd = Math.max(1, snapModule(d / TILE));
  return {
    w: gw,
    d: gd,
    cells: gw * gd,
    size: sizeClass(gw, gd),
    label: `${gw}x${gd}`,
  };
}

export const GRID_SIZES = MODULES.flatMap((w) => MODULES.map((d) => [w, d]));

export const snap = (v) => Math.round(v / TILE) * TILE;
