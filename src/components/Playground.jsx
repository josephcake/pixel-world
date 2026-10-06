import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renderViewport, cameraProject, renderHouse, rotatedFootprint } from "../engine/building/scene.js";
import { U, V } from "../engine/building/iso.js";
import { PIXEL_THEME } from "../engine/building/themes.js";
import { downsample } from "../engine/framebuffer.js";
import { ALL_GROUPS, ALL_ITEMS } from "../scenes/allItems.js";
import { toWorldObjects, serializeWorld } from "../world/index.js";
import { BLUEPRINTS } from "../scenes/blueprints/index.js";

const BG = [236, 238, 242];
const BASE = 16;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 4;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function Thumb({ item, theme }) {
  const ref = useRef(null);
  useEffect(() => {
    const fb = renderHouse(item, theme);
    const off = document.createElement("canvas");
    off.width = fb.width;
    off.height = fb.height;
    off.getContext("2d").putImageData(
      new ImageData(new Uint8ClampedArray(fb.data), fb.width, fb.height),
      0,
      0,
    );
    const canvas = ref.current;
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = !!theme.aaFactor;
    const k = Math.min(48 / fb.width, 48 / fb.height);
    const w = Math.max(1, Math.round(fb.width * k));
    const h = Math.max(1, Math.round(fb.height * k));
    ctx.drawImage(off, 0, 0, fb.width, fb.height, (48 - w) / 2, (48 - h) / 2, w, h);
  }, [item, theme]);
  return (
    <canvas
      ref={ref}
      style={{ width: 48, height: 48, imageRendering: theme.aaFactor ? "auto" : "pixelated" }}
    />
  );
}

export default function Playground({ theme = PIXEL_THEME }) {
  const [placements, setPlacements] = useState([]);
  const [tool, setTool] = useState(null);
  const [toolRotation, setToolRotation] = useState(0);
  const [filter, setFilter] = useState("all");
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [camera, setCamera] = useState({ x: 4, y: 3, zoom: 1 });
  const [size, setSize] = useState({ w: 0, h: 0 });

  const wrapRef = useRef(null);
  const sceneRef = useRef(null);
  const overlayRef = useRef(null);
  const dragRef = useRef(null);
  const dprRef = useRef(1);
  const idRef = useRef(0);

  const playTheme = useMemo(
    () => ({ ...theme, background: theme.background ?? BG }),
    [theme],
  );

  const items = useMemo(() => {
    if (filter === "all") return ALL_ITEMS;
    const g = ALL_GROUPS.find((grp) => grp.id === filter);
    return g ? g.items : ALL_ITEMS;
  }, [filter]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: Math.max(0, Math.round(r.width)), h: Math.max(0, Math.round(r.height)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!size.w || !size.h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    dprRef.current = dpr;
    const deviceW = Math.round(size.w * dpr);
    const deviceH = Math.round(size.h * dpr);
    const ss = theme.aaFactor ?? 1;
    const scale = (BASE / 2) * camera.zoom * ss;

    const fb = renderViewport(placements, playTheme, {
      camera,
      width: deviceW * ss,
      height: deviceH * ss,
      scale,
      grid: { color: [200, 203, 210], lineWidth: ss },
    });
    const final = ss > 1 ? downsample(fb, ss) : fb;

    const canvas = sceneRef.current;
    canvas.width = final.width;
    canvas.height = final.height;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    const off = document.createElement("canvas");
    off.width = final.width;
    off.height = final.height;
    off.getContext("2d").putImageData(
      new ImageData(new Uint8ClampedArray(final.data), final.width, final.height),
      0,
      0,
    );
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0);

    const ov = overlayRef.current;
    ov.width = final.width;
    ov.height = final.height;
    ov.style.width = `${size.w}px`;
    ov.style.height = `${size.h}px`;
  }, [placements, camera, size, playTheme, theme]);

  const deviceSize = () => {
    const dpr = dprRef.current;
    return { w: Math.round(size.w * dpr), h: Math.round(size.h * dpr) };
  };

  const cellAt = (clientX, clientY) => {
    const canvas = sceneRef.current;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const d = deviceSize();
    const sx = (clientX - rect.left) * (d.w / rect.width);
    const sy = (clientY - rect.top) * (d.h / rect.height);
    const p = cameraProject((BASE / 2) * camera.zoom, camera, d.w, d.h);
    const A = (sx - p.ox) / p.u;
    const B = (sy - p.oy) / p.v;
    return { x: Math.floor((A + B) / 2), y: Math.floor((B - A) / 2) };
  };

  useEffect(() => {
    const ov = overlayRef.current;
    if (!ov || !ov.width) return;
    const ctx = ov.getContext("2d");
    ctx.clearRect(0, 0, ov.width, ov.height);
    const p = cameraProject((BASE / 2) * camera.zoom, camera, ov.width, ov.height);
    const P = p.project;
    const drawDiamond = (x, y, w, d, fill, stroke) => {
      const pts = [P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)];
      ctx.beginPath();
      pts.forEach((pt, i) => (i === 0 ? ctx.moveTo(pt[0], pt[1]) : ctx.lineTo(pt[0], pt[1])));
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    const sel = placements.find((pl) => pl.id === selected);
    if (sel) {
      const sf = rotatedFootprint(sel.item.footprint, sel.rotation);
      drawDiamond(
        sel.x,
        sel.y,
        sf.w,
        sf.d,
        "rgba(77, 160, 255, 0.18)",
        "rgba(77, 160, 255, 0.95)",
      );
    }
    if (!hover) return;
    drawDiamond(hover.x, hover.y, 1, 1, "rgba(233, 69, 96, 0.3)", "rgba(233, 69, 96, 0.9)");
    if (tool) {
      const f = rotatedFootprint(tool.footprint ?? { w: 1, d: 1 }, toolRotation);
      drawDiamond(hover.x, hover.y, f.w, f.d, "rgba(80, 200, 120, 0.22)", "rgba(60, 180, 100, 0.9)");
    }
  }, [hover, tool, toolRotation, camera, selected, placements]);

  const overlaps = (a, b) =>
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.d && a.y + a.d > b.y;

  const place = (cell) => {
    if (!tool || !cell) return;
    const f = rotatedFootprint(tool.footprint, toolRotation);
    const id = `${tool.id}-${++idRef.current}`;
    const nb = { x: cell.x, y: cell.y, w: f.w, d: f.d };
    setPlacements((ps) => [
      ...ps.filter(
        (p) =>
          !overlaps(
            { x: p.x, y: p.y, w: rotatedFootprint(p.item.footprint, p.rotation).w, d: rotatedFootprint(p.item.footprint, p.rotation).d },
            nb,
          ),
      ),
      { id, item: tool, x: cell.x, y: cell.y, rotation: toolRotation },
    ]);
    setSelected(id);
  };

  const topmostAt = (cell) => {
    let best = null;
    for (const p of placements) {
      const f = rotatedFootprint(p.item.footprint, p.rotation);
      if (cell.x >= p.x && cell.x < p.x + f.w && cell.y >= p.y && cell.y < p.y + f.d) {
        if (!best || p.x + p.y >= best.x + best.y) best = p;
      }
    }
    return best ? best.id : null;
  };

  const erase = (cell) => {
    if (!cell) return;
    setPlacements((ps) =>
      ps.filter((p) => {
        const b = { x: p.x, y: p.y, ...rotatedFootprint(p.item.footprint, p.rotation) };
        return !(cell.x >= b.x && cell.x < b.x + b.w && cell.y >= b.y && cell.y < b.y + b.d);
      }),
    );
  };

  const onMouseDown = (e) => {
    if (e.button === 2) {
      erase(cellAt(e.clientX, e.clientY));
      return;
    }
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
  };

  const onMouseMove = (e) => {
    const cell = cellAt(e.clientX, e.clientY);
    setHover(cell);
    const dr = dragRef.current;
    if (dr) {
      const dx = e.clientX - dr.x;
      const dy = e.clientY - dr.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) dr.moved = true;
      if (dr.moved) {
        const d = deviceSize();
        const u = U * (BASE / 2) * camera.zoom;
        const v = V * (BASE / 2) * camera.zoom;
        const rect = sceneRef.current.getBoundingClientRect();
        const dsx = dx * (d.w / rect.width);
        const dsy = dy * (d.h / rect.height);
        const A = dsx / u;
        const B = dsy / v;
        const wx = (A + B) / 2;
        const wy = (B - A) / 2;
        setCamera((c) => ({ ...c, x: c.x - wx, y: c.y - wy }));
        dragRef.current = { x: e.clientX, y: e.clientY, moved: true };
      }
    }
  };

  const onMouseUp = (e) => {
    const dr = dragRef.current;
    dragRef.current = null;
    if (!dr || dr.moved || e.button !== 0) return;
    const cell = cellAt(e.clientX, e.clientY);
    if (tool) {
      place(cell);
    } else if (cell) {
      setSelected(topmostAt(cell));
    }
  };

  const onWheel = (e) => {
    e.preventDefault();
    const rect = sceneRef.current.getBoundingClientRect();
    const d = deviceSize();
    const sx = (e.clientX - rect.left) * (d.w / rect.width);
    const sy = (e.clientY - rect.top) * (d.h / rect.height);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setCamera((c) => {
      const z2 = clamp(c.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      if (z2 === c.zoom) return c;
      const u1 = U * (BASE / 2) * c.zoom;
      const v1 = V * (BASE / 2) * c.zoom;
      const A1 = (sx - d.w / 2) / u1;
      const B1 = (sy - d.h / 2) / v1;
      const wx = c.x + (A1 + B1) / 2;
      const wy = c.y + (B1 - A1) / 2;
      const u2 = U * (BASE / 2) * z2;
      const v2 = V * (BASE / 2) * z2;
      const A2 = (sx - d.w / 2) / u2;
      const B2 = (sy - d.h / 2) / v2;
      return { x: wx - (A2 + B2) / 2, y: wy - (B2 - A2) / 2, zoom: z2 };
    });
  };

  const selectedObj = placements.find((p) => p.id === selected);
  const selInfo = selectedObj
    ? `${selectedObj.id} · ${selectedObj.item.name} · (${selectedObj.x}, ${selectedObj.y})`
    : "Click an object to select it";

  const copyWorld = () => {
    const json = JSON.stringify(serializeWorld(toWorldObjects(placements)), null, 2);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).catch(() => console.log(json));
    } else {
      console.log(json);
    }
  };

  const randomBlueprint = () => {
    const blueprint = BLUEPRINTS[Math.floor(Math.random() * BLUEPRINTS.length)];
    const { placements: bp } = blueprint.generate();
    setPlacements(
      bp.map((p) => ({
        id: `${p.item.id}-${++idRef.current}`,
        item: p.item,
        x: p.x,
        y: p.y,
        rotation: p.rotation ?? 0,
      })),
    );
    setSelected(null);
    setCamera({ x: 9, y: 8, zoom: 1 });
  };

  const rotate = useCallback(() => {
    if (selected) {
      setPlacements((ps) =>
        ps.map((p) =>
          p.id === selected ? { ...p, rotation: p.rotation ? 0 : 1 } : p,
        ),
      );
    } else {
      setToolRotation((r) => (r ? 0 : 1));
    }
  }, [selected]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        rotate();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rotate]);

  return (
    <section className="playground">
      <div className="playground-bar">
        <button
          className="pg-clear"
          type="button"
          onClick={() => {
            setPlacements([]);
            setSelected(null);
          }}
        >
          Clear
        </button>
        <button
          className="pg-clear"
          type="button"
          onClick={() => setCamera({ x: 4, y: 3, zoom: 1 })}
        >
          Reset view
        </button>
        <button className="pg-clear" type="button" onClick={copyWorld}>
          Copy JSON
        </button>
        <button className="pg-clear" type="button" onClick={randomBlueprint}>
          Random Blueprint
        </button>
        <button className="pg-clear" type="button" onClick={rotate}>
          Rotate (R)
        </button>
        <span className="pg-hint">{selInfo}</span>
        <span className="pg-hint">
          Drag to pan · Scroll to zoom · Left-click to place · Right-click to remove · R to rotate (front ↔ side)
        </span>
      </div>

      <div className="playground-stage" ref={wrapRef}>
        <canvas
          ref={sceneRef}
          className="pg-scene"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => {
            dragRef.current = null;
            setHover(null);
          }}
          onWheel={onWheel}
          onContextMenu={(e) => e.preventDefault()}
        />
        <canvas
          ref={overlayRef}
          className="pg-overlay"
          style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
        />
      </div>

      <div className="playground-palette">
        <div className="pg-chips">
          <button
            type="button"
            className={`chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          {ALL_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`chip ${filter === g.id ? "active" : ""}`}
              onClick={() => setFilter(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="pg-items">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tool-btn ${tool?.id === item.id ? "active" : ""}`}
              onClick={() => setTool(tool?.id === item.id ? null : item)}
            >
              <Thumb item={item} theme={theme} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
