# ADR DUOLINGO — ARCHITEKTURA TREŚCI KURSU PODSTAWOWEGO

**Podstawa prawna:** Rozporządzenie Ministra Transportu, Budownictwa i Gospodarki Morskiej
z dnia 29 maja 2012 r. w sprawie prowadzenia kursów z zakresu przewozu towarów niebezpiecznych
(Dz.U. 2021 poz. 2150 z późn. zm.), zakres tematyczny wynikający z części 8 umowy ADR.

**Egzamin państwowy (zakres podstawowy):** 30 pytań jednokrotnego wyboru (3 warianty odpowiedzi),
60 minut, próg zaliczenia 2/3 (20/30). Komisja powołana przez marszałka województwa.

**Zakres kursu podstawowego:** wszystkie klasy ADR **z wyjątkiem klasy 1 (wybuchowe) i klasy 7
(promieniotwórcze)** — te wymagają osobnych kursów specjalistycznych (patrz sekcja na końcu).

⚠ Ten dokument to **architektura treści**, nie gotowa baza pytań. Każdy fakt niżej wymaga:
(a) zredagowania właściwych pytań (MCQ/match/fill/order/scenario), (b) weryfikacji wobec
aktualnej edycji ADR 2025, (c) sprawdzenia że NIE odtwarza oficjalnego katalogu egzaminacyjnego
(bramka B1 z roadmapy).

---

## BLOK 1 — Wymagania ogólne (2 godz. teorii)

*Przepisy prawne, definicje, szkolenie osób zaangażowanych w przewóz, wyłączenia stosowania ADR.*

**Status w demo: nieobecny. Priorytet: wysoki — to pierwszy blok egzaminu.**

Proponowane jednostki faktów:

| Fakt | Treść | Format sugerowany |
|---|---|---|
| `def-towar-niebezpieczny` | Definicja towaru niebezpiecznego wg ADR | mcq |
| `struktura-adr` | Struktura umowy ADR — załączniki A i B, co regulują | mcq |
| `uczestnicy-przewozu` | Role: nadawca, przewoźnik, odbiorca, załadowca, pakujący, napełniający — kto za co odpowiada | match |
| `obowiazki-kierowcy` | Podstawowe obowiązki kierowcy wynikające z ADR | mcq, scenario |
| `wylaczenia-1-1-3-6` | Wyłączenie 1.1.3.6 — zwolnione ilości ze względu na naturę przewozu (jednostki transportowe) | fill |
| `LQ-wylaczone-ilosci` | Oznakowanie LQ (Limited Quantities) — kiedy ADR nie ma zastosowania | mcq |
| `szkolenie-obowiazek` | Kto musi przejść szkolenie ADR (kierowca vs pracownik magazynu) | mcq |

**Uwaga:** wyłączenia (1.1.3.6, LQ) to najczęstsza pułapka egzaminacyjna — kierowcy mylą "zwolnione z ADR" z "bezpieczne". Dobry kandydat na pytania scenariuszowe wysokiego pudełka Leitnera.

---

## BLOK 2 — Główne rodzaje zagrożeń (2 godz. teorii)

*Podstawy klasyfikacji towarów niebezpiecznych, rozpoznawanie zagrożeń na podstawie nalepek i znaków.*

**Status w demo: pokryty częściowo.** 7 z 9 klas ma fakty (brak: pełne podklasy 4.1/4.2/4.3,
5.1/5.2, 6.1/6.2 jako osobne jednostki — obecnie potraktowane łącznie w opisie klasy).

Do dopisania:

| Fakt | Treść | Format sugerowany |
|---|---|---|
| `podklasy-4` | Rozróżnienie 4.1 (zapalne stałe) / 4.2 (samozapalne) / 4.3 (reagujące z wodą) | match |
| `podklasy-5` | Rozróżnienie 5.1 (utleniające) / 5.2 (nadtlenki organiczne) | match |
| `podklasy-6` | Rozróżnienie 6.1 (trujące) / 6.2 (zakaźne) | match |
| `grupy-pakowania` | Grupy pakowania I/II/III — poziom zagrożenia w obrębie klasy | mcq |
| `nalepki-vs-tabliczki` | Różnica: nalepka ostrzegawcza (na sztuce przesyłki) vs tablica pomarańczowa (na pojeździe) | mcq, scenario |
| `numer-kemler` | Numer rozpoznawczy zagrożenia (górny numer na tablicy) — struktura i przykład odczytu | fill |
| `numer-un` | Numer UN (dolny numer na tablicy) — co identyfikuje | mcq |
| `zagrozenia-wtorne` | Nalepki dodatkowe przy zagrożeniu wtórnym (np. materiał trujący i żrący jednocześnie) | scenario |

---

## BLOK 3 — Ochrona środowiska (1 godz. teorii)

*Informacje na temat ochrony środowiska i kontroli przewozu odpadów.*

**Status w demo: nieobecny. Priorytet: średni — najmniejszy blok punktowo, ale zawsze się pojawia.**

| Fakt | Treść | Format sugerowany |
|---|---|---|
| `srodowisko-obowiazki` | Obowiązek zapobiegania skażeniu środowiska podczas przewozu | mcq |
| `substancje-zagrazajace-wodzie` | Oznaczenie materiałów zagrażających środowisku wodnemu (symbol ryba+drzewo) | mcq |
| `odpady-niebezpieczne-klasyfikacja` | Podstawy klasyfikacji odpadów niebezpiecznych podlegających ADR | mcq |
| `wyciek-postepowanie-srodowisko` | Pierwsze kroki przy wycieku zagrażającym środowisku (np. glebie, wodom) | order |

---

## BLOK 4 — Działania zapobiegawcze i środki bezpieczeństwa (1 godz. teorii)

*Właściwe dla różnych rodzajów zagrożeń.*

**Status w demo: nieobecny.**

| Fakt | Treść | Format sugerowany |
|---|---|---|
| `wyposazenie-pojazdu-ogolne` | Obowiązkowe wyposażenie pojazdu ADR (gaśnice, kliny, kamizelka, latarka, itd.) | mcq, match |
| `sprzet-ochrony-indywidualnej` | Środki ochrony osobistej wymagane przy danej klasie towaru | match |
| `instrukcja-pisemna` | Instrukcje pisemne (dawniej "karta bezpieczeństwa") — co zawierają, gdzie przechowywane | mcq |
| `segregacja-ladunkow` | Zasady segregacji — których klas nie wolno przewozić razem | match, scenario |
| `dokumenty-przewozowe` | Wymagane dokumenty: dokument przewozowy, świadectwo dopuszczenia pojazdu ADR | fill |
| `zakaz-palenia-otwarty-ogien` | Zakazy przy załadunku/rozładunku (palenie, otwarty ogień, telefon) | mcq |

---

## BLOK 5 — Postępowanie po wypadku (1 godz. teorii + zajęcia praktyczne)

*Pierwsza pomoc, bezpieczeństwo ruchu drogowego, sprzęt ochronny/gaśniczy, środki ochrony indywidualnej.*

**Status w demo: nieobecny. Priorytet: wysoki — silnie scenariuszowy, dobrze pasuje do formatu `order`.**

| Fakt | Treść | Format sugerowany |
|---|---|---|
| `kolejnosc-dzialan-wypadek` | Kolejność działań po wypadku: zabezpiecz miejsce → ostrzeż innych → powiadom służby → pierwsza pomoc | order |
| `oznakowanie-miejsca-zdarzenia` | Ustawienie trójkąta ostrzegawczego, włączenie świateł awaryjnych | mcq |
| `powiadomienie-sluzb` | Numer alarmowy, co zgłosić dyspozytorowi (numer UN, klasa, ilość) | scenario |
| `gaszenie-pozaru-adr` | Kiedy gasić samodzielnie, kiedy tylko ewakuować i czekać na straż | scenario |
| `pierwsza-pomoc-kontakt-substancja` | Postępowanie przy kontakcie skóry/oczu z materiałem niebezpiecznym | mcq |
| `praktyczne-zajecia-info` | Info-karta (nie pytanie): zajęcia praktyczne z pierwszej pomocy i gaszenia pożaru są częścią kursu stacjonarnego — apka ich nie zastępuje | — |

---

## PODSUMOWANIE POKRYCIA

| Blok | Godz. teorii | Status przed tą sesją | Status po rozpisaniu |
|---|---|---|---|
| 1. Wymagania ogólne | 2h | ❌ 0 faktów | 📋 7 faktów zaplanowanych |
| 2. Zagrożenia/klasyfikacja | 2h | 🟡 9 faktów (klasy), braki w podklasach | 📋 +8 faktów zaplanowanych |
| 3. Ochrona środowiska | 1h | ❌ 0 faktów | 📋 4 fakty zaplanowane |
| 4. Zapobieganie/bezpieczeństwo | 1h | ❌ 0 faktów | 📋 6 faktów zaplanowanych |
| 5. Postępowanie po wypadku | 1h | ❌ 0 faktów | 📋 6 faktów zaplanowanych |

**Razem po pełnym wdrożeniu: ~40 faktów rdzenia**, proporcjonalnie do wagi godzinowej bloków
w kursie stacjonarnym (blok 2 największy, bloki 3/4/5 mniejsze ale obowiązkowe na egzaminie).

To NIE jest jeszcze finalna liczba pytań w apce — każdy fakt może wygenerować 2-3 warianty pytań
(różne formaty z `pickFormat`), więc baza pytań będzie kilkukrotnie większa niż liczba faktów.

---

## MODUŁY SPECJALISTYCZNE (poza zakresem podstawowym)

Osobne kursy, osobne uprawnienia, osobne egzaminy. Do zbudowania **po** pierwszej złotówce
z kursu podstawowego (§6 roadmapy — "czego świadomie nie robić przed pierwszą złotówką").

| Moduł | Wymiar kursu (początkowy) | Egzamin | Uwaga |
|---|---|---|---|
| Cysterny | 13 godz. lekcyjnych | 18 pytań / 40 min | Osobna specjalizacja techniczna (napełnianie/opróżnianie, konstrukcja cystern) |
| Klasa 1 (wybuchowe) | 8 godz. lekcyjnych | 15 pytań / 30 min | Już oznaczone w demo jako `scope: "specjalistyczny"` |
| Klasa 7 (promieniotwórcze) | 8 godz. lekcyjnych | 15 pytań / 30 min | Już oznaczone w demo jako `scope: "specjalistyczny"` |

---

## NASTĘPNY KROK

Masz dwie opcje kolejności wdrażania w kodzie:

1. **Wszerz** — dodać po 1-2 fakty z każdego brakującego bloku (1,3,4,5), żeby demo pokazywało
   pełen przekrój programu, ale płytko.
2. **W głąb** — dokończyć blok 1 i 2 w całości (bo są warte najwięcej punktów na egzaminie:
   4 z 7 godzin teorii), potem przejść do 3/4/5.

Rekomendacja: **w głąb, blok po bloku, w kolejności 1 → 2 → 4 → 5 → 3** (3 jest najmniejszy
i najmniej "śliski" merytorycznie — można zostawić na koniec).

Czekam na materiały do analizy (pkt 3) — jak trafią, zweryfikuję powyższą listę faktów względem
nich i oznaczę rozbieżności, zamiast zgadywać dalej z materiałów ogólnodostępnych.
