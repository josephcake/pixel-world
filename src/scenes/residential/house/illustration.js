import {
  fillPoly,
  strokePoly,
  strokeLine,
  setLineWidth,
  clearFramebuffer,
} from "../../../engine/framebuffer.js";
import { makeProjector } from "../../../engine/building/iso.js";
import { roundedRect, extrude } from "../../../engine/building/slab.js";
import { softShadowPoly } from "../../../engine/building/shadow.js";
import { ILLUSTRATION_THEME } from "../../../engine/building/themes.js";

const rgb = (hex) => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

export const DEFAULT_HOUSE_PALETTE = {
  background: "#FFFFFF",
  baseTop: "#EAE6DD",
  baseSide: "#DDD8CD",
  baseEdge: "#CBC5B8",
  lawn: "#AAD680",
  lawnEdge: "#97C46D",
  wallFront: "#F9ECC9",
  wallSide: "#F0DEB6",
  gable: "#F5E6C4",
  roof: "#F0A183",
  roofEdge: "#E08F70",
  ridge: "#F5B79E",
  door: "#8B94A2",
  window: "#8B94A2",
  outline: "#DAC7A0",
  chimney: "#F3E3C0",
  chimneySide: "#E7D5AC",
  chimneyCap: "#FAF1D8",
  bush: "#A8D07E",
  bushLight: "#C0E29C",
  bushDark: "#90BE68",
  shadow: "#2A2F3A",
};

export const PALETTE_PRESETS = {
  Clay: DEFAULT_HOUSE_PALETTE,
  Purple: { ...DEFAULT_HOUSE_PALETTE, roof: "#C3A6F5", roofEdge: "#AE8EEA", ridge: "#D6C2F8" },
  Forest: {
    ...DEFAULT_HOUSE_PALETTE,
    roof: "#9ACBA6",
    roofEdge: "#84B892",
    ridge: "#B4DBBE",
    lawn: "#A6D488",
    bush: "#9ECB7C",
  },
  Ocean: { ...DEFAULT_HOUSE_PALETTE, roof: "#A6C9EE", roofEdge: "#8FB4DE", ridge: "#C0D8F4" },
  Sunset: { ...DEFAULT_HOUSE_PALETTE, roof: "#F3AC9C", roofEdge: "#E19584", ridge: "#F7C3B5" },
};

const GEO = {
  bw: 9.8,
  bd: 9.2,
  br: 1.4,
  bh: 0.7,
  inset: 0.8,
  lawnR: 1.0,
  hw: 6.6,
  hd: 5.8,
  wallH: 3.7,
  roofH: 3.1,
  ov: 0.6,
  pm: 1.6,
};

function makeProj(scale) {
  const totalH = GEO.bh + GEO.wallH + GEO.roofH + 1.6;
  return makeProjector(GEO.bw, GEO.bd, GEO.pm, totalH, scale);
}

export function measureIllustration(scale = 1) {
  const p = makeProj(scale);
  return { width: p.width, height: p.height };
}

export function drawIllustration(fb, theme, palette) {
  const p = { ...DEFAULT_HOUSE_PALETTE, ...palette };
  const scale = theme.scale ?? 4;
  const lw = theme.lineWidth ?? 2;
  const { project } = makeProj(scale);
  setLineWidth(lw);

  clearFramebuffer(fb, rgb(p.background));

  const { bw, bd, br, bh, inset, lawnR, hw, hd, wallH, roofH, ov } = GEO;
  const hx = (bw - hw) / 2;
  const hy = (bd - hd) / 2;
  const iso = (x, y, z = 0) => project(hx + x, hy + y, z);
  const wallBase = bh;
  const wallTop = bh + wallH;
  const ridgeZ = bh + wallH + roofH;
  const ridgeY = hd / 2;

  const slab = roundedRect(bw, bd, br);
  const shadowPts = slab.map((q) => {
    const s = project(q[0], q[1], 0);
    return [s[0] + 2 * scale, s[1] + 3 * scale];
  });
  softShadowPoly(fb, shadowPts, {
    color: rgb(p.shadow),
    alpha: theme.shadowAlpha ?? 0.16,
    blur: (theme.shadowBlur ?? 9) * scale,
  });

  extrude(fb, project, slab, bh, 0, {
    top: rgb(p.baseTop),
    side: rgb(p.baseSide),
    edge: rgb(p.baseEdge),
  });

  const lawn = roundedRect(bw - inset * 2, bd - inset * 2, lawnR).map((q) => [
    q[0] + inset,
    q[1] + inset,
  ]);
  const lawnTop = lawn.map((q) => project(q[0], q[1], bh + 0.05));
  fillPoly(fb, lawnTop, rgb(p.lawn));
  strokePoly(fb, lawnTop, rgb(p.lawnEdge));

  const paintWall = (pts, color) => {
    fillPoly(fb, pts, rgb(color));
    setLineWidth(lw);
    strokePoly(fb, pts, rgb(p.outline));
  };

  paintWall([iso(hw, 0, wallBase), iso(hw, hd, wallBase), iso(hw, hd, wallTop), iso(hw, 0, wallTop)], p.wallSide);
  paintWall([iso(0, hd, wallBase), iso(hw, hd, wallBase), iso(hw, hd, wallTop), iso(0, hd, wallTop)], p.wallFront);
  paintWall([iso(hw, 0, wallTop), iso(hw, hd, wallTop), iso(hw, ridgeY, ridgeZ)], p.gable);

  const R0 = iso(0, ridgeY, ridgeZ);
  const R1 = iso(hw, ridgeY, ridgeZ);
  const eL = iso(0, hd + ov, wallTop);
  const eR = iso(hw, hd + ov, wallTop);
  fillPoly(fb, [R0, R1, eR, eL], rgb(p.roof));
  setLineWidth(lw);
  strokePoly(fb, [R0, R1, eR, eL], rgb(p.roofEdge));
  strokeLine(fb, R0[0], R0[1], R1[0], R1[1], rgb(p.ridge));

  const win = (y0, y1, z0, z1) => [iso(hw, y0, z0), iso(hw, y1, z0), iso(hw, y1, z1), iso(hw, y0, z1)];
  setLineWidth(Math.max(1, lw * 0.5));
  for (const y of [hd * 0.24, hd * 0.58]) {
    const quad = win(y, y + 1.0, wallBase + 0.9, wallBase + 2.4);
    fillPoly(fb, quad, rgb(p.window));
    strokePoly(fb, quad, rgb(p.outline));
  }
  const door = [
    iso(hw / 2 - 0.78, hd, wallBase + 2.7),
    iso(hw / 2 + 0.78, hd, wallBase + 2.7),
    iso(hw / 2 + 0.78, hd, wallBase),
    iso(hw / 2 - 0.78, hd, wallBase),
  ];
  fillPoly(fb, door, rgb(p.door));
  strokePoly(fb, door, rgb(p.outline));

  setLineWidth(lw);
  const chx0 = hw * 0.5;
  const chx1 = hw * 0.5 + 0.9;
  const chy0 = ridgeY - 0.35;
  const chy1 = ridgeY + 0.55;
  const chBase = wallTop + 0.15;
  const chTop = ridgeZ + 0.7;
  const P = (u, v, z) => iso(u, v, z);
  fillPoly(fb, [P(chx0, chy1, chBase), P(chx1, chy1, chBase), P(chx1, chy1, chTop), P(chx0, chy1, chTop)], rgb(p.chimney));
  fillPoly(fb, [P(chx1, chy0, chBase), P(chx1, chy1, chBase), P(chx1, chy1, chTop), P(chx1, chy0, chTop)], rgb(p.chimneySide));
  fillPoly(fb, [P(chx1, chy0, chTop), P(chx1, chy1, chTop), P(chx0, chy1, chTop), P(chx0, chy0, chTop)], rgb(p.chimney));
  strokeLine(fb, P(chx1, chy1, chBase)[0], P(chx1, chy1, chBase)[1], P(chx1, chy1, chTop)[0], P(chx1, chy1, chTop)[1], rgb(p.outline));

  const capH = 0.28;
  const kx0 = chx0 - 0.14;
  const kx1 = chx1 + 0.14;
  const ky0 = chy0 - 0.14;
  const ky1 = chy1 + 0.14;
  const capT = chTop + capH;
  fillPoly(fb, [P(kx0, ky1, chTop), P(kx1, ky1, chTop), P(kx1, ky1, capT), P(kx0, ky1, capT)], rgb(p.chimneyCap));
  fillPoly(fb, [P(kx1, ky0, chTop), P(kx1, ky1, chTop), P(kx1, ky1, capT), P(kx1, ky0, capT)], rgb(p.chimneyCap));
  fillPoly(fb, [P(kx1, ky0, capT), P(kx1, ky1, capT), P(kx0, ky1, capT), P(kx0, ky0, capT)], rgb(p.chimneyCap));
  const ix0 = chx0 + 0.2;
  const ix1 = chx1 - 0.2;
  const iy0 = chy0 + 0.2;
  const iy1 = chy1 - 0.2;
  fillPoly(fb, [P(ix1, iy0, capT + 0.02), P(ix1, iy1, capT + 0.02), P(ix0, iy1, capT + 0.02), P(ix0, iy0, capT + 0.02)], rgb(p.baseSide));
}

export function makeIllustrationFamilyHouse(palette = DEFAULT_HOUSE_PALETTE) {
  const p = { ...DEFAULT_HOUSE_PALETTE, ...palette };
  return {
    id: "family-illustration",
    name: "Family Home",
    theme: ILLUSTRATION_THEME,
    palette: p,
    measure: (scale = 1) => measureIllustration(scale),
    draw: (fb, theme = ILLUSTRATION_THEME) => drawIllustration(fb, theme, p),
  };
}

export const ILLUSTRATION_HOUSES = [makeIllustrationFamilyHouse()];
