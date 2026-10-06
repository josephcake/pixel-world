# Pixel World

A component-driven **building, infrastructure, transportation, and simulation playground**.

It is not a house configurator, a 3D model viewer, a warehouse generator, a dashboard, or a game — though it begins with those pieces. The long-term product combines:

```
Architectural Design
+ Site Planning
+ Infrastructure Design
+ Transportation Networks
+ Vehicle Routing
+ Interactive Simulation
```

The central concept is a **world**, not a collection of isolated demos:

```
World → WorldViewport → WorldObjects
```

---

## Tech stack

- **React 19** + **Vite 8**, plain **JSX** (no TypeScript), ESM.
- **npm**, lint with **oxlint**.
- **Custom CPU software rasterizer** for the isometric world (`src/engine/framebuffer.js`). **three.js** is an optional, lazy-loaded dependency used only for the separate **3D World** view — the pixel/architectural renderer is not WebGL.
- **Plain CSS** (`src/index.css`, `src/App.css`). No Tailwind/CSS-in-JS.
- State: React hooks only. No router (single page, sidebar section switching).

## What exists today

- A **parametric building renderer** (`src/engine/building/`) drawing isometric 2:1 pixel art: walls, windows, doors, garages, chimneys, gable/hip/flat roofs, multi-story boxes, and annexes (garages/wings).
- **Data-driven item specs** in `src/scenes/`:
  - Residential — 7 houses.
  - Commercial — 4 warehouses (roller doors, strip windows).
  - Landscape — removed (the old road/pavement/parking tiles are superseded by the modular Road System).
  - Logistics — 10 low-poly supply-chain assets (semi truck, box truck, shipping container, pallet, crate, cardboard box, forklift, reach truck, yard tractor, tower crane), 3D-only.
  - Nature — 15 low-poly vegetation items (two shapes each of small/medium/large tree, conifer, cherry + white blossom, plus bush, grass, weed) with procedural per-instance variation.
  - Vehicles — 10 low-poly road vehicles (sedan, compact, pickup, minivan, police car, ambulance, fire engine, taxi, delivery van, motorcycle), 3D-only.
  - Props — 5 detailed low-poly street props (fire hydrant, mailbox, vertical traffic light, street light, trash can), 3D-only.
  - Road System — 15 modular two-way road tiles on a universal 4-unit grid (straights, 4 corners, crossroad, T-junctions, offset, dead-end, Y, roundabout, transition) with identical edge sockets, curbs, sidewalks and markings.
- A **grid/footprint standard** (`src/engine/building/grid.js`): `TILE = 1`, modular sizes `1, 2, 4, 6, 8, 12`; buildings ≥ 2×2, `1×1` reserved for future props.
- A **Gallery** (uniform square grid, cached + progressive rendering) and a **Playground** (infinite, zoomable isometric canvas with pan/zoom, placement, 2-way rotation via the `Rotate (R)` button / `R` key, and selection).
- An optional **3D World** view (sidebar entry): a three.js perspective scene built from the same data-driven item specs, laid out by category rows with orbit/zoom/pan controls. The four warehouses have distinct low-poly designs (compact / two-tier / long-with-monitor / wide-logistics-center) rather than scaled copies. A **Logistics** row adds low-poly supply-chain assets (semi truck, box truck, shipping container) plus a cargo-handling library (pallet, crate, cardboard box, forklift, reach truck, yard tractor, tower crane), a row of 10 road vehicles, a modular road kit, and a row of trees (incl. cherry blossom), bushes and grass. A small assembled example road network is placed to the side. Lazy-loaded so three.js stays out of the main bundle.
- **Procedural blueprints** (`src/scenes/blueprints/`) — seeded, validated generators (e.g. a "Company Supply & Transit" facility) triggered by the Playground's **Random Blueprint** action.
- The **32-bit/pixel design system** (dark navy, red/green accents, `Courier New`).

### UI themes

The app shell supports two runtime UI themes (switched in the sidebar **Theme** menu), both sharing the same components:

1. **32-bit / Pixel** — the original design.
2. **Futuristic Architectural** — deep navy/blue-black, dark panels, electric-blue accent, blue-gray borders, subtle glow, clean sans-serif.

Design tokens are CSS custom properties in `src/index.css` (`--bg`, `--panel`, `--border`, `--accent`, `--green`, `--text*`, `--font-ui`, `--radius`, glow vars); the pixel values are the defaults, so switching themes changes appearance without changing functionality.

UI themes also select the **item-rendering theme** (`src/engine/building/themes.js`): the Pixel UI uses `PIXEL_THEME` (32-bit art); the Futuristic UI uses `ARCHITECTURAL_THEME` (anti-aliased, flat roofs, light-gray shells, purple glazing, neon edges). `App` passes the chosen render theme to the Gallery and Playground.

## World model (foundation)

World objects follow a common, serializable shape (`src/world/`):

```ts
WorldObject { id, type, position, rotation, scale, metadata }
ConnectionPoint { id, ownerId, type, position, direction }
```

Placed objects get **stable instance IDs** and can be **selected** in the playground. World state is serializable JSON.

## Architecture

```
src/engine/            # software rasterizer + isometric building engine (no React)
src/engine/world3d/     # item spec -> three.js scene graph (3D World view; detailed warehouse builder; supply-chain assets)
src/world/             # world-object + connection-point data model (no rendering)
src/scenes/            # data-driven item specs grouped by category
src/components/        # React UI (Sidebar, Gallery, Playground); App.jsx lives at src/App.jsx
```

Buildings draw in **local coordinates**; the world places them at **cell offsets** via `composeItems` / `renderViewport`. Rendering is kept separate from world/simulation data.

## Future architecture (not implemented yet)

- **Road network** — roads are currently decorative tiles; they will become a graph (`RoadNode → RoadEdge → Lane → RoadPath → Intersection`) with path/spline geometry, snapping, and lanes.
- **Vehicles** — independent objects (`Vehicle Data / Renderer / Simulation`) that route through the road graph.
- **Simulation** — routing/traffic, testable without rendering.
- **Editor** — select/build/road/landscape/vehicle/demolish modes, undo/redo as operations.

These are **future architecture**, not existing functionality.

## Development

```bash
npm run dev      # start dev server
npm run build    # production build
npm run lint     # oxlint
npm run preview  # preview the build
```

Iterate on pixel art headlessly:

```bash
node scripts/render-preview.mjs out.png <scale> <cols> <start> <count> <theme> <raw|no> <source>
# source: residential | commercial | landscape | compose | roadnet
```
# pixel-world
