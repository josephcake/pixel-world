import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { buildItemGroup, disposeGroup } from "../engine/world3d/buildItem.js";

const ROW_GAP = 10;
const COL_GAP = 4;
const ROW_DEPTH = 12;

function makeLabel(text) {
  const el = document.createElement("div");
  el.className = "world3d-label";
  el.textContent = text;
  return new CSS2DObject(el);
}

function layoutGroups(root, groups) {
  let z = 0;
  for (const group of groups) {
    let x = 0;
    let rowDepth = 0;
    for (const item of group.items) {
      const w = item.footprint?.w ?? 2;
      const d = item.footprint?.d ?? 2;
      const node = buildItemGroup(item);
      node.position.set(x, 0, z);
      root.add(node);
      const label = makeLabel(item.name ?? item.id);
      label.position.set(x + w / 2, 0.02, z + d + 0.8);
      label.visible = false;
      node.userData.label = label;
      root.add(label);
      x += w + COL_GAP;
      rowDepth = Math.max(rowDepth, d);
    }
    z += Math.max(ROW_DEPTH, rowDepth + ROW_GAP);
  }
}

// An assembled example: modular road tiles snapped on the 4-unit grid, with
// lots and traffic placed on/around them, offset to the side of the catalog.
function demoCity(root, groups) {
  const find = (id) => {
    for (const g of groups) {
      const it = g.items.find((x) => x.id === id);
      if (it) return it;
    }
    return null;
  };
  const ox = -64;
  const oz = -30;
  const place = (id, col, row, rotY = 0, dx = 0, dz = 0) => {
    const it = find(id);
    if (!it) return;
    const node = buildItemGroup(it);
    node.position.set(ox + col * 4 + dx, 0, oz + row * 4 + dz);
    node.rotation.y = rotY;
    root.add(node);
  };
  // road network (connected on the 4-unit grid)
  place("road-straight-z", 1, 0);
  place("road-straight-z", 1, 1);
  place("road-cross", 1, 2);
  place("road-dead-end", 1, 3);
  place("road-straight-x", 0, 2);
  place("road-straight-x", 2, 2);
  place("road-straight-z", 3, 1);
  place("road-tee-z", 3, 2);
  place("road-roundabout", 3, 0);
  place("road-corner-br", -1, 2);
  place("road-straight-z", -1, 3);
  // lots (non-road cells)
  place("family", 0, 0, 0, 0.5, 1.1);
  place("villa", 2, 0, 0, 0.5, 0.6);
  place("tower", 0, 1, 0, 0.5, 0.6);
  place("warehouse-small", 2, 1, 0, 0, 0);
  place("mansion", 0, 3, 0, 0, 0);
  place("family", 2, 3, 0, 0.5, 1.0);
  place("tower", -1, 0, 0, 0.5, 0.5);
  // traffic on the roads
  place("sedan", 1, 1, Math.PI / 2, 2.0, 2.0);
  place("semi-truck", 2, 2, 0, 2.0, 2.0);
  place("box-truck", 0, 2, 0, 2.0, 2.0);
  place("taxi", 3, 1, Math.PI / 2, 2.0, 2.0);
  // nature
  place("tree-medium", 3, 3, 0, 2.0, 2.0);
  place("tree-conifer", 2, 0, 0, 3.2, 3.2);
  place("bush", 0, 0, 0, 1.4, 3.2);
}

export default function World3D({ groups = [] }) {
  const stageRef = useRef(null);
  const groupsRef = useRef(groups);
  const resetRef = useRef(null);

  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = "world3d-canvas";
    stage.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = "world3d-labels";
    stage.appendChild(labelRenderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1018);
    scene.fog = new THREE.Fog(0x0b1018, 140, 380);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.5, 3000);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.04;
    controls.minDistance = 3;
    controls.maxDistance = 500;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };

    scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0a0e16, 1.1));
    scene.add(new THREE.AmbientLight(0xffffff, 0.22));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(70, 110, 50);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.05;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 500;
    key.shadow.camera.left = -180;
    key.shadow.camera.right = 180;
    key.shadow.camera.top = 180;
    key.shadow.camera.bottom = -180;
    scene.add(key);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1600, 1600),
      new THREE.MeshStandardMaterial({ color: 0x141b27, roughness: 1, metalness: 0 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(600, 300, 0x2f3b57, 0x212a3d);
    grid.position.y = 0.05;
    scene.add(grid);

    const built = new THREE.Group();
    scene.add(built);
    layoutGroups(built, groupsRef.current);
    demoCity(built, groupsRef.current);

    const box = new THREE.Box3().setFromObject(built);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(size.length(), 40);
    camera.position.set(
      center.x + radius * 0.62,
      center.y + radius * 0.5,
      center.z + radius * 0.86,
    );
    controls.target.copy(center);
    controls.update();

    const homePos = camera.position.clone();
    const homeTarget = controls.target.clone();
    resetRef.current = () => {
      camera.position.copy(homePos);
      controls.target.copy(homeTarget);
      controls.update();
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickables = [];
    built.traverse((o) => {
      if (o.isMesh) pickables.push(o);
    });
    let hovered = null;
    let pickDirty = false;
    const setHovered = (group) => {
      if (hovered === group) return;
      if (hovered?.userData?.label) hovered.userData.label.visible = false;
      hovered = group;
      if (hovered?.userData?.label) hovered.userData.label.visible = true;
    };
    const onPointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      pickDirty = true;
    };
    const onPointerLeave = () => setHovered(null);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const w = stage.clientWidth || 1;
      const h = stage.clientHeight || 1;
      renderer.setSize(w, h, false);
      labelRenderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    let frame = 0;
    const forward = new THREE.Vector3();
    const centerPoint = new THREE.Vector3();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      camera.getWorldDirection(forward);
      if (forward.y < -0.12) {
        const t = -camera.position.y / forward.y;
        if (t > 1 && t < 800) {
          centerPoint.copy(camera.position).addScaledVector(forward, t);
          controls.target.copy(centerPoint);
        }
      }
      controls.update();
      if (pickDirty) {
        pickDirty = false;
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(pickables, false);
        let group = null;
        if (hits.length) {
          let o = hits[0].object;
          while (o.parent && o.parent !== built) o = o.parent;
          if (o.parent === built) group = o;
        }
        setHovered(group);
      }
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      resetRef.current = null;
      controls.dispose();
      disposeGroup(built);
      ground.geometry.dispose();
      ground.material.dispose();
      grid.geometry.dispose();
      grid.material?.dispose?.();
      renderer.dispose();
      if (labelRenderer.domElement.parentNode === stage) {
        stage.removeChild(labelRenderer.domElement);
      }
      if (renderer.domElement.parentNode === stage) {
        stage.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="world3d">
      <div className="playground-bar">
        <span className="world3d-title">3D World</span>
        <button className="pg-clear" type="button" onClick={() => resetRef.current?.()}>
          Reset View
        </button>
        <span className="pg-hint">Drag to tilt &middot; right-drag to pan &middot; scroll to zoom</span>
      </div>
      <div className="world3d-stage" ref={stageRef} />
    </div>
  );
}
