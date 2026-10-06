export function rgbToHsl([r, g, b]) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
    else if (max === gn) h = ((bn - rn) / d + 2) / 6;
    else h = ((rn - gn) / d + 4) / 6;
  }
  return [h, s, l];
}

export function hslToRgb([h, s, l]) {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(hue(h + 1 / 3) * 255),
    Math.round(hue(h) * 255),
    Math.round(hue(h - 1 / 3) * 255),
  ];
}

// Futuristic architectural recoloring: light-gray shells with purple accents,
// dark pavement/roads/ground for contrast. (Neon accents are drawn separately.)
export function architectural(c) {
  const [h, s, l] = rgbToHsl(c);
  const deg = h * 360;
  // Neutrals (pavement, road, concrete, trim) → medium-dark gray, darker than the walls.
  if (s < 0.14) {
    const g = Math.round(40 + l * 40);
    return [g, g + 2, g + 6];
  }
  // Green (ground/landscaping) → dark base.
  if (deg > 70 && deg < 160) return [24, 26, 32];
  // Cool blue (glass) → purple glazing.
  if (deg > 185 && deg < 255) {
    const t = Math.min(1, Math.max(0, (l - 0.4) / 0.4));
    return [Math.round(150 + t * 40), Math.round(120 + t * 30), 235];
  }
  // Dark building features (doors) → purple.
  if (l < 0.4) return [132, 104, 208];
  // Light building surfaces → light gray.
  const v = Math.round(206 + (l - 0.4) * 60);
  return [v, v + 1, v + 5];
}
