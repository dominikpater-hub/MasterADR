import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Konfiguracja MasterADR.
// - React: kompiluje JSX/createElement na build (Babel z prototypu znika).
// - PWA: service worker + offline (ADR-003 Offline-First z Kanonu Guardian).
//   registerType 'autoUpdate' — nowa treść ADR wchodzi po odświeżeniu.
// base: "" — ścieżki względne, żeby działało też pod pod-katalogiem / w Capacitorze.
export default defineConfig({
  base: "",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null, // rejestrację robimy ręcznie w main.jsx
      filename: "sw.js",
      manifest: false, // używamy własnego public/manifest.webmanifest
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true
      }
    })
  ],
  build: {
    outDir: "dist",
    // Baza 218 pozycji siedzi w jednym module — podnosimy limit ostrzeżenia.
    chunkSizeWarningLimit: 1500
  }
});
