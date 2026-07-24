# MasterADR — kompletny projekt (apka + rdzeń + dokumentacja)

Grywalizowany trener do egzaminu ADR. Local-first, offline, silnik powtórek Leitnera,
253 pozycje treści. To jest CAŁY projekt w jednym miejscu.

## 📁 CO GDZIE LEŻY (od A do Z)

- README.md — ten plik (mapa całości)
- BUILDING_STATUS.md — stan budowy, ostatnie zmiany, plan scalenia ⭐ CZYTAJ NAJPIERW
- APKA (Vite+React+Capacitor) w korzeniu — index.html, package.json, vite.config.js,
  capacitor.config.json, public/ (ikony, manifest), src/:
    - app.jsx — główny komponent + 253 pozycje ADR + silnik Leitnera (wpleciony)
    - daily-habit.js — streak z zamrożeniem + cel dzienny (dodane w scaleniu)
    - main.jsx, styles.css
- core-learning/ — RDZEŃ SILNIKA (TypeScript, osobno, 63 testy):
    - src/leitner.ts, lesson.ts, session.ts, gamification.ts, index.ts, *.test.ts
    - package.json, tsconfig.json, README.md
- docs/ — DOKUMENTACJA: roadmapa AI (4 fazy), ścieżka do pierwszej złotówki,
  architektura treści, analizy rynku/prawne, INSTRUKCJA budowy APK.

## ⚠ DWIE KOPIE SILNIKA (celowo, do czasu scalenia)

1. src/app.jsx — silnik WPLECIONY w apkę (realnie działa w prototypie).
2. core-learning/ — silnik WYDZIELONY z 63 testami (wersja docelowa).

Plan (BUILDING_STATUS.md, krok 4): app.jsx ma docelowo IMPORTOWAĆ z core-learning
zamiast trzymać własną kopię. daily-habit.js to pierwszy element wspólny (przeniesiony
1:1 z core-learning/gamification.ts).

## 🔨 JAK ZBUDOWAĆ

Apka (w korzeniu):
    npm install
    npm run build      # dist/ = apka web
    npm run dev        # podgląd na żywo
Android: npx cap add android → npx cap sync → npx cap open android
(pełna instrukcja: docs/INSTRUKCJA.md)

Rdzeń (testy):
    cd core-learning && npm install && npm test   # 63 testy

## 📦 REGUŁA DOSTARCZANIA
Po każdej zmianie: dwa pliki — kompletny projekt (zip) + klikalny prototyp (HTML).
