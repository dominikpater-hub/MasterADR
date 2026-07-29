# 💰 ADR DUOLINGO — DO PIERWSZEJ ZŁOTÓWKI

**Data:** 2026-07-08
**Nazwa robocza:** ADR Duolingo (placeholder — do zmiany)
**Cel:** najkrótsza LEGALNA droga do pierwszego realnego przychodu. Nie „produkt gotowy" — pierwszy płacący użytkownik.
**Kontekst:** moduł ekosystemu CITADEL. Grywalizowana mikronauka wiedzy ADR (silnik retencji Duolingo + architektura treści SoloLearn). Ta sama grupa docelowa co Driver's Shield — domyka pętlę na kierowcy ADR.
**Framing:** learning teraz, kasa później. Ale produkt komercyjny od startu (jak Driver's Shield D1).

---

## 1. TWARDA PRAWDA NA START

**Sam grywalizowany silnik nie zarabia — content zarabia. Ale content bez silnika nie utrzyma użytkownika.**

Pierwsza złotówka wymaga trzech rzeczy jednocześnie:
1. **Wdrożona apka** (nie artifact — realny deploy, do którego wchodzi obcy kierowca)
2. **Co najmniej jedna płatna funkcja** zbudowana i za bramką
3. **Ktoś, kto zapłaci** — czyli darmowy hak musi najpierw ściągnąć użytkowników

To odwraca priorytet: nie „zbuduj całą bazę ADR", tylko „zbuduj JEDEN moduł egzaminacyjny *wystarczająco dobrze by ściągał*, i jak najszybciej postaw za nim płatną ścianę".

⚠ **Kluczowa różnica vs Driver's Shield:** tu Twoja wiedza ADR to *treść produktu*, nie tylko differentiator w tle. To Twój moat — ale też Twoja praca. Każdy fakt musisz zweryfikować (edycja ADR 2025, cykl 2-letni).

---

## 2. WYBÓR PIERWSZEGO PŁATNEGO MODUŁU

Rynek (z analizy): **nie istnieje żadna grywalizowana apka ADR.** Konkurencja to suche bazy pytań (IMAGE ~40 zł/14 dni, TransUP ~29,99 zł) i apki-encyklopedie (ADR Tool). Luka = silnik retencji na własnej bazie pytań.

Kandydaci na pierwszy płatny moduł i dlaczego:

| Kandydat | Koszt budowy | Koszt utrzymania | Odpowiedzialność prawna | Werdykt |
|---|---|---|---|---|
| **Kurs podstawowy — pełna ścieżka** (9 klas → UN/Tabela A → oznakowanie → segregacja → wyposażenie → dokumenty → procedury) | Średni (content + silnik) | Zero (brak inference) | Średnia | ✅ **Najkrótsza droga** |
| Tryb symulacji egzaminu | Niski (jak ścieżka gotowa) | Zero | Średnia | Wchodzi razem z kursem jako haczyk Pro |
| Moduły dodatkowe (cysterny / klasa 1 / klasa 7) | Średni każdy | Zero | Średnia | Druga w kolejce — osobne odbloki |
| Wersja UA/RU dla migrantów | Niski (tłumaczenie gotowej bazy) | Zero | Średnia | Differentiator — dokładasz, nie blokujesz launchu |

**Decyzja dłuta: kurs podstawowy (pełna ścieżka egzaminacyjna) jako pierwszy płatny moduł, z trybem symulacji egzaminu jako haczykiem Pro.**

Powód: kurs podstawowy to najczęstszy punkt wejścia każdego kierowcy ADR — największy lejek. Zero kosztu inference. Tryb symulacji egzaminu to konkretny zewnętrzny cel, który motywuje do zapłaty („chcę zdać za pierwszym razem"). Moduły cysterny/klasa 1/klasa 7 to mniejsze grupy — wchodzą jako osobne odbloki później.

**Tradeoff (uczciwie):** nauka ADR jest *epizodyczna* — kierowca uczy się intensywnie przed egzaminem i potem co 5 lat. To słabsza retencja niż codzienna apka językowa. Dlatego jednorazowy odblok / krótki abonament „sprint egzaminacyjny" pasuje lepiej niż stały abonament. Cykl 5-letni (kurs doskonalący) daje re-aktywację, nie codzienny nawyk.

---

## 3. MODEL — JEDNORAZOWY ODBLOK / SPRINT, NIE STAŁY ABONAMENT

Do pierwszej złotówki: **jednorazowy unlock kursu albo abonament 3-miesięczny „sprint egzaminacyjny".**

Powód: nauka ADR jest epizodyczna (§2). Stały abonament konsumencki jest tu trudny do utrzymania — kierowca nie wraca codziennie po zdaniu. Benchmark rynkowy: konkurencja bierze 29,99–40 zł za krótkie okno dostępu. Wchodzisz w ten sam przedział lub trochę wyżej, bo dajesz więcej (grywalizacja, powtórki, symulacja).

Mechanika bez backendu:
- License key przez Gumroad / Lemon Squeezy (obsługują PL, zero infrastruktury po Twojej stronie).
- Kierowca kupuje → dostaje klucz → apka odblokowuje kurs lokalnie. Pasuje do local-first: bez kont, bez serwera do inkasa.

**Drugi tor przychodu (po pierwszej złotówce, nie przed): B2B.**
Analiza rynku wskazała, że akredytowane ośrodki kontrolują kanał (kurs stacjonarny jest obowiązkowy — apka go NIE zastępuje). Zamiast walczyć z ośrodkami — sprzedaj im licencje jako wartość dodaną do ich kursów. To rozwiązuje problem kanału i daje przychód powracający. Ale to **Etap D**, nie pierwsza złotówka.

---

## 4. BRAMKI POZA KODEM ⚠ (łatwo niedoszacować)

To NIE są linijki kodu, a blokują pierwszą złotówkę tak samo twardo:

| Bramka | Co to znaczy |
|---|---|
| **Własna baza pytań (NIE oficjalny katalog)** | ⚠ Polski katalog pytań egzaminacyjnych jest zatwierdzony przez ministra i chroniony — publiczne są tylko pytania *przykładowe*. Możesz zbudować WŁASNY bank pytań wzorowany na programie szkolenia i pytaniach przykładowych. Skopiowanie tajnego katalogu = naruszenie. To fundament — bez tego cała apka jest nielegalna. |
| **Weryfikacja treści ADR (edycja 2025)** | Treść bezpieczeństwa. Każdy fakt zweryfikowany względem aktualnej umowy ADR. Twoja ekspertyza + tekst źródłowy (ADR to publiczny akt prawny UNECE — można parafrazować swobodnie, w przeciwieństwie do katalogu pytań). Wersjonowanie do edycji (cykl 2-letni). |
| **Framing „dodatek ≠ kurs akredytowany"** | Apka NIE może twierdzić, że wydaje zaświadczenie ani zastępuje obowiązkowy kurs stacjonarny. Regulamin + onboarding muszą to rozgraniczać. „Przygotowanie do egzaminu" — OK; „zdasz egzamin / dostaniesz uprawnienia" — NIE. |
| **Procesor płatności** | Gumroad / Lemon Squeezy (license key, bez backendu). Wymaga konta i zwykle formy prawnej. |
| **Forma prawna do przyjmowania pieniędzy** | *Działalność nierejestrowana* (mały przychód bez rejestracji firmy, do progu miesięcznego). ⚠ Trop do SPRAWDZENIA u księgowego — nie jestem doradcą podatkowym, próg i warunki się zmieniają. |
| **Regulamin + polityka prywatności (RODO)** | Wymagane prawnie. Regulamin musi zawierać rozgraniczenie z pkt „dodatek ≠ kurs". |

Bramka „własna baza pytań" jest tu najgroźniejsza i specyficzna dla tego modułu — to nie copywriting, to inne źródło danych. Zignorowanie = nie „szybciej", tylko „nielegalnie".

---

## 5. ŚCIEŻKA KRYTYCZNA (najkrótsza droga)

**Etap A — Silnik żywy i wdrożony (0 zł, ale konieczny)**
- A1. Silnik mikro-lekcji: pętla fakt → rozpoznanie → zastosowanie, 5 typów pytań (MCQ, dopasowanie, uzupełnianie, kolejność, scenariusz). Czysta logika, testowalna od ręki.
- A2. Kolejka powtórek (system Leitnera na start — fakt awansuje przy poprawnej odpowiedzi, spada przy błędzie). To Twój główny differentiator — mechanizm, którego konkurencja NIE MA.
- A3. Node/Git na ThinkPadzie → scaffold Vite (**bramka A2 z Driver's Shield — ta sama odłożona ściana; bez tego nie ma deployu żadnego modułu**).
- A4. Deploy PWA (Vercel/Netlify — darmowy tier), instalowalna na telefonie.
- A5. Darmowy hak: 1-2 jednostki kursu za darmo (np. 9 klas zagrożeń) — kierowca widzi wartość i mechanikę zanim zapłaci.
- A6. Minimalna dystrybucja: grupy kierowców (FB, fora, CB), ośrodki ADR.

**Etap B — Content za bramką**
- B1. Własna baza pytań kursu podstawowego skompletowana (§4 — NIE katalog oficjalny).
- B2. Pełna ścieżka: 9 klas → UN/Tabela A → oznakowanie → segregacja → wyposażenie → dokumenty → procedury.
- B3. Tryb symulacji egzaminu (format realnego egzaminu: 30 pytań single-choice, 60 min, próg 2/3).
- B4. Grywalizacja retencji: streak (z „zamrożeniem"), cel dzienny, XP.

**Etap C — Pierwsza płatna funkcja + pierwsza konwersja**
- C1. Weryfikacja treści ADR + framing „dodatek ≠ kurs" (bramka §4).
- C2. Regulamin + RODO + forma prawna (bramka §4).
- C3. Procesor płatności + bramka unlock (jednorazowy / sprint 3-mies.).
- C4. Darmowy hak ściąga → kierowca widzi mechanikę → trafia na płatny kurs + symulację.
- C5. Pierwszy unlock = **pierwsza złotówka** 🎯

---

## 6. CZEGO ŚWIADOMIE NIE ROBIĆ PRZED PIERWSZĄ ZŁOTÓWKĄ

Odcięcie scope = szybciej do celu:
- ❌ Moduły cysterny / klasa 1 / klasa 7 — mniejsze grupy, osobne odbloki. Po pierwszej złotówce.
- ❌ Pełne UA/RU jako blokada — PL first. Dokładasz tłumaczenie gotowej bazy, nie czekasz z launchem.
- ❌ Ligi / leaderboardy — wymagają masy jednoczesnych użytkowników. Bez niej martwe. Faza 2.
- ❌ Model half-life regression (adaptacyjny jak Duolingo) — overkill na start. Leitner wystarczy do pierwszej danych. HLR dopiero jak masz ruch.
- ❌ B2B dla ośrodków — drugi tor przychodu, ale osobny produkt/sprzedaż. Etap D, nie pierwsza złotówka.
- ❌ Treści od społeczności (jak SoloLearn) — ryzyko błędnych odpowiedzi w treści bezpieczeństwa. Nigdy bez moderacji eksperckiej.
- ❌ System „serc/energii" karzący za błędy — w treści szkoleniowej dla zawodowców błąd to sposób nauki, nie kara.

---

## 7. CHECKLIST DO PIERWSZEJ ZŁOTÓWKI

```
[ ] A1  Silnik mikro-lekcji (5 typów pytań, pętla fakt→rozpoznanie→zastosowanie)
[ ] A2  Kolejka powtórek Leitner (główny differentiator)
[ ] A3  Node/Git + scaffold Vite (bramka A2)
[ ] A4  Deploy PWA (darmowy hosting)
[ ] A5  Darmowy hak (1-2 jednostki gratis)
[ ] A6  Pierwsi użytkownicy (grupy kierowców, ośrodki)
[ ] B1  Własna baza pytań (NIE katalog oficjalny) ⚠
[ ] B2  Pełna ścieżka kursu podstawowego
[ ] B3  Tryb symulacji egzaminu
[ ] B4  Streak + cel dzienny + XP
[ ] C1  Weryfikacja treści ADR + framing „dodatek ≠ kurs"
[ ] C2  Regulamin + RODO + forma prawna
[ ] C3  Procesor płatności + bramka unlock
[ ] C4  Ścieżka darmowy → płatny widoczna w apce
[ ] C5  🎯 PIERWSZA ZŁOTÓWKA
```

---

## 8. PIERWSZA AKCJA

Silnik mikro-lekcji + kolejka Leitner (A1+A2) — czysta logika, testowalna bez UI, bez contentu. To rdzeń, na którym stoi wszystko inne, i jednocześnie Twój jedyny prawdziwy differentiator względem suchych baz pytań. Buduj to zanim wsypiesz choć jeden fakt ADR.

⚠ **Zależność krzyżowa:** bramka A2 (Node/Git na ThinkPadzie) blokuje deploy Driver's Shield, DIETA-ENGINE i ten moduł jednocześnie. Jedno przecięcie odblokowuje trzy moduły naraz.

---

*Do pierwszej złotówki: darmowy hak ściąga, kurs + symulacja sprzedają, jednorazowy unlock inkasuje. Cysterny, ligi, UA/RU i B2B czekają.* 💰
