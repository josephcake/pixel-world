import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

// Shared low-poly helpers for the 3D World view. Colors arrive as sRGB
// [r,g,b] arrays (the same spec palette the CPU renderer uses).

export function rgb(colorLike, fallback = [200, 200, 200]) {
  const c =
    Array.isArray(colorLike) && Array.isArray(colorLike[0])
      ? colorLike[0]
      : colorLike;
  const [r, g, b] = c ?? fallback;
  return new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
}

export function shade(colorLike, factor) {
  const c =
    Array.isArray(colorLike) && Array.isArray(colorLike[0])
      ? colorLike[0]
      : colorLike;
  const [r, g, b] = c ?? [200, 200, 200];
  return [
    Math.round(r * factor),
    Math.round(g * factor),
    Math.round(b * factor),
  ];
}

export function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: rgb(color),
    roughness: 0.78,
    metalness: 0.04,
    flatShading: true,
    ...opts,
  });
}

function finish(mesh, parent, { castShadow = true, receiveShadow = true } = {}) {
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  parent.add(mesh);
  return mesh;
}

export function addBox(parent, { w, h, d, x = 0, y = 0, z = 0, color, material, materials, rotation }) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    materials ?? material ?? mat(color),
  );
  mesh.position.set(x, y, z);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  return finish(mesh, parent);
}

export function addPlane(
  parent,
  { w, h, x = 0, y = 0, z = 0, color, material, rotationY = 0, opacity },
) {
  const m =
    material ??
    mat(color, opacity != null ? { transparent: true, opacity } : {});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotationY;
  return finish(mesh, parent, { castShadow: false });
}

export function addCylinder(
  parent,
  { rTop, rBottom, h, x = 0, y = 0, z = 0, color, material, segments = 10, rotation },
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom ?? rTop, h, segments),
    material ?? mat(color),
  );
  mesh.position.set(x, y, z);
  if (rotation) mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  return finish(mesh, parent);
}

// Chamfered rectangle outline in the shape's local x/y plane.
export function chamferedShape(w, d, ch, reverse = false) {
  const s = reverse ? new THREE.Path() : new THREE.Shape();
  const pts = [
    [ch, 0],
    [w - ch, 0],
    [w, ch],
    [w, d - ch],
    [w - ch, d],
    [ch, d],
    [0, d - ch],
    [0, ch],
  ];
  if (reverse) pts.reverse();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return s;
}

// Extrudes a shape drawn in x[0..w] / y[0..d] upward so the result occupies
// x[0..w], y[0..height], z[0..d] in item-local space.
export function extrudeUp(shape, height, d) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, d);
  return geo;
}

export function addExtrusion(parent, { shape, height, d, color, material }) {
  const mesh = new THREE.Mesh(
    extrudeUp(shape, height, d),
    material ?? mat(color),
  );
  return finish(mesh, parent);
}

// Chamfered/rounded box (large controlled bevels for a polished low-poly look).
export function addRoundedBox(
  parent,
  { w, h, d, x = 0, y = 0, z = 0, color, material, radius = 0.05, segments = 1 },
) {
  const minDim = Math.min(w, h, d);
  const rr = Math.max(0.004, Math.min(radius, minDim * 0.3));
  const mesh = new THREE.Mesh(
    new RoundedBoxGeometry(w, h, d, segments, rr),
    material ?? mat(color),
  );
  mesh.position.set(x, y, z);
  return finish(mesh, parent);
}

// Lathe-profiled tire with rounded shoulders + a recessed hub.
export function addWheel(parent, { x, y, z, r, w, tire, hub, segments = 12 }) {
  const pts = [
    new THREE.Vector2(r * 0.7, -w / 2),
    new THREE.Vector2(r * 0.95, -w / 2 + 0.02),
    new THREE.Vector2(r, -w / 2 + 0.07),
    new THREE.Vector2(r, w / 2 - 0.07),
    new THREE.Vector2(r * 0.95, w / 2 - 0.02),
    new THREE.Vector2(r * 0.7, w / 2),
  ];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(pts, segments), tire);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y ?? r, z);
  finish(mesh, parent);
  addCylinder(parent, { rTop: r * 0.72, rBottom: r * 0.72, h: w * 0.9, x, y: y ?? r, z, material: hub, segments, rotation: [Math.PI / 2, 0, 0] });
}
