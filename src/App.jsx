import { useEffect, useRef } from "react";
import { initCalendarApp } from "./calendarApp.js";
import "./App.css";

export default function App() {
  const rootRef = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    // StrictModeでの二重実行を防止
    if (initialized.current) return;
    initialized.current = true;
    if (rootRef.current) {
      initCalendarApp(rootRef.current);
    }
  }, []);

  return <div id="app" ref={rootRef}></div>;
}
