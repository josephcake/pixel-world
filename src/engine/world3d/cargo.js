import { mat, shade, addBox, addCylinder, addRoundedBox, addWheel } from "./materials.js";

// Low-poly logistics / cargo assets sharing the trucks' visual language:
// rounded industrial geometry, chunky readable silhouettes, flat shading.
// Local coords: length along +x, width along z, up +y, resting on y=0.

const WOOD = [182, 138, 86];
const CARDBOARD = [196, 150, 100];

// --- Pallet ---------------------------------------------------------------

function buildPallet(parent, spec) {
  const w = spec.w;
  const d = spec.d;
  const wood = mat(spec.wood ?? WOOD);
  const woodDark = mat(shade(spec.wood ?? WOOD, 0.82));
  const th = 0.05;
  const deckY = 0.115;

  const n = 7;
  const bw = 0.12;
  const gap = (w - n * bw) / (n - 1);
  for (let i = 0; i < n; i++) {
    addRoundedBox(parent, { w: bw, h: th, d: d, x: bw / 2 + i * (bw + gap), y: deckY + th / 2, z: d / 2, radius: 0.012, material: i % 2 ? woodDark : wood });
  }

  const szs = [0.12, d / 2, d - 0.12];
  for (const z of szs) {
    addRoundedBox(parent, { w: w, h: th, d: 0.1, x: w / 2, y: th / 2, z, radius: 0.012, material: woodDark });
  }

  const bxs = [0.14, w / 2, w - 0.14];
  for (const x of bxs) {
    for (const z of szs) {
      addRoundedBox(parent, { w: 0.16, h: 0.07, d: 0.14, x, y: th + 0.035, z, radius: 0.012, material: wood });
    }
  }
}

// --- Crate ----------------------------------------------------------------

function buildCrate(parent, spec) {
  const w = spec.w;
  const d = spec.d;
  const h = spec.height;
  const wood = mat(spec.wood ?? [170, 122, 72]);
  const woodDark = mat(shade(spec.wood ?? [170, 122, 72], 0.78));
  const rail = mat(shade(spec.wood ?? [170, 122, 72], 0.9));
  const t = 0.1;
  const bodyH = h - 0.09;

  addRoundedBox(parent, { w, h: bodyH, d, x: w / 2, y: bodyH / 2, z: d / 2, radius: 0.05, segments: 2, material: wood });

  for (const x of [t / 2, w - t / 2]) {
    for (const z of [t / 2, d - t / 2]) {
      addRoundedBox(parent, { w: t, h, d: t, x, y: h / 2, z, radius: 0.02, material: woodDark });
    }
  }
  for (const y of [t / 2, bodyH - t / 2]) {
    addBox(parent, { w: w - 0.14, h: t, d: t, x: w / 2, y, z: t / 2, material: rail });
    addBox(parent, { w: w - 0.14, h: t, d: t, x: w / 2, y, z: d - t / 2, material: rail });
    addBox(parent, { w: t, h: t, d: d - 0.14, x: t / 2, y, z: d / 2, material: rail });
    addBox(parent, { w: t, h: t, d: d - 0.14, x: w - t / 2, y, z: d / 2, material: rail });
  }
  for (const z of [t / 2, d - t / 2]) {
    addBox(parent, { w: w - 0.2, h: 0.09, d: 0.03, x: w / 2, y: bodyH * 0.5, z: z < d / 2 ? z - 0.015 : z + 0.015, material: woodDark });
  }
  addRoundedBox(parent, { w: w + 0.05, h: 0.09, d: d + 0.05, x: w / 2, y: h - 0.045, z: d / 2, radius: 0.02, material: rail });
}

// --- Cardboard box --------------------------------------------------------

function buildCardboard(parent, spec) {
  const w = spec.w;
  const d = spec.d;
  const h = spec.height;
  const card = mat(spec.color ?? CARDBOARD);
  const tape = mat([214, 196, 166]);

  addRoundedBox(parent, { w, h, d, x: w / 2, y: h / 2, z: d / 2, radius: 0.03, segments: 2, material: card });

  addBox(parent, { w: 0.1, h: h * 0.85, d: 0.014, x: w / 2, y: h * 0.575, z: d + 0.008, material: tape });
  addBox(parent, { w: 0.1, h: h * 0.85, d: 0.014, x: w / 2, y: h * 0.575, z: -0.008, material: tape });
  addBox(parent, { w: 0.1, h: 0.016, d: d + 0.02, x: w / 2, y: h + 0.008, z: d / 2, material: tape });
}

// --- Forklift -------------------------------------------------------------

function buildForklift(parent, spec) {
  const d = spec.d;
  const h = spec.height;
  const bodyC = mat(spec.color ?? [240, 178, 40]);
  const dark = mat([48, 52, 58], { roughness: 0.85 });
  const mastC = mat([70, 76, 84]);
  const metal = mat([150, 156, 164], { metalness: 0.5, roughness: 0.4 });
  const glass = mat([70, 100, 128], { metalness: 0.4, roughness: 0.15 });
  const light = mat([250, 244, 200]);
  const amber = mat([246, 170, 40]);
  const tire = mat([32, 34, 40], { roughness: 0.92 });
  const hub = mat([178, 182, 188], { metalness: 0.5, roughness: 0.35 });

  const bodyX0 = 0.35;
  const bodyX1 = 1.45;
  addRoundedBox(parent, { w: bodyX1 - bodyX0, h: 0.62, d: d - 0.14, x: (bodyX0 + bodyX1) / 2, y: 0.63, z: d / 2, radius: 0.09, segments: 2, material: bodyC });
  addRoundedBox(parent, { w: 0.44, h: 0.5, d: d - 0.12, x: 0.42, y: 0.5, z: d / 2, radius: 0.09, segments: 2, material: bodyC });

  for (const z of [0.3, d - 0.3]) {
    addRoundedBox(parent, { w: 0.12, h: h - 0.25, d: 0.12, x: 1.53, y: 0.25 + (h - 0.25) / 2, z, radius: 0.03, material: mastC });
  }
  addBox(parent, { w: 0.12, h: 0.1, d: d - 0.5, x: 1.53, y: h - 0.12, z: d / 2, material: mastC });
  addBox(parent, { w: 0.12, h: 0.1, d: d - 0.5, x: 1.53, y: 0.75, z: d / 2, material: mastC });
  addRoundedBox(parent, { w: 0.08, h: 0.62, d: d - 0.34, x: 1.62, y: 0.5, z: d / 2, radius: 0.02, material: metal });

  for (const z of [0.32, d - 0.32]) {
    addBox(parent, { w: 0.5, h: 0.06, d: 0.12, x: 1.9, y: 0.13, z, material: metal });
    addBox(parent, { w: 0.06, h: 0.42, d: 0.1, x: 1.65, y: 0.32, z, material: metal });
  }

  const gx = 1.0;
  for (const x of [0.66, 1.34]) {
    for (const z of [0.2, d - 0.2]) {
      addBox(parent, { w: 0.06, h: 0.62, d: 0.06, x, y: 1.25, z, material: dark });
    }
  }
  addRoundedBox(parent, { w: 0.76, h: 0.06, d: d - 0.34, x: gx, y: 1.58, z: d / 2, radius: 0.02, material: dark });
  addRoundedBox(parent, { w: 0.34, h: 0.12, d: 0.42, x: 0.9, y: 0.98, z: d / 2, radius: 0.03, material: dark });
  addRoundedBox(parent, { w: 0.08, h: 0.38, d: 0.42, x: 0.72, y: 1.16, z: d / 2, radius: 0.02, material: dark });
  addCylinder(parent, { rTop: 0.05, rBottom: 0.05, h: 0.3, x: 1.14, y: 1.05, z: d / 2, material: dark, segments: 8, rotation: [0.6, 0, 0] });

  addRoundedBox(parent, { w: 0.12, h: 0.34, d: 0.28, x: 0.5, y: 0.9, z: d / 2 - 0.18, radius: 0.03, material: glass });
  for (const z of [0.24, d - 0.24]) {
    addBox(parent, { w: 0.06, h: 0.1, d: 0.14, x: 1.47, y: 0.9, z, material: light });
  }
  addCylinder(parent, { rTop: 0.06, rBottom: 0.06, h: 0.12, x: 0.66, y: 1.66, z: d / 2, material: amber, segments: 8 });

  const r = 0.24;
  for (const x of [1.24, 0.5]) {
    for (const z of [0.1, d - 0.1]) {
      addWheel(parent, { x, z, r: x > 1 ? r : 0.19, w: 0.16, tire, hub });
    }
  }
}

// --- Reach truck ----------------------------------------------------------

function buildReachTruck(parent, spec) {
  const d = spec.d;
  const bodyC = mat(spec.color ?? [232, 120, 52]);
  const dark = mat([48, 52, 58], { roughness: 0.85 });
  const mastC = mat([70, 76, 84]);
  const metal = mat([150, 156, 164], { metalness: 0.5, roughness: 0.4 });
  const glass = mat([70, 100, 128], { metalness: 0.4, roughness: 0.15 });
  const light = mat([250, 244, 200]);
  const tire = mat([32, 34, 40], { roughness: 0.92 });
  const hub = mat([178, 182, 188], { metalness: 0.5, roughness: 0.35 });

  const mastX = 1.4;
  const mastH = 1.15;
  for (const z of [0.26, d - 0.26]) {
    addRoundedBox(parent, { w: 0.11, h: mastH, d: 0.11, x: mastX, y: 0.2 + mastH / 2, z, radius: 0.025, material: mastC });
  }
  addRoundedBox(parent, { w: 0.09, h: 0.9, d: d - 0.34, x: mastX + 0.11, y: 0.55, z: d / 2, radius: 0.02, material: metal });

  for (const z of [0.3, d - 0.3]) {
    addBox(parent, { w: 0.62, h: 0.06, d: 0.11, x: mastX + 0.5, y: 0.14, z, material: metal });
    addBox(parent, { w: 0.06, h: 0.36, d: 0.11, x: mastX + 0.16, y: 0.32, z, material: metal });
  }

  addRoundedBox(parent, { w: 0.72, h: 0.56, d: d - 0.14, x: 0.82, y: 0.58, z: d / 2, radius: 0.09, segments: 2, material: bodyC });
  addRoundedBox(parent, { w: 0.36, h: 0.66, d: d - 0.24, x: 0.5, y: 0.9, z: d / 2, radius: 0.06, segments: 2, material: bodyC });

  addRoundedBox(parent, { w: 0.3, h: 0.1, d: 0.36, x: 0.78, y: 1.0, z: d / 2, radius: 0.03, material: dark });

  addRoundedBox(parent, { w: 0.1, h: 0.3, d: 0.24, x: 0.3, y: 1.0, z: d / 2 - 0.16, radius: 0.03, material: glass });
  for (const z of [0.22, d - 0.22]) {
    addBox(parent, { w: 0.06, h: 0.09, d: 0.12, x: 1.3, y: 0.86, z, material: light });
  }

  for (const z of [0.1, d - 0.1]) {
    addWheel(parent, { x: 1.3, z, r: 0.2, w: 0.15, tire, hub });
    addWheel(parent, { x: 0.42, z, r: 0.22, w: 0.15, tire, hub });
  }
}

// --- Yard tractor ---------------------------------------------------------

function buildYardTractor(parent, spec) {
  const w = spec.w;
  const d = spec.d;
  const bodyC = mat(spec.color ?? [60, 150, 120]);
  const dark = mat([48, 52, 58], { roughness: 0.85 });
  const metal = mat([150, 156, 164], { metalness: 0.5, roughness: 0.4 });
  const glass = mat([70, 100, 128], { metalness: 0.4, roughness: 0.15 });
  const light = mat([250, 244, 200]);
  const tire = mat([32, 34, 40], { roughness: 0.92 });
  const hub = mat([178, 182, 188], { metalness: 0.5, roughness: 0.35 });

  addRoundedBox(parent, { w: 1.1, h: 0.2, d: d - 0.3, x: 0.9, y: 0.42, z: d / 2, radius: 0.05, material: dark });

  const cx0 = 1.5;
  const cx1 = w - 0.1;
  addRoundedBox(parent, { w: cx1 - cx0, h: 1.0, d: d - 0.12, x: (cx0 + cx1) / 2, y: 0.88, z: d / 2, radius: 0.16, segments: 3, material: bodyC });
  addRoundedBox(parent, { w: cx1 - cx0 - 0.1, h: 0.16, d: d - 0.24, x: (cx0 + cx1) / 2, y: 1.42, z: d / 2, radius: 0.05, material: bodyC });

  addRoundedBox(parent, { w: 0.08, h: 0.44, d: d - 0.3, x: cx1 - 0.02, y: 1.12, z: d / 2, radius: 0.03, material: glass });
  for (const z of [0.14, d - 0.14]) {
    addBox(parent, { w: 0.04, h: 0.04, d: 0.14, x: cx1 - 0.02, y: 1.16, z: z + (z < d / 2 ? -0.08 : 0.08), material: dark });
    addRoundedBox(parent, { w: 0.08, h: 0.18, d: 0.05, x: cx1 - 0.02, y: 1.16, z: z + (z < d / 2 ? -0.17 : 0.17), radius: 0.015, material: glass });
  }

  addCylinder(parent, { rTop: 0.42, rBottom: 0.42, h: 0.08, x: 0.8, y: 0.66, z: d / 2, material: metal, segments: 16 });
  addBox(parent, { w: 0.5, h: 0.1, d: 0.3, x: 0.8, y: 0.62, z: d / 2, material: dark });
  for (const z of [0.16, d - 0.16]) {
    addBox(parent, { w: 0.06, h: 0.1, d: 0.14, x: cx1 + 0.02, y: 0.66, z, material: light });
  }

  const r = 0.3;
  for (const z of [0.08, d - 0.08]) {
    addWheel(parent, { x: 0.72, z, r, w: 0.18, tire, hub });
    addRoundedBox(parent, { w: r * 2.2, h: r * 0.7, d: 0.14, x: 0.72, y: r * 1.35, z: z < d / 2 ? z - 0.06 : z + 0.06, radius: 0.05, material: bodyC });
  }
  for (const z of [0.08, d - 0.08]) {
    addWheel(parent, { x: w - 0.34, z, r: 0.22, w: 0.15, tire, hub });
  }
}

// --- Tower crane ----------------------------------------------------------

function buildTowerCrane(parent, spec) {
  const w = spec.w;
  const d = spec.d;
  const h = spec.height;
  const steel = mat(spec.color ?? [236, 182, 60]);
  const steelDark = mat(shade(spec.color ?? [236, 182, 60], 0.8));
  const accent = mat([92, 98, 106]);
  const metal = mat([150, 156, 164], { metalness: 0.5, roughness: 0.4 });
  const glass = mat([70, 100, 128], { metalness: 0.4, roughness: 0.15 });
  const cable = mat([60, 64, 70]);

  const towerX = 2.6;
  const hw = 0.35;
  const zc = d / 2;
  const th = h - 1.3;

  addRoundedBox(parent, { w: 1.4, h: 0.3, d: 1.4, x: towerX, y: 0.15, z: zc, radius: 0.05, material: accent });

  for (const dx of [-hw, hw]) {
    for (const dz of [-hw, hw]) {
      addBox(parent, { w: 0.1, h: th, d: 0.1, x: towerX + dx, y: th / 2, z: zc + dz, material: steel });
    }
  }
  const levels = Math.max(3, Math.round(th / 1.3));
  for (let i = 1; i < levels; i++) {
    const y = (th * i) / levels;
    addBox(parent, { w: hw * 2, h: 0.07, d: 0.07, x: towerX, y, z: zc - hw, material: steelDark });
    addBox(parent, { w: hw * 2, h: 0.07, d: 0.07, x: towerX, y, z: zc + hw, material: steelDark });
    addBox(parent, { w: 0.07, h: 0.07, d: hw * 2, x: towerX - hw, y, z: zc, material: steelDark });
    addBox(parent, { w: 0.07, h: 0.07, d: hw * 2, x: towerX + hw, y, z: zc, material: steelDark });
  }
  for (let i = 0; i < levels; i++) {
    const y0 = (th * i) / levels;
    const y1 = (th * (i + 1)) / levels;
    const len = Math.hypot(hw * 2, y1 - y0);
    const ang = Math.atan2(y1 - y0, hw * 2) * (i % 2 ? 1 : -1);
    addBox(parent, { w: len, h: 0.05, d: 0.05, x: towerX, y: (y0 + y1) / 2, z: zc - hw, material: steelDark, rotation: [0, 0, ang] });
    addBox(parent, { w: len, h: 0.05, d: 0.05, x: towerX, y: (y0 + y1) / 2, z: zc + hw, material: steelDark, rotation: [0, 0, ang] });
  }

  addRoundedBox(parent, { w: 1.0, h: 0.4, d: 1.0, x: towerX, y: th + 0.2, z: zc, radius: 0.05, material: steelDark });
  addRoundedBox(parent, { w: 0.55, h: 0.62, d: 0.62, x: towerX + 0.85, y: th + 0.55, z: zc + 0.35, radius: 0.06, material: accent });
  addRoundedBox(parent, { w: 0.06, h: 0.36, d: 0.42, x: towerX + 1.1, y: th + 0.58, z: zc + 0.35, radius: 0.02, material: glass });

  const apexY = th + 1.2;
  for (const dx of [-0.18, 0.18]) {
    for (const dz of [-0.18, 0.18]) {
      addBox(parent, { w: 0.08, h: apexY - (th + 0.4), d: 0.08, x: towerX + dx, y: (th + 0.4 + apexY) / 2, z: zc + dz, material: steel });
    }
  }
  addBox(parent, { w: 0.42, h: 0.12, d: 0.42, x: towerX, y: apexY, z: zc, material: accent });

  const jibY = th + 0.9;
  const lowY = th + 0.45;
  const jibX1 = w - 0.2;
  const cjX0 = 0.2;
  addBox(parent, { w: jibX1 - towerX, h: 0.1, d: 0.1, x: (towerX + jibX1) / 2, y: jibY, z: zc, material: steel });
  addBox(parent, { w: towerX - cjX0, h: 0.1, d: 0.1, x: (cjX0 + towerX) / 2, y: jibY, z: zc, material: steel });
  for (const dz of [-0.22, 0.22]) {
    addBox(parent, { w: jibX1 - towerX, h: 0.09, d: 0.09, x: (towerX + jibX1) / 2, y: lowY, z: zc + dz, material: steel });
    addBox(parent, { w: towerX - cjX0, h: 0.09, d: 0.09, x: (cjX0 + towerX) / 2, y: lowY, z: zc + dz, material: steel });
  }
  const jsec = 6;
  for (let i = 0; i <= jsec; i++) {
    const x = towerX + ((jibX1 - towerX) * i) / jsec;
    addBox(parent, { w: 0.06, h: jibY - lowY, d: 0.06, x, y: (jibY + lowY) / 2, z: zc - 0.22, material: steelDark });
    addBox(parent, { w: 0.06, h: jibY - lowY, d: 0.06, x, y: (jibY + lowY) / 2, z: zc + 0.22, material: steelDark });
  }
  for (let i = 0; i <= 3; i++) {
    const x = towerX - ((towerX - cjX0) * i) / 3;
    addBox(parent, { w: 0.06, h: jibY - lowY, d: 0.06, x, y: (jibY + lowY) / 2, z: zc, material: steelDark });
  }
  addRoundedBox(parent, { w: 1.3, h: 1.0, d: d - 0.2, x: cjX0 + 0.65, y: lowY - 0.1, z: zc, radius: 0.06, material: accent });

  const tie = (x1, y1, x2, y2, t = 0.05, zo = 0) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    addBox(parent, { w: len, h: t, d: t, x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: zc + zo, material: metal, rotation: [0, 0, ang] });
  };
  tie(towerX, apexY, towerX + (jibX1 - towerX) * 0.78, jibY + 0.05, 0.05, 0);
  tie(towerX, apexY, cjX0 + 0.65, jibY + 0.05, 0.066, 0.03);

  const tx = towerX + (jibX1 - towerX) * 0.6;
  addRoundedBox(parent, { w: 0.5, h: 0.28, d: 0.6, x: tx, y: lowY - 0.12, z: zc, radius: 0.05, material: accent });
  const hookTop = lowY - 0.26;
  const hookBottom = 0.85;
  addCylinder(parent, { rTop: 0.02, rBottom: 0.02, h: hookTop - hookBottom, x: tx, y: (hookTop + hookBottom) / 2, z: zc, material: cable, segments: 6 });
  addRoundedBox(parent, { w: 0.3, h: 0.4, d: 0.3, x: tx, y: hookBottom + 0.1, z: zc, radius: 0.04, material: metal });
  addBox(parent, { w: 0.08, h: 0.14, d: 0.08, x: tx, y: hookBottom - 0.12, z: zc, material: metal });
}

export function buildCargoAsset(parent, spec) {
  if (spec?.type === "pallet") {
    buildPallet(parent, spec);
    return true;
  }
  if (spec?.type === "crate") {
    buildCrate(parent, spec);
    return true;
  }
  if (spec?.type === "cardboard-box") {
    buildCardboard(parent, spec);
    return true;
  }
  if (spec?.type === "forklift") {
    buildForklift(parent, spec);
    return true;
  }
  if (spec?.type === "reach-truck") {
    buildReachTruck(parent, spec);
    return true;
  }
  if (spec?.type === "yard-tractor") {
    buildYardTractor(parent, spec);
    return true;
  }
  if (spec?.type === "tower-crane") {
    buildTowerCrane(parent, spec);
    return true;
  }
  return false;
}
