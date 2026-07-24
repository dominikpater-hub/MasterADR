// Punkt wejścia MasterADR (Vite + React 18).
// Montuje AdrApp i rejestruje service workera (offline / PWA).
import React from "react";
import { createRoot } from "react-dom/client";
import AdrApp from "./app.jsx";
import "./styles.css";

const boot = document.getElementById("boot");
try {
  const root = createRoot(document.getElementById("root"));
  root.render(React.createElement(AdrApp, null));
  if (boot) boot.remove();
} catch (e) {
  if (boot) {
    boot.innerHTML =
      '<div class="msg" style="color:#D98880">Błąd uruchomienia:<br>' +
      ((e && e.message) || e) +
      "</div>";
  }
  throw e;
}

// Rejestracja service workera — offline-first (ADR-003 z Kanonu Guardian).
// Vite PWA plugin generuje sw.js na build; w dev pomijamy.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline i tak działa z cache po pierwszym otwarciu */
    });
  });
}
