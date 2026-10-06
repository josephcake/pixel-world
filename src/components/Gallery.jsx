import { useEffect, useMemo, useRef, useState } from "react";
import { cellSize } from "../engine/building/scene.js";
import { DEFAULT_THEME } from "../engine/building/themes.js";
import { peekCell, ensureCell } from "./renderCache.js";

const DISPLAY = 240;

function Card({ item, theme, size, index, ready }) {
  const canvasRef = useRef(null);
  const isReady = index < ready;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const off = peekCell(item, theme, size);
    if (!off) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    if (canvas.width !== off.width || canvas.height !== off.height) {
      canvas.width = off.width;
      canvas.height = off.height;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0);
  }, [item, theme, size, isReady]);

  return (
    <figure className="house-card">
      <canvas
        ref={canvasRef}
        style={{
          width: DISPLAY,
          height: DISPLAY,
          imageRendering: theme.aaFactor ? "auto" : "pixelated",
        }}
      />
      <figcaption>
        {item.name}
        {item.grid ? ` · ${item.grid.label}` : ""}
      </figcaption>
    </figure>
  );
}

export default function Gallery({ items, title, theme = DEFAULT_THEME }) {
  const size = useMemo(() => cellSize(items, theme), [items, theme]);
  const sig = useMemo(
    () => `${theme.id}|${size}|${items.map((i) => i.id).join(",")}`,
    [items, size, theme],
  );
  const [progress, setProgress] = useState({ sig: null, count: 0 });
  const ready = progress.sig === sig ? progress.count : 0;

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let i = 0;

    const step = () => {
      if (cancelled) return;
      let budget = theme.aaFactor ? 2 : 4;
      while (i < items.length && budget > 0) {
        const item = items[i];
        if (!peekCell(item, theme, size)) {
          ensureCell(item, theme, size);
          budget -= 1;
        }
        i += 1;
      }
      setProgress({ sig, count: i });
      if (i < items.length) raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [sig, items, size, theme]);

  return (
    <section className="gallery">
      <header className="gallery-header">
        <h1>{title}</h1>
      </header>
      <div className="gallery-grid">
        {items.map((item, index) => (
          <Card
            key={item.id}
            item={item}
            theme={theme}
            size={size}
            index={index}
            ready={ready}
          />
        ))}
      </div>
    </section>
  );
}
