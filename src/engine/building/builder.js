import { fillPoly, strokePoly, strokeLine, setLineWidth } from "../framebuffer.js";
import {
  makeProjector,
  drawGround,
  drawShadow,
  drawPath,
  drawWindowQuad,
} from "./iso.js";
import { drawProp } from "./props.js";
import { PIXEL_THEME } from "./themes.js";

function mainBox(spec) {
  return {
    ox: 0,
    oy: 0,
    w: spec.w,
    d: spec.d,
    stories: spec.stories ?? 1,
    storyHeight: spec.storyHeight ?? 5,
    wall: spec.wall,
    trim: spec.trim,
    window: spec.window ?? null,
    door: spec.door ?? null,
    roof: spec.roof ?? { type: "flat", height: 1 },
    chimney: spec.chimneys ?? spec.chimney ?? null,
    roller: spec.roller ?? null,
    garage: false,
    before: false,
  };
}

function annexBox(spec, a) {
  return {
    ox: a.ox,
    oy: a.oy,
    w: a.w,
    d: a.d,
    stories: a.stories ?? 1,
    storyHeight: a.storyHeight ?? spec.storyHeight ?? 5,
    wall: a.wall ?? spec.wall,
    trim: a.trim ?? spec.trim,
    window: a.window ?? null,
    door: a.door ?? null,
    roof: a.roof ?? { type: "flat", height: 1 },
    chimney: a.chimney ?? null,
    roller: a.roller ?? null,
    garage: a.garage ?? false,
    garageHeight: a.garageHeight,
    before: a.before ?? false,
  };
}

function allBoxes(spec) {
  const boxes = [mainBox(spec)];
  for (const a of spec.annexes ?? []) boxes.push(annexBox(spec, a));
  return boxes;
}

function roofHeight(roof) {
  if (!roof) return 0;
  return roof.height ?? (roof.type === "flat" ? 1 : 3);
}

function boxHeight(b) {
  return b.stories * b.storyHeight + roofHeight(b.roof);
}

function extents(boxes) {
  return {
    W: Math.max(...boxes.map((b) => b.ox + b.w)),
    D: Math.max(...boxes.map((b) => b.oy + b.d)),
    H: Math.max(...boxes.map(boxHeight)),
  };
}

export function measureBuilding(spec, scale = 1) {
  const boxes = allBoxes(spec);
  const { W, D, H } = extents(boxes);
  const p = makeProjector(W, D, spec.plotMargin ?? 2, H + (spec.extraSky ?? 0), scale);
  return { width: p.width, height: p.height };
}

function drawBoxWalls(fb, project, b, theme) {
  const P = (u, v, z) => project(b.ox + u, b.oy + v, z);
  const wallTop = b.stories * b.storyHeight;
  const front = theme.wallFront ?? theme.fill(b.wall.front);
  const side = theme.wallSide ?? theme.fill(b.wall.side);
  const trim = theme.trim ? theme.fill(b.trim ?? [104, 78, 52]) : null;

  for (let i = 0; i < b.stories; i++) {
    const z0 = i * b.storyHeight;
    const z1 = z0 + b.storyHeight;
    // back (y=0) and left (x=0) walls — plain, so rotations stay closed.
    fillPoly(fb, [P(0, 0, z0), P(b.w, 0, z0), P(b.w, 0, z1), P(0, 0, z1)], front);
    fillPoly(fb, [P(0, 0, z0), P(0, b.d, z0), P(0, b.d, z1), P(0, 0, z1)], side);
    // side (x=w) and front (y=d) walls — detailed faces.
    fillPoly(fb, [P(b.w, 0, z0), P(b.w, b.d, z0), P(b.w, b.d, z1), P(b.w, 0, z1)], side);
    fillPoly(fb, [P(0, b.d, z0), P(b.w, b.d, z0), P(b.w, b.d, z1), P(0, b.d, z1)], front);
    if (trim && theme.wallTopTrim !== false) {
      strokeLine(fb, P(b.w, b.d, z1)[0], P(b.w, b.d, z1)[1], P(b.w, 0, z1)[0], P(b.w, 0, z1)[1], trim);
      strokeLine(fb, P(0, b.d, z1)[0], P(0, b.d, z1)[1], P(b.w, b.d, z1)[0], P(b.w, b.d, z1)[1], trim);
    }
  }
  if (trim) {
    strokeLine(fb, P(b.w, b.d, 0)[0], P(b.w, b.d, 0)[1], P(b.w, b.d, wallTop)[0], P(b.w, b.d, wallTop)[1], trim);
    if (theme.baseTrim !== false) {
      strokePoly(fb, [P(0, b.d, 0), P(b.w, b.d, 0), P(b.w, 0, 0)], trim);
    }
  }
  if (theme.neon) {
    const lw = theme.lineWidth ?? 1;
    setLineWidth(Math.max(1, Math.round(lw * 0.9)));
    const ne = theme.neonEdge;
    // glowing cornice tracing the top of the walls
    strokeLine(fb, P(0, b.d, wallTop)[0], P(0, b.d, wallTop)[1], P(b.w, b.d, wallTop)[0], P(b.w, b.d, wallTop)[1], ne);
    strokeLine(fb, P(b.w, b.d, wallTop)[0], P(b.w, b.d, wallTop)[1], P(b.w, 0, wallTop)[0], P(b.w, 0, wallTop)[1], ne);
    // illuminated foundation + corner glow
    const nb = theme.neonBase;
    strokeLine(fb, P(0, b.d, 0)[0], P(0, b.d, 0)[1], P(b.w, b.d, 0)[0], P(b.w, b.d, 0)[1], nb);
    strokeLine(fb, P(b.w, b.d, 0)[0], P(b.w, b.d, 0)[1], P(b.w, 0, 0)[0], P(b.w, 0, 0)[1], nb);
    strokeLine(fb, P(b.w, b.d, 0)[0], P(b.w, b.d, 0)[1], P(b.w, b.d, wallTop)[0], P(b.w, b.d, wallTop)[1], nb);
    setLineWidth(lw);
  }
}

function frontWindows(w, n, ww, reserve) {
  if (!reserve) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const cx = ((k + 1) * w) / (n + 1);
      out.push([cx - ww / 2, cx + ww / 2]);
    }
    return out;
  }
  const margin = 0.1;
  const gap = 0.25;
  const regions = [
    [margin, reserve.x0 - gap],
    [reserve.x1 + gap, w - margin],
  ];
  const counts = [Math.ceil(n / 2), Math.floor(n / 2)];
  const out = [];
  regions.forEach((region, ri) => {
    const [a, bnd] = region;
    const span = bnd - a;
    const cnt = counts[ri];
    if (cnt <= 0 || span <= 0.15) return;
    const width = Math.min(ww, span);
    if (width < 0.2) return;
    for (let k = 0; k < cnt; k++) {
      const center = a + (span * (k + 1)) / (cnt + 1);
      out.push([center - width / 2, center + width / 2]);
    }
  });
  return out;
}

function drawBoxWindows(fb, project, b, theme) {
  if (!b.window) return;
  const P = (u, v, z) => project(b.ox + u, b.oy + v, z);
  const ws = theme.windowScale ?? 1;
  const ww = (b.window.ww ?? 0.5) * ws;
  const wh = Math.min((b.window.wh ?? 0.5) * ws, b.storyHeight * 0.72);
  const colors = {
    glass: theme.fill(b.window.glass ?? [150, 200, 230]),
    frame: theme.windowFrame ? theme.fill(b.window.frame ?? [92, 70, 48]) : null,
    hi: b.window.hi && theme.windowHi !== false ? theme.fill(b.window.hi) : null,
  };
  const zOff = b.window.zOff ?? Math.max(0, Math.floor((b.storyHeight - wh) / 2));
  const lw = theme.lineWidth ?? 1;
  setLineWidth(Math.max(1, Math.round(lw / 2)));

  for (let i = 0; i < b.stories; i++) {
    const z0 = i * b.storyHeight + zOff;
    const z1 = z0 + wh;
    const nFront = i === 0 ? (b.window.front ?? 2) : (b.window.frontUpper ?? 3);
    let reserve = null;
    if (i === 0) {
      if (b.garage) reserve = { x0: 0.4, x1: b.w - 0.4 };
      else if (b.door) {
        const dw = b.door.width ?? 2;
        reserve = { x0: b.w / 2 - dw / 2, x1: b.w / 2 + dw / 2 };
      }
    }
    for (const [x0, x1] of frontWindows(b.w, nFront, ww, reserve)) {
      drawWindowQuad(
        fb,
        [P(x0, b.d, z1), P(x1, b.d, z1), P(x1, b.d, z0), P(x0, b.d, z0)],
        colors,
      );
    }
    const nSide = b.window.side ?? 0;
    for (let k = 0; k < nSide; k++) {
      const cy = ((k + 1) * b.d) / (nSide + 1);
      const y0 = cy - ww / 2;
      const y1 = cy + ww / 2;
      drawWindowQuad(
        fb,
        [P(b.w, y1, z1), P(b.w, y0, z1), P(b.w, y0, z0), P(b.w, y1, z0)],
        colors,
      );
    }
  }
  setLineWidth(lw);
}

function drawBoxDoor(fb, project, b, theme) {
  if (!b.door) return;
  const P = (u, v, z) => project(b.ox + u, b.oy + v, z);
  const dw = b.door.width ?? 0.8;
  const dh = b.door.height ?? 1.2;
  const x0 = b.w / 2 - dw / 2;
  const x1 = b.w / 2 + dw / 2;
  const quad = [P(x0, b.d, dh), P(x1, b.d, dh), P(x1, b.d, 0), P(x0, b.d, 0)];
  fillPoly(fb, quad, theme.fill(b.door.color ?? [110, 76, 48]));
  if (theme.trim) strokePoly(fb, quad, theme.fill(b.trim ?? [104, 78, 52]));
  if (b.door.hi) {
    fillPoly(fb, [P(x1 - dw * 0.22, b.d, dh * 0.5), P(x1 - dw * 0.06, b.d, dh * 0.5)], theme.fill(b.door.hi));
  }
}

function drawGarageDoor(fb, project, b) {
  const P = (u, v, z) => project(b.ox + u, b.oy + v, z);
  const gh = b.garageHeight ?? 1.6;
  const gw = b.w - 0.4;
  const x0 = (b.w - gw) / 2;
  const x1 = x0 + gw;
  const quad = [P(x0, b.d, gh), P(x1, b.d, gh), P(x1, b.d, 0), P(x0, b.d, 0)];
  fillPoly(fb, quad, [186, 186, 188]);
  strokePoly(fb, quad, [108, 108, 110]);
  for (let i = 1; i < 4; i++) {
    const z = (gh * i) / 4;
    const a = P(x0, b.d, z);
    const c = P(x1, b.d, z);
    strokeLine(fb, a[0], a[1], c[0], c[1], [150, 150, 152]);
  }
}

function drawRollerDoors(fb, project, b, theme) {
  const list = b.roller;
  if (!list || !list.length) return;
  const P = (u, v, z) => project(b.ox + u, b.oy + v, z);
  for (const dd of list) {
    const quad = [P(dd.x0, b.d, dd.z1), P(dd.x1, b.d, dd.z1), P(dd.x1, b.d, dd.z0), P(dd.x0, b.d, dd.z0)];
    fillPoly(fb, quad, theme.fill(dd.color ?? [190, 193, 197]));
    strokePoly(fb, quad, theme.fill(dd.frame ?? [110, 115, 122]));
    const n = dd.panels ?? Math.max(2, Math.round((dd.z1 - dd.z0) / 1.1));
    for (let i = 1; i < n; i++) {
      const z = dd.z0 + ((dd.z1 - dd.z0) * i) / n;
      const a = P(dd.x0, b.d, z);
      const c = P(dd.x1, b.d, z);
      strokeLine(fb, a[0], a[1], c[0], c[1], theme.fill(dd.line ?? [158, 162, 168]));
    }
  }
}

function drawChimney(fb, P, c, wallTop, theme) {
  const base = c.base ?? wallTop - 1;
  const b1 = P(c.x1, c.y0, base);
  const c1 = P(c.x1, c.y1, base);
  const d1 = P(c.x0, c.y1, base);
  const at = P(c.x0, c.y0, c.top);
  const bt = P(c.x1, c.y0, c.top);
  const ct = P(c.x1, c.y1, c.top);
  const dt = P(c.x0, c.y1, c.top);
  fillPoly(fb, [d1, c1, ct, dt], theme.fill(c.front ?? [156, 126, 96]));
  fillPoly(fb, [b1, c1, ct, bt], theme.fill(c.side ?? [184, 154, 124]));
  fillPoly(fb, [at, bt, ct, dt], theme.fill(c.topColor ?? [208, 178, 148]));
}

function drawBoxChimney(fb, project, b, wallTop, theme) {
  if (!b.chimney || theme.chimney === false) return;
  const P = (u, v, z) => project(b.ox + u, b.oy + v, z);
  const list = Array.isArray(b.chimney) ? b.chimney : [b.chimney];
  for (const c of list) drawChimney(fb, P, c, wallTop, theme);
}

function strokeGable(fb, gable, ridge, edge, theme) {
  if (!edge) return;
  strokeLine(fb, gable[0][0], gable[0][1], ridge[0], ridge[1], edge);
  strokeLine(fb, gable[1][0], gable[1][1], ridge[0], ridge[1], edge);
  if (theme.gableBase !== false) {
    strokeLine(fb, gable[0][0], gable[0][1], gable[1][0], gable[1][1], edge);
  }
}

function strokeRoofQuad(fb, quad, edge) {
  if (!edge) return;
  strokeLine(fb, quad[0][0], quad[0][1], quad[1][0], quad[1][1], edge);
  strokeLine(fb, quad[1][0], quad[1][1], quad[2][0], quad[2][1], edge);
  strokeLine(fb, quad[3][0], quad[3][1], quad[0][0], quad[0][1], edge);
}

function drawBoxRoof(fb, project, b, wallTop, theme) {
  const roof = b.roof;
  if (!roof) return;
  const P = (u, v, z) => project(b.ox + u, b.oy + v, z);
  const type = theme.flatRoof ? "flat" : (roof.type ?? "gable");
  const edge = theme.neon
    ? theme.neonEdge
    : theme.roofEdge
      ? theme.fill(roof.edge ?? [112, 46, 34])
      : null;

  if (type === "flat") {
    const top = wallTop + (theme.flatRoof ? 0.5 : (roof.height ?? 1));
    const back = theme.roofFront ?? theme.fill(roof.front ?? roof.fill ?? [150, 150, 150]);
    const sideC = theme.roofSide ?? theme.fill(roof.side ?? roof.fill ?? [130, 130, 130]);
    fillPoly(fb, [P(b.w, 0, wallTop), P(b.w, b.d, wallTop), P(b.w, b.d, top), P(b.w, 0, top)], sideC);
    fillPoly(fb, [P(0, 0, wallTop), P(b.w, 0, wallTop), P(b.w, 0, top), P(0, 0, top)], back);
    fillPoly(fb, [P(0, b.d, wallTop), P(b.w, b.d, wallTop), P(b.w, b.d, top), P(0, b.d, top)], back);
    fillPoly(fb, [P(0, 0, wallTop), P(0, b.d, wallTop), P(0, b.d, top), P(0, 0, top)], sideC);
    const cap = [P(0, 0, top), P(b.w, 0, top), P(b.w, b.d, top), P(0, b.d, top)];
    fillPoly(fb, cap, theme.roofFill ?? theme.fill(roof.fill ?? [120, 120, 120]));
    if (edge) strokePoly(fb, cap, edge);
    return;
  }

  if (type === "hip") {
    const top = wallTop + (roof.height ?? 3);
    const apex = P(b.w / 2, b.d / 2, top);
    const fillA = theme.fill(roof.fillA ?? [150, 170, 190]);
    const fillB = theme.fill(roof.fillB ?? [120, 140, 160]);
    // back slopes first, then front slopes.
    fillPoly(fb, [P(0, 0, wallTop), P(b.w, 0, wallTop), apex], fillB);
    fillPoly(fb, [P(0, b.d, wallTop), P(0, 0, wallTop), apex], fillB);
    fillPoly(fb, [P(b.w, 0, wallTop), P(b.w, b.d, wallTop), apex], fillA);
    fillPoly(fb, [P(b.w, b.d, wallTop), P(0, b.d, wallTop), apex], fillB);
    if (edge) {
      strokeLine(fb, apex[0], apex[1], P(b.w, b.d, wallTop)[0], P(b.w, b.d, wallTop)[1], edge);
      strokeLine(fb, apex[0], apex[1], P(b.w, 0, wallTop)[0], P(b.w, 0, wallTop)[1], edge);
    }
    return;
  }

  const rh = roof.height ?? 3;
  const ov = roof.overhang ?? 0;
  const top = wallTop + rh;
  const fill = theme.fill(roof.fill ?? [192, 90, 68]);
  const gableFill = theme.fill(roof.gable ?? [166, 134, 90]);

  if ((roof.axis ?? "x") === "y") {
    const xr = b.w / 2;
    const R0 = P(xr, 0, top);
    const R1 = P(xr, b.d, top);
    // back (-x) slope
    fillPoly(fb, [R0, R1, P(0 - ov, b.d, wallTop), P(0 - ov, 0, wallTop)], fill);
    strokeRoofQuad(fb, [R0, R1, P(0 - ov, b.d, wallTop), P(0 - ov, 0, wallTop)], edge);
    // gables (y=0 and y=d)
    fillPoly(fb, [P(0 - ov, 0, wallTop), P(b.w + ov, 0, wallTop), R0], gableFill);
    strokeGable(fb, [P(0 - ov, 0, wallTop), P(b.w + ov, 0, wallTop), R0], R0, edge, theme);
    fillPoly(fb, [P(0 - ov, b.d, wallTop), P(b.w + ov, b.d, wallTop), R1], gableFill);
    strokeGable(fb, [P(0 - ov, b.d, wallTop), P(b.w + ov, b.d, wallTop), R1], R1, edge, theme);
    // front (+x) slope
    fillPoly(fb, [R0, R1, P(b.w + ov, b.d, wallTop), P(b.w + ov, 0, wallTop)], fill);
    strokeRoofQuad(fb, [R0, R1, P(b.w + ov, b.d, wallTop), P(b.w + ov, 0, wallTop)], edge);
  } else {
    const yr = b.d / 2;
    const R0 = P(0, yr, top);
    const R1 = P(b.w, yr, top);
    // back (-y) slope
    fillPoly(fb, [R0, R1, P(b.w, 0 - ov, wallTop), P(0, 0 - ov, wallTop)], fill);
    strokeRoofQuad(fb, [R0, R1, P(b.w, 0 - ov, wallTop), P(0, 0 - ov, wallTop)], edge);
    // gables (x=0 and x=w)
    fillPoly(fb, [P(0, 0 - ov, wallTop), P(0, b.d + ov, wallTop), R0], gableFill);
    strokeGable(fb, [P(0, 0 - ov, wallTop), P(0, b.d + ov, wallTop), R0], R0, edge, theme);
    fillPoly(fb, [P(b.w, 0 - ov, wallTop), P(b.w, b.d + ov, wallTop), R1], gableFill);
    strokeGable(fb, [P(b.w, 0 - ov, wallTop), P(b.w, b.d + ov, wallTop), R1], R1, edge, theme);
    // front (+y) slope
    fillPoly(fb, [R0, R1, P(b.w, b.d + ov, wallTop), P(0, b.d + ov, wallTop)], fill);
    strokeRoofQuad(fb, [R0, R1, P(b.w, b.d + ov, wallTop), P(0, b.d + ov, wallTop)], edge);
  }
}

function drawBox(fb, project, b, theme) {
  const wallTop = b.stories * b.storyHeight;
  drawBoxWalls(fb, project, b, theme);
  drawBoxWindows(fb, project, b, theme);
  drawRollerDoors(fb, project, b, theme);
  if (b.garage) drawGarageDoor(fb, project, b);
  else drawBoxDoor(fb, project, b, theme);
  drawBoxChimney(fb, project, b, wallTop, theme);
  drawBoxRoof(fb, project, b, wallTop, theme);
}

export function buildingFootprint(spec) {
  const { W, D } = extents(allBoxes(spec));
  return { w: W, d: D };
}

export function buildingHeight(spec) {
  const { H } = extents(allBoxes(spec));
  return H + (spec.extraSky ?? 0);
}

export function drawBuilding(fb, spec, theme = PIXEL_THEME, frame = null) {
  const boxes = allBoxes(spec);
  const { W, D, H } = extents(boxes);
  const scale = theme.scale ?? 1;
  setLineWidth(theme.lineWidth ?? 1);

  let project;
  let ox = 0;
  let oy = 0;
  let pm;
  if (frame) {
    project = frame.project;
    ox = frame.ox ?? 0;
    oy = frame.oy ?? 0;
    pm = frame.plotMargin ?? 0;
  } else {
    pm = spec.plotMargin ?? 2;
    ({ project } = makeProjector(W, D, pm, H + (spec.extraSky ?? 0), scale));
  }
  const P = (x, y, z = 0) => project(x + ox, y + oy, z);

  const scene = {
    grassA: [86, 130, 58],
    grassB: [98, 144, 68],
    grassEdge: [64, 100, 44],
    path: [178, 148, 108],
    pathEdge: [146, 118, 82],
    ...(spec.scene ?? {}),
  };

  if (spec.ground !== false) {
    drawGround(fb, P, W, D, pm, scene, theme);
  }
  if (spec.path) {
    drawPath(fb, P, spec.path.x0, spec.path.x1, spec.path.y0, spec.path.y1, scene, theme);
  }
  for (const d of spec.decals ?? []) drawProp(fb, P, d, theme);
  if (theme.shadow) {
    for (const b of boxes) drawShadow(fb, P, b.ox, b.oy, b.w, b.d, 4 * scale, 2 * scale, spec.shadow ?? [50, 82, 38]);
  }
  if (!theme.simple) {
    for (const p of spec.props ?? []) {
      if ((p.layer ?? "front") === "back") drawProp(fb, P, p, theme);
    }
  }

  for (const b of boxes) if (b.before) drawBox(fb, P, b, theme);
  drawBox(fb, P, boxes[0], theme);
  for (const b of boxes) if (!b.before && b !== boxes[0]) drawBox(fb, P, b, theme);

  if (!theme.simple) {
    for (const p of spec.props ?? []) {
      if ((p.layer ?? "front") === "front") drawProp(fb, P, p, theme);
    }
  }
}
