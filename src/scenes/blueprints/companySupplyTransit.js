import { HOUSES } from "../residential/house/index.js";
import { WAREHOUSES } from "../commercial/index.js";
import { ROADS, PAVEMENT, PARKING } from "../landscape/index.js";
import { PAVEMENT_FILL } from "../landscape/pavement/index.js";

const byId = (arr, id) => arr.find((x) => x.id === id);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.d && a.y + a.d > b.y;
}

function validate(placements) {
  const rs = placements.map((p) => ({
    x: p.x,
    y: p.y,
    w: p.item.footprint.w,
    d: p.item.footprint.d,
  }));
  for (let i = 0; i < rs.length; i++) {
    for (let j = i + 1; j < rs.length; j++) {
      if (rectsOverlap(rs[i], rs[j])) return false;
    }
  }
  return true;
}

function build(seed) {
  const rand = mulberry32(seed);
  const rint = (n) => Math.floor(rand() * n);
  const pick = (arr) => arr[rint(arr.length)];

  const primary = rint(2)
    ? byId(WAREHOUSES, "warehouse-mega")
    : byId(WAREHOUSES, "warehouse-large");
  const office = pick([
    byId(HOUSES, "modern"),
    byId(HOUSES, "villa"),
    byId(HOUSES, "tower"),
  ]);
  const secondary = byId(WAREHOUSES, "warehouse-small");
  const roadFront = byId(ROADS, "road-front");
  const roadSide = byId(ROADS, "road-side");
  const cross = byId(ROADS, "road-cross");
  const pavement = PAVEMENT[0];
  const parking = PARKING[0];
  const fill = PAVEMENT_FILL[0];

  const placements = [];
  const push = (item, x, y) => placements.push({ item, x, y, rotation: 0 });

  const pw = primary.footprint.w;
  const pd = primary.footprint.d;
  const od = office.footprint.d;

  const PUBLIC_Y = 14;
  const ENTR = 6;

  // Public road along the property edge, with the facility entrance.
  for (let x = 0; x <= 16; x += 2) if (x !== ENTR) push(roadFront, x, PUBLIC_Y);
  push(cross, ENTR, PUBLIC_Y);

  // Internal access road (vertical) off the entrance.
  for (let y = 0; y <= PUBLIC_Y - 2; y += 2) push(roadSide, ENTR, y);

  // Right: primary warehouse + paved service/loading yard.
  const wx = ENTR + 3;
  const wy = 2;
  push(primary, wx, wy);
  const yardRows = 2 + rint(2);
  for (let r = 0; r < yardRows; r++) {
    for (let x = wx; x < wx + pw; x += 2) push(pavement, x, wy + pd + r * 2);
  }

  // Left: secondary support building, office, and parking near the entrance.
  push(secondary, 0, 2);
  push(office, 0, 6);
  const spots = 2 + rint(2);
  const parkY = 6 + od + 1;
  for (let i = 0; i < spots; i++) push(parking, i, parkY);

  // Pave the property interior (inside the boundary) around everything placed.
  const bx0 = -1;
  const bx1 = 19;
  const by0 = -1;
  const by1 = 14;
  const occupied = placements.map((p) => ({
    x: p.x,
    y: p.y,
    w: p.item.footprint.w,
    d: p.item.footprint.d,
  }));
  for (let y = by0; y < by1; y++) {
    for (let x = bx0; x < bx1; x++) {
      const blocked = occupied.some(
        (r) => x < r.x + r.w && x + 1 > r.x && y < r.y + r.d && y + 1 > r.y,
      );
      if (!blocked) push(fill, x, y);
    }
  }

  return placements;
}

export function generateCompanySupplyTransitBlueprint(seed = Date.now() % 0x7fffffff) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const s = (seed + attempt) >>> 0;
    const placements = build(s);
    if (validate(placements)) return { seed: s, placements };
  }
  return { seed: seed >>> 0, placements: build(seed >>> 0) };
}
