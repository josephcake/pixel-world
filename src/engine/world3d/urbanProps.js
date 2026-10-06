import { mat, addBox, addCylinder, addRoundedBox } from "./materials.js";

// Detailed low-poly urban street props. Same visual language as the rest of
// the world (flat-shaded, chamfered, chunky hardware). Local origin at the base.

function palette(spec) {
  return {
    body: mat(spec.color ?? [190, 60, 50]),
    body2: mat(spec.color2 ?? [70, 96, 130]),
    dark: mat([52, 56, 63], { roughness: 0.85 }),
    metal: mat([150, 156, 164], { metalness: 0.5, roughness: 0.45 }),
    darkMetal: mat([86, 92, 100], { metalness: 0.45, roughness: 0.55 }),
    light: mat([236, 236, 230]),
    red: mat([214, 52, 48]),
    amber: mat([236, 168, 40]),
    green: mat([64, 178, 92]),
    lens: mat([24, 28, 34], { metalness: 0.2, roughness: 0.2 }),
    liner: mat([34, 36, 42], { roughness: 0.95 }),
  };
}

function hexCyl(parent, { r, h, x = 0, y, z = 0, material }) {
  return addCylinder(parent, { rTop: r, rBottom: r, h, x, y, z, material, segments: 6 });
}

// --- Fire hydrant ---------------------------------------------------------

function buildHydrant(parent, spec) {
  const M = palette(spec);
  hexCyl(parent, { r: 0.15, h: 0.1, y: 0.05, material: M.dark });
  addCylinder(parent, { rTop: 0.12, rBottom: 0.12, h: 0.05, y: 0.125, material: M.darkMetal, segments: 12 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    addBox(parent, { w: 0.03, h: 0.02, d: 0.03, x: Math.cos(a) * 0.1, y: 0.16, z: Math.sin(a) * 0.1, material: M.metal });
  }
  addCylinder(parent, { rTop: 0.1, rBottom: 0.11, h: 0.32, y: 0.31, material: M.body, segments: 8 });
  addCylinder(parent, { rTop: 0.115, rBottom: 0.115, h: 0.03, y: 0.2, material: M.darkMetal, segments: 12 });
  addCylinder(parent, { rTop: 0.115, rBottom: 0.115, h: 0.03, y: 0.44, material: M.darkMetal, segments: 12 });
  addCylinder(parent, { rTop: 0.09, rBottom: 0.1, h: 0.06, y: 0.485, material: M.body, segments: 8 });
  hexCyl(parent, { r: 0.065, h: 0.05, y: 0.54, material: M.darkMetal });
  addCylinder(parent, { rTop: 0.035, rBottom: 0.06, h: 0.05, y: 0.59, material: M.darkMetal, segments: 8 });
  for (const sx of [1, -1]) {
    addCylinder(parent, { rTop: 0.05, rBottom: 0.05, h: 0.09, x: sx * 0.12, y: 0.33, material: M.darkMetal, segments: 8, rotation: [0, 0, Math.PI / 2] });
    hexCyl(parent, { r: 0.055, h: 0.035, x: sx * 0.17, y: 0.33, material: M.metal });
  }
  addCylinder(parent, { rTop: 0.05, rBottom: 0.05, h: 0.08, z: 0.12, y: 0.33, material: M.darkMetal, segments: 8, rotation: [Math.PI / 2, 0, 0] });
  hexCyl(parent, { r: 0.055, h: 0.03, x: 0, y: 0.33, z: 0.17, material: M.metal });
  for (let i = 0; i < 3; i++) {
    addBox(parent, { w: 0.02, h: 0.05, d: 0.02, x: 0.02 * (i % 2 ? 1 : -1), y: 0.5 - i * 0.06, z: 0.07, material: M.metal });
  }
  addBox(parent, { w: 0.06, h: 0.1, d: 0.012, x: 0, y: 0.3, z: 0.105, material: M.light });
}

// --- Street postbox / mailbox --------------------------------------------

function buildMailbox(parent, spec) {
  const M = palette(spec);
  addBox(parent, { w: 0.36, h: 0.06, d: 0.36, y: 0.03, material: M.darkMetal });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder(parent, { rTop: 0.02, rBottom: 0.02, h: 0.03, x: sx * 0.15, y: 0.07, z: sz * 0.15, material: M.metal, segments: 6 });
    }
  }
  addBox(parent, { w: 0.16, h: 0.56, d: 0.16, y: 0.34, material: M.darkMetal });
  const bodyY = 0.98;
  addRoundedBox(parent, { w: 0.52, h: 0.72, d: 0.4, x: 0, y: bodyY, z: 0, radius: 0.05, segments: 1, material: M.body2 });
  addCylinder(parent, { rTop: 0.2, rBottom: 0.2, h: 0.4, x: 0, y: bodyY + 0.36, z: 0, material: M.body2, segments: 12, rotation: [Math.PI / 2, 0, 0] });
  addRoundedBox(parent, { w: 0.42, h: 0.5, d: 0.03, x: 0, y: bodyY - 0.08, z: 0.2, radius: 0.02, segments: 1, material: M.darkMetal });
  addBox(parent, { w: 0.34, h: 0.035, d: 0.02, x: 0, y: bodyY + 0.22, z: 0.21, material: M.lens });
  for (const sx of [-1, 1]) {
    addBox(parent, { w: 0.03, h: 0.08, d: 0.03, x: sx * 0.19, y: bodyY - 0.2, z: 0.215, material: M.metal });
  }
  addBox(parent, { w: 0.12, h: 0.04, d: 0.03, x: 0.08, y: bodyY - 0.24, z: 0.215, material: M.metal });
  addBox(parent, { w: 0.08, h: 0.08, d: 0.03, x: -0.13, y: bodyY - 0.24, z: 0.215, material: M.dark });
  addBox(parent, { w: 0.2, h: 0.1, d: 0.012, x: 0, y: bodyY + 0.28, z: 0.21, material: M.light });
  for (const sz of [1, -1]) {
    addBox(parent, { w: 0.3, h: 0.02, d: 0.012, x: 0, y: bodyY - 0.34, z: sz * 0.201, material: M.metal });
  }
  const topA = addCylinder(parent, { rTop: 0.05, rBottom: 0.05, h: 0.1, x: 0.16, y: bodyY + 0.5, z: 0.1, material: M.metal, segments: 8 });
  topA.rotation.z = 0.4;
}

// --- Vertical traffic light ----------------------------------------------

function buildTrafficLight(parent, spec) {
  const M = palette(spec);
  const poleH = 3.7;
  addBox(parent, { w: 0.42, h: 0.07, d: 0.42, y: 0.035, material: M.darkMetal });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCylinder(parent, { rTop: 0.025, rBottom: 0.025, h: 0.04, x: sx * 0.16, y: 0.08, z: sz * 0.16, material: M.metal, segments: 6 });
    }
  }
  addCylinder(parent, { rTop: 0.06, rBottom: 0.09, h: poleH, y: poleH / 2 + 0.07, material: M.metal, segments: 10 });
  addCylinder(parent, { rTop: 0.075, rBottom: 0.075, h: 0.1, y: 0.16, material: M.darkMetal, segments: 10 });

  const hx = 0.28;
  const hy = poleH - 0.15;
  addBox(parent, { w: 0.3, h: 0.12, d: 0.12, x: hx * 0.5, y: hy, z: 0, material: M.darkMetal });
  addBox(parent, { w: 0.34, h: 1.15, d: 0.3, x: hx, y: hy, z: 0, material: M.dark });
  const lights = [[0.38, M.red], [0, M.amber], [-0.38, M.green]];
  for (const [dy, color] of lights) {
    addCylinder(parent, { rTop: 0.14, rBottom: 0.14, h: 0.14, x: hx, y: hy + dy, z: -0.05, material: M.dark, segments: 10, rotation: [Math.PI / 2, 0, 0] });
    addCylinder(parent, { rTop: 0.1, rBottom: 0.1, h: 0.05, x: hx, y: hy + dy, z: -0.13, material: color, segments: 10, rotation: [Math.PI / 2, 0, 0] });
  }
  addBox(parent, { w: 0.36, h: 1.2, d: 0.06, x: hx, y: hy, z: 0.17, material: M.darkMetal });
  addBox(parent, { w: 0.32, h: 1.1, d: 0.06, x: hx, y: hy, z: -0.17, material: M.darkMetal });

  // pedestrian signal lower on the pole
  addBox(parent, { w: 0.22, h: 0.34, d: 0.22, x: 0.2, y: 2.2, z: 0, material: M.dark });
  addBox(parent, { w: 0.16, h: 0.12, d: 0.03, x: 0.2, y: 2.28, z: -0.13, material: M.light });
  addBox(parent, { w: 0.16, h: 0.12, d: 0.03, x: 0.2, y: 2.12, z: -0.13, material: M.red });

  // conduit + junction box
  addCylinder(parent, { rTop: 0.025, rBottom: 0.025, h: poleH - 0.4, x: -0.07, y: poleH / 2, z: 0.02, material: M.metal, segments: 6 });
  addBox(parent, { w: 0.26, h: 0.5, d: 0.2, x: 0.06, y: 0.4, z: 0.16, material: M.darkMetal });
  addBox(parent, { w: 0.2, h: 0.36, d: 0.02, x: 0.06, y: 0.4, z: 0.27, material: M.dark });
  addBox(parent, { w: 0.5, h: 0.1, d: 0.2, x: 0.24, y: poleH + 0.55, z: 0, material: M.darkMetal });
}

// --- Street light / lamp post --------------------------------------------

function buildStreetLight(parent, spec) {
  const M = palette(spec);
  const poleH = 4.9;
  addCylinder(parent, { rTop: 0.2, rBottom: 0.24, h: 0.32, y: 0.16, material: M.darkMetal, segments: 12 });
  addCylinder(parent, { rTop: 0.1, rBottom: 0.11, h: 0.06, y: 0.35, material: M.metal, segments: 12 });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    addCylinder(parent, { rTop: 0.02, rBottom: 0.02, h: 0.05, x: Math.cos(a) * 0.17, y: 0.34, z: Math.sin(a) * 0.17, material: M.metal, segments: 6 });
  }
  addCylinder(parent, { rTop: 0.06, rBottom: 0.1, h: poleH, y: poleH / 2 + 0.38, material: M.metal, segments: 10 });

  const armX0 = 0;
  const armX1 = 0.9;
  const armY0 = poleH + 0.3;
  const armY1 = poleH + 0.85;
  const arm = addBox(parent, { w: Math.hypot(armX1 - armX0, armY1 - armY0), h: 0.1, d: 0.1, x: (armX0 + armX1) / 2, y: (armY0 + armY1) / 2 + 0.38, z: 0, material: M.metal });
  arm.rotation.z = Math.atan2(armY1 - armY0, armX1 - armX0);

  const lampY = armY1 + 0.44;
  addBox(parent, { w: 0.56, h: 0.14, d: 0.28, x: armX1, y: lampY, z: 0, material: M.darkMetal });
  addBox(parent, { w: 0.5, h: 0.05, d: 0.24, x: armX1, y: lampY - 0.09, z: 0, material: M.lens });
  addBox(parent, { w: 0.2, h: 0.06, d: 0.3, x: armX1 - 0.2, y: lampY + 0.09, z: 0, material: M.metal });
  addBox(parent, { w: 0.16, h: 0.24, d: 0.14, x: 0.08, y: 1.2, z: 0, material: M.darkMetal });
  addBox(parent, { w: 0.1, h: 0.02, d: 0.012, x: 0, y: 1.2, z: 0.071, material: M.metal });
  addBox(parent, { w: 0.12, h: 0.3, d: 0.12, x: -0.02, y: poleH + 0.9, z: 0, material: M.darkMetal });
}

// --- Urban trash can ------------------------------------------------------

function buildTrashCan(parent, spec) {
  const M = palette(spec);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addBox(parent, { w: 0.1, h: 0.08, d: 0.1, x: Math.cos(a) * 0.24, y: 0.04, z: Math.sin(a) * 0.24, material: M.darkMetal });
  }
  addCylinder(parent, { rTop: 0.3, rBottom: 0.26, h: 0.78, y: 0.47, material: M.body2, segments: 12 });
  addCylinder(parent, { rTop: 0.315, rBottom: 0.315, h: 0.08, y: 0.87, material: M.darkMetal, segments: 12 });
  addCylinder(parent, { rTop: 0.29, rBottom: 0.29, h: 0.06, y: 0.9, material: M.liner, segments: 12 });
  addCylinder(parent, { rTop: 0.32, rBottom: 0.3, h: 0.16, y: 0.98, material: M.body2, segments: 12 });
  addCylinder(parent, { rTop: 0.26, rBottom: 0.32, h: 0.12, y: 1.12, material: M.darkMetal, segments: 12 });
  addRoundedBox(parent, { w: 0.26, h: 0.5, d: 0.04, x: 0, y: 0.5, z: 0.28, radius: 0.02, segments: 1, material: M.darkMetal });
  addBox(parent, { w: 0.16, h: 0.05, d: 0.03, x: 0, y: 0.5, z: 0.31, material: M.metal });
  for (const sx of [-1, 1]) {
    addBox(parent, { w: 0.04, h: 0.08, d: 0.04, x: sx * 0.12, y: 0.72, z: 0.28, material: M.metal });
    for (let i = 0; i < 3; i++) {
      addBox(parent, { w: 0.02, h: 0.12, d: 0.02, x: sx * 0.24, y: 0.35 + i * 0.14, z: 0.16, material: M.liner });
    }
  }
  addBox(parent, { w: 0.18, h: 0.18, d: 0.012, x: 0, y: 0.6, z: -0.28, material: M.light });
}

export function buildUrbanProp(parent, spec) {
  if (spec?.type === "fire-hydrant") {
    buildHydrant(parent, spec);
    return true;
  }
  if (spec?.type === "mailbox") {
    buildMailbox(parent, spec);
    return true;
  }
  if (spec?.type === "traffic-light") {
    buildTrafficLight(parent, spec);
    return true;
  }
  if (spec?.type === "street-light") {
    buildStreetLight(parent, spec);
    return true;
  }
  if (spec?.type === "trash-can") {
    buildTrashCan(parent, spec);
    return true;
  }
  return false;
}
