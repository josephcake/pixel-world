export function createFramebuffer(width, height) {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

export function clearFramebuffer(fb, rgb, alpha = 255) {
  for (let i = 0; i < fb.data.length; i += 4) {
    fb.data[i] = rgb[0];
    fb.data[i + 1] = rgb[1];
    fb.data[i + 2] = rgb[2];
    fb.data[i + 3] = alpha;
  }
}

export function scaleNearest(fb, factor) {
  const w = fb.width * factor;
  const h = fb.height * factor;
  const out = { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (((y / factor) | 0) * fb.width + ((x / factor) | 0)) * 4;
      const di = (y * w + x) * 4;
      out.data[di] = fb.data[si];
      out.data[di + 1] = fb.data[si + 1];
      out.data[di + 2] = fb.data[si + 2];
      out.data[di + 3] = fb.data[si + 3];
    }
  }
  return out;
}

export function downsample(fb, factor) {
  const width = Math.floor(fb.width / factor);
  const height = Math.floor(fb.height / factor);
  const out = { width, height, data: new Uint8ClampedArray(width * height * 4) };
  const n = factor * factor;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < factor; sy++) {
        for (let sx = 0; sx < factor; sx++) {
          const i = ((y * factor + sy) * fb.width + (x * factor + sx)) * 4;
          r += fb.data[i];
          g += fb.data[i + 1];
          b += fb.data[i + 2];
          a += fb.data[i + 3];
        }
      }
      const o = (y * width + x) * 4;
      out.data[o] = r / n;
      out.data[o + 1] = g / n;
      out.data[o + 2] = b / n;
      out.data[o + 3] = a / n;
    }
  }
  return out;
}

export function blit(dest, src, ox, oy) {
  for (let y = 0; y < src.height; y++) {
    for (let x = 0; x < src.width; x++) {
      const si = (y * src.width + x) * 4;
      if (src.data[si + 3] === 0) continue;
      const dx = ox + x;
      const dy = oy + y;
      if (dx < 0 || dy < 0 || dx >= dest.width || dy >= dest.height) continue;
      const di = (dy * dest.width + dx) * 4;
      dest.data[di] = src.data[si];
      dest.data[di + 1] = src.data[si + 1];
      dest.data[di + 2] = src.data[si + 2];
      dest.data[di + 3] = 255;
    }
  }
}

export function setPixel(fb, x, y, rgb) {
  x |= 0;
  y |= 0;
  if (x < 0 || y < 0 || x >= fb.width || y >= fb.height) return;
  const i = (y * fb.width + x) * 4;
  fb.data[i] = rgb[0];
  fb.data[i + 1] = rgb[1];
  fb.data[i + 2] = rgb[2];
  fb.data[i + 3] = 255;
}

export function blendPixel(fb, x, y, rgb, a) {
  x |= 0;
  y |= 0;
  if (a <= 0 || x < 0 || y < 0 || x >= fb.width || y >= fb.height) return;
  const i = (y * fb.width + x) * 4;
  const ia = 1 - a;
  fb.data[i] = fb.data[i] * ia + rgb[0] * a;
  fb.data[i + 1] = fb.data[i + 1] * ia + rgb[1] * a;
  fb.data[i + 2] = fb.data[i + 2] * ia + rgb[2] * a;
  fb.data[i + 3] = 255;
}

export function getPixel(fb, x, y) {
  if (x < 0 || y < 0 || x >= fb.width || y >= fb.height) return [0, 0, 0, 0];
  const i = (y * fb.width + x) * 4;
  return [fb.data[i], fb.data[i + 1], fb.data[i + 2], fb.data[i + 3]];
}

export function fillPoly(fb, pts, color) {
  const cf = typeof color === "function" ? color : () => color;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(fb.height - 1, Math.ceil(maxY));
  for (let y = y0; y <= y1; y++) {
    const yc = y + 0.5;
    const xs = [];
    for (let i = 0, n = pts.length; i < n; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % n];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
        xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
    }
    if (xs.length < 2) continue;
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const xa = Math.ceil(xs[i] - 0.5);
      const xb = Math.floor(xs[i + 1] - 0.5);
      for (let x = xa; x <= xb; x++) setPixel(fb, x, y, cf(x, y));
    }
  }
}

let lineWidth = 1;

export function setLineWidth(w) {
  lineWidth = Math.max(1, Math.round(w));
}

function rasterLine(fb, x0, y0, x1, y1, cf) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPixel(fb, x0, y0, cf(x0, y0));
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
}

export function strokeLine(fb, x0, y0, x1, y1, color) {
  if (lineWidth <= 1) {
    const cf = typeof color === "function" ? color : () => color;
    rasterLine(fb, Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), cf);
    return;
  }
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const h = lineWidth / 2;
  const ex = ux * h;
  const ey = uy * h;
  const ax = x0 - ex;
  const ay = y0 - ey;
  const bx = x1 + ex;
  const by = y1 + ey;
  fillPoly(
    fb,
    [
      [ax + px * h, ay + py * h],
      [bx + px * h, by + py * h],
      [bx - px * h, by - py * h],
      [ax - px * h, ay - py * h],
    ],
    color,
  );
}

export function strokePoly(fb, pts, color) {
  for (let i = 0, n = pts.length; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    strokeLine(fb, a[0], a[1], b[0], b[1], color);
  }
}
