import { lazy, Suspense, useState } from "react";
import Sidebar from "./components/Sidebar";
// import Gallery from "./components/Gallery";
// import Playground from "./components/Playground";
// import { COLLECTIONS, COLLECTION_LIST } from "./scenes/collections.js";
import { ALL_GROUPS } from "./scenes/allItems.js";
// import { PIXEL_THEME, ARCHITECTURAL_THEME } from "./engine/building/themes.js";
import "./App.css";

const World3D = lazy(() => import("./components/World3D"));

function App() {
  const [section, setSection] = useState("world3d");
  const [menuOpen, setMenuOpen] = useState(false);
  // const [uiTheme, setUiTheme] = useState("pixel");
  // const collection = COLLECTIONS[section];
  // const renderTheme =
  //   uiTheme === "futuristic" ? ARCHITECTURAL_THEME : PIXEL_THEME;

  // useEffect(() => {
  //   document.documentElement.dataset.theme = uiTheme;
  // }, [uiTheme]);

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
        // collections={COLLECTION_LIST}
        // active={section}
        // playgroundActive={section === "playground"}
        world3dActive={section === "world3d"}
        // uiTheme={uiTheme}
        // onThemeChange={setUiTheme}
        // onSelect={(id) => {
        //   setSection(id);
        //   setMenuOpen(false);
        // }}
        // onPlayground={() => {
        //   setSection("playground");
        //   setMenuOpen(false);
        // }}
        onWorld3D={() => {
          setSection("world3d");
          setMenuOpen(false);
        }}
        onClose={() => setMenuOpen(false)}
      />

      {/* Non-3D views hidden for now — re-enable to restore Playground / Gallery.
      {section === "playground" ? (
        <Playground theme={renderTheme} />
      ) : section === "world3d" ? (
        <Suspense
          fallback={
            <div className="world3d">
              <div className="playground-bar">
                <span className="world3d-title">3D World</span>
              </div>
              <div className="world3d-stage" />
            </div>
          }
        >
          <World3D groups={ALL_GROUPS} />
        </Suspense>
      ) : (
        <Gallery items={collection.items} title={collection.name} theme={renderTheme} />
      )}
      */}

      <Suspense
        fallback={
          <div className="world3d">
            <div className="playground-bar">
              <span className="world3d-title">3D World</span>
            </div>
            <div className="world3d-stage" />
          </div>
        }
      >
        <World3D groups={ALL_GROUPS} />
      </Suspense>
    </div>
  );
}

export default App;
