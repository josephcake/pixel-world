import * as THREE from "three";
import { mat } from "./materials.js";

// Low-poly organic environment assets (trees, bush, grass).
// Flat-shaded faceted forms; deterministic per-instance variation.
// Local coords: origin at the base, up +y.

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

const GREENS = [
  [86, 140, 66],
  [76, 128, 58],
  [98, 150, 72],
];
const CONIFER = [56, 102, 58];
const GRASS_GREEN = [108, 148, 70];

function blob(parent, r, x, y, z, material, rand, squash = 1) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rand() * 3.14, rand() * 3.14, rand() * 3.14);
  mesh.scale.set(1 + (rand() - 0.5) * 0.22, squash * (1 + (rand() - 0.5) * 0.22), 1 + (rand() - 0.5) * 0.22);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function cone(parent, r, h, x, y, z, material, seg = 7) {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function trunk(parent, rTop, rBot, h, x, y, z, material, tilt = 0) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 7), material);
  mesh.position.set(x, y, z);
  mesh.rotation.z = tilt;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function branch(parent, h, x, y, z, material, tilt) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.07, h, 6), material);
  mesh.position.set(x, y, z);
  mesh.rotation.z = tilt;
  mesh.castShadow = true;
  parent.add(mesh);
}

function blade(parent, h, x, y, z, material, tilt, rand) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, h, 0.05), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set((rand() - 0.5) * 0.2, 0, tilt);
  mesh.castShadow = true;
  parent.add(mesh);
}

export function buildNature(parent, spec, seed) {
  const rand = mulberry32(seed >>> 0);
  parent.rotation.y = rand() * Math.PI * 2;
  const s = 0.84 + rand() * 0.36;
  parent.scale.set(s * (0.94 + rand() * 0.12), s * (0.9 + rand() * 0.28), s * (0.94 + rand() * 0.12));

  const trunkM = mat([118, 84, 56]);
  const leafM = mat(GREENS[Math.floor(rand() * GREENS.length)]);
  const leaf2 = mat(GREENS[Math.floor(rand() * GREENS.length)]);
  const coniferM = mat(CONIFER);
  const grassM = mat(GRASS_GREEN);

  switch (spec.type) {
    case "tree-small": {
      trunk(parent, 0.07, 0.1, 0.8, 0, 0.4, 0, trunkM, (rand() - 0.5) * 0.1);
      blob(parent, 0.55, 0, 1.15, 0, leafM, rand);
      blob(parent, 0.4, 0.3, 0.95, 0.16, leaf2, rand);
      break;
    }
    case "tree-medium": {
      trunk(parent, 0.09, 0.14, 1.3, 0, 0.65, 0, trunkM, (rand() - 0.5) * 0.08);
      branch(parent, 0.6, 0.22, 1.15, 0.05, trunkM, -0.7);
      branch(parent, 0.55, -0.2, 1.2, -0.1, trunkM, 0.75);
      blob(parent, 0.8, 0, 2.0, 0, leafM, rand);
      blob(parent, 0.62, 0.55, 1.82, 0.2, leaf2, rand);
      blob(parent, 0.6, -0.5, 1.86, -0.2, leafM, rand);
      blob(parent, 0.55, 0.1, 2.28, -0.36, leaf2, rand);
      break;
    }
    case "tree-large": {
      trunk(parent, 0.13, 0.2, 2.1, 0, 1.05, 0, trunkM, (rand() - 0.5) * 0.06);
      branch(parent, 0.95, 0.4, 1.9, 0.1, trunkM, -0.6);
      branch(parent, 0.9, -0.4, 1.95, -0.12, trunkM, 0.62);
      branch(parent, 0.8, 0.05, 2.2, 0.45, trunkM, -0.35);
      blob(parent, 1.1, 0, 3.3, 0, leafM, rand);
      blob(parent, 0.9, 1.0, 3.02, 0.3, leaf2, rand);
      blob(parent, 0.9, -0.95, 3.06, -0.28, leafM, rand);
      blob(parent, 0.85, 0.2, 3.72, -0.4, leaf2, rand);
      blob(parent, 0.8, -0.3, 3.55, 0.5, leafM, rand);
      break;
    }
    case "tree-blossom":
    case "tree-blossom-white": {
      const white = spec.type === "tree-blossom-white";
      const a = mat(white ? [244, 238, 240] : [232, 152, 178]);
      const b = mat(white ? [236, 226, 230] : [244, 182, 198]);
      const c = mat(white ? [248, 244, 246] : [250, 210, 220]);
      trunk(parent, 0.09, 0.15, 1.5, 0, 0.75, 0, trunkM, (rand() - 0.5) * 0.08);
      branch(parent, 0.7, 0.28, 1.3, 0.08, trunkM, -0.7);
      branch(parent, 0.66, -0.26, 1.35, -0.1, trunkM, 0.74);
      branch(parent, 0.6, 0.04, 1.45, 0.3, trunkM, -0.3);
      blob(parent, 0.9, 0, 2.2, 0, a, rand, 0.92);
      blob(parent, 0.72, 0.66, 2.0, 0.28, b, rand, 0.92);
      blob(parent, 0.7, -0.6, 2.04, -0.24, a, rand, 0.92);
      blob(parent, 0.62, 0.16, 2.5, -0.34, b, rand, 0.92);
      blob(parent, 0.55, -0.3, 2.38, 0.4, c, rand, 0.92);
      blob(parent, 0.26, 0.5, 2.42, 0.1, c, rand);
      blob(parent, 0.24, -0.5, 2.3, 0.2, c, rand);
      break;
    }
    case "tree-conifer": {
      trunk(parent, 0.08, 0.14, 3.8, 0, 1.9, 0, trunkM, 0);
      cone(parent, 1.1, 1.6, 0, 2.0, 0, coniferM);
      cone(parent, 0.85, 1.4, 0, 2.7, 0, coniferM);
      cone(parent, 0.6, 1.2, 0, 3.32, 0, coniferM);
      cone(parent, 0.38, 1.0, 0, 3.85, 0, coniferM);
      break;
    }
    case "bush": {
      blob(parent, 0.36, 0, 0.34, 0, leafM, rand, 0.85);
      blob(parent, 0.28, 0.26, 0.3, 0.1, leaf2, rand, 0.85);
      blob(parent, 0.26, -0.2, 0.32, -0.16, leafM, rand, 0.85);
      break;
    }
    case "grass-patch": {
      for (let i = 0; i < 9; i++) {
        const a = rand() * Math.PI * 2;
        const rr = rand() * 0.32;
        blade(parent, 0.22 + rand() * 0.16, Math.cos(a) * rr, 0.12 + rand() * 0.06, Math.sin(a) * rr, grassM, (rand() - 0.5) * 0.7, rand);
      }
      break;
    }
    case "weed-cluster": {
      for (let i = 0; i < 6; i++) {
        const a = rand() * Math.PI * 2;
        const rr = rand() * 0.24;
        blade(parent, 0.6 + rand() * 0.3, Math.cos(a) * rr, 0.36, Math.sin(a) * rr, grassM, (rand() - 0.5) * 0.9, rand);
      }
      blob(parent, 0.2, 0.06, 0.72, 0.04, leafM, rand, 0.9);
      blob(parent, 0.16, -0.14, 0.66, -0.1, leaf2, rand, 0.9);
      break;
    }
    case "tree-small-b": {
      trunk(parent, 0.06, 0.09, 0.5, 0, 0.25, 0, trunkM, (rand() - 0.5) * 0.08);
      cone(parent, 0.52, 0.9, 0, 1.0, 0, leafM, 7);
      cone(parent, 0.36, 0.7, 0, 1.55, 0, leaf2, 7);
      break;
    }
    case "tree-medium-b": {
      trunk(parent, 0.09, 0.14, 1.6, 0, 0.8, 0, trunkM, 0);
      blob(parent, 0.6, 0, 1.75, 0, leafM, rand);
      blob(parent, 0.55, 0.05, 2.25, 0.04, leaf2, rand);
      blob(parent, 0.5, -0.04, 2.7, -0.03, leafM, rand);
      blob(parent, 0.38, 0.03, 3.05, 0.02, leaf2, rand);
      break;
    }
    case "tree-large-b": {
      trunk(parent, 0.14, 0.21, 2.0, 0, 1.0, 0, trunkM, 0);
      branch(parent, 1.0, 0.5, 1.85, 0.15, trunkM, -0.75);
      branch(parent, 1.0, -0.5, 1.85, -0.15, trunkM, 0.78);
      branch(parent, 0.9, 0.05, 2.0, 0.55, trunkM, -0.4);
      blob(parent, 1.05, 0, 3.1, 0, leafM, rand, 0.62);
      blob(parent, 0.95, 1.35, 2.95, 0.35, leaf2, rand, 0.62);
      blob(parent, 0.95, -1.3, 3.0, -0.3, leafM, rand, 0.62);
      blob(parent, 0.85, 0.7, 3.25, 1.0, leaf2, rand, 0.62);
      blob(parent, 0.85, -0.65, 3.3, -0.95, leafM, rand, 0.62);
      break;
    }
    case "tree-conifer-b": {
      trunk(parent, 0.07, 0.12, 4.0, 0, 2.0, 0, trunkM, 0);
      cone(parent, 0.5, 1.5, 0, 1.1, 0, coniferM, 7);
      cone(parent, 0.46, 1.4, 0, 1.95, 0, coniferM, 7);
      cone(parent, 0.4, 1.3, 0, 2.75, 0, coniferM, 7);
      cone(parent, 0.32, 1.1, 0, 3.45, 0, coniferM, 7);
      cone(parent, 0.2, 0.9, 0, 4.0, 0, coniferM, 7);
      break;
    }
    case "tree-blossom-b": {
      const pk = mat([236, 160, 184]);
      const pk2 = mat([248, 196, 210]);
      trunk(parent, 0.09, 0.15, 1.2, 0, 0.6, 0, trunkM, 0);
      branch(parent, 0.9, 0.5, 1.0, 0.15, trunkM, -0.8);
      branch(parent, 0.9, -0.5, 1.0, -0.15, trunkM, 0.82);
      blob(parent, 0.9, 0, 1.8, 0, pk, rand, 0.8);
      blob(parent, 0.8, 1.05, 1.65, 0.2, pk2, rand, 0.8);
      blob(parent, 0.8, -1.0, 1.68, -0.2, pk, rand, 0.8);
      blob(parent, 0.6, 0.4, 2.05, 0.6, pk2, rand, 0.8);
      blob(parent, 0.55, -0.45, 2.0, -0.55, pk, rand, 0.8);
      break;
    }
    case "tree-blossom-white-b": {
      const wh = mat([244, 238, 240]);
      const wh2 = mat([236, 226, 230]);
      trunk(parent, 0.09, 0.14, 1.6, 0, 0.8, 0, trunkM, 0);
      blob(parent, 0.62, 0, 1.8, 0, wh, rand);
      blob(parent, 0.56, 0.05, 2.3, 0.05, wh2, rand);
      blob(parent, 0.5, -0.04, 2.75, -0.04, wh, rand);
      blob(parent, 0.4, 0.03, 3.1, 0.03, wh2, rand);
      break;
    }
    default:
      break;
  }
}
