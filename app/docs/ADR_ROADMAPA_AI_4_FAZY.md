# 🧠 ADR TRENER — ROADMAPA WARSTWY AI (4 FAZY)

**Data:** 2026-07-20
**Status:** decyzja zatwierdzona — sekwencja faz, nie wybór jednego wariantu
**Decyduje:** kiedy i jak głęboko wchodzi AI, względem bramek offline-first i DGSA
**Zależy od:** `core/learning/` (silnik Leitner + pickFormat), CONTENT_ANALYSIS (bramka DRAFT→PUBLISHED),
ADR_DUOLINGO_PIERWSZA_ZLOTOWKA (§5 ścieżka krytyczna), zrzut Master (Leitner rdzeń, AI wisienka)

---

## ZASADA NADRZĘDNA

**Leitner to rdzeń. AI to wisienka.** Trzy pomysły na AI nie wykluczają się — nawarstwiają się
na tym samym silniku, bez forkowania packa czy `core/learning`. Każda faza dokłada AI głębiej,
ale **dopiero gdy bramka poprzedniej fazy jest zamknięta.** Ryzyko rośnie równolegle z zabezpieczeniem.

Dwie twarde bramki, których żadna faza nie łamie bez świadomej decyzji:

1. **Offline-first** — Leitner działa zawsze bez sieci. AI to tryb „gdy masz zasięg", nigdy warunek
   działania nauki. (Ze zrzutu Master: „Leitner offline zawsze, Master-AI jako tryb »gdy masz zasięg«.
   Nie miesza się to, jedno nie psuje drugiego.")
2. **DGSA / treść safety-critical** — treść ADR bez podpisu doradcy „nie istnieje"
   (CONTENT_ANALYSIS, ADR_Training_Distribution). AI nie produkuje niezweryfikowanej treści
   egzaminacyjnej przed bramką.

---

## FAZA 0 — SAM LEITNER, ZERO AI *(do pierwszej złotówki)*

**Cel:** pierwsza złotówka bez ani jednego wywołania API.

- Silnik Leitner + pętla mikro-lekcji (fakt → rozpoznanie → zastosowanie), 5 typów pytań
  (mcq / match / fill / order / scenario).
- Baza 218 pozycji ADR (już istnieje w `adr-content-full.js`), format-ramp po pudełku Leitnera.
- Symulacja egzaminu za bramką Pro: 30 pytań / 60 min / próg 2/3 (20/30).
- Streak (z zamrożeniem), cel dzienny, XP.
- Deploy PWA/Android, darmowy hak (1–2 jednostki gratis), jednorazowy unlock / sprint.

**Bramka wyjścia:** pierwszy płacący kierowca. Nic tu nie halucynuje — to differentiator,
którego konkurencja (suche bazy pytań) nie ma.

**Dlaczego AI tu NIE wchodzi:** pierwsza złotówka jej nie potrzebuje, a każde wywołanie API
łamie offline-first i dokłada koszt inference do modelu, który dziś ma zero kosztu utrzymania.

---

## FAZA 1 — AI WYJAŚNIA „DLACZEGO" *(Wariant 1 — wisienka)*

**Cel:** podnieść retencję i „wow", nie dotykając bramki DGSA.

- Kierowca klika **„wyjaśnij"** przy trudnym fakcie → AI parafrazuje **zatwierdzoną** treść
  po ludzku (i tłumaczy na UA/RU dla kierowców migrantów — differentiator z analizy rynku).
- Tryb „gdy masz zasięg". Brak sieci → przycisk nieaktywny, Leitner leci dalej offline.
- AI **rozwija tylko to, co już podpisane** — nie tworzy nowych faktów. Bramka DGSA nietknięta.

**Bramka offline-first:** zachowana — nauka działa bez AI, AI to nakładka.
**Bramka DGSA:** nietknięta — brak nowej treści egzaminacyjnej.

**Model biznesowy:** naturalnie druga funkcja Pro, obok symulacji egzaminu.

---

## FAZA 2 — AI GENERUJE WARIANTY PYTAŃ *(Wariant 2 — za bramką DGSA)*

**Cel:** baza pytań przestaje być skończona — ten sam fakt w nowych formatach.

- AI przerabia fakt (`class-3`) na świeże MCQ / match / scenariusz w locie.
- ⚠ To **już produkcja treści egzaminacyjnej** — wchodzi WYŁĄCZNIE za bramką DGSA.
- Każdy wygenerowany wariant przechodzi walidację importu (min. `mcq` jako gwarantowany fallback,
  zgodnie z format-ramp z CONTENT_ANALYSIS). Wariant bez przejścia walidacji nie trafia do puli.
- Wersjonowanie treści (SemVer packa) obejmuje warianty — korekta = nowa wersja, nie edycja.

**Bramka offline-first:** warianty generowane online, ale **cache'owane** — raz wygenerowane
i zwalidowane wchodzą do lokalnej puli i działają offline.
**Bramka DGSA:** kluczowa — bez podpisu doradcy faza nie startuje.

---

## FAZA 3 — KOREPETYTOR KONWERSACYJNY *(Wariant 3 — pełne „wow")*

**Cel:** kierowca rozmawia z apką („wytłumacz mi segregację ładunków").

- Do tej fazy istnieje już zbudowana, podpisana baza DGSA → korepetytor jest **ugruntowany (RAG)
  na zatwierdzonych faktach**, nie swobodny.
- Poza zakresem programu odpowiada „tego nie ma w kursie" zamiast halucynować. Halucynacja
  safety-critical zamienia się w kontrolowane „nie wiem".
- Najczystszy tryb „gdy masz zasięg" — najgłębsza zależność od sieci ze wszystkich faz.

**Bramka offline-first:** świadomie poluzowana — to funkcja online z natury, ale Leitner + Fazy 0–2
działają bez niej. Korepetytor nigdy nie jest jedyną drogą do nauki.
**Bramka DGSA:** domknięta przez RAG — model cytuje tylko zatwierdzone fakty.

---

## PODSUMOWANIE — WZÓR NAWARSTWIANIA

| Faza | Warstwa AI | Offline-first | Bramka DGSA | Kiedy |
|---|---|---|---|---|
| 0 | brak | ✅ pełny | n/d | do pierwszej złotówki |
| 1 | wyjaśnia „dlaczego" | ✅ AI to nakładka | nietknięta | po 1. złotówce |
| 2 | generuje warianty pytań | 🟡 cache offline | ⚠ wymagana | po podpisie DGSA |
| 3 | korepetytor RAG | 🔶 online z natury | domknięta RAG | baza DGSA gotowa |

**Reguła spinająca całość:** silnik i pack nigdy się nie forkują. Każda faza to ta sama
`core/learning` + głębsza warstwa AI na wierzchu. Kolejność bramek jest nienegocjowalna —
AI wchodzi głębiej tylko wtedy, gdy poprzednie zabezpieczenie jest już na miejscu.

---

## NASTĘPNY KROK

Faza 0, rdzeń: silnik Leitner + pętla mikro-lekcji. Czysta logika, testowalna bez UI i bez AI.
Buduj to zanim wsypiesz choć jedno wywołanie API.
