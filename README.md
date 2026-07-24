# MasterADR

**Grywalizowany trener do egzaminu ADR.** Local-first, offline, silnik powtórek
Leitnera, baza 239 zweryfikowanych faktów ADR (edycja 2025). Dodatek do nauki —
nie kurs akredytowany.

Część marki **Master** (patrz `docs/GENESIS.md`).

---

## 📁 Struktura repozytorium (monorepo)

```
masteradr/
├── app/          ← ŹRÓDŁO aplikacji (Vite + React + Capacitor) — tu się rozwija i buduje
│   ├── src/                app.jsx (komponent + silnik Leitnera wpleciony), main.jsx,
│   │                       styles.css, daily-habit.js
│   ├── core-learning/      RDZEŃ SILNIKA wydzielony (TypeScript, 63 testy):
│   │                       leitner.ts, session.ts, lesson.ts, gamification.ts
│   ├── public/             ikony + manifest PWA
│   ├── docs/               dokumentacja produktowa i strategiczna (ADR-y, analizy rynku)
│   ├── index.html, vite.config.js, capacitor.config.json, package.json
│   └── BUILDING_STATUS.md  ⭐ stan budowy i plan scalenia — CZYTAJ NAJPIERW
│
├── deploy/       ← GOTOWY BUILD do wdrożenia (statyczny PWA + backend Franka)
│   ├── index.html          zbudowana apka (239 faktów v2, po audycie)
│   ├── api/                serverless (Vercel): feedback.js + feedback-admin.js (Redis/Upstash)
│   ├── sw.js, manifest.webmanifest, vercel.json, ikony
│   └── README.txt          instrukcja wdrożenia na Vercel
│
├── knowledge/    ← BAZA WIEDZY (guardian-knowledge v2) — źródło prawdy dla treści
│   ├── entries/            455 wpisów (239 PUBLISHED / CURRENT, reszta DRAFT/superseded)
│   ├── editions/           adr-2023.json, adr-2025.json
│   ├── library/            currency-index.json
│   ├── i18n/               sygnały językowe
│   ├── scripts/            pipeline: migrate, carry-forward, currency, export-to-app,
│   │                       report, verify, feedback-bridge, fix-caps
│   ├── policy.json         polityka aktualności (model dwuosiowy: trust × currency)
│   ├── ADR-003-v2-model-dwuosiowy.md   decyzja architektoniczna (dwie osie)
│   ├── MIGRACJA-README.md, PODLACZENIE.md, caps-do-naprawy.csv
│
└── docs/
    └── GENESIS.md          dokument-genesis marki Master
```

---

## 🧭 Stan wersji (ważne — przeczytaj)

Projekt rozwinął się w **dwie gałęzie**, które NIE są jeszcze scalone (świadomie —
patrz `app/BUILDING_STATUS.md`, „krok 4”):

| Gałąź | Co daje | Data | Treść | Backend |
|-------|---------|------|-------|---------|
| **`app/`** (źródło) | pełna struktura: Vite/React/Capacitor + wydzielony rdzeń `core-learning` (63 testy) + docs | 2026-07-20 | 253 pozycje (przed migracją do v2) | brak |
| **`deploy/`** (build) | aktualna treść + działający backend Franka (synchronizacja uwag) | 2026-07-24 | 239 faktów v2, po audycie 2023→2025 | tak (Redis/Upstash) |

Krótko: **`app/` ma nowszą STRUKTURĘ kodu, `deploy/` ma nowszą TREŚĆ i backend.**
Źródło zbudowane z 239-faktowej treści v2 nie znalazło się w tej paczce (tylko
zminifikowany build w `deploy/`), dlatego oba katalogi żyją obok siebie do czasu
scalenia. **Nie scalałem gałęzi automatycznie** — to otwarte zadanie właściciela.

Kanoniczne źródło treści to zawsze `knowledge/` (guardian-knowledge v2, model
dwuosiowy wg `ADR-003-v2`). Build `deploy/` powstał z eksportu z `knowledge/`
(`scripts/export-to-app.js`).

---

## 🔨 Budowanie i uruchamianie

### Aplikacja (źródło) — `app/`
```bash
cd app
npm install
npm run dev        # tryb deweloperski (Vite)
npm run build      # produkcyjny build → dist/
npm run preview    # podgląd builda
# Android (Capacitor):
npm run cap:sync && npm run cap:open
```
Testy rdzenia silnika:
```bash
cd app/core-learning
npm install && npm test    # 63 testy (Leitner, sesja, gamifikacja, lekcja)
```

### Deploy (gotowy build + backend) — `deploy/`
Wgraj cały katalog `deploy/` jako projekt statyczny na Vercel. `vercel.json`
ustawia już nagłówki (no-cache dla index/sw/manifest, no-store dla `/api/`).

Backend Franka (uwagi użytkowników → Redis) wymaga zmiennych środowiskowych:
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
FEEDBACK_ADMIN_TOKEN=...      # do /api/feedback-admin (eksport zgłoszeń)
```
Żadne sekrety NIE są zaszyte w kodzie — wszystko przez `process.env` / `Redis.fromEnv()`.

> Przy każdym kolejnym deployu podbij `CACHE` w `deploy/sw.js`
> (format `masteradr-vN-RRRR-MM-DD`), inaczej użytkownicy zobaczą starą wersję.

### Baza wiedzy — `knowledge/`
Skrypty pipeline'u (Node) w `knowledge/scripts/`: migracja edycji, carry-forward
2023→2025, wyliczanie aktualności (`currency.js`), eksport do apki
(`export-to-app.js`), raporty i weryfikacja.

---

## 🔐 Model aktualności treści (dwuosiowy)

Zgodnie z `knowledge/ADR-003-v2-model-dwuosiowy.md` i `knowledge/policy.json`
treść ma **dwie niezależne osie**:

- **trustLevel** (T1–T3) — z kim/czym zweryfikowano źródło,
- **currency** (CURRENT / STALE / LAPSED / DRIFTED) — czy wciąż aktualne.

Bramki kanałowe (online / offline_pack / rag_corpus) decydują, co wolno pokazać.
Kierowca widzi **jeden** wynikowy sygnał (liczony deterministycznie), nie dwie osie.

---

## ✅ Następne kroki (z `BUILDING_STATUS.md`)

- Scalenie gałęzi: `app/src/app.jsx` ma docelowo IMPORTOWAĆ z `core-learning/`
  zamiast trzymać własną kopię silnika (krok 4).
- Przeniesienie aktualnej 239-faktowej treści v2 do źródła `app/` (dziś tylko w buildzie).
- Rozłożenie dat przeglądów w czasie — przy `reviewIntervalDays: 365` cała baza
  zweryfikowana 2026-07-23 stanie się LAPSED tego samego dnia w 2027 (patrz uwaga
  w `deploy/README.txt`).

---

*Projekt prywatny (`"private": true`). Wszelkie prawa zastrzeżone.*
