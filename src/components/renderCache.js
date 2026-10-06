import { renderSquare } from "../engine/building/scene.js";

const cache = new Map();

const keyOf = (item, theme, size) => `${theme.id}:${item.id}:${size}`;

export function peekCell(item, theme, size) {
  return cache.get(keyOf(item, theme, size)) ?? null;
}

export function ensureCell(item, theme, size) {
  const key = keyOf(item, theme, size);
  const cached = cache.get(key);
  if (cached) return cached;

  const fb = renderSquare(item, theme, size);
  const canvas = document.createElement("canvas");
  canvas.width = fb.width;
  canvas.height = fb.height;
  canvas
    .getContext("2d")
    .putImageData(
      new ImageData(new Uint8ClampedArray(fb.data), fb.width, fb.height),
      0,
      0,
    );
  cache.set(key, canvas);
  return canvas;
}
