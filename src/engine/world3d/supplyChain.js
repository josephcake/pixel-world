import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mat, shade, addBox, addCylinder } from "./materials.js";

// Low-poly supply-chain assets (semi truck, box truck, shipping container).
// Bodies are clean sharp boxes; only the truck FRONTS (hood, fascia, bumper)
// get chamfered/rounded corners. Flat-shaded throughout.
// Local coords: length along +x, width along z, up +y, resting on y=0.

function addFrontRound(parent, { w, h, d, x, y, z, material, radius = 0.06, segments = 2 }) {
  const minDim = Math.min(w, h, d);
  const rr = Math.max(0.004, Math.min(radius, minDim * 0.3));
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, rr), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addWheel(parent, { x, z, r, w, tire, hub }) {
  const pts = [
    new THREE.Vector2(r * 0.7, -w / 2),
    new THREE.Vector2(r * 0.95, -w / 2 + 0.02),
    new THREE.Vector2(r, -w / 2 + 0.07),
    new THREE.Vector2(r, w / 2 - 0.07),
    new THREE.Vector2(r * 0.95, w / 2 - 0.02),
    new THREE.Vector2(r * 0.7, w / 2),
  ];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), tire);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, r, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  addCylinder(parent, { rTop: r * 0.72, rBottom: r * 0.72, h: w * 0.9, x, y: r, z, material: hub, segments: 12, rotation: [Math.PI / 2, 0, 0] });
}

function addMirror(parent, { x, y, z, dir, arm, glass }) {
  addBox(parent, { w: 0.04, h: 0.04, d: 0.16, x, y, z: z + dir * 0.08, material: arm });
  addBox(parent, { w: 0.09, h: 0.2, d: 0.05, x, y, z: z + dir * 0.17, material: glass });
}

function addEdges(parent, mesh, color = 0x33373f) {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry, 45),
    new THREE.LineBasicMaterial({ color }),
  );
  edges.position.copy(mesh.position);
  edges.quaternion.copy(mesh.quaternion);
  edges.scale.copy(mesh.scale);
  edges.renderOrder = 1;
  parent.add(edges);
  return edges;
}

function tuneWheels(parent, { r, w, Wd, xs, M }) {
  for (const x of xs) {
    for (const z of [0.075, Wd - 0.075]) {
      addWheel(parent, { x, z, r, w, tire: M.wheel, hub: M.hub });
    }
  }
}

// --- Semi truck -----------------------------------------------------------

function buildSemiTruck(parent, spec) {
  const L = spec.w;
  const Wd = spec.d;
  const cabC = spec.cabColor ?? [58, 110, 168];
  const boxC = spec.boxColor ?? [230, 233, 237];
  const M = {
    cab: mat(cabC),
    box: mat(boxC),
    boxDark: mat(shade(boxC, 0.92)),
    dark: mat([40, 43, 50], { roughness: 0.85 }),
    glass: mat([70, 100, 128], { metalness: 0.4, roughness: 0.15 }),
    light: mat([250, 244, 200]),
    chassis: mat([52, 56, 64]),
    wheel: mat([32, 34, 40], { roughness: 0.92 }),
    hub: mat([178, 182, 188], { metalness: 0.5, roughness: 0.35 }),
    metal: mat([150, 155, 162], { metalness: 0.5, roughness: 0.4 }),
    tail: mat([190, 60, 54]),
  };

  const r = 0.21;
  const w = 0.18;
  const sz = Wd / 2;

  addBox(parent, { w: L - 0.28, h: 0.16, d: 0.42, x: L / 2, y: 0.34, z: sz, material: M.chassis });

  const tX0 = 0.14;
  const tX1 = L * 0.7;
  addEdges(parent, addBox(parent, { w: tX1 - tX0, h: 1.06, d: Wd - 0.06, x: (tX0 + tX1) / 2, y: 0.97, z: sz, material: M.box }));
  addBox(parent, { w: tX1 - tX0 - 0.04, h: 0.12, d: Wd - 0.14, x: (tX0 + tX1) / 2, y: 0.44, z: sz, material: M.chassis });
  addBox(parent, { w: 0.07, h: 0.96, d: Wd - 0.2, x: tX0 - 0.02, y: 0.97, z: sz, material: M.boxDark });
  addBox(parent, { w: 0.03, h: 0.9, d: 0.04, x: tX0 - 0.05, y: 0.97, z: sz, material: M.dark });
  addBox(parent, { w: 0.13, h: 0.18, d: Wd - 0.12, x: tX0 - 0.04, y: 0.34, z: sz, material: M.chassis });
  for (const z of [0.24, Wd - 0.24]) {
    addBox(parent, { w: 0.05, h: 0.1, d: 0.14, x: tX0 - 0.09, y: 0.4, z, material: M.tail });
  }

  const cX0 = L * 0.74;
  const cX1 = L - 0.4;
  const cabW = cX1 - cX0;
  const cabZ = Wd - 0.08;
  addEdges(parent, addBox(parent, { w: cabW, h: 1.2, d: cabZ, x: (cX0 + cX1) / 2, y: 1.02, z: sz, material: M.cab }));

  const hX1 = L - 0.03;
  addFrontRound(parent, { w: hX1 - cX1, h: 0.62, d: cabZ - 0.16, x: (cX1 + hX1) / 2, y: 0.73, z: sz, radius: 0.05, material: M.cab });
  addFrontRound(parent, { w: 0.12, h: 0.5, d: cabZ - 0.24, x: hX1 + 0.02, y: 0.74, z: sz, radius: 0.035, material: M.cab });

  const ws = addBox(parent, { w: 0.06, h: 0.56, d: cabZ - 0.24, x: cX1 + 0.03, y: 1.28, z: sz, material: M.glass });
  ws.rotation.z = 0.22;
  for (const dir of [-1, 1]) {
    const zc = dir < 0 ? 0.05 : Wd - 0.05;
    addBox(parent, { w: cabW * 0.74, h: 0.34, d: 0.04, x: (cX0 + cX1) / 2 - 0.02, y: 1.34, z: zc, material: M.glass });
  }

  addBox(parent, { w: 0.04, h: 0.3, d: cabZ - 0.36, x: hX1 + 0.03, y: 0.66, z: sz, material: M.dark });
  for (const z of [sz - 0.16, sz + 0.16]) {
    addBox(parent, { w: 0.03, h: 0.05, d: 0.2, x: hX1 + 0.045, y: 0.66, z, material: M.metal });
  }
  for (const z of [0.18, Wd - 0.18]) {
    addBox(parent, { w: 0.06, h: 0.15, d: 0.2, x: hX1 + 0.06, y: 0.62, z, material: M.light });
  }
  addFrontRound(parent, { w: 0.18, h: 0.24, d: Wd - 0.02, x: hX1 + 0.09, y: 0.44, z: sz, radius: 0.04, material: M.chassis });

  for (const dir of [-1, 1]) {
    addMirror(parent, { x: cX1 - 0.06, y: 1.36, z: dir < 0 ? 0.04 : Wd - 0.04, dir, arm: M.dark, glass: M.glass });
  }

  addCylinder(parent, { rTop: 0.05, rBottom: 0.05, h: 0.95, x: cX0 - 0.08, y: 0.6, z: Wd - 0.16, material: M.metal, segments: 8 });
  addCylinder(parent, { rTop: 0.05, rBottom: 0.05, h: 0.95, x: cX0 - 0.08, y: 0.6, z: 0.16, material: M.metal, segments: 8 });

  const axles = [L - 0.34, L * 0.72, 1.05, 0.55];
  tuneWheels(parent, { r, w, Wd, xs: axles, M });
}

// --- Box truck ------------------------------------------------------------

function buildBoxTruck(parent, spec) {
  const L = spec.w;
  const Wd = spec.d;
  const cabC = spec.cabColor ?? [60, 160, 150];
  const boxC = spec.boxColor ?? [232, 234, 236];
  const M = {
    cab: mat(cabC),
    box: mat(boxC),
    boxDark: mat(shade(boxC, 0.93)),
    dark: mat([40, 43, 50], { roughness: 0.85 }),
    glass: mat([70, 100, 128], { metalness: 0.4, roughness: 0.15 }),
    light: mat([250, 244, 200]),
    chassis: mat([52, 56, 64]),
    wheel: mat([32, 34, 40], { roughness: 0.92 }),
    hub: mat([178, 182, 188], { metalness: 0.5, roughness: 0.35 }),
    metal: mat([150, 155, 162], { metalness: 0.5, roughness: 0.4 }),
    tail: mat([190, 60, 54]),
  };

  const r = 0.19;
  const w = 0.16;
  const sz = Wd / 2;

  addBox(parent, { w: L - 0.3, h: 0.14, d: 0.4, x: L / 2, y: 0.32, z: sz, material: M.chassis });

  const bX0 = 0.14;
  const bX1 = L - 0.86;
  addEdges(parent, addBox(parent, { w: bX1 - bX0, h: 1.0, d: Wd - 0.06, x: (bX0 + bX1) / 2, y: 0.94, z: sz, material: M.box }));
  addBox(parent, { w: bX1 - bX0 - 0.05, h: 0.12, d: Wd - 0.14, x: (bX0 + bX1) / 2, y: 0.44, z: sz, material: M.chassis });
  addBox(parent, { w: 0.07, h: 0.9, d: Wd - 0.16, x: bX0 - 0.02, y: 0.94, z: sz, material: M.boxDark });
  addBox(parent, { w: 0.03, h: 0.84, d: 0.04, x: bX0 - 0.05, y: 0.94, z: sz, material: M.dark });
  addBox(parent, { w: 0.14, h: 0.04, d: 0.2, x: bX0 - 0.04, y: 0.62, z: sz + 0.22, material: M.metal });
  addBox(parent, { w: 0.12, h: 0.16, d: Wd - 0.1, x: bX0 - 0.04, y: 0.32, z: sz, material: M.chassis });
  for (const z of [0.2, Wd - 0.2]) {
    addBox(parent, { w: 0.05, h: 0.09, d: 0.12, x: bX0 - 0.09, y: 0.38, z, material: M.tail });
  }
  const sdX = (bX0 + bX1) / 2;
  const sdZ = Wd / 2 + (Wd - 0.06) / 2;
  addBox(parent, { w: 0.02, h: 0.52, d: 0.012, x: sdX - 0.25, y: 0.92, z: sdZ, material: M.dark });
  addBox(parent, { w: 0.02, h: 0.52, d: 0.012, x: sdX + 0.25, y: 0.92, z: sdZ, material: M.dark });
  addBox(parent, { w: 0.52, h: 0.02, d: 0.012, x: sdX, y: 1.18, z: sdZ, material: M.dark });
  addBox(parent, { w: 0.52, h: 0.02, d: 0.012, x: sdX, y: 0.66, z: sdZ, material: M.dark });
  addBox(parent, { w: 0.12, h: 0.03, d: 0.02, x: sdX + 0.16, y: 0.86, z: sdZ + 0.014, material: M.metal });

  const cX0 = bX1 + 0.04;
  const cX1 = L - 0.04;
  const cabW = cX1 - cX0;
  const cabZ = Wd - 0.12;
  addEdges(parent, addBox(parent, { w: cabW, h: 0.82, d: cabZ, x: (cX0 + cX1) / 2, y: 0.78, z: sz, material: M.cab }));
  addFrontRound(parent, { w: 0.14, h: 0.66, d: cabZ - 0.06, x: cX1 + 0.02, y: 0.76, z: sz, radius: 0.04, material: M.cab });

  const ws = addBox(parent, { w: 0.06, h: 0.42, d: cabZ - 0.18, x: cX1 - 0.01, y: 1.0, z: sz, material: M.glass });
  ws.rotation.z = 0.24;
  for (const dir of [-1, 1]) {
    const zc = dir < 0 ? 0.05 : Wd - 0.05;
    addBox(parent, { w: cabW * 0.6, h: 0.28, d: 0.04, x: (cX0 + cX1) / 2 - 0.03, y: 1.0, z: zc, material: M.glass });
    addMirror(parent, { x: cX1 - 0.08, y: 1.02, z: dir < 0 ? 0.07 : Wd - 0.07, dir, arm: M.dark, glass: M.glass });
  }

  addBox(parent, { w: 0.04, h: 0.22, d: cabZ - 0.3, x: cX1 + 0.01, y: 0.72, z: sz, material: M.dark });
  for (const z of [sz - 0.14, sz + 0.14]) {
    addBox(parent, { w: 0.03, h: 0.05, d: 0.18, x: cX1 + 0.025, y: 0.72, z, material: M.metal });
  }
  for (const z of [0.19, Wd - 0.19]) {
    addBox(parent, { w: 0.06, h: 0.14, d: 0.18, x: cX1 + 0.04, y: 0.66, z, material: M.light });
  }
  addFrontRound(parent, { w: 0.18, h: 0.22, d: Wd - 0.04, x: cX1 + 0.07, y: 0.44, z: sz, radius: 0.04, material: M.chassis });

  const axles = [L - 0.42, 0.62];
  tuneWheels(parent, { r, w, Wd, xs: axles, M });
}

// --- Shipping container ---------------------------------------------------

function buildContainer(parent, spec) {
  const L = spec.w;
  const Wd = spec.d;
  const H = spec.height;
  const c = spec.color ?? [52, 110, 170];
  const M = {
    body: mat(c),
    rib: mat(shade(c, 1.08)),
    post: mat(shade(c, 0.8)),
    door: mat(shade(c, 0.94)),
    cast: mat([74, 78, 86], { metalness: 0.3, roughness: 0.5 }),
    seam: mat([30, 32, 36]),
  };
  const y0 = 0.2;
  const y1 = H - 0.08;
  const bodyHalf = (Wd - 0.36) / 2;
  const sideZ = [Wd / 2 - bodyHalf, Wd / 2 + bodyHalf];

  addBox(parent, { w: L - 0.36, h: y1 - y0, d: Wd - 0.36, x: L / 2, y: (y0 + y1) / 2, z: Wd / 2, material: M.body });
  addBox(parent, { w: L - 0.48, h: 0.1, d: Wd - 0.48, x: L / 2, y: y1 + 0.03, z: Wd / 2, material: M.post });
  addBox(parent, { w: L - 0.48, h: 0.12, d: Wd - 0.48, x: L / 2, y: y0 - 0.02, z: Wd / 2, material: M.post });

  const ribN = 8;
  const span = L - 0.5;
  for (let i = 0; i < ribN; i++) {
    const x = 0.28 + ((i + 0.5) * span) / ribN;
    addBox(parent, { w: 0.1, h: y1 - y0 - 0.08, d: 0.07, x, y: (y0 + y1) / 2, z: sideZ[0] - 0.025, material: M.rib });
    addBox(parent, { w: 0.1, h: y1 - y0 - 0.08, d: 0.07, x, y: (y0 + y1) / 2, z: sideZ[1] + 0.025, material: M.rib });
  }

  addBox(parent, { w: 0.06, h: y1 - y0 - 0.02, d: Wd - 0.4, x: L - 0.16, y: (y0 + y1) / 2, z: Wd / 2, material: M.door });
  addBox(parent, { w: 0.03, h: y1 - y0 - 0.1, d: 0.06, x: L - 0.12, y: (y0 + y1) / 2, z: Wd / 2, material: M.seam });
  for (const z of [0.24, Wd - 0.24]) {
    addBox(parent, { w: 0.04, h: y1 - y0 - 0.06, d: 0.05, x: L - 0.13, y: (y0 + y1) / 2, z, material: M.seam });
  }

  const px = [0.12, L - 0.12];
  const pz = [0.12, Wd - 0.12];
  for (const x of px) {
    for (const z of pz) {
      addBox(parent, { w: 0.14, h: H - 0.06, d: 0.14, x, y: (H - 0.06) / 2, z, material: M.post });
    }
  }
  for (const x of px) {
    for (const z of pz) {
      for (const y of [0.1, H - 0.1]) {
        addBox(parent, { w: 0.2, h: 0.2, d: 0.2, x, y, z, material: M.cast });
      }
    }
  }
}

export function buildSupplyAsset(parent, spec) {
  if (spec?.type === "semi-truck") {
    buildSemiTruck(parent, spec);
    return true;
  }
  if (spec?.type === "box-truck") {
    buildBoxTruck(parent, spec);
    return true;
  }
  if (spec?.type === "container") {
    buildContainer(parent, spec);
    return true;
  }
  return false;
}
