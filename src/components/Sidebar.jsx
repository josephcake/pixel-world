export default function Sidebar({
  open,
  // collections,
  // active,
  // playgroundActive,
  world3dActive,
  // uiTheme,
  // onThemeChange,
  // onSelect,
  // onPlayground,
  onWorld3D,
  onClose,
}) {
  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <nav className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-title">Pixel World</div>

        {/* Category collections hidden for now (non-3D) — comments preserved to re-enable.
        <ul className="sidebar-list">
          {collections.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={c.id === active ? "active" : ""}
                onClick={() => onSelect(c.id)}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
        <div className="sidebar-divider" />
        <button
          type="button"
          className={`sidebar-playground ${playgroundActive ? "active" : ""}`}
          onClick={onPlayground}
        >
          <span className="pg-dot" />
          Playground
        </button>
        */}

        <button
          type="button"
          className={`sidebar-playground sidebar-3d ${world3dActive ? "active" : ""}`}
          onClick={onWorld3D}
        >
          <span className="pg-dot" />
          3D World
        </button>
        {/* <div className="sidebar-divider" /> */}

        {/* Theme selector hidden for now — comments preserved to re-enable.
        <div className="sidebar-section-label">Theme</div>
        <div className="sidebar-theme">
          {["pixel", "futuristic"].map((t) => (
            <button
              key={t}
              type="button"
              className={uiTheme === t ? "active" : ""}
              onClick={() => onThemeChange(t)}
            >
              {t === "pixel" ? "32-bit / Pixel" : "Futuristic"}
            </button>
          ))}
        </div>
        */}
      </nav>
    </>
  );
}
