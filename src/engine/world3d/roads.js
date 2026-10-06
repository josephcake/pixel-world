import * as THREE from "three";
import { mat, addBox, addCylinder } from "./materials.js";

// Modular two-way road kit. Universal tile + socket dimensions:
//   TILE   = 4.0  (every piece fits exactly one tile, x/z in [0, TILE])
//   SW     = 0.7  sidewalk width (each edge) -> total 2*SW
//   ROAD   = 2.6  asphalt width (constant), LANE = 1.3 (one per direction)
//   ASPH   = 0.05 asphalt top;  WALK = 0.19 sidewalk top (curb = 0.14 step)
// Every edge socket is: sidewalk [0, SW], road [SW, TILE-SW], sidewalk [SW..].
// Compass: N = -z, S = +z, W = -x, E = +x.

export const TILE = 4;
const SW = 0.7;
const ROAD = 2.6;
const HALF = ROAD / 2;
const MID = TILE / 2;
const B = TILE - SW;
const ASPH = 0.05;
const WALK = 0.19;

const MATS = {
  asphalt: mat([62, 64, 70], { roughness: 0.98 }),
  patch: mat([54, 56, 62], { roughness: 0.98 }),
  walk: mat([150, 150, 148], { roughness: 0.95 }),
  curb: mat([120, 122, 126], { roughness: 0.95 }),
  dark: mat([44, 47, 53], { roughness: 0.9 }),
  yellow: mat([226, 212, 118]),
  white: mat([232, 232, 226]),
};

function slab(parent, x0, z0, x1, z1, h, y0, material) {
  addBox(parent, { w: x1 - x0, h, d: z1 - z0, x: (x0 + x1) / 2, y: y0 + h / 2, z: (z0 + z1) / 2, material });
}

// Extrude a polygon (points in x/z, y-up). Points are given as [x, z].
function polySlab(parent, pts, h, y0, material) {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], -pts[0][1]);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], -pts[i][1]);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 1, steps: 1 });
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.y = y0;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function asphalt(parent, pts) {
  polySlab(parent, pts, ASPH, 0, MATS.asphalt);
}
function walk(parent, pts) {
  polySlab(parent, pts, WALK, 0, MATS.walk);
}
function asphaltRect(parent, x0, z0, x1, z1) {
  slab(parent, x0, z0, x1, z1, ASPH, 0, MATS.asphalt);
}
function walkRect(parent, x0, z0, x1, z1) {
  slab(parent, x0, z0, x1, z1, WALK, 0, MATS.walk);
}

function arc(cx, cz, r, a0, a1, n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return out;
}

// --- markings -------------------------------------------------------------

function lineZ(parent, x, z0, z1, w, y, material) {
  addBox(parent, { w, h: 0.012, d: z1 - z0, x, y, z: (z0 + z1) / 2, material });
}
function lineX(parent, z, x0, x1, w, y, material) {
  addBox(parent, { w: x1 - x0, h: 0.012, d: w, x: (x0 + x1) / 2, y, z, material });
}
function dashesZ(parent, x, z0, z1, w, y, material, on = 0.42, off = 0.36) {
  for (let z = z0; z < z1 - 0.05; z += on + off) {
    lineZ(parent, x, z, Math.min(z + on, z1), w, y, material);
  }
}
function dashesX(parent, z, x0, x1, w, y, material, on = 0.42, off = 0.36) {
  for (let x = x0; x < x1 - 0.05; x += on + off) {
    lineX(parent, z, x, Math.min(x + on, x1), w, y, material);
  }
}
function crosswalkX(parent, z0, z1, x0, x1) {
  for (let x = x0 + 0.14; x < x1 - 0.2; x += 0.44) {
    lineX(parent, (z0 + z1) / 2, x, x + 0.26, z1 - z0, ASPH + 0.008, MATS.white);
  }
}
function crosswalkZ(parent, x0, x1, z0, z1) {
  for (let z = z0 + 0.14; z < z1 - 0.2; z += 0.44) {
    lineZ(parent, (x0 + x1) / 2, z, z + 0.26, x1 - x0, ASPH + 0.008, MATS.white);
  }
}
function manhole(parent, x, z) {
  addCylinder(parent, { rTop: 0.17, rBottom: 0.17, h: 0.02, x, y: ASPH + 0.005, z, material: MATS.dark, segments: 12 });
  addCylinder(parent, { rTop: 0.14, rBottom: 0.14, h: 0.012, x, y: ASPH + 0.014, z, material: mat([70, 72, 78]), segments: 12 });
}
function patch(parent, x, z, w, d) {
  addBox(parent, { w, h: 0.01, d, x, y: ASPH + 0.002, z, material: MATS.patch });
}
function crack(parent, x, z, w, d, rot) {
  const m = addBox(parent, { w, h: 0.008, d, x, y: ASPH + 0.004, z, material: MATS.dark });
  m.rotation.y = rot;
}

// --- straight roads -------------------------------------------------------

function straightZ(parent) {
  asphaltRect(parent, SW, 0, B, TILE);
  walkRect(parent, 0, 0, SW, TILE);
  walkRect(parent, B, 0, TILE, TILE);
  dashesZ(parent, MID, 0, TILE, 0.09, ASPH + 0.01, MATS.yellow);
  lineZ(parent, SW + 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineZ(parent, B - 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  manhole(parent, MID - 0.6, 1.2);
  patch(parent, MID + 0.5, 2.8, 0.5, 0.4);
  crack(parent, MID - 0.2, 3.2, 0.6, 0.02, 0.3);
}

function straightX(parent) {
  asphaltRect(parent, 0, SW, TILE, B);
  walkRect(parent, 0, 0, TILE, SW);
  walkRect(parent, 0, B, TILE, TILE);
  dashesX(parent, MID, 0, TILE, 0.09, ASPH + 0.01, MATS.yellow);
  lineX(parent, SW + 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, B - 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  manhole(parent, 1.2, MID - 0.6);
  patch(parent, 2.8, MID + 0.5, 0.4, 0.5);
  crack(parent, 3.2, MID - 0.2, 0.02, 0.6, -0.3);
}

// --- 90-degree corners ----------------------------------------------------

function cornerPoints() {
  const C = [0, TILE];
  const Ro = MID + HALF;
  const Ri = MID - HALF;
  const asphaltPts = [...arc(C[0], C[1], Ro, -Math.PI / 2, 0, 6), ...arc(C[0], C[1], Ri, 0, -Math.PI / 2, 6)];
  const outerWalk = [[0, SW], [B, SW], [B, TILE], ...arc(C[0], C[1], Ro, 0, -Math.PI / 2, 6)];
  const innerWalk = [...arc(C[0], C[1], Ri, -Math.PI / 2, 0, 6), [0, TILE]];
  const centerLine = [...arc(C[0], C[1], MID + 0.05, -Math.PI / 2, 0, 6), ...arc(C[0], C[1], MID - 0.05, 0, -Math.PI / 2, 6)];
  return { asphaltPts, outerWalk, innerWalk, centerLine };
}

function buildCorner(parent, variant) {
  const { asphaltPts, outerWalk, innerWalk, centerLine } = cornerPoints();
  const tf = (p) => {
    let x = p[0];
    let z = p[1];
    if (variant === "br" || variant === "tr") x = TILE - x;
    if (variant === "tl" || variant === "tr") z = TILE - z;
    return [x, z];
  };
  asphalt(parent, asphaltPts.map(tf));
  walk(parent, outerWalk.map(tf));
  walk(parent, innerWalk.map(tf));
  walkRect(parent, 0, 0, B, SW);
  walkRect(parent, B, 0, TILE, TILE);
  polySlab(parent, centerLine.map(tf), 0.012, ASPH + 0.005, MATS.yellow);
}

// --- crossroad ------------------------------------------------------------

function crossBase(parent) {
  asphaltRect(parent, SW, SW, B, B);
  asphaltRect(parent, SW, 0, B, SW);
  asphaltRect(parent, SW, B, B, TILE);
  asphaltRect(parent, 0, SW, SW, B);
  asphaltRect(parent, B, SW, TILE, B);
  walkRect(parent, 0, 0, SW, SW);
  walkRect(parent, B, 0, TILE, SW);
  walkRect(parent, 0, B, SW, TILE);
  walkRect(parent, B, B, TILE, TILE);
}

function crossMarkings(parent, crosswalks) {
  if (crosswalks) {
    crosswalkZ(parent, SW, B, SW - 0.34, SW);
    crosswalkZ(parent, SW, B, TILE - SW, TILE - SW + 0.34);
    crosswalkX(parent, SW - 0.34, SW, SW, B);
    crosswalkX(parent, TILE - SW, SW, B, B);
  }
  lineZ(parent, SW + 0.08, 0, SW - 0.45, 0.06, ASPH + 0.01, MATS.white);
  lineZ(parent, B - 0.08, 0, SW - 0.45, 0.06, ASPH + 0.01, MATS.white);
  lineZ(parent, SW + 0.08, B + 0.45, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineZ(parent, B - 0.08, B + 0.45, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, SW + 0.08, 0, SW - 0.45, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, B - 0.08, 0, SW - 0.45, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, SW + 0.08, B + 0.45, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, B - 0.08, B + 0.45, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, MID, 0, SW - 0.5, 0.3, ASPH + 0.01, MATS.white);
  lineX(parent, MID, B + 0.5, TILE, 0.3, ASPH + 0.01, MATS.white);
  lineZ(parent, MID, 0, SW - 0.5, 0.3, ASPH + 0.01, MATS.white);
  lineZ(parent, MID, B + 0.5, TILE, 0.3, ASPH + 0.01, MATS.white);
  manhole(parent, MID, MID);
}

function cross(parent) {
  crossBase(parent);
  crossMarkings(parent, true);
}

// --- T-junctions ----------------------------------------------------------

function teeZ(parent) {
  asphaltRect(parent, SW, SW, B, B);
  asphaltRect(parent, SW, 0, B, SW);
  asphaltRect(parent, 0, SW, SW, B);
  asphaltRect(parent, B, SW, TILE, B);
  walkRect(parent, 0, B, SW, TILE);
  walkRect(parent, B, B, TILE, TILE);
  walkRect(parent, 0, 0, SW, SW);
  walkRect(parent, B, 0, TILE, SW);
  dashesZ(parent, MID, 0, SW - 0.35, 0.09, ASPH + 0.01, MATS.yellow);
  lineX(parent, SW - 0.18, SW + 0.08, B - 0.08, 0.24, ASPH + 0.01, MATS.white);
  lineX(parent, SW + 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, B - 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  manhole(parent, MID, MID - 0.5);
}

function teeX(parent) {
  asphaltRect(parent, SW, SW, B, B);
  asphaltRect(parent, 0, SW, SW, B);
  asphaltRect(parent, B, SW, TILE, B);
  asphaltRect(parent, SW, B, B, TILE);
  walkRect(parent, B, 0, TILE, SW);
  walkRect(parent, B, B, TILE, TILE);
  walkRect(parent, 0, 0, SW, SW);
  walkRect(parent, 0, B, SW, TILE);
  dashesX(parent, MID, 0, SW - 0.35, 0.09, ASPH + 0.01, MATS.yellow);
  lineZ(parent, SW - 0.18, SW + 0.08, B - 0.08, 0.24, ASPH + 0.01, MATS.white);
  lineZ(parent, SW + 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineZ(parent, B - 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  manhole(parent, MID - 0.5, MID);
}

// --- dead end -------------------------------------------------------------

function deadEnd(parent) {
  asphaltRect(parent, SW, 0, B, MID + 0.4);
  walkRect(parent, 0, 0, SW, MID + 0.9);
  walkRect(parent, B, 0, TILE, MID + 0.9);
  walkRect(parent, 0, MID + 0.9, TILE, TILE);
  walkRect(parent, SW, MID + 0.4, B, MID + 0.9);
  dashesZ(parent, MID, 0, MID - 0.3, 0.09, ASPH + 0.01, MATS.yellow);
  lineZ(parent, SW + 0.08, 0, MID + 0.3, 0.06, ASPH + 0.01, MATS.white);
  lineZ(parent, B - 0.08, 0, MID + 0.3, 0.06, ASPH + 0.01, MATS.white);
  manhole(parent, MID, 1.0);
}

// --- roundabout -----------------------------------------------------------

function roundabout(parent) {
  crossBase(parent);
  addCylinder(parent, { rTop: 1.04, rBottom: 1.04, h: 0.012, x: MID, y: ASPH + 0.004, z: MID, material: MATS.dark, segments: 20 });
  addCylinder(parent, { rTop: 0.92, rBottom: 0.92, h: WALK, x: MID, y: 0, z: MID, material: MATS.walk, segments: 20 });
  addCylinder(parent, { rTop: 0.12, rBottom: 0.12, h: 0.02, x: MID, y: WALK, z: MID, material: MATS.dark, segments: 8 });
}

// --- Y junction -----------------------------------------------------------

function yJunction(parent) {
  asphaltRect(parent, SW, 0, B, MID - 0.4);
  const tri = [[MID, MID - 0.4], [0, TILE], [TILE, TILE]];
  asphalt(parent, [[B, MID - 0.4], [B, TILE], [SW, TILE], [SW, MID - 0.4]]);
  asphalt(parent, tri);
  walkRect(parent, 0, 0, SW, MID);
  walkRect(parent, B, 0, TILE, MID);
  walkRect(parent, 0, MID, SW, TILE);
  walkRect(parent, B, MID, TILE, TILE);
  dashesZ(parent, MID, 0, MID - 0.7, 0.09, ASPH + 0.01, MATS.yellow);
  manhole(parent, MID, 0.9);
}

// --- offset / staggered intersection -------------------------------------

function staggered(parent) {
  asphaltRect(parent, SW, SW, B, B);
  asphaltRect(parent, 0, SW, SW, B);
  asphaltRect(parent, B, SW, TILE, B);
  asphaltRect(parent, SW, 0, B, SW);
  asphaltRect(parent, SW, B, B, TILE);
  walkRect(parent, 0, 0, SW, SW);
  walkRect(parent, B, 0, TILE, SW);
  walkRect(parent, 0, B, SW, TILE);
  walkRect(parent, B, B, TILE, TILE);
  lineX(parent, SW + 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
  lineX(parent, B - 0.08, 0, TILE, 0.06, ASPH + 0.01, MATS.white);
}

// --- transition -----------------------------------------------------------

function transition(parent) {
  straightX(parent);
  // concrete end half over the asphalt
  slab(parent, MID, SW, TILE, B, 0.012, ASPH, mat([150, 148, 144], { roughness: 1 }));
  lineX(parent, MID, SW, B, 0.05, ASPH + 0.02, MATS.dark);
}

// --- detailed intersection with turning geometry --------------------------

function intersection(parent) {
  cross(parent);
}

// --- dispatcher -----------------------------------------------------------

export function buildRoad(parent, spec) {
  switch (spec?.roadType) {
    case "straight-z":
      straightZ(parent);
      return true;
    case "straight-x":
      straightX(parent);
      return true;
    case "corner-bl":
    case "corner-br":
    case "corner-tl":
    case "corner-tr":
      buildCorner(parent, spec.roadType.slice(7));
      return true;
    case "cross":
      cross(parent);
      return true;
    case "tee-z":
      teeZ(parent);
      return true;
    case "tee-x":
      teeX(parent);
      return true;
    case "dead-end":
      deadEnd(parent);
      return true;
    case "roundabout":
      roundabout(parent);
      return true;
    case "y-junction":
      yJunction(parent);
      return true;
    case "staggered":
      staggered(parent);
      return true;
    case "transition":
      transition(parent);
      return true;
    case "intersection":
      intersection(parent);
      return true;
    default:
      return false;
  }
}
