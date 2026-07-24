# 🗂️ BUILDING STATUS — MasterADR (stan na 2026-07-20)

## 🔧 OSTATNIA ZMIANA (2026-07-20) — TRYB SYMULACJI EGZAMINU (hacz Pro)

**Zbudowane:** osobny tryb egzaminu — nie było go wcześniej (tylko wzmianki tekstowe).

**Komponent `ExamMode`** (samodzielny, reużywa `buildQuestion` / `QuestionBody` / `norm` / `mapEq` / `arrEq`):
- Stała, LOSOWA pula **30 pytań** (`EXAM_COUNT`) z całej bazy ADR, losowy wspierany format każdego.
- **Timer 60 min** (`EXAM_MIN`) — odlicza, ostatnie 5 min na czerwono, po 0 auto-oddanie.
- **BEZ feedbacku po pytaniu** (jak na prawdziwym egzaminie) — wynik dopiero na końcu.
- **BEZ zapisu do Leitnera** — egzamin SPRAWDZA, nie uczy (celowo, decyzja z sesji: na egzaminie
  nikt nie pokaże słabego faktu drugi raz).
- Nawigacja przód/tył, można zmienić odpowiedź przed oddaniem, licznik "odpowiedziano X/30".
- Wynik: próg **20/30 (⅔)** = zdany (`EXAM_PASS`), ekran ✅/❌ z wynikiem.

**Wpięcie:**
- Nowy `screen === "exam"`, funkcja `startExam()` z **bramką Pro** (bez licencji → paywall).
- Kafel "📝 Symulacja egzaminu" na ekranie Home (badge PRO gdy brak licencji), pod "Powtórką dnia".
- `onExam` podpięty do obu wywołań `Home`.

**Framing (zgodny z mapą):** kafel mówi "format prawdziwego egzaminu", nie "zdaj u nas".
To hacz Pro z ADR_DUOLINGO_PIERWSZA_ZLOTOWKA ("chcę zdać za pierwszym razem").

**Weryfikacja:** build ✓ (369 kB JS). Test logiki: losowanie=30 (100x), próg 19→false/20→true,
brzeg 10 faktów→10 bez crasha. Wszystko PASS.

**Zostaje z Fazy 0:** krok 4 (import silnika core-learning do app.jsx), testy dla apki (dziś 0),
podpis DGSA (`verifiedBy: null`).

---

# 🗂️ BUILDING STATUS — MasterADR (stan na 2026-07-20)

## 🔧 OSTATNIA ZMIANA (2026-07-20, wieczór) — scalenie forka + 8 faktów audytu

**Problem rozwiązany:** projekt rozjechał się na dwie gałęzie (fork, przed którym ostrzega
reguła "bez forka"):
- `MasterADR-complete` — bogatsza STRUKTURA (core-learning + daily-habit + docs), 218 pozycji.
- gałąź treściowa — 226 pozycji (8 faktów z audytu 2023→2025), ale gołe Vite bez struktury.

**Rozwiązanie:** wstrzyknięto BRAKUJĄCE 8 faktów do `complete` (bogatsza baza), bez ruszania
struktury. Teraz jedna wersja ma wszystko: strukturę + pełną treść.

**Co doszło (8 faktów, wszystkie `verifiedBy: null`):**
- Warstwa ADR 2025: `x-sp677-baterie-uszkodzone-2025` (B1), `x-kamizelka-eniso20471-2025` (B4),
  `x-segregacja-klasa1-uproszczenie-2025` (B4).
- Blok 3: `b3-obowiazek-srodowisko`, `b3-odpady-klasyfikacja`, `b3-numer-zagrozenia-90`.
- Blok 5: `b5-pierwsza-pomoc-kontakt`, `b5-zajecia-praktyczne-info`.

**Liczby: 218 → 226 pozycji.** Rozkład: B1=63, B2=56, B3=12, B4=73, B5=22.
Build: `npm run build` ✓ (PWA OK).

**Do weryfikacji przy recenzji (nie blokuje):**
- `b5-pierwsza-pomoc-kontakt` — treść MEDYCZNA → ratownik/instruktor (typ M).
- `x-*-2025`, `b3-*`, `x-lq-szkolenie-2025` — DGSA (typ L).

**⚠ REGUŁA NA PRZYSZŁOŚĆ (żeby nie powtórzyć forka):** pracujemy TYLKO na
`MasterADR-complete.zip` jako jednym źródle prawdy. Każda zmiana → ten sam pakiet
w kolejnym czacie. Nie tworzyć osobnych gałęzi "tylko treść" / "tylko struktura".

---

# 🗂️ BUILDING STATUS — MasterADR (stan na 2026-07-20)

## 🔧 OSTATNIA ZMIANA (scalenie, krok 1-3)

**Co zrobione:**
- Rdzeń `core/learning` wyrównany do prototypu: interwały box-1 = 10 min (było „ten sam
  dzień"), interwały w ms, dodany licznik `lapses` w `CardState`. Testy: **63 zielone**.
- Do apki (`MasterADR-vite`) dodany **moduł `src/daily-habit.js`**: streak Z ZAMROŻENIEM
  + cel dzienny + XP z bonusem — przeniesione 1:1 z przetestowanego `gamification.ts`,
  na czystym JS. Własny klucz `adrtrainer.habit.v1`, **nie rusza** stanu Leitnera ani
  streaka sesji. Widżet 📅 wbudowany w komponent `TrHeader` — pojawia się na WSZYSTKICH
  9 ekranach automatycznie (streak, ❄ zamrożenia, postęp celu), nie tylko na ekranie sesji.
- Apka buduje się czysto (`npm run build` ✓, 23 moduły, PWA wygenerowane).

**Świadomie ODŁOŻONE (krok 4):** pełna podmiana wplecionego silnika w `app.jsx` na import
z `core/learning`. Powód: modele różnią się (`dueAt` w apce vs `lastSeen`+interwał w core),
to refaktor stanu całej apki — robimy osobno, żeby nie zepsuć działającego deployu jedną
wielką zmianą. Na teraz apka ma DWA streaki: sesyjny (🔥, był) i dzienny (📅, nowy).

**Uwaga o dwóch streakach:** to celowe, nie bug. 🔥 = poprawne z rzędu w jednej lekcji
(motywacja w sesji). 📅 = kolejne dni nauki z zamrożeniem (nawyk długoterminowy z mapy).

---


**Po co ten plik:** w projekcie krążą DWA artefakty o podobnej nazwie. Ten dokument mówi
jednoznacznie, czym każdy jest, co ma, czego mu brakuje i jak się łączą — żeby przy kolejnej
sesji nic się nie myliło.

---

## TL;DR

To NIE są dwa różne projekty. To **ten sam silnik Leitnera napisany dwa razy**:
- raz **wpleciony w UI** (MasterADR-vite, realna apka),
- raz **wyjęty i przetestowany** (core/learning, czysta logika).

**Uzupełniają się.** Vite daje ciało (UI + 253 pozycje treści + deploy na Androida).
core/learning daje serce (przetestowany silnik + brakujące mechaniki z mapy: zamrożenie
streaka, cel dzienny, XP z bonusem). Docelowo: **UI z Vite importuje silnik z core/learning**,
zamiast trzymać własną kopię w `app.jsx`.

---

## ARTEFAKT A — `MasterADR-vite` (realna apka, z załącznika)

**Czym jest:** działający projekt Vite + React + Capacitor, gotowy do zbudowania APK/AAB
na Androida (instrukcja w INSTRUKCJA.md). Kod przeniesiony 1:1 z prototypu HTML.

**Co MA:**
- ✅ **Realny UI** — ekrany, nawigacja, licznik „do powtórki", streak w nagłówku.
- ✅ **253 pozycje treści ADR** z pełnymi pytaniami (nie same metadane): 5 formatów
  (mcq 142, scenario 143, match 79, fill 26, order 10). Rozkład po blokach: B1=62,
  B2=56, B3=9, B4=71, B5=20.
- ✅ **Silnik Leitnera** wpleciony w `app.jsx`: 5 pudełek, interwały 10min/1/3/7/16 dni,
  awans box+1, zrzut na box 1 (+ licznik `lapses`).
- ✅ **Persystencja** przez `localStorage` (14 miejsc).
- ✅ **Streak + XP** (prostsza wersja).
- ✅ **Metadane pod DGSA w danych**: `adrRef`, `source`, `edition`, `status`, `verifiedBy`.

**Czego NIE MA (luki względem mapy):**
- ❌ **Zamrożenie streaka** (`freeze`) — zero w kodzie. Mapa wymaga: nieprzebaczający streak = rage-quit.
- ❌ **Cel dzienny** (`dailyGoal`) — brak.
- ❌ **Tryb symulacji egzaminu** (30 pytań / 60 min / próg 2/3) — jest wzmianka, brak trybu.
- ❌ **Testy** — 0. Silnik działa, ale nic go nie pilnuje przy zmianach.
- ❌ **Podpis DGSA** — 210 z 253 pozycji ma `verifiedBy: null` (formalnie „nieopublikowane").
- ⚠ **Silnik w jednym pliku 11,5 tys. linii** — trudny w utrzymaniu, łatwo o regresję.

---

## ARTEFAKT B — `core/learning` (silnik z tej sesji)

**Czym jest:** czysty, wydzielony rdzeń w TypeScript — silnik Leitnera + pętla lekcji +
sesja + gamifikacja, jako osobne moduły z pełnym pokryciem testami. BEZ UI, BEZ treści.

**Co MA:**
- ✅ **Silnik Leitnera** (`leitner.ts`) — 5 pudełek, interwały, kolejka due, czyste funkcje.
- ✅ **Pętla lekcji** (`lesson.ts`) — `pickFormat` (rampa mcq→scenario), walidacja mcq-fallback.
- ✅ **Sesja** (`session.ts`) — zapis po każdej odpowiedzi, storage przez interfejs.
- ✅ **Gamifikacja** (`gamification.ts`) — **streak Z ZAMROŻENIEM, cel dzienny, XP z bonusem**.
- ✅ **62 testy (vitest)** — wszystkie zielone, weryfikacja w czystym katalogu.

**Czego NIE MA:**
- ❌ **UI** — to sama logika, nic do kliknięcia.
- ❌ **Treść** — operuje na typie `Fact`, ale nie zawiera 253 pozycji (są w Vite).
- ❌ **Symulacja egzaminu** — świadomie odłożona (decyzja z tej sesji).

---

## JAK SIĘ ŁĄCZĄ (mapowanie modeli)

Oba silniki są zgodne co do rdzenia — różnią się detalami, które trzeba pogodzić:

| Cecha | core/learning | MasterADR-vite | Uwaga przy scaleniu |
|---|---|---|---|
| Pudełka | 5 (1..5) | 5 (1..5) | zgodne |
| Interwały | 0/1/3/7/14 dni | 10min/1/3/7/16 dni | **wybrać jeden** — Vite ma ładne „10 min" na box 1 |
| Awans / zrzut | box+1 / →1 | box+1 / →1 (+lapses) | zgodne; `lapses` to fajny dodatek, warto przenieść |
| Persystencja | `DeckStore` (interfejs) | `localStorage` | interfejs owija localStorage — pasuje idealnie |
| Streak | **z zamrożeniem** | bez | core uzupełnia lukę Vite |
| Cel dzienny | **jest** | brak | core uzupełnia lukę Vite |
| Testy | 62 | 0 | core wnosi siatkę bezpieczeństwa |

**Typ `Fact`:** mój `Fact` (`id, block, supportedFormats`) to PODZBIÓR bogatszego faktu z Vite
(`id, block, topic, kind, adrRef, edition, verifiedBy, formats, why, q{...}`). Scalenie =
rozszerzyć mój typ o `q` (treść pytań) i metadane DGSA. Zero konfliktu, tylko dołożenie pól.

---

## PLAN SCALENIA (kolejność, gdy ruszymy)

1. **Interwały** — zdecydować jeden zestaw (rekomendacja: wziąć „10 min / 1 / 3 / 7 / 16"
   z Vite, bo box 1 tego samego dnia jest lepszy dla nauki przedegzaminacyjnej).
2. **Przenieść `lapses`** do `CardState` w core (Vite już to liczy — przydatne do HLR w Fazie 2+).
3. **Wstawić brakujące mechaniki z core do Vite**: zamrożenie streaka, cel dzienny, XP-bonus.
4. **Wymienić wpleciony silnik w `app.jsx` na import z `core/learning`** — jeden silnik,
   nie dwa. To realizuje regułę z mapy: „silnik i pack nigdy się nie forkują".
5. **Dodać tryb symulacji egzaminu** (30/60/próg 2/3) jako nakładkę na tej samej bazie.
6. **Domknąć bramkę DGSA** — przepuścić 253 pozycje przez doradcę, ustawić `verifiedBy`.

---

## GDZIE CO LEŻY W TYM ZIPIE

```
adr-core-learning/        ← ARTEFAKT B (silnik + 62 testy, TypeScript)
  src/leitner.ts
  src/lesson.ts
  src/session.ts
  src/gamification.ts
  src/index.ts
  src/*.test.ts
  README.md
BUILDING_STATUS.md        ← ten plik
```

**Uwaga:** realna apka `MasterADR-vite` (ARTEFAKT A) NIE jest w tym zipie — masz ją w swoim
załączniku. Ten zip to rdzeń (B), który ma zostać *wpięty* do A. Trzymanie ich osobno jest
celowe do czasu scalenia: A się buduje i działa dziś, B jest testowalny w izolacji.

---

*Reguła spinająca (z mapy): jeden silnik, jeden pack, żadnego forka. Docelowo `app.jsx`
importuje `core/learning` zamiast trzymać własną kopię Leitnera.*

---

## 📦 REGUŁA DOSTARCZANIA (obowiązuje przy KAŻDEJ zmianie)

Po każdej zmianie w kodzie dostajesz **DWA pliki naraz**, nie jeden:

1. **ZIP z rdzeniem** (`adr-core-learning.zip`) — źródła + testy + ten building status.
   To wersja do wglądu w kod, uruchomienia testów i wpięcia do projektu.
2. **PROTOTYP** — klikalna, zbudowana apka (HTML lub projekt Vite), żebyś od razu
   zobaczył zmianę w działaniu, a nie tylko w testach.

Powód: sam kod z testami nie pokazuje, jak rzecz wygląda i klika się na telefonie.
Sam prototyp nie pozwala zajrzeć w logikę ani jej pilnować. Dwa pliki = pełny obraz:
**co się zmieniło (zip) i jak to teraz działa (prototyp).**

Zasada nie ma wyjątków — nawet drobna poprawka silnika idzie z odświeżonym prototypem,
żeby oba artefakty nigdy się nie rozjechały (to ta sama reguła „bez forka", tylko na
poziomie dostaw).
