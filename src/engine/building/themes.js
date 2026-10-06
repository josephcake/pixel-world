import { dither } from "./iso.js";
import { architectural } from "../color.js";

const avg = (a, b) => [
  Math.round((a[0] + b[0]) / 2),
  Math.round((a[1] + b[1]) / 2),
  Math.round((a[2] + b[2]) / 2),
];

export function isPair(c) {
  return Array.isArray(c) && c.length === 2 && Array.isArray(c[0]);
}

export const PIXEL_THEME = {
  id: "pixel",
  scale: 4,
  lineWidth: 4,
  downsample: false,
  patterns: true,
  trim: true,
  wallTopTrim: false,
  baseTrim: false,
  gableBase: false,
  roofEdge: true,
  shadow: false,
  windowFrame: true,
  fill(c) {
    return isPair(c) ? dither(c[0], c[1], 4) : c;
  },
};

export const ILLUSTRATION_THEME = {
  id: "illustration",
  scale: 16,
  aaFactor: 2,
  lineWidth: 5,
  downsample: false,
  patterns: false,
  trim: true,
  roofEdge: false,
  shadow: false,
  softShadow: true,
  windowFrame: true,
  shadowColor: [28, 34, 52],
  shadowAlpha: 0.16,
  shadowBlur: 2,
  fill(c) {
    return isPair(c) ? avg(c[0], c[1]) : c;
  },
};

export const ARCHITECTURAL_THEME = {
  id: "architectural",
  scale: 16,
  aaFactor: 2,
  lineWidth: 2,
  downsample: false,
  patterns: false,
  trim: true,
  wallTopTrim: false,
  baseTrim: false,
  gableBase: false,
  roofEdge: true,
  shadow: false,
  windowFrame: true,
  flatRoof: true,
  chimney: false,
  windowScale: 1.9,
  windowHi: false,
  neon: true,
  neonEdge: [176, 140, 255],
  neonBase: [124, 84, 230],
  background: [12, 16, 26],
  wallFront: [234, 236, 240],
  wallSide: [204, 208, 216],
  roofFill: [104, 110, 124],
  roofSide: [86, 92, 106],
  roofFront: [94, 100, 114],
  fill(c) {
    return architectural(isPair(c) ? avg(c[0], c[1]) : c);
  },
};

export const THEMES = {
  pixel: PIXEL_THEME,
  architectural: ARCHITECTURAL_THEME,
  illustration: ILLUSTRATION_THEME,
};

export const DEFAULT_THEME = PIXEL_THEME;
