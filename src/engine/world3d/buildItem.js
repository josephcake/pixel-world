import * as THREE from "three";
import { mat, addBox, addPlane } from "./materials.js";
import { buildWarehouse } from "./warehouse.js";
import { buildSupplyAsset } from "./supplyChain.js";
import { buildCargoAsset } from "./cargo.js";
import { buildNature } from "./nature.js";
import { buildVehicle } from "./vehicles.js";
import { buildUrbanProp } from "./urbanProps.js";
import { buildRoad } from "./roads.js";

// Data-driven conversion of world items (see src/engine/building/) into a
// three.js scene graph. Local coordinates: item origin is (0,0,0); three.js
// x = grid x, z = grid y, y = height. Rendering stays separate from world data.

const DEFAULT_WALL = { front: [232, 208, 162], side: [188, 156, 108] };
const DEFAULT_GRASS = [86, 130, 58];

function roofHeight(roof) {
  if (!roof) return 0;
  return roof.height ?? (roof.type === "flat" ? 1 : 3);
}

function allBoxes(spec) {
  const boxes = [
    {
      ox: 0,
      oy: 0,
      w: spec.w,
      d: spec.d,
      stories: spec.stories ?? 1,
      storyHeight: spec.storyHeight ?? 5,
      wall: spec.wall,
      roof: spec.roof ?? { type: "flat", height: 1 },
      window: spec.window ?? null,
      door: spec.door ?? null,
      chimney: spec.chimneys ?? spec.chimney ?? null,
      roller: spec.roller ?? null,
      garage: false,
      garageHeight: undefined,
    },
  ];
  for (const a of spec.annexes ?? []) {
    boxes.push({
      ox: a.ox,
      oy: a.oy,
      w: a.w,
      d: a.d,
      stories: a.stories ?? 1,
      storyHeight: a.storyHeight ?? spec.storyHeight ?? 5,
      wall: a.wall ?? spec.wall,
      roof: a.roof ?? { type: "flat", height: 1 },
      window: a.window ?? null,
      door: a.door ?? null,
      chimney: a.chimney ?? null,
      roller: a.roller ?? null,
      garage: a.garage ?? false,
      garageHeight: a.garageHeight,
    });
  }
  return boxes;
}

export function itemExtents(spec) {
  const boxes = allBoxes(spec);
  const W = Math.max(...boxes.map((b) => b.ox + b.w));
  const D = Math.max(...boxes.map((b) => b.oy + b.d));
  const H = Math.max(...boxes.map((b) => b.stories * b.storyHeight + roofHeight(b.roof)));
  return { w: W, d: D, h: H };
}

// --- roofs ----------------------------------------------------------------

function quad(a, b, c, d, out) {
  out.push(...a, ...b, ...c, ...a, ...c, ...d);
}

function buildGableGeometry(w, d, wallTop, top, overhang, axis) {
  const ov = overhang ?? 0;
  const v = [];
  if (axis === "y") {
    const xr = w / 2;
    // slopes (face -x and +x)
    quad([-ov, wallTop, 0], [-ov, wallTop, d], [xr, top, d], [xr, top, 0], v);
    quad([w + ov, wallTop, 0], [w + ov, wallTop, d], [xr, top, d], [xr, top, 0], v);
    // gable triangles at z=0 and z=d
    v.push(-ov, wallTop, 0, w + ov, wallTop, 0, xr, top, 0);
    v.push(-ov, wallTop, d, w + ov, wallTop, d, xr, top, d);
  } else {
    const zr = d / 2;
    // slopes (face -z and +z)
    quad([0, wallTop, -ov], [w, wallTop, -ov], [w, top, zr], [0, top, zr], v);
    quad([0, wallTop, d + ov], [w, wallTop, d + ov], [w, top, zr], [0, top, zr], v);
    // gable triangles at x=0 and x=w
    v.push(0, wallTop, -ov, 0, wallTop, d + ov, 0, top, zr);
    v.push(w, wallTop, -ov, w, wallTop, d + ov, w, top, zr);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  return geo;
}

function buildHipGeometry(w, d, wallTop, top) {
  const apex = [w / 2, top, d / 2];
  const v = [];
  const c = [
    [0, wallTop, 0],
    [w, wallTop, 0],
    [w, wallTop, d],
    [0, wallTop, d],
  ];
  for (let i = 0; i < 4; i++) {
    v.push(...c[i], ...c[(i + 1) % 4], ...apex);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  geo.computeVertexNormals();
  return geo;
}

function addRoof(parent, b, wallTop) {
  const roof = b.roof;
  if (!roof) return;
  const type = roof.type ?? "gable";
  if (type === "flat") {
    const rh = Math.max(0.25, roof.height ?? 1);
    const fill = roof.fill ?? roof.front ?? [150, 150, 150];
    addBox(parent, {
      w: b.w,
      h: rh,
      d: b.d,
      x: b.ox + b.w / 2,
      y: wallTop + rh / 2,
      z: b.oy + b.d / 2,
      color: fill,
    });
    return;
  }
  const rh = roof.height ?? 3;
  const top = wallTop + rh;
  const mesh = new THREE.Mesh(
    type === "hip"
      ? buildHipGeometry(b.w, b.d, wallTop, top)
      : buildGableGeometry(b.w, b.d, wallTop, top, roof.overhang, roof.axis),
    mat(roof.fill ?? roof.fillA ?? [192, 90, 68], { side: THREE.DoubleSide }),
  );
  mesh.position.set(b.ox, 0, b.oy);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

// --- walls / openings -----------------------------------------------------

function windowSpans(w, n, reserve) {
  const out = [];
  if (n <= 0) return out;
  for (let k = 0; k < n; k++) {
    const cx = ((k + 1) * w) / (n + 1);
    if (reserve && Math.abs(cx - w / 2) < reserve) continue;
    out.push(cx);
  }
  return out;
}

function addOpenings(parent, b) {
  const win = b.window;
  const glass = win?.glass ?? [150, 200, 230];
  const doorColor = b.door?.color ?? [110, 76, 48];

  if (win) {
    const ww = win.ww ?? 0.5;
    const wh = win.wh ?? 0.5;
    const zOff = win.zOff ?? Math.max(0, (b.storyHeight - wh) / 2);
    const reserve = b.door ? (b.door.width ?? 0.8) / 2 + 0.2 : 0;
    for (let i = 0; i < b.stories; i++) {
      const cy = i * b.storyHeight + zOff + wh / 2;
      const nFront = i === 0 ? (win.front ?? 2) : (win.frontUpper ?? win.front ?? 2);
      for (const cx of windowSpans(b.w, nFront, i === 0 ? reserve : 0)) {
        addPlane(parent, {
          w: ww,
          h: wh,
          x: b.ox + cx,
          y: cy,
          z: b.oy + b.d + 0.02,
          color: glass,
        });
      }
      const nSide = win.side ?? 0;
      for (let k = 0; k < nSide; k++) {
        const cz = ((k + 1) * b.d) / (nSide + 1);
        addPlane(parent, {
          w: ww,
          h: wh,
          x: b.ox + b.w + 0.02,
          y: cy,
          z: b.oy + cz,
          color: glass,
          rotationY: Math.PI / 2,
        });
      }
    }
  }

  if (b.garage) {
    const gh = b.garageHeight ?? b.storyHeight * 0.7;
    const gw = b.w - 0.4;
    addPlane(parent, {
      w: gw,
      h: gh,
      x: b.ox + b.w / 2,
      y: gh / 2,
      z: b.oy + b.d + 0.02,
      color: [186, 186, 188],
    });
    return;
  }

  if (b.roller?.length) {
    for (const dd of b.roller) {
      addPlane(parent, {
        w: dd.x1 - dd.x0,
        h: dd.z1 - dd.z0,
        x: b.ox + (dd.x0 + dd.x1) / 2,
        y: (dd.z0 + dd.z1) / 2,
        z: b.oy + b.d + 0.02,
        color: dd.color ?? [190, 193, 197],
      });
    }
    return;
  }

  if (b.door) {
    const dw = b.door.width ?? 0.8;
    const dh = b.door.height ?? 1.5;
    addPlane(parent, {
      w: dw,
      h: dh,
      x: b.ox + b.w / 2,
      y: dh / 2,
      z: b.oy + b.d + 0.02,
      color: doorColor,
    });
  }
}

function addChimneys(parent, b, wallTop) {
  if (!b.chimney) return;
  const list = Array.isArray(b.chimney) ? b.chimney : [b.chimney];
  for (const c of list) {
    const w = c.x1 - c.x0;
    const d = c.y1 - c.y0;
    const base = Math.min(c.base ?? wallTop - 1, c.top - 0.2);
    const h = c.top - base;
    addBox(parent, {
      w,
      h,
      d,
      x: b.ox + (c.x0 + c.x1) / 2,
      y: base + h / 2,
      z: b.oy + (c.y0 + c.y1) / 2,
      color: c.side ?? [184, 154, 124],
    });
  }
}

function buildBox(parent, b) {
  const wallTop = b.stories * b.storyHeight;
  const wall = b.wall ?? DEFAULT_WALL;
  const side = mat(wall.side ?? DEFAULT_WALL.side);
  const front = mat(wall.front ?? DEFAULT_WALL.front);
  const capMat = mat([90, 96, 108]);
  addBox(parent, {
    w: b.w,
    h: wallTop,
    d: b.d,
    x: b.ox + b.w / 2,
    y: wallTop / 2,
    z: b.oy + b.d / 2,
    materials: [side, side, capMat, capMat, front, front],
  });
  addChimneys(parent, b, wallTop);
  addRoof(parent, b, wallTop);
  addOpenings(parent, b);
}

// --- landscape tiles ------------------------------------------------------

function groundColor(item) {
  const spec = item.spec ?? {};
  if (spec.asphalt) return spec.asphalt[0] ?? spec.asphalt;
  if (spec.paving) return spec.paving[0] ?? spec.paving;
  if (item.id?.startsWith("road")) return [70, 74, 80];
  if (item.id?.startsWith("parking")) return [64, 68, 74];
  return [156, 156, 154];
}

function addRoadMarkings(parent, item) {
  const spec = item.spec ?? {};
  const w = spec.w ?? 2;
  const d = spec.d ?? 2;
  const line = [226, 212, 118];
  const y = 0.16;
  const lw = 0.12;
  const dash = (cx, cz, len, alongX) =>
    addBox(parent, {
      w: alongX ? len : lw,
      h: 0.02,
      d: alongX ? lw : len,
      x: cx,
      y,
      z: cz,
      color: line,
    });

  if (spec.kind === "h") {
    for (let x = 0.15; x < w; x += 0.5) dash(Math.min(x + 0.15, w - 0.05), d / 2, 0.3, true);
    for (let x = 0.15; x < w; x += 0.5) dash(x + 0.05, 0.21, 0.5, false);
  } else if (spec.kind === "v") {
    for (let z = 0.15; z < d; z += 0.5) dash(w / 2, Math.min(z + 0.15, d - 0.05), 0.3, false);
    for (let z = 0.15; z < d; z += 0.5) dash(0.21, z + 0.05, 0.5, true);
  } else if (spec.kind === "cross") {
    dash(w / 2, d / 2, 0.5, true);
    dash(w / 2, d / 2, 0.5, false);
  } else if (spec.kind === "turn") {
    dash(w / 2, d / 2, Math.min(w, d) * 0.4, true);
  }

  if (item.id === "parking-spot") {
    const paint = [232, 232, 226];
    const inset = 0.14;
    addBox(parent, { w: 0.05, h: 0.02, d: d - inset * 2, x: inset, y, z: d / 2, color: paint });
    addBox(parent, { w: 0.05, h: 0.02, d: d - inset * 2, x: w - inset, y, z: d / 2, color: paint });
    addBox(parent, { w: w - inset * 2, h: 0.02, d: 0.05, x: w / 2, y, z: inset, color: paint });
  }
}

function buildGroundTile(parent, item) {
  const spec = item.spec ?? {};
  addBox(parent, {
    w: item.footprint?.w ?? spec.w ?? 1,
    h: 0.12,
    d: item.footprint?.d ?? spec.d ?? 1,
    x: (item.footprint?.w ?? spec.w ?? 1) / 2,
    y: 0.07,
    z: (item.footprint?.d ?? spec.d ?? 1) / 2,
    color: groundColor(item),
  });
  addRoadMarkings(parent, item);
}

// --- public API -----------------------------------------------------------

function seedOf(item) {
  if (item?.seed != null) return item.seed >>> 0;
  let h = 2166136261;
  const s = item?.id ?? "";
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildItemGroup(item, seed) {
  const group = new THREE.Group();
  group.name = item.id;
  const spec = item.spec;
  if (spec?.kind === "nature") {
    buildNature(group, spec, seed ?? seedOf(item));
  } else if (spec?.kind === "vehicle") {
    buildVehicle(group, spec);
  } else if (spec?.kind === "prop") {
    buildUrbanProp(group, spec);
  } else if (spec?.kind === "road") {
    buildRoad(group, spec);
  } else if (buildCargoAsset(group, spec)) {
    // handled by the cargo assets builder
  } else if (buildSupplyAsset(group, spec)) {
    // handled by the supply-chain assets builder
  } else if (spec?.type === "warehouse") {
    buildWarehouse(group, spec);
  } else if (spec && spec.wall) {
    const extent = itemExtents(spec);
    const grass = spec.scene?.grassA ?? DEFAULT_GRASS;
    addBox(group, {
      w: extent.w + 0.1,
      h: 0.06,
      d: extent.d + 0.1,
      x: extent.w / 2,
      y: 0.04,
      z: extent.d / 2,
      color: grass,
    });
    for (const b of allBoxes(spec)) buildBox(group, b);
  } else {
    buildGroundTile(group, item);
  }
  return group;
}

export function disposeGroup(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose?.();
    const material = obj.material;
    if (Array.isArray(material)) material.forEach((m) => m.dispose?.());
    else material?.dispose?.();
  });
}
