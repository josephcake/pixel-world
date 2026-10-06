export default function Sidebar({
  open,
  collections,
  active,
  playgroundActive,
  uiTheme,
  onThemeChange,
  onSelect,
  onPlayground,
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
        <div className="sidebar-divider" />
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
      </nav>
    </>
  );
}
