import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PetView } from "./components/Pet/PetView";
import { SettingsPanel } from "./components/Settings/SettingsPanel";

/**
 * Root App component — detects which window it's in and renders accordingly.
 * - "main" window: renders the desktop pet (small, draggable, transparent)
 * - "settings" window: renders the settings panel
 */
export default function App() {
  const [windowLabel, setWindowLabel] = useState<string>("main");

  useEffect(() => {
    const win = getCurrentWindow();
    setWindowLabel(win.label);
  }, []);

  if (windowLabel === "settings") {
    return <SettingsWindow />;
  }

  return <PetWindow />;
}

// ===== Pet Window (main) =====

function PetWindow() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent">
      <PetView />
    </div>
  );
}

// ===== Settings Window =====

function SettingsWindow() {
  return (
    <div className="w-full h-full bg-slate-900">
      <SettingsPanel onClose={() => getCurrentWindow().hide()} />
    </div>
  );
}
