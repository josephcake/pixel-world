import * as THREE from "three";
import { mat, addBox, addCylinder, addRoundedBox, addWheel } from "./materials.js";

// Low-poly everyday road vehicles sharing the trucks' visual language.
// Local coords: length along +x (front at +x), width along z, up +y.

const DARK = [40, 43, 50];
const GLASS = [70, 100, 128];
const LIGHT = [250, 244, 200];
const TAIL = [200, 60, 54];
const TIRE = [32, 34, 40];
const HUB = [178, 182, 188];
const RED = [224, 66, 60];
const BLUE = [60, 110, 220];

function palette(spec) {
  return {
    body: mat(spec.color ?? [200, 70, 70]),
    dark: mat(DARK),
    glass: mat(GLASS, { metalness: 0.4, roughness: 0.15 }),
    glassClear: mat([120, 150, 176], { transparent: true, opacity: 0.32, metalness: 0.1, roughness: 0.08, side: THREE.DoubleSide, depthWrite: false }),
    light: mat(LIGHT),
    tail: mat(TAIL),
    tire: mat(TIRE, { roughness: 0.92 }),
    hub: mat(HUB, { metalness: 0.5, roughness: 0.35 }),
    red: mat(RED),
    blue: mat(BLUE),
    stripe: mat([245, 245, 245]),
  };
}

// Wheels sit just proud of the body sides so they read from an isometric view.
function wheels(parent, L, W, o, M) {
  const zL = o.wheelW / 2 - 0.02;
  const zR = W - o.wheelW / 2 + 0.02;
  for (const x of [L * o.front, L * o.rear]) {
    for (const z of [zL, zR]) {
      addWheel(parent, { x, z, r: o.wheelR, w: o.wheelW, tire: M.tire, hub: M.hub });
    }
  }
}

// Hollow greenhouse (pillars + roof + transparent glass) with a modelled
// interior, so passenger compartments read as real interiors, not shells.
function carCabin(parent, o, M, cX0, cX1, W, belt) {
  const zL = 0.1;
  const zR = W - 0.1;
  const zc = W / 2;
  const midX = (cX0 + cX1) / 2;
  const roofH = 0.07;
  addRoundedBox(parent, { w: cX1 - cX0, h: roofH, d: W - 0.14, x: midX, y: belt + o.cabinH - roofH / 2, z: zc, radius: 0.05, segments: 1, material: M.body });

  const pW = 0.1;
  for (const x of [cX0 + 0.04, midX, cX1 - 0.04]) {
    for (const z of [zL, zR]) {
      addBox(parent, { w: pW, h: o.cabinH, d: pW, x, y: belt + o.cabinH / 2, z, material: M.body });
    }
  }
  for (const z of [zL, zR]) {
    const g1 = [cX0 + 0.09, midX - 0.05];
    const g2 = [midX + 0.05, cX1 - 0.09];
    addBox(parent, { w: g1[1] - g1[0], h: o.cabinH - 0.16, d: 0.02, x: (g1[0] + g1[1]) / 2, y: belt + o.cabinH / 2, z, material: M.glassClear });
    addBox(parent, { w: g2[1] - g2[0], h: o.cabinH - 0.16, d: 0.02, x: (g2[0] + g2[1]) / 2, y: belt + o.cabinH / 2, z, material: M.glassClear });
  }
  const ws = addBox(parent, { w: 0.05, h: o.cabinH - 0.14, d: W - 0.3, x: cX1 - 0.01, y: belt + o.cabinH * 0.55, z: zc, material: M.glassClear });
  ws.rotation.z = 0.34;
  if (o.rearWindows2) {
    for (const z of [W * 0.28, W * 0.72]) {
      addBox(parent, { w: 0.05, h: o.cabinH - 0.16, d: W * 0.34, x: cX0 + 0.01, y: belt + o.cabinH * 0.55, z, material: M.glassClear });
    }
  } else {
    const rw = addBox(parent, { w: 0.05, h: o.cabinH - 0.18, d: W - 0.34, x: cX0 + 0.01, y: belt + o.cabinH * 0.55, z: zc, material: M.glassClear });
    rw.rotation.z = o.flatBack ? 0 : o.squaredBack ? -0.16 : -0.5;
  }

  const fy = belt + 0.06;
  addBox(parent, { w: cX1 - cX0 - 0.2, h: 0.05, d: W - 0.28, x: midX, y: fy, z: zc, material: M.dark });
  addBox(parent, { w: 0.22, h: 0.18, d: W - 0.36, x: cX1 - 0.24, y: fy + 0.14, z: zc, material: M.dark });
  for (const z of [0.26, W - 0.26]) {
    addBox(parent, { w: 0.34, h: 0.1, d: 0.32, x: midX + 0.1, y: fy + 0.1, z, material: M.dark });
    addBox(parent, { w: 0.09, h: 0.34, d: 0.3, x: midX - 0.06, y: fy + 0.22, z, material: M.dark });
  }
  addBox(parent, { w: 0.5, h: 0.14, d: W - 0.42, x: cX0 + 0.5, y: fy + 0.13, z: zc, material: M.dark });
  addBox(parent, { w: 0.4, h: 0.12, d: 0.14, x: midX + 0.1, y: fy + 0.1, z: zc, material: M.dark });
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 12), M.dark);
  sw.position.set(cX1 - 0.34, fy + 0.3, W * 0.28);
  sw.rotation.x = Math.PI / 2.6;
  parent.add(sw);
}

// Shared passenger-car body: lower body, cabin, glass, lights, bumpers, grille, mirrors, fender flares and wheels.
function carBase(parent, spec, o) {
  const L = spec.w;
  const W = spec.d;
  const M = palette(spec);
  const y0 = o.clearance;
  const belt = y0 + o.bodyH;

  // Lower body tub (full width, rounded).
  addRoundedBox(parent, { w: L, h: o.bodyH, d: W, x: L / 2, y: y0 + o.bodyH / 2, z: W / 2, radius: 0.12, segments: 2, material: M.body });

  // Sloped hood (front) — very thin.
  if (o.hood) {
    const hs = L * (1 - o.hood);
    const hood = addRoundedBox(parent, { w: L - hs, h: o.bodyH * 0.14, d: W - 0.06, x: (hs + L) / 2, y: belt + o.bodyH * 0.07, z: W / 2, radius: 0.06, segments: 1, material: M.body });
    hood.rotation.z = -0.06;
  }
  // Sloped trunk (sedan, rear) — very thin.
  if (o.trunk) {
    const ts = L * o.trunk;
    const trunk = addRoundedBox(parent, { w: ts, h: o.bodyH * 0.14, d: W - 0.06, x: ts / 2, y: belt + o.bodyH * 0.07, z: W / 2, radius: 0.06, segments: 1, material: M.body });
    trunk.rotation.z = 0.07;
  }

  const cX0 = o.rearFlush ? 0.01 : o.flatBack ? L * 0.06 : L * o.cabinR;
  const cX1 = L * o.cabinF;
  carCabin(parent, o, M, cX0, cX1, W, belt);

  const cy = belt + o.cabinH * 0.58;
  for (const side of [-1, 1]) {
    const zs = side < 0 ? 0 : W;
    addBox(parent, { w: 0.04, h: 0.03, d: 0.08, x: cX1 - 0.1, y: cy + 0.02, z: zs + side * 0.04, material: M.dark });
    addRoundedBox(parent, { w: 0.09, h: 0.08, d: 0.05, x: cX1 - 0.1, y: cy + 0.02, z: zs + side * 0.11, radius: 0.02, material: M.glass });
  }

  addRoundedBox(parent, { w: 0.18, h: o.bodyH * 0.5, d: W - 0.08, x: L + 0.03, y: y0 + o.bodyH * 0.36, z: W / 2, radius: 0.08, segments: 1, material: M.dark });
  addRoundedBox(parent, { w: 0.18, h: o.bodyH * 0.5, d: W - 0.08, x: o.rearFlush ? 0.07 : -0.03, y: y0 + o.bodyH * 0.36, z: W / 2, radius: 0.08, segments: 1, material: M.dark });

  addBox(parent, { w: 0.05, h: o.bodyH * 0.34, d: W - 0.5, x: L - 0.005, y: y0 + o.bodyH * 0.46, z: W / 2, material: M.dark });
  for (const z of [W * 0.22, W * 0.78]) {
    addRoundedBox(parent, { w: 0.06, h: 0.1, d: 0.26, x: L - 0.02, y: y0 + o.bodyH * 0.62, z, radius: 0.03, material: M.light });
  }
  for (const z of [W * 0.2, W * 0.8]) {
    addRoundedBox(parent, { w: 0.05, h: 0.12, d: 0.24, x: 0.02, y: y0 + o.bodyH * 0.6, z, radius: 0.03, material: M.tail });
  }

  if (o.roofRails) {
    for (const z of [0.16, W - 0.16]) {
      addBox(parent, { w: (cX1 - cX0) * 0.82, h: 0.05, d: 0.05, x: (cX0 + cX1) / 2, y: belt + o.cabinH + o.cabinH * 0.2 + 0.03, z, material: M.dark });
    }
  }
  if (o.slidingDoor) {
    for (const z of [-0.004, W + 0.004]) {
      addBox(parent, { w: L * 0.44, h: 0.02, d: 0.012, x: L * 0.4, y: belt + o.cabinH * 0.32, z, material: M.dark });
      addBox(parent, { w: 0.02, h: o.cabinH * 0.9, d: 0.012, x: L * 0.15, y: belt + o.cabinH * 0.45, z, material: M.dark });
    }
  }

  for (const x of [L * o.front, L * o.rear]) {
    for (const z of [-0.01, W + 0.01]) {
      addRoundedBox(parent, { w: o.wheelR * 2.4, h: o.wheelR * 0.95, d: 0.1, x, y: y0 + o.wheelR * 0.95, z, radius: 0.06, segments: 1, material: M.body });
    }
  }

  wheels(parent, L, W, o, M);
  return { L, W, o, y0, yRoof: belt + o.cabinH, cX0, cX1, M };
}

function lightBar(parent, { x, y, z, len, M }) {
  addBox(parent, { w: 0.12, h: 0.06, d: len, x, y, z, material: M.dark });
  addBox(parent, { w: 0.1, h: 0.09, d: len * 0.44, x, y: y + 0.06, z: z - len * 0.24, material: M.red });
  addBox(parent, { w: 0.1, h: 0.09, d: len * 0.44, x, y: y + 0.06, z: z + len * 0.24, material: M.blue });
}

function policeTrim(parent, c, stripe = true) {
  if (stripe) {
    for (const z of [-0.006, c.W + 0.006]) {
      addBox(parent, { w: c.L * 0.86, h: 0.16, d: 0.02, x: c.L / 2, y: c.y0 + c.o.bodyH * 0.55, z, material: c.M.dark });
    }
  }
  addBox(parent, { w: 0.08, h: 0.5, d: c.W - 0.24, x: c.L + 0.01, y: c.y0 + 0.3, z: c.W / 2, material: c.M.dark });
  addBox(parent, { w: 0.06, h: 0.44, d: 0.06, x: c.L + 0.05, y: c.y0 + 0.3, z: c.W / 2 - 0.28, material: c.M.dark });
  addBox(parent, { w: 0.06, h: 0.44, d: 0.06, x: c.L + 0.05, y: c.y0 + 0.3, z: c.W / 2 + 0.28, material: c.M.dark });
  addCylinder(parent, { rTop: 0.045, rBottom: 0.045, h: 0.14, x: c.cX1 - 0.06, y: c.y0 + c.o.bodyH + c.o.cabinH * 0.7, z: 0.06, material: c.M.dark, segments: 8, rotation: [0, 0, Math.PI / 2] });
}

const SEDAN = { clearance: 0.22, bodyH: 0.5, cabinH: 0.46, cabinR: 0.28, cabinF: 0.7, hood: 0.3, trunk: 0.26, wheelR: 0.24, wheelW: 0.14, front: 0.77, rear: 0.23 };
const COMPACT = { clearance: 0.2, bodyH: 0.46, cabinH: 0.54, cabinR: 0.1, cabinF: 0.72, hood: 0.22, trunk: 0, wheelR: 0.2, wheelW: 0.13, front: 0.72, rear: 0.28, flatBack: true };

export function buildVehicle(parent, spec) {
  const type = spec.type;
  if (type === "motorcycle") {
    buildMotorcycle(parent, spec);
    return true;
  }
  if (type === "delivery-van") {
    buildBoxVehicle(parent, spec);
    return true;
  }
  if (type === "fire-engine") {
    buildFireEngine(parent, spec);
    return true;
  }
  if (type === "ambulance") {
    buildAmbulance(parent, spec);
    return true;
  }
  if (type === "pickup") {
    buildPickup(parent, spec);
    return true;
  }

  if (type === "compact") {
    carBase(parent, spec, COMPACT);
  } else if (type === "minivan") {
    buildMinivan(parent, spec);
  } else if (type === "police-car") {
    const c = carBase(parent, { ...spec, color: [236, 236, 240] }, SEDAN);
    policeTrim(parent, c);
    lightBar(parent, { x: (c.cX0 + c.cX1) / 2, y: c.yRoof + 0.05, z: c.W / 2, len: c.W * 0.72, M: c.M });
  } else if (type === "taxi") {
    const c = carBase(parent, { ...spec, color: [240, 200, 60] }, SEDAN);
    addRoundedBox(parent, { w: 0.34, h: 0.14, d: 0.2, x: (c.cX0 + c.cX1) / 2, y: c.yRoof + 0.07, z: c.W / 2, radius: 0.03, material: c.M.light });
    const ck = 0.15;
    const nCk = 7;
    const ckX0 = c.L * 0.33;
    for (const side of [-1, 1]) {
      const zs = side < 0 ? 0 : c.W;
      const out = side < 0 ? -1 : 1;
      for (const row of [0, 1]) {
        for (let i = 0; i < nCk; i++) {
          addBox(parent, { w: ck, h: ck, d: 0.02, x: ckX0 + i * ck, y: c.y0 + c.o.bodyH * 0.4 + row * ck, z: zs + out * 0.012, material: (i + row) % 2 ? c.M.dark : c.M.stripe });
        }
      }
    }
  } else {
    carBase(parent, spec, SEDAN);
  }
  return true;
}

// American municipal fire engine: large squared cab + long equipment body with
// a flat roof, mounted ladder, hose reels/compartments and emergency lighting.
function buildFireEngine(parent, spec) {
  const L = spec.w;
  const W = spec.d;
  const M = palette(spec);
  const y0 = 0.5;
  const cabH = 1.7;
  const bodyH = 1.7;
  const hoodLen = 0.35;
  const cabLen = 1.4;
  const bodyX0 = 0.15;
  const bodyX1 = L - hoodLen - cabLen;
  const cabX0 = bodyX1;
  const cabX1 = L - hoodLen;
  const hoodX1 = L;
  const zc = W / 2;
  const white = M.stripe;

  addBox(parent, { w: L - 0.3, h: 0.3, d: W * 0.5, x: L / 2, y: y0 - 0.05, z: zc, material: M.dark });

  addRoundedBox(parent, { w: bodyX1 - bodyX0, h: bodyH, d: W, x: (bodyX0 + bodyX1) / 2, y: y0 + bodyH / 2, z: zc, radius: 0.05, segments: 1, material: M.body });
  addRoundedBox(parent, { w: cabLen, h: cabH, d: W - 0.02, x: (cabX0 + cabX1) / 2, y: y0 + cabH / 2, z: zc, radius: 0.05, segments: 1, material: M.body });
  addRoundedBox(parent, { w: hoodLen, h: 0.75, d: W - 0.3, x: (cabX1 + hoodX1) / 2, y: y0 + 0.375, z: zc, radius: 0.04, segments: 1, material: M.body });

  addBox(parent, { w: 0.05, h: cabH * 0.58, d: W - 0.4, x: cabX1 - 0.02, y: y0 + cabH * 0.62, z: zc, material: M.glass });
  for (const z of [0.06, W - 0.06]) {
    addBox(parent, { w: cabLen * 0.55, h: cabH * 0.4, d: 0.02, x: (cabX0 + cabX1) / 2, y: y0 + cabH * 0.62, z, material: M.glass });
  }

  for (const z of [-0.008, W + 0.008]) {
    addBox(parent, { w: (bodyX1 - bodyX0) * 0.98, h: 0.2, d: 0.016, x: (bodyX0 + bodyX1) / 2, y: y0 + bodyH * 0.55, z, material: white });
  }
  const ncomp = 3;
  const step = (bodyX1 - bodyX0 - 0.6) / ncomp;
  const cw = step * 0.8;
  for (const z of [-0.02, W + 0.02]) {
    for (let i = 0; i < ncomp; i++) {
      const cx = bodyX0 + 0.3 + i * step;
      addBox(parent, { w: cw, h: bodyH * 0.5, d: 0.02, x: cx, y: y0 + bodyH * 0.5, z, material: M.dark });
      addBox(parent, { w: 0.1, h: 0.04, d: 0.03, x: cx, y: y0 + bodyH * 0.5, z: z < zc ? z - 0.02 : z + 0.02, material: white });
    }
  }
  for (const zz of [-0.012, W + 0.012]) {
    for (let i = 0; i < 7; i++) addBox(parent, { w: 0.12, h: 0.16, d: 0.014, x: bodyX0 + 0.3 + i * 0.18, y: y0 + bodyH * 0.78, z: zz, material: white });
    for (let i = 0; i < 5; i++) addBox(parent, { w: 0.1, h: 0.12, d: 0.014, x: bodyX0 + 0.4 + i * 0.16, y: y0 + bodyH * 0.28, z: zz, material: white });
  }
  addCylinder(parent, { rTop: 0.14, rBottom: 0.14, h: 0.18, x: bodyX1 - 0.5, y: y0 + bodyH * 0.45, z: W + 0.09, material: white, segments: 10, rotation: [Math.PI / 2, 0, 0] });
  for (let i = 0; i < 3; i++) {
    addCylinder(parent, { rTop: 0.05, rBottom: 0.05, h: 0.08, x: bodyX0 + 0.3 + i * 0.18, y: y0 + 0.5, z: W + 0.03, material: white, segments: 8, rotation: [Math.PI / 2, 0, 0] });
  }

  addRoundedBox(parent, { w: (bodyX1 - bodyX0) * 0.5, h: 0.2, d: W * 0.4, x: bodyX0 + (bodyX1 - bodyX0) * 0.5, y: y0 + bodyH + 0.1, z: zc - W * 0.2, radius: 0.03, segments: 1, material: white });
  addRoundedBox(parent, { w: (bodyX1 - bodyX0) * 0.4, h: 0.16, d: W * 0.3, x: bodyX0 + (bodyX1 - bodyX0) * 0.7, y: y0 + bodyH + 0.08, z: zc + W * 0.2, radius: 0.03, segments: 1, material: white });

  const ladX0 = bodyX0 + 0.3;
  const ladX1 = bodyX1 - 0.3;
  const ladY = y0 + bodyH + 0.16;
  const ladZ = zc + W * 0.28;
  addBox(parent, { w: ladX1 - ladX0, h: 0.06, d: 0.06, x: (ladX0 + ladX1) / 2, y: ladY, z: ladZ - 0.14, material: white });
  addBox(parent, { w: ladX1 - ladX0, h: 0.06, d: 0.06, x: (ladX0 + ladX1) / 2, y: ladY, z: ladZ + 0.14, material: white });
  for (let i = 0; i < 8; i++) {
    addBox(parent, { w: 0.05, h: 0.04, d: 0.28, x: ladX0 + ((ladX1 - ladX0) * i) / 7, y: ladY, z: ladZ, material: white });
  }
  for (const x of [ladX0 + 0.12, ladX1 - 0.12]) {
    addBox(parent, { w: 0.06, h: 0.16, d: 0.06, x, y: ladY - 0.1, z: ladZ, material: M.dark });
  }

  addBox(parent, { w: 0.05, h: 0.4, d: W - 0.6, x: hoodX1 + 0.005, y: y0 + 0.4, z: zc, material: M.dark });
  for (const z of [W * 0.2, W * 0.8]) {
    addBox(parent, { w: 0.05, h: 0.14, d: 0.24, x: hoodX1 + 0.02, y: y0 + 0.42, z, material: M.light });
  }
  for (const z of [W * 0.14, W * 0.86]) {
    addBox(parent, { w: 0.05, h: 0.16, d: 0.16, x: hoodX1 + 0.01, y: y0 + 0.62, z, material: z < zc ? M.red : M.blue });
  }
  addRoundedBox(parent, { w: 0.3, h: 0.5, d: W - 0.06, x: hoodX1 + 0.16, y: y0 + 0.25, z: zc, radius: 0.05, segments: 1, material: M.dark });
  addRoundedBox(parent, { w: 0.2, h: 0.4, d: W - 0.1, x: bodyX0 - 0.08, y: y0 + 0.2, z: zc, radius: 0.05, segments: 1, material: M.dark });

  for (const z of [W * 0.3, W * 0.7]) {
    addBox(parent, { w: 0.02, h: 0.4, d: 0.36, x: bodyX0 - 0.02, y: y0 + 1.0, z, material: M.dark });
    addBox(parent, { w: 0.02, h: 0.14, d: 0.14, x: bodyX0 - 0.02, y: y0 + bodyH - 0.1, z, material: M.red });
  }

  lightBar(parent, { x: (cabX0 + cabX1) / 2, y: y0 + cabH + 0.06, z: zc, len: W * 0.8, M });
  for (const z of [-0.02, W + 0.02]) {
    addBox(parent, { w: 0.16, h: 0.12, d: 0.02, x: bodyX1 - 0.4, y: y0 + bodyH - 0.09, z, material: M.red });
    addBox(parent, { w: 0.16, h: 0.12, d: 0.02, x: bodyX1 - 0.64, y: y0 + bodyH - 0.09, z, material: M.blue });
    addBox(parent, { w: 0.36, h: 0.36, d: 0.02, x: (cabX0 + cabX1) / 2 + 0.12, y: y0 + 0.95, z, material: white });
  }

  const wr = 0.4;
  const ww = 0.24;
  for (const x of [cabX1 - 0.4, bodyX0 + 0.7, bodyX0 + 1.4]) {
    for (const z of [-0.02, W + 0.02]) {
      addRoundedBox(parent, { w: wr * 2.5, h: wr * 0.9, d: 0.14, x, y: y0 + wr * 0.75, z, radius: 0.03, segments: 1, material: M.body });
    }
  }
  const zL = ww / 2 - 0.06;
  const zR = W - ww / 2 + 0.06;
  for (const x of [cabX1 - 0.4, bodyX0 + 0.7, bodyX0 + 1.4]) {
    for (const z of [zL, zR]) addWheel(parent, { x, z, r: wr, w: ww, tire: M.tire, hub: M.hub });
  }
}

// American Type III ambulance: separate cab + tall boxy medical module with a
// near-vertical rear. White body, red stripe, medical crosses, emergency lights.
function buildAmbulance(parent, spec) {
  const L = spec.w;
  const W = spec.d;
  const M = palette(spec);
  const y0 = 0.4;
  const boxH = 1.9;
  const cabH = 1.5;
  const boxX0 = 0.12;
  const boxX1 = 2.95;
  const cabX1 = L - 0.35;
  const hoodX1 = L - 0.02;
  const boxTop = y0 + boxH;
  const zc = W / 2;

  addRoundedBox(parent, { w: boxX1 - boxX0, h: boxH, d: W, x: (boxX0 + boxX1) / 2, y: y0 + boxH / 2, z: zc, radius: 0.05, segments: 1, material: M.body });
  addRoundedBox(parent, { w: cabX1 - boxX1, h: cabH, d: W - 0.14, x: (boxX1 + cabX1) / 2, y: y0 + cabH / 2, z: zc, radius: 0.05, segments: 1, material: M.body });
  addRoundedBox(parent, { w: hoodX1 - cabX1, h: 0.6, d: W - 0.34, x: (cabX1 + hoodX1) / 2, y: y0 + 0.3, z: zc, radius: 0.04, segments: 1, material: M.body });
  addRoundedBox(parent, { w: cabX1 - boxX1 + 0.06, h: 0.12, d: W - 0.12, x: (boxX1 + cabX1) / 2, y: y0 + cabH + 0.04, z: zc, radius: 0.03, segments: 1, material: M.body });

  addBox(parent, { w: 0.05, h: cabH * 0.64, d: W - 0.42, x: cabX1 + 0.005, y: y0 + cabH * 0.64, z: zc, material: M.glass });
  for (const z of [0.07, W - 0.07]) {
    addBox(parent, { w: (cabX1 - boxX1) * 0.6, h: cabH * 0.42, d: 0.02, x: (boxX1 + cabX1) / 2, y: y0 + cabH * 0.62, z, material: M.glass });
  }

  for (const z of [-0.008, W + 0.008]) {
    addBox(parent, { w: (boxX1 - boxX0) * 0.98, h: 0.24, d: 0.016, x: (boxX0 + boxX1) / 2, y: y0 + 0.95, z, material: M.red });
  }
  for (const z of [-0.02, W + 0.02]) {
    addBox(parent, { w: 0.16, h: 0.5, d: 0.024, x: 1.7, y: y0 + 1.35, z, material: M.red });
    addBox(parent, { w: 0.5, h: 0.16, d: 0.02, x: 1.7, y: y0 + 1.35, z, material: M.red });
    for (let i = 0; i < 8; i++) {
      addBox(parent, { w: 0.1, h: 0.15, d: 0.014, x: 0.64 + i * 0.16, y: y0 + 1.75, z, material: M.dark });
    }
  }
  for (const z of [-0.02, W + 0.02]) {
    addBox(parent, { w: 0.14, h: 0.12, d: 0.02, x: boxX1 - 0.18, y: y0 + 1.5, z, material: M.red });
    addBox(parent, { w: 0.14, h: 0.12, d: 0.02, x: boxX1 - 0.42, y: y0 + 1.5, z, material: M.blue });
  }

  for (const z of [W / 2 - 0.03, W / 2 + 0.03]) {
    addBox(parent, { w: 0.02, h: boxH - 0.34, d: 0.02, x: boxX0 - 0.01, y: y0 + boxH / 2, z, material: M.dark });
  }
  for (const z of [W * 0.3, W * 0.7]) {
    addBox(parent, { w: 0.024, h: 0.44, d: 0.14, x: boxX0 - 0.012, y: y0 + 1.3, z, material: M.red });
    addBox(parent, { w: 0.02, h: 0.14, d: 0.44, x: boxX0 - 0.012, y: y0 + 1.3, z, material: M.red });
    addBox(parent, { w: 0.02, h: 0.12, d: 0.14, x: boxX0 - 0.012, y: boxTop - 0.06, z, material: M.red });
  }
  for (let i = 0; i < 8; i++) {
    addBox(parent, { w: 0.014, h: 0.14, d: 0.1, x: boxX0 - 0.012, y: y0 + 1.75, z: 0.52 + i * 0.16, material: M.dark });
  }

  addBox(parent, { w: 0.05, h: 0.3, d: W - 0.6, x: hoodX1 + 0.005, y: y0 + 0.32, z: zc, material: M.dark });
  for (const z of [W * 0.22, W * 0.78]) {
    addBox(parent, { w: 0.05, h: 0.1, d: 0.22, x: hoodX1 + 0.02, y: y0 + 0.34, z, material: M.light });
  }
  for (const z of [W * 0.16, W * 0.84]) {
    addBox(parent, { w: 0.05, h: 0.12, d: 0.16, x: hoodX1 + 0.01, y: y0 + 0.5, z, material: z < zc ? M.red : M.blue });
  }
  addRoundedBox(parent, { w: 0.18, h: 0.3, d: W - 0.1, x: hoodX1 + 0.07, y: y0 + 0.16, z: zc, radius: 0.05, segments: 1, material: M.dark });
  addRoundedBox(parent, { w: 0.16, h: 0.3, d: W - 0.1, x: boxX0 - 0.06, y: y0 + 0.16, z: zc, radius: 0.05, segments: 1, material: M.dark });

  lightBar(parent, { x: boxX1 - 0.55, y: boxTop + 0.06, z: zc, len: W * 0.82, M });
  for (const z of [W * 0.3, W * 0.7]) {
    addCylinder(parent, { rTop: 0.02, rBottom: 0.02, h: 0.5, x: boxX0 + 0.55, y: boxTop + 0.25, z, material: M.dark, segments: 6 });
  }

  const wr = 0.32;
  const ww = 0.2;
  for (const x of [3.45, 0.9]) {
    for (const z of [-0.02, W + 0.02]) {
      addRoundedBox(parent, { w: wr * 2.5, h: wr * 0.9, d: 0.12, x, y: y0 + wr * 0.75, z, radius: 0.03, segments: 1, material: M.body });
    }
  }
  const zL = ww / 2 - 0.06;
  const zR = W - ww / 2 + 0.06;
  for (const x of [3.45, 0.9]) {
    for (const z of [zL, zR]) addWheel(parent, { x, z, r: wr, w: ww, tire: M.tire, hub: M.hub });
  }
}

// Minivan: a single extruded side profile ("one modified rectangle") — tall,
// short sloped hood, big windshield, flat vertical back, flush sides.
function buildMinivan(parent, spec) {
  const L = spec.w;
  const W = spec.d;
  const M = palette(spec);
  const y0 = 0.3;
  const yHood = 0.86;
  const yRoof = 1.8;
  const frontX = L - 0.06;
  const rearX = 0.06;
  const bev = 0.04;

  const shape = new THREE.Shape();
  shape.moveTo(rearX, y0);
  shape.lineTo(frontX, y0);
  shape.lineTo(frontX, yHood);
  shape.lineTo(frontX - 0.5, yHood);
  shape.lineTo(frontX - 1.42, yRoof);
  shape.lineTo(rearX + 0.08, yRoof);
  shape.lineTo(rearX, yRoof - 0.08);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, { depth: W - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 1, curveSegments: 1, steps: 1 });
  const body = new THREE.Mesh(geo, mat(spec.color ?? [180, 180, 190], { side: THREE.DoubleSide }));
  body.position.set(0, 0, bev);
  body.castShadow = true;
  body.receiveShadow = true;
  parent.add(body);

  const x1 = frontX - 0.5;
  const x2 = frontX - 1.42;
  const sl = Math.hypot(x2 - x1, yRoof - yHood);
  const ang = Math.atan2(yRoof - yHood, x2 - x1);
  const nlen = Math.hypot(yRoof - yHood, x2 - x1);
  const nx = (yRoof - yHood) / nlen;
  const ny = -(x2 - x1) / nlen;
  const ws = addBox(parent, { w: sl - 0.06, h: 0.06, d: W - 0.28, x: (x1 + x2) / 2 + nx * 0.02, y: (yHood + yRoof) / 2 + ny * 0.02, z: W / 2, material: M.glass });
  ws.rotation.z = ang;

  const gcy = (yHood + yRoof) / 2 + 0.06;
  const gH = (yRoof - yHood) * 0.5;
  const rearPane = [rearX + 0.16, 1.15];
  const frontPane = [1.35, frontX - 1.54];
  for (const z of [-0.006, W + 0.006]) {
    for (const p of [rearPane, frontPane]) {
      addBox(parent, { w: p[1] - p[0], h: gH, d: 0.012, x: (p[0] + p[1]) / 2, y: gcy, z, material: M.glass });
    }
  }
  addBox(parent, { w: 0.05, h: (yRoof - yHood) * 0.62, d: W - 0.34, x: rearX + 0.02, y: gcy, z: W / 2, material: M.glass });

  addBox(parent, { w: 0.05, h: 0.32, d: W - 0.6, x: frontX + 0.005, y: y0 + 0.34, z: W / 2, material: M.dark });
  for (const z of [W * 0.2, W * 0.8]) {
    addBox(parent, { w: 0.05, h: 0.12, d: 0.3, x: frontX + 0.02, y: yHood - 0.16, z, material: M.light });
    addBox(parent, { w: 0.05, h: 0.14, d: 0.24, x: rearX - 0.02, y: y0 + 0.5, z, material: M.tail });
  }
  addRoundedBox(parent, { w: 0.18, h: 0.28, d: W - 0.08, x: frontX + 0.07, y: y0 + 0.14, z: W / 2, radius: 0.06, segments: 1, material: M.dark });
  addRoundedBox(parent, { w: 0.18, h: 0.28, d: W - 0.08, x: rearX - 0.07, y: y0 + 0.14, z: W / 2, radius: 0.06, segments: 1, material: M.dark });

  for (const side of [-1, 1]) {
    const zs = side < 0 ? 0 : W;
    addBox(parent, { w: 0.04, h: 0.03, d: 0.09, x: frontX - 0.62, y: gcy + 0.16, z: zs + side * 0.04, material: M.dark });
    addBox(parent, { w: 0.1, h: 0.09, d: 0.05, x: frontX - 0.62, y: gcy + 0.16, z: zs + side * 0.12, material: M.glass });
  }

  for (const z of [0.18, W - 0.18]) {
    addBox(parent, { w: (frontX - 1.42 - rearX) * 0.92, h: 0.05, d: 0.05, x: (rearX + frontX - 1.42) / 2, y: yRoof + 0.02, z, material: M.dark });
  }

  const wr = 0.28;
  const ww = 0.16;
  for (const x of [L * 0.76, L * 0.24]) {
    for (const z of [-0.02, W + 0.02]) {
      addRoundedBox(parent, { w: wr * 2.4, h: wr * 0.9, d: 0.1, x, y: y0 + wr * 0.8, z, radius: 0.05, segments: 1, material: M.body });
    }
  }
  const zL = ww / 2 - 0.06;
  const zR = W - ww / 2 + 0.06;
  for (const x of [L * 0.76, L * 0.24]) {
    for (const z of [zL, zR]) addWheel(parent, { x, z, r: wr, w: ww, tire: M.tire, hub: M.hub });
  }
}

// Pickup: front cab/hood body + an actually open cargo bed behind the cab.
function buildPickup(parent, spec) {
  const L = spec.w;
  const W = spec.d;
  const M = palette(spec);
  const y0 = 0.36;
  const bodyH = 0.62;
  const cabinH = 0.6;
  const cabX0 = L * 0.46;
  const bedX0 = 0.12;
  const cy = y0 + bodyH + cabinH * 0.55;

  addRoundedBox(parent, { w: L - cabX0, h: bodyH, d: W, x: (cabX0 + L) / 2, y: y0 + bodyH / 2, z: W / 2, radius: 0.09, segments: 2, material: M.body });
  const cX1 = L * 0.78;
  addRoundedBox(parent, { w: cX1 - cabX0, h: cabinH, d: W - 0.08, x: (cabX0 + cX1) / 2, y: y0 + bodyH + cabinH / 2, z: W / 2, radius: 0.1, segments: 2, material: M.body });

  const ws = addBox(parent, { w: 0.05, h: cabinH * 0.7, d: W - 0.24, x: cX1 - 0.02, y: cy, z: W / 2, material: M.glass });
  ws.rotation.z = 0.34;
  const rw = addBox(parent, { w: 0.05, h: cabinH * 0.6, d: W - 0.28, x: cabX0 + 0.02, y: cy, z: W / 2, material: M.glass });
  rw.rotation.z = -0.42;
  for (const z of [0.06, W - 0.06]) {
    addBox(parent, { w: (cX1 - cabX0) * 0.8, h: cabinH * 0.45, d: 0.02, x: (cabX0 + cX1) / 2, y: cy, z, material: M.glass });
  }
  for (const z of [W * 0.24, W * 0.76]) {
    addRoundedBox(parent, { w: 0.06, h: 0.15, d: 0.2, x: L - 0.02, y: y0 + bodyH * 0.62, z, radius: 0.02, material: M.light });
  }
  addBox(parent, { w: 0.05, h: bodyH * 0.5, d: W - 0.4, x: L - 0.005, y: y0 + bodyH * 0.5, z: W / 2, material: M.dark });

  const floorY = y0 + 0.16;
  const wallTop = y0 + bodyH;
  const bedLen = cabX0 - bedX0;
  const midX = (bedX0 + cabX0) / 2;
  addBox(parent, { w: bedLen - 0.08, h: 0.16, d: W - 0.28, x: midX, y: y0 + 0.08, z: W / 2, material: M.dark });
  addBox(parent, { w: bedLen - 0.02, h: 0.06, d: W - 0.16, x: midX, y: floorY, z: W / 2, material: M.dark });
  for (const z of [0.08, W - 0.08]) {
    addBox(parent, { w: bedLen, h: wallTop - floorY, d: 0.06, x: midX, y: (floorY + wallTop) / 2, z, material: M.body });
  }
  addBox(parent, { w: 0.06, h: 0.5, d: W - 0.24, x: bedX0, y: 0.75, z: W / 2, material: M.body });
  for (const z of [W * 0.2, W * 0.8]) {
    addRoundedBox(parent, { w: 0.03, h: 0.12, d: 0.16, x: bedX0 - 0.02, y: y0 + bodyH * 0.6, z, radius: 0.02, material: M.tail });
  }

  const zL = 0.08 - 0.02;
  const zR = W - 0.08 + 0.02;
  for (const x of [L * 0.76, L * 0.24]) {
    for (const z of [zL, zR]) {
      addWheel(parent, { x, z, r: 0.29, w: 0.16, tire: M.tire, hub: M.hub });
    }
  }
}

function buildBoxVehicle(parent, spec) {
  const type = spec.type;
  const L = spec.w;
  const W = spec.d;
  const M = palette(spec);
  const y0 = 0.32;
  const cabLen = type === "fire-engine" ? 1.1 : 0.9;
  const boxLen = L - cabLen - 0.14;
  const boxH = type === "fire-engine" ? 2.0 : 1.45;
  const cabH = type === "fire-engine" ? 1.5 : 1.35;

  addRoundedBox(parent, { w: boxLen, h: boxH, d: W, x: boxLen / 2 + 0.12, y: y0 + boxH / 2, z: W / 2, radius: 0.06, segments: 1, material: M.body });
  const cabX = L - cabLen / 2;
  addRoundedBox(parent, { w: cabLen, h: cabH, d: W - 0.06, x: cabX, y: y0 + cabH / 2, z: W / 2, radius: 0.08, segments: 1, material: M.body });

  const ws = addBox(parent, { w: 0.05, h: cabH * 0.55, d: W - 0.24, x: L - 0.02, y: y0 + cabH * 0.62, z: W / 2, material: M.glass });
  ws.rotation.z = 0.3;
  for (const z of [0.06, W - 0.06]) {
    addBox(parent, { w: cabLen * 0.7, h: cabH * 0.42, d: 0.02, x: cabX, y: y0 + cabH * 0.6, z, material: M.glass });
  }

  addBox(parent, { w: 0.06, h: boxH * 0.7, d: 0.03, x: 0.14, y: y0 + boxH * 0.5, z: W / 2, material: M.dark });
  for (const z of [W * 0.24, W * 0.76]) {
    addRoundedBox(parent, { w: 0.05, h: 0.13, d: 0.18, x: 0.01, y: y0 + 0.5, z, radius: 0.03, material: M.tail });
  }
  for (const z of [W * 0.24, W * 0.76]) {
    addRoundedBox(parent, { w: 0.06, h: 0.13, d: 0.2, x: L - 0.02, y: y0 + 0.5, z, radius: 0.03, material: M.light });
  }

  if (type === "fire-engine") {
    for (const z of [-0.006, W + 0.006]) {
      addBox(parent, { w: L * 0.9, h: 0.22, d: 0.02, x: L / 2, y: y0 + boxH * 0.62, z, material: M.stripe });
    }
  }

  const logoA = mat([80, 58, 150]);
  const logoB = mat([232, 120, 40]);
  for (const side of [-1, 1]) {
    const zs = side < 0 ? 0 : W;
    const out = side < 0 ? -1 : 1;
    const sdX = boxLen * 0.55;
    const sdW = boxLen * 0.5;
    const sdY = y0 + boxH * 0.45;
    const sdH = boxH * 0.66;
    addBox(parent, { w: sdW, h: sdH, d: 0.03, x: sdX, y: sdY, z: zs + out * 0.02, material: M.body });
    addBox(parent, { w: sdW, h: 0.02, d: 0.012, x: sdX, y: sdY + sdH * 0.24, z: zs + out * 0.032, material: M.dark });
    addBox(parent, { w: sdW, h: 0.02, d: 0.012, x: sdX, y: sdY - sdH * 0.24, z: zs + out * 0.032, material: M.dark });
    addBox(parent, { w: 0.14, h: 0.05, d: 0.03, x: sdX - sdW * 0.36, y: sdY, z: zs + out * 0.035, material: M.dark });
    addRoundedBox(parent, { w: 0.6, h: 0.4, d: 0.05, x: sdX, y: sdY + 0.02, z: zs + out * 0.045, radius: 0.05, segments: 1, material: logoA });
    addBox(parent, { w: 0.28, h: 0.4, d: 0.06, x: sdX + 0.44, y: sdY + 0.02, z: zs + out * 0.045, material: logoB });
  }

  const wheelW = 0.16;
  const zL = wheelW / 2 - 0.02;
  const zR = W - wheelW / 2 + 0.02;
  const front = type === "fire-engine" ? 0.78 : 0.76;
  for (const x of [L * front, L * 0.3]) {
    for (const z of [zL, zR]) {
      addWheel(parent, { x, z, r: type === "fire-engine" ? 0.32 : 0.26, w: wheelW, tire: M.tire, hub: M.hub });
    }
  }
}

function buildMotorcycle(parent, spec) {
  const L = spec.w;
  const W = spec.d;
  const M = palette(spec);
  const zc = W / 2;
  addWheel(parent, { x: L - 0.32, z: zc, r: 0.24, w: 0.1, tire: M.tire, hub: M.hub });
  addWheel(parent, { x: 0.32, z: zc, r: 0.24, w: 0.1, tire: M.tire, hub: M.hub });
  addRoundedBox(parent, { w: L * 0.55, h: 0.12, d: 0.12, x: L / 2, y: 0.48, z: zc, radius: 0.04, material: M.dark });
  addRoundedBox(parent, { w: 0.5, h: 0.26, d: 0.26, x: L * 0.6, y: 0.62, z: zc, radius: 0.08, material: M.body });
  addRoundedBox(parent, { w: 0.46, h: 0.12, d: 0.22, x: L * 0.34, y: 0.66, z: zc, radius: 0.06, material: M.dark });
  addBox(parent, { w: 0.06, h: 0.34, d: 0.06, x: L * 0.82, y: 0.5, z: zc, material: M.dark });
  addBox(parent, { w: 0.06, h: 0.06, d: 0.42, x: L * 0.84, y: 0.78, z: zc, material: M.dark });
  addCylinder(parent, { rTop: 0.08, rBottom: 0.08, h: 0.08, x: L * 0.9, y: 0.7, z: zc, material: M.light, segments: 10, rotation: [0, 0, Math.PI / 2] });
}
