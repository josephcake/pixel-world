import * as THREE from "three";
import {
  mat,
  shade,
  addBox,
  addCylinder,
  chamferedShape,
  extrudeUp,
} from "./materials.js";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const WALL = { front: [158, 164, 172], side: [128, 134, 142] };
const ROOF = [96, 102, 110];

function palette(spec) {
  const front = spec.wall?.front ?? WALL.front;
  const side = spec.wall?.side ?? WALL.side;
  const roofC = spec.roof?.fill ?? ROOF;
  const trimC = spec.trim ?? [70, 76, 84];
  return {
    shell: mat(front),
    shellSide: mat(side),
    shellBack: mat(shade(front, 0.93)),
    panelA: mat(shade(front, 1.04)),
    panelB: mat(shade(front, 0.9)),
    panelSide: mat(shade(side, 1.03)),
    pier: mat(shade(side, 0.82)),
    band: mat(trimC),
    frame: mat(shade(trimC, 1.24)),
    frameDark: mat(shade(trimC, 0.7)),
    dark: mat([20, 22, 27], { roughness: 0.95 }),
    roof: mat(roofC),
    roofDark: mat(shade(roofC, 0.8)),
    metal: mat([152, 158, 166], { metalness: 0.4, roughness: 0.45 }),
    glass: mat([150, 198, 214], { metalness: 0.25, roughness: 0.16 }),
    glassClear: mat([150, 186, 206], { transparent: true, opacity: 0.34, metalness: 0.15, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }),
    door: mat([208, 212, 216], { roughness: 0.7 }),
    doorDark: mat([150, 156, 162], { roughness: 0.7 }),
    hvac: mat([150, 156, 164]),
    hvacDark: mat([116, 122, 130]),
    concrete: mat([118, 122, 128], { roughness: 1 }),
    concreteLight: mat([148, 152, 158], { roughness: 1 }),
    signFace: mat([222, 76, 88]),
    signInk: mat([246, 246, 244]),
    rubber: mat([40, 42, 46], { roughness: 0.9 }),
  };
}

function ringShape(W, D, ch, t) {
  const outer = chamferedShape(W, D, ch);
  const iw = W - 2 * t;
  const id = D - 2 * t;
  const ic = Math.max(0.05, ch - t);
  const inner = new THREE.Path();
  const pts = [
    [t + ic, t],
    [t + iw - ic, t],
    [t + iw, t + ic],
    [t + iw, t + id - ic],
    [t + iw - ic, t + id],
    [t + ic, t + id],
    [t, t + id - ic],
    [t, t + ic],
  ].reverse();
  inner.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) inner.lineTo(pts[i][0], pts[i][1]);
  inner.closePath();
  outer.holes.push(inner);
  return outer;
}

function addMass(parent, W, D, wallH, ch, material) {
  const mesh = new THREE.Mesh(
    extrudeUp(chamferedShape(W, D, ch), wallH, D),
    material,
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addParapet(parent, W, D, y, ch, t, h, material) {
  const ring = new THREE.Mesh(
    extrudeUp(ringShape(W, D, ch, t), h, D),
    material,
  );
  ring.position.y = y;
  ring.castShadow = true;
  ring.receiveShadow = true;
  parent.add(ring);
  return ring;
}

function frontBand(parent, x0, x1, y, z, material, h, t = 0.3) {
  addBox(parent, {
    w: x1 - x0 + 0.1,
    h,
    d: t,
    x: (x0 + x1) / 2,
    y,
    z,
    material,
  });
}

function sideBand(parent, z0, z1, y, x, material, h, t = 0.3) {
  addBox(parent, {
    w: t,
    h: h + 0.05,
    d: z1 - z0 + 0.1,
    x,
    y,
    z: (z0 + z1) / 2,
    material,
  });
}

function addBay(parent, { cx, D, M, bayW, bayH, y0, prot = 0.12, f = 0.1, ledge = true, bumpers = true, frame }) {
  const fm = frame ?? M.frame;
  addBox(parent, { w: bayW, h: bayH, d: 0.06, x: cx, y: y0 + bayH / 2, z: D + 0.03, material: M.door });
  const slats = Math.max(3, Math.floor(bayH / 0.26));
  for (let i = 1; i < slats; i++) {
    addBox(parent, { w: bayW - 0.06, h: 0.03, d: 0.02, x: cx, y: y0 + (bayH * i) / slats, z: D + 0.065, material: M.doorDark });
  }
  addBox(parent, { w: f, h: bayH, d: prot + 0.04, x: cx - (bayW + f) / 2, y: y0 + bayH / 2, z: D + (prot + 0.04) / 2, material: fm });
  addBox(parent, { w: f, h: bayH, d: prot + 0.04, x: cx + (bayW + f) / 2, y: y0 + bayH / 2, z: D + (prot + 0.04) / 2, material: fm });
  addBox(parent, { w: bayW + f * 2, h: f, d: prot + 0.06, x: cx, y: y0 + bayH + f / 2, z: D + (prot + 0.06) / 2, material: fm });
  addBox(parent, { w: bayW + 0.24, h: 0.08, d: 0.5, x: cx, y: y0 + bayH + 0.26, z: D + 0.34, material: M.metal });
  if (ledge) addBox(parent, { w: bayW + 0.2, h: 0.24, d: 0.8, x: cx, y: 0.12, z: D + 0.4, material: M.concreteLight });
  if (bumpers) {
    addBox(parent, { w: 0.18, h: 0.34, d: 0.3, x: cx - (bayW / 2 - 0.2), y: y0 * 0.6 + 0.16, z: D + prot + 0.16, material: M.rubber });
    addBox(parent, { w: 0.18, h: 0.34, d: 0.3, x: cx + (bayW / 2 - 0.2), y: y0 * 0.6 + 0.16, z: D + prot + 0.16, material: M.rubber });
  }
}

function clerestory(parent, Wf, W, D, wallH, M) {
  addBox(parent, { w: Wf - 0.5, h: 0.5, d: 0.06, x: Wf / 2, y: wallH - 0.75, z: D + 0.06, material: M.glassClear });
  addBox(parent, { w: Wf - 0.5, h: 0.06, d: 0.06, x: Wf / 2, y: wallH - 1.03, z: D + 0.06, material: M.frame });
  addBox(parent, { w: 0.06, h: 0.5, d: D - 0.5, x: W + 0.05, y: wallH - 0.75, z: D / 2, material: M.glassClear });
  addBox(parent, { w: 0.06, h: 0.5, d: D - 0.5, x: -0.05, y: wallH - 0.75, z: D / 2, material: M.glassClear });
}

function addBays(parent, { D, M, count, margin, gap, bayH, y0, x0 = 0, x1, prot, f, ledge, bumpers, frame }) {
  const span = x1 - x0;
  const bayW = (span - margin * 2 - gap * (count - 1)) / count;
  const cxs = [];
  for (let i = 0; i < count; i++) {
    const cx = x0 + margin + bayW / 2 + i * (bayW + gap);
    cxs.push(cx);
    addBay(parent, { cx, D, M, bayW, bayH, y0, prot, f, ledge, bumpers, frame });
  }
  return { bayW, cxs, span };
}

function addFrontPiers(parent, { D, M, cxs, bayW, gap, x0, x1, wallH, width = 0.16, depth = 0.2 }) {
  const xs = [x0, x1];
  for (let i = 1; i < cxs.length; i++) xs.push(cxs[i] - bayW / 2 - gap / 2);
  for (const x of xs) {
    addBox(parent, { w: width, h: wallH, d: depth, x, y: wallH / 2, z: D, material: M.frame });
  }
}

function addOffice(parent, { x0, z0, w, d, storyH, stories, M, core = 0, canopy = true, mullions = true }) {
  const h = storyH * stories;
  const cx = x0 + w / 2;
  const cz = z0 + d / 2;
  addBox(parent, { w: w + 0.22, h: 0.32, d: d + 0.06, x: cx, y: 0.16, z: cz, material: M.frameDark });
  addBox(parent, { w, h, d, x: cx, y: h / 2, z: cz, material: M.glass });
  if (core > 0) {
    const cw = w * core;
    addBox(parent, { w: cw + 0.06, h: h + 0.2, d: d + 0.2, x: x0 - 0.03 + (cw + 0.06) / 2, y: (h + 0.2) / 2, z: cz, material: M.frame });
  } else {
    addBox(parent, { w: w + 0.06, h: 0.14, d: d + 0.06, x: cx, y: 0.07, z: cz, material: M.frame });
  }
  for (let s = 1; s < stories; s++) {
    addBox(parent, { w: w + 0.08, h: 0.14, d: d + 0.08, x: cx, y: s * storyH, z: cz, material: M.frame });
  }
  addBox(parent, { w: w + 0.14, h: 0.16, d: d + 0.14, x: cx, y: h, z: cz, material: M.frame });
  if (mullions) {
    for (const x of [x0, x0 + w]) {
      for (const z of [z0, z0 + d]) {
        addBox(parent, { w: 0.12, h: h + 0.06, d: 0.12, x, y: (h + 0.06) / 2, z, material: M.frame });
      }
    }
  }
  const eh = Math.min(1.4, h * 0.5);
  addBox(parent, { w: w * 0.34, h: eh, d: 0.06, x: cx, y: eh / 2, z: z0 + d + 0.03, material: M.dark });
  if (canopy) {
    const cw = w * 0.78;
    const cy = Math.min(h * 0.62, 1.9);
    addBox(parent, { w: cw, h: 0.12, d: 1.0, x: cx, y: cy, z: z0 + d + 0.5, material: M.frame });
    addBox(parent, { w: 0.1, h: cy, d: 0.1, x: cx - cw / 2 + 0.12, y: cy / 2, z: z0 + d + 0.92, material: M.frame });
    addBox(parent, { w: 0.1, h: cy, d: 0.1, x: cx + cw / 2 - 0.12, y: cy / 2, z: z0 + d + 0.92, material: M.frame });
  }
}

function addHvac(parent, { x, z, y, w, h, d, M }) {
  addBox(parent, { w: w + 0.2, h: 0.18, d: d + 0.2, x, y: y + 0.09, z, material: M.hvacDark });
  addBox(parent, { w, h, d, x, y: y + 0.18 + h / 2, z, material: M.hvac });
  addBox(parent, { w: w * 0.9, h: 0.06, d: d * 0.9, x, y: y + 0.18 + h + 0.03, z, material: M.hvacDark });
}

function addVent(parent, { x, z, y, r, h }) {
  addCylinder(parent, { rTop: r * 0.95, h: 0.16, x, y: y + 0.08, z, color: [110, 116, 124], segments: 10 });
  addCylinder(parent, { rTop: r, h, x, y: y + 0.16 + h / 2, z, color: [158, 164, 172], segments: 10 });
}

function addSign(parent, { x, y, z, w, h, M }) {
  addBox(parent, { w: w + 0.16, h: h + 0.16, d: 0.16, x, y, z, material: M.frameDark });
  addBox(parent, { w, h, d: 0.12, x, y, z: z + 0.1, material: M.signFace });
  addBox(parent, { w: h * 0.6, h: h * 0.6, d: 0.04, x: x - w / 2 + h * 0.5, y, z: z + 0.17, material: M.signInk });
  addBox(parent, { w: w * 0.48, h: h * 0.16, d: 0.04, x: x + w * 0.14, y: y + h * 0.2, z: z + 0.17, material: M.signInk });
  addBox(parent, { w: w * 0.34, h: h * 0.13, d: 0.04, x: x + w * 0.1, y: y - h * 0.16, z: z + 0.17, material: M.signInk });
}

function addCornerstone(parent, { D, M }) {
  const c = 1.15;
  const y = 0.72;
  const h = 1.0;
  addBox(parent, { w: c, h, d: c, x: 0, y, z: D, material: M.concreteLight });
  addBox(parent, { w: c * 0.82, h: h * 0.6, d: 0.06, x: 0, y, z: D + c / 2 + 0.03, material: M.signFace });
  addBox(parent, { w: c * 0.5, h: h * 0.12, d: 0.05, x: 0, y: y + h * 0.08, z: D + c / 2 + 0.08, material: M.signInk });
  addBox(parent, { w: c * 0.32, h: h * 0.1, d: 0.05, x: 0, y: y - h * 0.14, z: D + c / 2 + 0.08, material: M.signInk });
  addBox(parent, { w: 0.06, h: h * 0.6, d: c * 0.82, x: -c / 2 - 0.03, y, z: D, material: M.signFace });
  addBox(parent, { w: 0.05, h: h * 0.12, d: c * 0.5, x: -c / 2 - 0.08, y: y + h * 0.08, z: D, material: M.signInk });
  addBox(parent, { w: 0.05, h: h * 0.1, d: c * 0.32, x: -c / 2 - 0.08, y: y - h * 0.14, z: D, material: M.signInk });
}

function apron(parent, W, D, M, sideExt, frontExt) {
  addBox(parent, { w: W + sideExt, h: 0.1, d: D + frontExt, x: W / 2, y: 0.06, z: D / 2 + frontExt * 0.22, material: M.concrete });
  addBox(parent, { w: W + 0.2, h: 0.12, d: 2.0, x: W / 2, y: 0.08, z: D + 0.9, material: M.concreteLight });
}

// --- Small: compact neighborhood warehouse -------------------------------

function buildSmall(parent, spec) {
  const W = spec.w;
  const D = spec.d;
  const wallH = (spec.stories ?? 1) * (spec.storyHeight ?? 5);
  const ch = clamp(Math.min(W, D) * 0.1, 0.2, 0.4);
  const M = palette(spec);

  apron(parent, W, D, M, 1.2, 1.2);
  addMass(parent, W, D, wallH, ch, M.shell);
  clerestory(parent, W, W, D, wallH, M);
  addParapet(parent, W, D, wallH, ch, 0.1, 0.22, M.concreteLight);

  frontBand(parent, 0, W, 0.24, D, M.concrete, 0.34, 0.3);
  sideBand(parent, 0, D, 0.24, W, M.concrete, 0.34, 0.3);
  sideBand(parent, 0, D, 0.24, 0, M.concrete, 0.34, 0.3);

  const doorW = Math.min(W * 0.42, 1.6);
  const doorH = Math.min(wallH * 0.62, 1.7);
  const y0 = 0.32;
  addBay(parent, { cx: W / 2, D, M, bayW: doorW, bayH: doorH, y0, prot: 0.12, f: 0.1, ledge: true, bumpers: true });

  addHvac(parent, { x: W * 0.34, z: D * 0.52, y: wallH, w: 0.95, h: 0.5, d: 0.8, M });
  addVent(parent, { x: W * 0.72, z: D * 0.56, y: wallH, r: 0.26, h: 0.55 });
}

// --- Medium: developed commercial warehouse ------------------------------

function buildMedium(parent, spec) {
  const W = spec.w;
  const D = spec.d;
  const wallH = (spec.stories ?? 1) * (spec.storyHeight ?? 5);
  const mainW = W * 0.7;
  const annexW = W - mainW;
  const annexD = D - 1.0;
  const annexH = wallH * 0.72;
  const ch = clamp(Math.min(mainW, D) * 0.1, 0.2, 0.4);
  const M = palette(spec);

  apron(parent, W, D, M, 1.4, 1.4);
  addMass(parent, mainW, D, wallH, ch, M.shell);
  clerestory(parent, mainW, W, D, wallH, M);
  addParapet(parent, mainW, D, wallH, ch, 0.14, 0.3, M.concreteLight);

  addBox(parent, { w: annexW, h: annexH, d: annexD, x: mainW + annexW / 2, y: annexH / 2, z: annexD / 2, material: M.shellSide });
  addBox(parent, { w: annexW + 0.12, h: 0.14, d: annexD + 0.12, x: mainW + annexW / 2, y: annexH + 0.07, z: annexD / 2, material: M.roofDark });

  addBox(parent, { w: mainW * 0.6, h: 0.55, d: D * 0.46, x: mainW / 2, y: wallH + 0.275, z: D * 0.5, material: M.roofDark });
  addBox(parent, { w: mainW * 0.56, h: 0.22, d: 0.06, x: mainW / 2, y: wallH + 0.3, z: D * 0.5 + D * 0.23 + 0.02, material: M.dark });

  const bays = addBays(parent, {
    D, M, count: 3, margin: 0.34, gap: 0.3,
    bayH: Math.min(wallH * 0.6, 1.7), y0: 0.34,
    x0: 0, x1: mainW, prot: 0.12, f: 0.1,
  });
  addFrontPiers(parent, { D, M, cxs: bays.cxs, bayW: bays.bayW, gap: 0.3, x0: 0.18, x1: mainW - 0.18, wallH, depth: 0.2 });

  frontBand(parent, 0, mainW, wallH - 0.22, D, M.band, 0.2, 0.26);
  frontBand(parent, 0, W, 0.22, D, M.concrete, 0.3, 0.26);
  sideBand(parent, 0, D, 0.22, W, M.concrete, 0.3, 0.26);

  addBox(parent, { w: 0.28, h: annexH, d: 0.28, x: mainW, y: annexH / 2, z: annexD - 0.15, material: M.frame });

  addOffice(parent, {
    x0: mainW + 0.2, z0: D - 1.55, w: 1.5, d: 1.45,
    storyH: 1.5, stories: 2, M, canopy: true,
  });

  addHvac(parent, { x: mainW * 0.3, z: D * 0.34, y: wallH, w: 1.2, h: 0.6, d: 0.9, M });
  addHvac(parent, { x: mainW * 0.66, z: D * 0.66, y: wallH, w: 1.0, h: 0.5, d: 0.8, M });
  addVent(parent, { x: mainW * 0.86, z: D * 0.4, y: wallH, r: 0.3, h: 0.6 });
}

// --- Large: long industrial distribution building ------------------------

function buildLarge(parent, spec) {
  const W = spec.w;
  const D = spec.d;
  const wallH = (spec.stories ?? 1) * (spec.storyHeight ?? 5);
  const ch = clamp(Math.min(W, D) * 0.1, 0.2, 0.45);
  const M = palette(spec);

  apron(parent, W, D, M, 1.6, 1.8);
  addMass(parent, W, D, wallH, ch, M.shell);
  clerestory(parent, W - 2.4, W, D, wallH, M);
  addParapet(parent, W, D, wallH, ch, 0.22, 0.55, M.concreteLight);

  const mw = W * 0.84;
  const mh = 0.95;
  addBox(parent, { w: mw, h: mh, d: 1.0, x: W / 2, y: wallH + mh / 2, z: D * 0.5, material: M.roofDark });
  addBox(parent, { w: mw * 0.96, h: mh * 0.42, d: 0.06, x: W / 2, y: wallH + mh * 0.52, z: D * 0.5 + 0.51, material: M.dark });
  addBox(parent, { w: mw * 0.96, h: mh * 0.42, d: 0.06, x: W / 2, y: wallH + mh * 0.52, z: D * 0.5 - 0.51, material: M.dark });

  const officeW = 2.0;
  const bays = addBays(parent, {
    D, M, count: 3, margin: 0.34, gap: 0.34,
    bayH: Math.min(wallH * 0.62, 2.0), y0: 0.38,
    x0: 0, x1: W - officeW - 0.2, prot: 0.12, f: 0.1,
  });
  addFrontPiers(parent, { D, M, cxs: bays.cxs, bayW: bays.bayW, gap: 0.34, x0: 0.2, x1: W - officeW - 0.26, wallH, depth: 0.2 });

  frontBand(parent, 0, W, wallH - 0.24, D, M.band, 0.22, 0.34);
  frontBand(parent, 0, W, wallH * 0.5, D, M.panelSide, 0.16, 0.24);
  frontBand(parent, 0, W, 0.24, D, M.concrete, 0.34, 0.34);
  sideBand(parent, 0, D, 0.24, W, M.concrete, 0.34, 0.34);
  sideBand(parent, 0, D, 0.24, 0, M.concrete, 0.34, 0.34);
  sideBand(parent, 0, D, wallH - 0.24, W, M.band, 0.22, 0.34);
  sideBand(parent, 0, D, wallH - 0.24, 0, M.band, 0.22, 0.34);
  for (const z of [D * 0.35, D * 0.7]) {
    addBox(parent, { w: 0.24, h: wallH, d: 0.24, x: W, y: wallH / 2, z, material: M.frame });
    addBox(parent, { w: 0.24, h: wallH, d: 0.24, x: 0, y: wallH / 2, z, material: M.frame });
  }

  const ox = W - officeW - 0.1;
  addOffice(parent, {
    x0: ox, z0: D - 1.5, w: officeW, d: 2.0,
    storyH: 1.8, stories: 3, M, core: 0.34, canopy: true,
  });

  addSign(parent, { x: W * 0.3, y: wallH - 0.5, z: D + 0.16, w: 2.4, h: 0.62, M });

  addHvac(parent, { x: W * 0.28, z: D * 0.3, y: wallH + mh * 0.15, w: 1.3, h: 0.6, d: 0.9, M });
  addHvac(parent, { x: W * 0.62, z: D * 0.72, y: wallH + mh * 0.15, w: 1.1, h: 0.55, d: 0.85, M });
  addVent(parent, { x: W * 0.5, z: D * 0.32, y: wallH + mh * 0.2, r: 0.32, h: 0.6 });
  addBox(parent, { w: 1.5, h: 0.7, d: 1.1, x: W * 0.82, y: wallH + mh * 0.35 + 0.35, z: D * 0.32, material: M.hvacDark });
}

// --- Mega: enormous logistics / distribution center ----------------------

function buildMega(parent, spec) {
  const W = spec.w;
  const D = spec.d;
  const wallH = (spec.stories ?? 1) * (spec.storyHeight ?? 5);
  const ch = clamp(Math.min(W, D) * 0.08, 0.3, 0.6);
  const M = palette(spec);

  apron(parent, W, D, M, 2.2, 2.4);
  addMass(parent, W, D, wallH, ch, M.shell);
  clerestory(parent, W - 2.2, W, D, wallH, M);
  addParapet(parent, W, D, wallH, ch, 0.34, 1.0, M.concreteLight);

  const officeW = 1.7;
  const bays = addBays(parent, {
    D, M, count: 4, margin: 0.75, gap: 0.62,
    bayH: Math.min(wallH * 0.6, 2.6), y0: 0.5,
    x0: 0, x1: W - officeW - 0.5, prot: 0.12, f: 0.1,
  });
  addFrontPiers(parent, { D, M, cxs: bays.cxs, bayW: bays.bayW, gap: 0.62, x0: 0.36, x1: W - officeW - 0.7, wallH, depth: 0.2 });

  frontBand(parent, 0, W, wallH - 0.5, D, M.band, 0.4, 0.5);
  frontBand(parent, 0, W, 0.4, D, M.concrete, 0.5, 0.5);
  sideBand(parent, 0, D, wallH - 0.5, W, M.band, 0.4, 0.5);
  sideBand(parent, 0, D, wallH - 0.5, 0, M.band, 0.4, 0.5);
  sideBand(parent, 0, D, 0.4, W, M.concrete, 0.5, 0.5);
  sideBand(parent, 0, D, 0.4, 0, M.concrete, 0.5, 0.5);
  for (const z of [D * 0.3, D * 0.55, D * 0.8]) {
    addBox(parent, { w: 0.24, h: wallH, d: 0.24, x: W, y: wallH / 2, z, material: M.frame });
    addBox(parent, { w: 0.24, h: wallH, d: 0.24, x: 0, y: wallH / 2, z, material: M.frame });
  }

  addOffice(parent, {
    x0: W - officeW - 0.2, z0: D - 1.4, w: officeW, d: 1.5,
    storyH: 1.7, stories: 2, M, canopy: true, mullions: false,
  });

  addCornerstone(parent, { D, M });

  addHvac(parent, { x: W * 0.18, z: D * 0.26, y: wallH, w: 2.2, h: 0.9, d: 1.5, M });
  addHvac(parent, { x: W * 0.44, z: D * 0.7, y: wallH, w: 2.6, h: 1.0, d: 1.8, M });
  addHvac(parent, { x: W * 0.68, z: D * 0.3, y: wallH, w: 1.9, h: 0.8, d: 1.4, M });
  addHvac(parent, { x: W * 0.84, z: D * 0.66, y: wallH, w: 1.6, h: 0.7, d: 1.2, M });
  addVent(parent, { x: W * 0.3, z: D * 0.55, y: wallH, r: 0.5, h: 1.0 });
  addVent(parent, { x: W * 0.58, z: D * 0.42, y: wallH, r: 0.42, h: 0.85 });
  addBox(parent, { w: 1.9, h: 1.1, d: 1.8, x: W * 0.9, y: wallH + 0.55, z: D * 0.85, material: M.hvacDark });
  addBox(parent, { w: 0.9, h: 0.6, d: 0.06, x: W * 0.9, y: wallH + 0.45, z: D * 0.85 + 0.91, material: M.frame });
}

export function buildWarehouse(parent, spec) {
  const variant = spec.variant ?? (spec.id ? spec.id.replace("warehouse-", "") : "mega");
  if (variant === "small") return buildSmall(parent, spec);
  if (variant === "medium") return buildMedium(parent, spec);
  if (variant === "large") return buildLarge(parent, spec);
  return buildMega(parent, spec);
}
