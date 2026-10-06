import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Gallery from "./components/Gallery";
import Playground from "./components/Playground";
import { COLLECTIONS, COLLECTION_LIST } from "./scenes/collections.js";
import { PIXEL_THEME, ARCHITECTURAL_THEME } from "./engine/building/themes.js";
import "./App.css";

function App() {
  const [section, setSection] = useState("residential");
  const [menuOpen, setMenuOpen] = useState(false);
  const [uiTheme, setUiTheme] = useState("pixel");
  const collection = COLLECTIONS[section];
  const renderTheme =
    uiTheme === "futuristic" ? ARCHITECTURAL_THEME : PIXEL_THEME;

  useEffect(() => {
    document.documentElement.dataset.theme = uiTheme;
  }, [uiTheme]);

  return (
    <div className="app">
      <button
        className="menu-btn"
        type="button"
        aria-label="Open menu"
        onClick={() => setMenuOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>

      <Sidebar
        open={menuOpen}
        collections={COLLECTION_LIST}
        active={section}
        playgroundActive={section === "playground"}
        uiTheme={uiTheme}
        onThemeChange={setUiTheme}
        onSelect={(id) => {
          setSection(id);
          setMenuOpen(false);
        }}
        onPlayground={() => {
          setSection("playground");
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
      />

      {section === "playground" ? (
        <Playground theme={renderTheme} />
      ) : (
        <Gallery items={collection.items} title={collection.name} theme={renderTheme} />
      )}
    </div>
  );
}

export default App;
