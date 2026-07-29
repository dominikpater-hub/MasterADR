# MasterADR

**Grywalizowany trener egzaminu ADR.** Local-first, offline, silnik Leitnera, 239 faktów
(edycja ADR 2025), backend zbierania uwag (Frank), egzamin, ekran postępu z kontem, i18n.
Dodatek do nauki — nie kurs akredytowany. Część marki **Master**.

> **To repo BUDUJE aplikację ze źródła** (Vite + React). Koniec z wgrywaniem gotowego
> minifikatu — edytujesz `src/`, a build tworzy produkcję.

## Struktura

```
MasterADR/                 ← korzeń = projekt Vite (Vercel buduje stąd)
├── src/                   źródło aplikacji
│   ├── app.jsx            czytelny kod (edytowalny) — home, sesja, egzamin, postęp, konto
│   ├── franek.js          moduł Franka (bufor localStorage + sync /api/feedback)
│   ├── i18n.js            warstwa tłumaczeń (PL działa; EN/DE/UK/RU partiami)
│   ├── daily-habit.js     nawyk dzienny (streak/XP)
│   ├── main.jsx, styles.css
├── public/               ikony, manifest (sw.js generuje vite-plugin-pwa)
├── api/                  backend Franka (Vercel serverless: feedback.js + admin, KV_*/UPSTASH_*)
├── index.html, vite.config.js, package.json, vercel.json
│
├── engine/               silnik core-learning (TypeScript, 63 testy) — cel B5 (import zamiast kopii)
├── knowledge/            źródło prawdy treści (239 wpisów) + skrypty pipeline
├── ksiega/               governance (Constitution, Handbook, ADR, Roadmap)
└── docs/                 dokumentacja strategiczna + GENESIS
```

## Uruchomienie i build
```bash
npm install
npm run dev        # podgląd na localhost
npm run build      # -> dist/ (produkcja)
npm run preview
```

## ⚠ CUTOVER — jak przełączyć Vercel na build ze źródła (jednorazowo)

Repo dotąd serwowało gotowy `deploy/index.html`. Teraz Vercel ma **budować** projekt Vite:

1. **Wgraj to repo** (zastąp poprzednią zawartość). Najbezpieczniej: najpierw na osobną
   gałąź i sprawdź na Vercel Preview, potem merge do `main`.
2. **Vercel → Settings → Build and Deployment → Root Directory** → zmień z `deploy` na
   **`.` (korzeń)** / puste. Vercel wykryje **Vite**: build `npm run build`, output `dist`.
3. **Zmienne środowiskowe** zostają: `KV_REST_API_URL`/`KV_REST_API_TOKEN` (baza Redis),
   `FEEDBACK_ADMIN_TOKEN` (odczyt uwag).
4. **Redeploy.** Vercel zbuduje appkę ze źródła i wystawi `dist/` + funkcje `api/`.

**Test po wdrożeniu:** apka się otwiera (home 239 pozycji), a `GET /api/feedback` → `405`
(znaczy backend funkcji żyje). Uwagi Franka lecą do Redis (Upstash → Data Browser: `madr:fb:*`).

## Aktualizacja treści
Fakty żyją w `knowledge/entries/`. Po zmianie: `node knowledge/scripts/export-to-app.js`
aktualizuje wbudowaną bazę w źródle (albo edytujesz tablicę faktów w `src/app.jsx`), potem
`npm run build`. (Docelowo: jeden skrypt spinający eksport z buildem.)

## Stan (Tor B)
Odtworzone i zweryfikowane render-diffem względem V4: home · widok bloku · sesja (formaty +
Frank) · egzamin (30/60min) · postęp (kafle + seria + konto) · rejestracja/logowanie · i18n ·
paywall OFF · pigułka 📊 „Mój postęp". Zostało opcjonalne **B5** (import silnika z `engine/`).

*Projekt prywatny. Wszelkie prawa zastrzeżone.*
