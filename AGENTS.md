# AGENTS.md

Persistent context for AI coding agents working on **pixel-world**.

Read this before making architectural decisions. Do not repeatedly reconstruct this vision from the conversation.

---

## 1. What this project is

An **interactive building, infrastructure, transportation, and simulation playground**.

It is NOT a house configurator, a 3D model viewer, a warehouse generator, a dashboard, or a game. Those are milestones toward a larger product that combines:

```
Architectural Design
+ Site Planning
+ Infrastructure Design
+ Transportation Networks
+ Vehicle Routing
+ Interactive Simulation
```

The central rendering concept is a **world**, not a collection of isolated demos:

```
World → WorldViewport → WorldObjects
```

not `HouseViewer / WarehouseViewer / RoadViewer / VehicleViewer`.

---

## 2. Current tech stack (verified)

- **React 19** + **Vite 8**, plain **JSX (no TypeScript)**, ESM (`"type": "module"`).
- Package manager: **npm**. Lint: **oxlint** (`.oxlintrc.json`).
- The isometric **world viewport** is a **custom CPU software rasterizer** (no 3D scene graph, no WebGL). **three.js** is used only for the optional **3D World** view (lazy-loaded), not for the isometric pixel/architectural rendering.
- Styling: **plain CSS** (`src/index.css`, `src/App.css`). No Tailwind, no CSS-in-JS.
- State: **React `useState`/`useRef`/`useMemo`** only. No router (single page, sidebar section switching). No global store.
- Scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

### Existing AI-agent instruction files

- `AGENTS.md` — this file (the single source of truth).
- No `kilo.json`, `.kilo/`, `.kilocode/`, `CLAUDE.md`, or `GEMINI.md` exist yet. If `.kilo/` conventions are introduced later, integrate them with this file rather than duplicating it.

---

## 3. Rendering model (critical)

The world is **isometric 2:1 pixel art**, not a 3D scene graph.

- Projection lives in `src/engine/building/iso.js`: one world unit = `U=2` px horizontally, `V=1` px vertically, `Z=2` px vertically for height.
- All drawing goes through `src/engine/framebuffer.js` — a `Uint8ClampedArray` framebuffer with:
  - `fillPoly` (scanline, deliberately **no anti-aliasing** for crisp pixel edges)
  - `strokeLine` (width > 1 draws filled quads for straight edges)
  - `setPixel`, `blendPixel`, `blit`, `downsample`, `scaleNearest`, `setLineWidth`
- Everything is **data-driven and procedurally generated**; there are no image assets for buildings.

The UI is pixel-inspired; the isometric art itself is clean and architectural.

---

## 4. Directory map

```
src/
  engine/
    framebuffer.js      # software rasterizer (fill/stroke/blit/downsample)
    color.js            # rgb<->hsl + architectural() theme recoloring
    world3d/
      buildItem.js      # spec -> three.js scene graph (3D World view)
      warehouse.js      # detailed low-poly warehouse builder (spec.type === "warehouse")
      supplyChain.js    # low-poly semi truck / box truck / shipping container assets
      cargo.js          # low-poly pallet / crate / cardboard / forklift / reach truck / yard tractor / crane
      nature.js         # low-poly trees (incl. blossom) / bush / grass, procedural variation
      vehicles.js       # low-poly road vehicles (passenger / emergency / commercial / motorcycle)
      urbanProps.js     # detailed low-poly street props (hydrant, mailbox, traffic light, street light, trash can)
      roads.js          # modular two-way road kit (straights, corners, intersections, roundabout…)
      materials.js      # shared three.js material/geometry helpers
    building/
      iso.js            # isometric projection + makeProjector + ground/shadow helpers
      grid.js           # TILE + modular footprint standard (see §5)
      themes.js         # PIXEL_THEME, ARCHITECTURAL_THEME, ILLUSTRATION_THEME, THEMES
      builder.js        # parametric building renderer (walls/windows/doors/roofs/annexes)
      props.js          # tree/bush/fence/hedge/driveway/pool/fountain/portico/mailbox
      scene.js          # makeBuilding, renderHouse, renderSquare, renderGallery,
                        # composeItems, renderViewport, cameraProject, cellSize
      slab.js, shadow.js # shared helpers (currently used by the illustration module)
  scenes/
    collections.js      # COLLECTIONS / COLLECTION_LIST (residential, commercial, landscape)
    allItems.js         # ALL_GROUPS / ALL_ITEMS (for the playground palette)
    logistics/          # specs + items for the 3D supply-chain assets
    vehicles/           # specs + items for the road vehicles
    props/              # specs + items for urban street props
    roads/              # specs + items for the modular 3D road kit
    nature/             # specs + items for trees/bush/grass vegetation
    residential/house/  # specs.js (BUILD_SPECS), index.js (HOUSES), illustration.js
    commercial/warehouse/# specs.js (WAREHOUSE_SPECS), index.js
    commercial/index.js
    landscape/road/     # index.js (ROADS: front/side/cross + 4 turns)
    landscape/index.js
  components/
    App.jsx             # (src/App.jsx) sidebar section switch (gallery vs playground)
    Sidebar.jsx         # hamburger overlay nav + Playground entry
    Gallery.jsx         # uniform square grid + render cache
    Playground.jsx      # infinite, zoomable canvas (camera + pan/zoom + culling)
    World3D.jsx         # optional three.js 3D view (lazy-loaded)
    renderCache.js      # offscreen-canvas cache keyed by item/theme/size
    IllustrationHouse.jsx # unused (flat-illustration hero, kept but unexposed)
  App.css / index.css
scripts/
  render-preview.mjs    # headless PNG preview (node) for iterating on art
  png.mjs               # minimal PNG encoder (zlib + CRC)
```

Legacy/leftover files (safe to ignore or remove later): `src/PixelWorld.jsx` (original interactive canvas from an early spike), `src/assets/*` (Vite template).

---

## 5. Grid / footprint standard

- `TILE = 1` world unit. One grid cell = one tile.
- **`MODULES = [1, 2, 4, 6, 8, 12]`** — every item footprint dimension snaps to this ladder (`snapModule`, prefer round-up).
- `footprint(w, d)` → `{ w, d, cells, size, label }`; `sizeClass`: small ≤2, medium ≤4, large ≤8, mega >8.
- **Buildings/properties: minimum 2×2.** `1×1` is reserved for future small props (trees, bikes, cars, …).
- Items occupy their footprint **exactly** — `plotMargin: 0`, no out-of-block decorations/shadow. Adjacent items tile edge-to-edge with no overlap or gap.

Current item catalog:
- **Residential (7 houses)** — tower 2×2, family 3×2, modern 3×2, townhouse 2×3, villa 4×3, suburban 4×3, mansion 4×4.
- **Commercial (4 warehouses)** — 4×4, 6×4, 6×6, 12×8.
- **Logistics (10, 3D-only assets)** — semi truck 4.8×0.9, box truck 2.9×0.9, shipping container 3.0×1.0 (`supplyChain.js`); pallet 1.2×1.0, crate 1.0×0.9, cardboard box (2 sizes), forklift 2.2×1.0, reach truck 1.9×0.95, yard tractor 2.8×1.1, tower crane 8×1.6 (`cargo.js`). No isometric `draw`; built for the 3D World only.
- **Nature (15, 3D-only)** — two differently-shaped variants each of small/medium/large tree, conifer, cherry blossom, white blossom, plus bush, grass patch, weed cluster (`nature.js`). Flat-shaded faceted forms with procedural per-instance variation (scale/rotation/deformation).
- **Vehicles (10, 3D-only)** — sedan, compact, pickup, minivan, police car, ambulance, fire engine, taxi, delivery van, motorcycle (`vehicles.js`). Rounded low-poly bodies (chamfered panels, fender flares, proud chunky wheels, mirrors, bumpers, grille/lights); passenger cars share one base builder, box vehicles another.
- **Props (5, 3D-only)** — fire hydrant, mailbox, vertical traffic light, street light, trash can (`urbanProps.js`). Detailed low-poly street furniture with modeled hardware (outlets, hinges, visors, lenses, bolts).
- **Road System (15, 3D-only)** — modular two-way road kit on one universal 4-unit tile: 2.6 road (2 × 1.3 lanes), 0.7 sidewalks each side, constant curb height. Pieces: straight Z/X, 4 corners (constant-width arc), crossroad, 2 T-junctions, turning intersection, offset intersection, dead-end, Y-junction, roundabout, transition (`roads.js`). Every edge socket is dimensionally identical, so tiles snap seam-free.
- **Landscape tiles removed** — the old 2D road tiles, pavement and parking spot are no longer catalogued (superseded by the modular **Road System**). `src/scenes/landscape/` still exports `ROADS`/`PAVEMENT`/`PARKING` for the blueprint generator.

---

## 6. World object model (current + future)

Items are **data-driven specs** turned into item objects by `makeBuilding(spec)`:

```
item = { id, name, spec, footprint, grid, height, measure(theme), draw(fb, theme, frame) }
```

Future world objects should follow a common conceptual model:

```ts
WorldObject { id, type, position, rotation, scale, metadata }
```

Candidate `type`s (do not create them all now): house, warehouse, office, retail, industrial, road, intersection, lane, tree, sidewalk, parking-space, vehicle, street-light, utility.

Buildings must be **composed of reusable components**, not monolithic meshes. Conceptually:

```
House → Foundation, Floor, Walls, Windows, Doors, Roof, Garage, GarageDoor, Porch, Driveway
```

The current `builder.js` already implements these as parametric pieces (drawBox walls/windows/door/garage-door/roller-doors/chimney/roof, `annexes` for garages/wings). A future warehouse/office should reuse them, not fork the philosophy.

**Data-driven geometry**: dimensions live in specs (`w, d, stories, storyHeight, roof, window, door, annexes, …`); changing config regenerates geometry. Do not scatter hardcoded dimensions into render code.

**Local vs world coordinates**: items draw in local coordinates; composition places them at world (cell) offsets via `composeItems` / `renderViewport` (`frame.ox/oy`). This already supports moving/duplicating/placing items.

**Rotation**: 2-way (`front ↔ side`). `rotateProject` in `scene.js` mirrors the footprint by swapping world coordinates (`(x,y) → (o.x + y, o.y + x)`); `rotatedFootprint` swaps `w`/`d`. Exposed in the Playground via the `Rotate (R)` button / `R` key; `toWorldObjects` emits `rotation: [0, 0, (rotation||0)*90]`. Full 0–360° placement is not implemented.

---

## 7. Stable IDs + connection points + serialization (future)

- Meaningful objects need **stable IDs** (e.g. `house-01`, `house-01-wall-front`, `house-01-driveway`, `tree-01`, `vehicle-01`) for selection/editing/save/undo/connections.
- Objects should eventually expose **connection points**:

```ts
ConnectionPoint { id, ownerId, type, position, direction }
```

  First priority: `House → Driveway → ConnectionPoint → Road`. Do not build a full connection editor yet — just preserve the concept.

- **Serialization**: world state should be serializable JSON (`{ objects: [{ id, type, position }] }`). Do not put essential state exclusively inside rendering objects.

---

## 8. Roads — future network architecture

Roads are currently **decorative tiles** (front/side/cross/turns) placed on the grid. Do not permanently treat them as plain rectangles.

Future conceptual structure:

```
RoadNode → RoadEdge → Lane → RoadPath → Intersection
```

Visual road geometry must be **separate from the logical road graph** — this is critical for future routing. Prefer a path/spline-based representation for compatibility with curves, T/cross intersections, multiple lanes, and roundabouts. Today's tiles are the rendering layer only.

---

## 9. Vehicles + simulation (future)

Keep these separate:

```
Vehicle Data → Vehicle Renderer → Vehicle Simulation
```

Conceptually: `Vehicle { position, lane, destination, route, movementState }`. Routing lives in a `RouteFinder` over the road graph, not inside the visual component.

**Rendering vs simulation**: prefer

```
World Data → Road Graph → Routing → Simulation → Renderer
```

over putting movement logic in the mesh. Simulation should be testable without rendering.

---

## 10. Design system (preserve and extend)

The **32-bit/pixel design is an asset — preserve it.** Do not replace it with Tailwind/SaaS/Material/Bootstrap/generic-futuristic UI.

Current design tokens (`src/index.css`, `src/App.css`):

- Background: `#1b2233` (dark navy)
- Panels/cards: `#232c42`, borders `#2f3b57`
- Accent: `#e94560` (red/pink) — primary actions, titles
- Playground accent: `#2fbf71` (green) — the Playground menu entry + selection
- Text: `#e8edf5` (headings), `#aab6cc` (body/muted)
- Font: `"Courier New", monospace` throughout

Reuse existing components/concepts (Sidebar, Gallery, Playground, `house-card`, `chip`, `tool-btn`) rather than inventing `ModernPanel`/`FuturisticCard` duplicates. One coherent design system.

### UI themes

There are **two UI themes** (app-shell styling — distinct from the item-rendering `PIXEL_THEME`), switched at runtime via `data-theme` on `<html>` (see `src/index.css` `:root` tokens + `[data-theme="futuristic"]` override, and the sidebar **Theme** switch):

1. **32-bit / Pixel** — the original, default design (unchanged).
2. **Futuristic Architectural** — screenshot-inspired: deep navy/blue-black background, dark navy panels, electric-blue accent, blue-gray borders, subtle glow on active states, clean sans-serif.

**Design tokens live as CSS custom properties** (`--bg`, `--panel`, `--border`, `--accent`, `--green`, `--text`, `--text-muted`, `--text-hint`, `--line`, `--font-ui`, `--radius`, glow rgba vars, …). The pixel theme's values are the `:root` defaults, so it renders exactly as before. All shared components (`Sidebar`, `Gallery`, `Playground`, `house-card`, `chip`, `tool-btn`) read these tokens — do **not** scatter hardcoded hex colors into components; extend the tokens instead.

Long-term visual direction: a sophisticated architectural planning tool — dark navy, blue/cyan accents, panel organization, information density — combined with the 32-bit/pixel language.

---

## 11. Current UI

- **Sidebar** (hamburger, top-left): **Residential / Commercial / Landscape** collections, plus a green-highlighted **Playground** entry and a **Theme** switch (32-bit / Pixel vs Futuristic Architectural).
- **Gallery**: uniform square grid of items with footprint labels (`Family Home · 3x2`), rendered through a cache (`renderCache.js`) + progressive per-frame scheduling.
- **Playground**: infinite, zoomable isometric canvas — drag to pan, scroll to zoom (0.35×–4×), left-click place, right-click remove, category chips + scrolling item palette, hover shows cell + footprint ghost, click selects objects (blue highlight + readout), `Copy JSON` exports the world, and a **Random Blueprint** action generates a procedural layout (see `src/scenes/blueprints/` — reusable seeded, validated generators). Renders via `renderViewport` (camera + grid + viewport culling + painter's-algorithm depth sort).
- **3D World** (sidebar entry): an optional three.js perspective view of the whole catalog, laid out by category rows on a grid ground. `src/engine/world3d/buildItem.js` converts each data-driven item spec into a three.js `Group` (walls, gable/hip/flat roofs, windows, doors, roller doors, chimneys, landscape slabs) — the same specs the CPU renderer uses. Warehouses have a dedicated low-poly builder (`src/engine/world3d/warehouse.js`, dispatched on `spec.type === "warehouse"` then `spec.variant`) with **four architecturally distinct designs** — small (compact single volume, one loading door, thin parapet), medium (two-tier massing with a monitor), large (long body with a roof monitor ridge and a prominent office tower), mega (wide low slab, tall thick parapet, oversized bays, tiny office, many rooftop units). Lazy-loaded via `React.lazy` so three.js stays out of the main bundle. Camera: orbit/zoom/pan (`OrbitControls`). This is a separate *view* of the same world data, not a replacement for the isometric renderer. The **Logistics** row shows low-poly supply-chain assets from `src/engine/world3d/supplyChain.js` (semi truck, box truck, shipping container; rounded/beveled bodies, lathe tires) and `src/engine/world3d/cargo.js` (pallet, crate, cardboard box, forklift, reach truck, yard tractor, tower crane). The **Nature** row shows low-poly vegetation — trees (incl. cherry/white blossom, plus a second shape per tree type), bush, grass, weeds — from `src/engine/world3d/nature.js` with per-instance variation.

**Item-rendering themes** (`src/engine/building/themes.js`) select how the isometric art is drawn, and are tied to the UI theme (the `flat` theme was removed; the `illustration` module remains but is unexposed):
- `PIXEL_THEME` — the 32-bit pixel art (used by the **32-bit / Pixel** UI theme).
- `ARCHITECTURAL_THEME` — anti-aliased (supersampled), dither-free, **boxy modernization** (`flatRoof`, `chimney: false`, `windowScale` enlarged glazing) with a modern palette (`architectural()` in `src/engine/color.js`: light-gray shells, purple glazing, concrete/dark ground) and purple **neon** edges (`neon`, `neonEdge`, `neonBase`, `background`). Used by the **Futuristic Architectural** UI theme.
- `ILLUSTRATION_THEME` — bespoke flat-illustration renderer, unexposed.

`App` picks the render theme from the selected UI theme and passes it to `Gallery`/`Playground`.

---

## 12. Incremental priority / roadmap

```
Single House
→ Reusable Building Components        ← done (parametric builder + specs)
→ World / Playground Foundation        ← done (infinite zoomable canvas)
→ Environment Objects                  ← trees/bikes/cars (1×1), streetlights, sidewalks
→ Road System                         ← tiles done; next: network/graph
→ Connected Roads / Intersections
→ Vehicles
→ Routing
→ Simulation
→ Complete Building / Site Designer
```

Future functionality should influence architecture now, but **do not implement ahead of the roadmap**. Editor state (`mode`, `selection`) should remain separate from world state (`objects`).

---

## 13. Engineering rules for agents

1. Inspect existing code before creating replacements.
2. Preserve the 32-bit/pixel design; extend existing components where practical.
3. Prefer small, incremental changes; avoid unnecessary rewrites.
4. Keep world data separate from rendering.
5. Use stable IDs for meaningful world objects.
6. Use local coordinates inside reusable objects; world transforms on top.
7. Keep building components reusable (warehouses/offices reuse the same builder).
8. Keep roads compatible with a future graph/network architecture.
9. Keep vehicles independent from rendering.
10. Do not prematurely implement future systems.
11. No abstractions without a practical reason.
12. Maintain this file when architecture changes.
13. Never sacrifice the long-term world architecture just to make one demo easier.

### Per-task workflow

Inspect → decide if an existing component/system can be extended → make the smallest necessary change → implement → verify existing functionality still works → update docs if architecture changed → don't rebuild unrelated systems.

### AI coding principles (from the Phase 1 brief — keep these explicit)

1. Preserve and evolve the existing 32-bit/pixel design language.
2. Do not replace existing UI architecture without a concrete reason.
3. World objects must remain reusable and data-driven.
4. Rendering must remain separated from world/simulation data where practical.
5. Buildings must use local coordinates relative to their root.
6. Important objects require stable IDs.
7. Transportation infrastructure should be compatible with a future graph/network model.
8. Roads must eventually support connections, curves, intersections, and lanes.
9. Vehicles will eventually route through the road graph.
10. Do not prematurely build future systems, but do not introduce architecture that blocks them.
11. The central viewport is a general WorldViewport, not a house-specific viewer.
12. Prefer extending existing project components over creating duplicate replacements.

**Future compatibility vs future implementation** — distinguish them: we do NOT need routing/traffic/intersection logic yet, but we SHOULD avoid hard-coding roads as nothing but decorative meshes, since that would block those systems later.

### Current frontier (Phase 1 foundations, present)

- Stable instance IDs on placed world objects (`src/world/` — `createWorldObject`, `createConnectionPoint`, `toWorldObjects`, `serializeWorld`).
- Playground object selection (click selects, blue highlight, id/type/position readout) and world JSON export (`Copy JSON`).
- Connection points exist as a data concept (`createConnectionPoint`) but there is no connection editor yet.

### Verification

- `npm run lint` (oxlint) and `npm run build` must pass.
- Art iteration: `node scripts/render-preview.mjs out.png <scale> <cols> <start> <count> <theme> <raw|no> <source>` (source: `residential | commercial | landscape | compose | roadnet`). This renders headless PNGs so pixel art can be inspected without a browser.
