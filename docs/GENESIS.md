# GENESIS — GUARDIAN ENGINE

**v1.1** · 2026-07-24 · **kanoniczny** · zastępuje wszystkie `GUARDIAN_ENGINE_MASTER_KNOWLEDGE_v0_*`

---

## 0. BOOT — INSTRUKCJA DLA MODELU

> Ta sekcja to kontrakt, nie opis. Przeczytaj ją przed pierwszą odpowiedzią.

**Kim jesteś:** Lead Software Architect i Lead Engineer platformy Guardian Engine. Nie budujesz
funkcji — budujesz platformę, która ma ewoluować przez 10 lat. Myślisz w kategoriach architektury,
skalowalności, utrzymywalności i separacji domen.

**Zanim odpowiesz:**
1. Przeczytaj sekcje **A** (hierarchia, konstytucja, nazwy) — one rozstrzygają spory.
2. Sprawdź sekcję **F/OPEN** — jeśli temat tam jest, **zapytaj zamiast zgadywać**.
3. Sprawdź sekcję **E/DECYZJE** — nie proponuj rzeczy oznaczonych `wycofana`.

**Czego nie wolno:**
- Naruszyć zasad z A.3 (Konstytucja). To niezmienniki, nie preferencje.
- Pomylić trzech warstw hierarchii (A.1). Pomylenie ich kosztuje projekt.
- Zaproponować logiki domenowej w `core/`. Domena żyje w `apps/<produkt>/`.
- Wstawić AI tam, gdzie ma być Decision Engine (liczenie, decydowanie, trustLevel).

**Jak odpowiadać:** dla każdej decyzji architektonicznej podaj *dlaczego*, *zalety*, *tradeoffy*,
*skalowalność w przyszłości*. Nie implementuj bezmyślnie. Kwestionuj słabą architekturę, proponuj
lepsze warianty.

**Jak utrzymywać ten plik:** append-only. Nie kasujesz decyzji — przenosisz do G/ARCHIWUM ze
statusem `wycofana` i powodem. Nowa decyzja dostaje kolejny numer i status `aktywna`.

---

## SPIS TREŚCI

| Sekcja | Zawartość | Kiedy czytać |
|---|---|---|
| **0** | BOOT — instrukcja dla modelu | zawsze, pierwsza |
| **A** | FUNDAMENT — hierarchia, misja, konstytucja, mapa nazw | zawsze |
| **B** | ARCHITEKTURA — 5 silników, Trust Ladder, struktura repo | zawsze |
| **C** | MODEL DOMENOWY — encje, inwarianty, ADR-001…009 | przy pracy nad kodem |
| **D** | PRODUKTY — DriverOS, MasterADR, MasterDriver, MasterADHD, twarze (Franek/Max), dzienniki rozwoju | przy pracy nad produktem |
| **E** | DECYZJE — rejestr ADR (append-only) | przed każdą propozycją |
| **F** | STAN + OPEN — co działa, co nierozstrzygnięte | na starcie sesji |
| **G** | RYNEK, POTENCJAŁ, ARCHIWUM, INWENTARZ | na żądanie |

---

## A. FUNDAMENT

## A.1 HIERARCHIA TRÓJWARSTWOWA — NADRZĘDNE, NIE MYLIĆ

Kolejność trzech warstw jest sztywna. Pomylenie ich kosztuje projekt. To najważniejsza rama całego
dokumentu — wszystko poniżej się do niej odnosi.

```
Guardian Engine   ← SILNIK / fundament (pięć silników domenowych)
      ↓
DriverOS          ← PLATFORMA zbudowana na tym silniku (pierwsza implementacja)
      ↓
Master            ← WARSTWA PRODUKTÓW (marka kliencka: MasterADR, MasterDriver, MasterADHD …)
```

| Warstwa | Co to jest | Nazwa(y) |
|---|---|---|
| **Silnik (spód)** | Pięć silników domenowych (Knowledge / Context / Decision / Workflow / AI). Fundament, na którym wszystko stoi. | **Guardian Engine** |
| **Platforma (środek)** | Implementacja Guardian Engine dla konkretnej grupy. Pierwsza i jedyna dziś: DriverOS (kierowca zawodowy). W planie kolejne *OS. | **DriverOS** (+ przyszłe *OS) |
| **Produkty / marka (góra, klient)** | Warstwa produktów, którą widzi użytkownik. Wspólny prefiks **Master**. | **Master** (MasterADR, MasterDriver, MasterADHD …) |

**Trzy zdania, które muszą się zgadzać w całym dokumencie:**
1. **Guardian Engine to silnik**, nie nazwa projektu ani produktu. Jest na spodzie.
2. **DriverOS to platforma** (implementacja silnika dla kierowcy), nie produkt kliencki per se.
3. **Master to warstwa produktów** — najwyższa, kliencka. MasterADR żyje wewnątrz platformy DriverOS.
   **Marka Master może być szersza niż DriverOS** — MasterADHD (poza-transportowe) pokazuje, że
   Master nie jest przypisany na sztywno do jednej platformy; kolejne produkty Master (np. MasterTacho)
   mogą stać na innej platformie *OS na tym samym silniku Guardian Engine, albo poza rodziną *OS.

**Rozstrzygnięcie napięcia v0.6 ↔ MASTER_WIEDZA (2026-07-22):** to NIE była sprzeczność. v0.6 opisywał
Franka jako twarz kliencką i DriverOS jako parasol; MASTER_WIEDZA dołożył *ponad* tym warstwę marki
Master. Godzimy tak: **Franek** = twarz asystenta AI wewnątrz platformy DriverOS; **Master** = marka
parasolowa produktów, szersza niż DriverOS. MasterADR siedzi w DriverOS; MasterADHD to osobna apka na
tym samym silniku, poza DriverOS. Obie prawdy współistnieją — to hierarchia, nie konflikt.

---

---

## A.2 CZYM JEST GUARDIAN ENGINE

Guardian Engine to **platforma kontekstowej pomocy dla Europy** — silnik, na którym powstają produkty
pomagające człowiekowi nie być bezradnym wobec obcego prawa, procedur i sytuacji kryzysowych. To
**nie jest kolejna aplikacja z AI**. To warstwa fundamentu (pięć silników domenowych), na której
DriverOS jest dopiero *pierwszą* implementacją. Przyszłe platformy — TravelOS, FleetOS, MotoOS,
CamperOS — mają dzielić te same silniki i różnić się wyłącznie konfiguracją (manifest + paczki wiedzy
+ cienkie UI).

Zasada nadrzędna, powtarzana we wszystkich artefaktach: **Context first. Workflow over features.
Verified knowledge over AI.** Guardian nie odpowiada na pytania — Guardian rozwiązuje sytuacje,
odpowiadając na jedno pytanie: *„Co użytkownik powinien zrobić TERAZ?"*

---

---

## A.3 KONSTYTUCJA (Artefakt #0001)

**Misja:** aby człowiek nigdy nie był bezradny w obcym miejscu, wobec procedur, prawa lub sytuacji
kryzysowej. Nie zastępujemy człowieka — dajemy mu właściwą decyzję we właściwym czasie.

**Wizja:** pierwszy w Europie silnik kontekstowej pomocy (Contextual Assistance Engine). Nie kolejne
aplikacje — platforma, na której powstaną dziesiątki produktów. **Za 10 lat: standard kontekstowej
pomocy w Europie. DriverOS będzie pierwszą platformą — nie najważniejszą.**

**Filozofia produktu:** nigdy nie buduj ekranów — buduj workflowy. Nigdy nie buduj funkcji — buduj
rozwiązania. Każdy moduł odpowiada na „Co użytkownik powinien zrobić teraz?", nie „Jakie informacje
wyświetlić?".

### Zasady rdzenne (Core Principles)

| Zasada | Znaczenie operacyjne |
|---|---|
| **Context First** | Zrozum kontekst zanim wygenerujesz jakąkolwiek odpowiedź |
| **Workflow over Features** | Wszystko jest workflowem, nic nie jest izolowaną funkcją |
| **Offline First** | Krytyczne workflowy działają bez internetu |
| **Verified Knowledge First** | Wiedza prawna ma priorytet nad AI. AI może rozszerzać i objaśniać, nigdy zastępować |
| **AI Augments** | AI wspiera, nigdy nie jest źródłem prawdy |
| **Privacy by Design** | Minimum danych, szyfrowanie wrażliwych, GDPR od dnia pierwszego |
| **Modular Architecture** | Każdy moduł reużywalny przez przyszłe produkty. Żadnej logiki „tylko-DriverOS", chyba że absolutnie konieczna |
| **Every Incident Becomes Knowledge** | Każda kontrola/mandat/problem po anonimizacji zasila wiedzę systemu |

**Filtr modułu (test wejścia):** moduł powstaje tylko jeśli ✅ wpisuje się w workflow, ✅ zwiększa
przewagę platformy, ✅ da się użyć również w innych produktach. Jeśli nie — nie powstaje.

**Deklaracja metodyczna:** pracujemy jak startup. Każdy dokument ma numer wersji, jest spójny
z poprzednimi i rozwija jedną architekturę. To „Biblia Guardian Engine".

---

---

## A.4 KANONICZNA MAPA NAZW

Efekt porządkowania nazw 2026-07-21/22. Zastępuje wszystkie wcześniejsze niejednoznaczności. Każda
pozycja ma status i — gdzie dotyczy — historię nazw.

### A.4.1 Fundament / silnik — ZATWIERDZONE

| Nazwa kanoniczna | Co to jest | Status |
|---|---|---|
| **Guardian Engine** | Silnik nadrzędny, „Contextual Assistance Engine" (spód hierarchii) | Zatwierdzone |
| Knowledge Engine | 1 z 5 silników — przechowuje prawdę (wersjonowana, niemutowalna) | Zatwierdzone |
| Context Engine | 1 z 5 silników — buduje SituationContext, ustala fakty, nigdy nie wnioskuje | Zatwierdzone |
| Decision Engine | 1 z 5 silników — deterministyczny rule engine, **nigdy AI** | Zatwierdzone |
| Workflow Engine | 1 z 5 silników — orkiestrator, jedyny znający wszystkie porty | Zatwierdzone |
| AI Engine | 1 z 5 silników — RAG/OCR/tłumacz/głos, usługa, **nigdy źródło prawdy** | Zatwierdzone |

### A.4.2 Platformy *OS (środek) i marka Master (góra) — ZATWIERDZONE

```
Guardian Engine (silnik)
   ↓
Platformy *OS:                          Marka produktów Master:
  DriverOS  (v1 — kierowca, w budowie)    MasterADR   (w DriverOS — najdalej)
  TravelOS  (turysta — plan)              MasterDriver(w DriverOS — prototyp działa)
  FleetOS   (flota — plan)                MasterADHD  (poza DriverOS — koncept)
  MotoOS    (motocyklista — plan)         MasterTacho (możliwe przyszłe)
  CamperOS  (kamper/vanlife — plan)       …
```
Każda platforma = ten sam silnik, inny manifest + paczki + UI. Zasada niezmienna: **żadna domenowa
linia kodu w `core/`, tylko w `apps/<produkt>/`.** Marka Master siada na platformach (transportowe
w DriverOS) lub poza nimi (MasterADHD) — spójnik to silnik Guardian Engine + prefiks „Master".

### A.4.3 Moduł nauki ADR — ewolucja nazw ZAMKNIĘTA, nazwa kanoniczna: **MasterADR**

| Nazwa | Status |
|---|---|
| ADR Duolingo | Historyczna — pierwszy placeholder, porzucony (pożyczał cudzą markę, ryzyko prawne) |
| Master ADR (ze spacją) | Historyczna — etap pośredni propozycji brandu |
| Trener ADR / ADR Trainer / `AdrTrainer218.jsx` | Historyczna — nazwa prototypu/pliku |
| **MasterADR** | **✅ ZATWIERDZONA — nazwa kanoniczna, ewolucja zamknięta 2026-07-21** |

MasterADR to główny produkt marki Master (dziś najdalej posunięty): grywalizowana mikronauka wiedzy
ADR — silnik retencji styl Duolingo + architektura treści styl SoloLearn, własna baza pytań, silnik
powtórek Leitner (→ docelowo adaptacyjny).

### A.4.3b Rozstrzygnięcie nazewnicze — FRANEK / DriverOS / MasterADR / Master

| Nazwa | Rola | Widoczność dla klienta |
|---|---|---|
| **Franek** | Twarz kliencka asystenta AI wewnątrz DriverOS („czat z Frankiem") — imię, ciepłe, personifikowane | ✅ Klient to widzi — twarz asystenta |
| **DriverOS** | Platforma (implementacja silnika dla kierowcy); nazwa robocza/architektoniczna | ❌ Klient jej zwykle nie widzi |
| **MasterADR** | Produkt marki Master (moduł nauki ADR) wewnątrz DriverOS | ✅ Nazwa produktu |
| **Master** | Marka parasolowa produktów, szersza niż DriverOS | ✅ Prefiks marki |

W warstwie technicznej (Artefakt #0006) **Franek = twarz kliencka wołająca bezosobowy silnik
Wiedza AI**. Wzorzec: jeden silnik, wiele twarzy; Franek jest pierwszą twarzą. Franek nie może
podnieść trustLevel ani obejść T4.

**Aktualizacja statusu Franka (v0.8):** „Franek słucha, jeszcze nie odpowiada" opisywało **etap 1**
(zbieracz uwag, sekcja 9.2) — nie stan docelowy. Aby domknąć #0006, Franek wchodzi w **etap 2:
odpowiada w zamkniętej pętli** (RAG podaje chunk → Franek streszcza *tylko* z niego → mierzymy
wierność golden setem, 156 parafraz, hit@3=0,82). Bez odpowiadającego Franka nie da się testować
faithfulness. To następny etap tej samej twarzy, nie zmiana roli: uczciwa granica T4 i deterministyczny
trustLevel obowiązują dalej.

### A.4.3c Max — twarz asystenta MasterADHD (NOWE w v0.8)

| Nazwa | Rola | Widoczność dla klienta |
|---|---|---|
| **Max** | Twarz kliencka asystenta AI w **MasterADHD** — imię, personifikowane, spokojny przewodnik | ✅ Klient to widzi — twarz asystenta |
| **MasterADHD** | Produkt marki Master (domena poza-transportowa), poza DriverOS | ✅ Nazwa produktu |

Max jest do Franka jak twarz do twarzy: **oba to twarze asystenta na silniku Guardian Engine**, ale
w różnych domenach i o różnym stopniu swobody. Pełna analiza koncepcyjna — sekcja 8.7.

**Asymetria Franek ↔ Max (ustalona 2026-07-22) — świadoma, wynika z natury domen:**

| | **Franek (MasterADR)** | **Max (MasterADHD)** |
|---|---|---|
| Domena | Wiedza ADR — fakty, przepisy | Stan wewnętrzny — energia, emocja |
| Źródło prawdy | Zewnętrzne (RAG, zweryfikowana baza) | Wewnętrzne (to, co user właśnie nazwał) + mapa z historii |
| Stopień swobody | **Związany źródłem** — swoboda = ryzyko (mandat/sąd) | **Rozwiązany rozmową** — sztywność = porażka (regułka odbija się od usera) |
| Główne ryzyko | Halucynacja faktu (T4 jako bezpiecznik) | Nietrafiona interwencja + urwana ciągłość rozmowy |
| Rdzeń dziś (prototyp) | RAG + streszczenie z chunka | Deterministyczny rule engine `energia × emocja → akcja` |
| Stan | Etap 2 — zaczyna odpowiadać (do testów) | Już odpowiada (prototyp klikalny) |

Zasada na tym etapie: **nie ograniczamy żadnej z twarzy** — obie są na początku drogi. Idziemy od
szczegółu do ogółu; wzorzec „jeden silnik, wiele twarzy" jest obserwacją, nie sztywną regułą (8.3, 8.7).

### A.4.4 CITADEL — USUNIĘTE z drzewa Guardian Engine

**Decyzja 2026-07-21:** CITADEL, Driver's Shield i DIETA-ENGINE nie są częścią stosu Guardian Engine
/ DriverOS / Master. CITADEL to osobny, prywatny poligon nauki projektowania z AI — nie produkt ani
zależność architektoniczna. Nazwy mogły się nakładać przez wspólne środowisko powstawania, ale to
odrębny byt. **Wszystkie odniesienia do CITADEL/Driver's Shield/DIETA-ENGINE w poprzednich wersjach
(w tym „zależność Node/Git blokuje moduły CITADEL") dotyczyły tamtego poligonu — nieaktualne dla
Guardian Engine.** Jeśli w starszych plikach (`MasterADR_WIEDZA_PROJEKTU.md` i in.) pojawia się
CITADEL — to ślad tej samej pomyłki nazw, do wglądu historycznego, nie do planowania.

### A.4.5 Koncepty nowe — status

| Nazwa | Co to jest (dziś) | Status |
|---|---|---|
| **Wiedza AI** | **Silnik RAG wewnątrz MasterADR** (nie: szósty silnik platformy). Bezosobowy: retrieval + deterministyczny trustLevel + cytat + mini-test z gotowych `q.*`. | 🟢 **ROZSTRZYGNIĘTE — Artefakt #0006 (8.6), 5 ADR-ów; 006-C zmierzone (hit@3=0,82)** |
| **Franek** | Twarz kliencka MasterADR, woła silnik Wiedza AI i ubiera wynik w rozmowę. Etap 1 = zbieracz uwag; **etap 2 (v0.8) = odpowiada w zamkniętej pętli** (warunek testowania faithfulness). | 🟢 Zatwierdzone (2.3b) + rola w #0006; przechodzi do etapu „odpowiada" |
| **Max** | Twarz kliencka **MasterADHD**. Spokojny przewodnik: nazwanie stanu → jedna mikroakcja → domknięcie pętli. Rdzeń dziś deterministyczny; architektura (LLM vs reguły) do przetestowania. | 🔶 **NOWE (v0.8)** — koncepcja rozwinięta (8.7), prototyp klikalny; dwa warianty architektury do prototypowania |
| **RoboUmowaADR** | Robocza nazwa klasy „twarz zamknięta na jedno źródło" — analiza schematu Wiedzy AI (8.5). Merytorycznie = Franek. | 🟢 Przeanalizowane (8.5) |
| **DriverOS AI Coach** | Wizja: jeden silnik AI dla kierowcy w trasie (Tacho/Inspector/Mentor/Risk/Knowledge AI). | 🔶 Zaparkowane — wzorzec ustalony: persony = twarze wołające silnik Wiedza AI (jak Franek), nie osobne silniki RAG (8.2/8.3) |
| „Guardian Knowledge Engine" | Nazwa z wizji AI Coach na „AI ma własną bazę" | ⚠️ NIE używać — koliduje z silnikiem Knowledge Engine (2.1). Silnik nazywa się **Wiedza AI** |

### A.4.6 Tryb „przed kontrolą" — workflow DriverOS

**Decyzja 2026-07-21:** Tryb przed kontrolą jest **workflowem DriverOS** (roboczo
`PreInspection_Check` w Workflow Engine), nie osobną „osobowością AI" ani produktem. Treść, UX
i zakres pytań — do dopracowania w osobnej sesji; miejsce w architekturze ustalone: workflow, nie
nowy silnik ani nowy byt nazewniczy.

---
---

## B.1 ARCHITEKTURA PLATFORMY — PIĘĆ SILNIKÓW

```
┌─────────────────────────────────────────────────────┐
│               GUARDIAN ENGINE                        │
│  ┌────────────┐   ┌────────────┐   ┌─────────────┐  │
│  │ KNOWLEDGE  │   │  CONTEXT   │   │  DECISION   │  │
│  │  (prawda)  │   │ (sytuacja) │   │  (reguły)   │  │
│  └─────┬──────┘   └─────┬──────┘   └──────┬──────┘  │
│        │ port           │ port            │ port     │
│        ▼                ▼                 ▼          │
│  ┌──────────────────────────────────────────────┐   │
│  │        WORKFLOW  (orkiestracja)              │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │ port                       │
│                   ┌─────▼─────┐                      │
│                   │    AI     │  (usługa, nie prawda)│
│                   └───────────┘                      │
└─────────────────────────────────────────────────────┘
                        ▼
          DriverOS (platforma) → produkty Master
      ↓ przyszłe platformy: TravelOS · FleetOS · MotoOS · CamperOS
```

### Definicje silników

**Knowledge Engine** — przechowuje prawdę: prawa, procedury, karty ratunkowe, kontakty, FAQ,
metadane, źródła, wersje, datę weryfikacji. Wiedza **wersjonowana i niemutowalna** (poprawka = nowa
wersja). Wiedza bez metadanych/źródła nie istnieje.

**Context Engine** — buduje `SituationContext` z faktów: kraj, język, GPS, profil, online/offline,
pojazd, bieżący workflow, stan incydentu. **Ustala fakty, nigdy nie wnioskuje** (ADR-004). AI nigdy
nie dostaje surowego pytania — dostaje pełny kontekst.

**Decision Engine** — deterministyczny rule engine, **nigdy AI**.
`IF kraj=Niemcy AND workflow=Inspection THEN Inspection_DE`. 100% testowalny, powtarzalny (test
determinizmu 1000×).

**Workflow Engine** — orkiestrator. Jedyny silnik, który zna wszystkie porty. Wszystko jest
workflowem: Kontrola → Prawa → Tłumacz → AI → OCR → Raport → Historia.

**AI Engine** — RAG, OCR, tłumaczenie, głos, analiza dokumentów, generowanie raportów. Zawsze dostaje
Workflow + Knowledge + Context + History. **Nigdy sam prompt użytkownika.** Nigdy nie nadaje sobie
trustLevel, nie wymyśla sygnatur prawnych, nie decyduje o przejściach workflow.

### Trust Ladder — poziomy zaufania i kanoniczna formuła T4

Każda odpowiedź AI dostaje poziom: **T1** zweryfikowane · ~~**T2** wymaga aktualizacji~~ (wycofany,
patrz niżej) · **T3** parafraza AI na bazie źródła (niezweryfikowana ludzko) · **T4** brak pokrycia
w źródle. `trustLevel` nadaje **warstwa deterministyczna**, nigdy LLM.

> ⚠️ **ZMIANA v1.1 — model dwuosiowy (ADR-003 v2, 2026-07-23, ZAAKCEPTOWANY).**
> **T2 VERIFIED_STALE jest wycofany.** `trustLevel` **nie jest już degradowany upływem czasu**.
> Aktualność opisuje osobna oś `currency` (`CURRENT` / `STALE` / `LAPSED` / `DRIFTED`).
>
> **Powód:** przy sklejonych osiach dwa jakościowo różne stany dostawały tę samą etykietę T2 —
> `LAPSED` (minął rok od przeglądu, nic nie wskazuje na zmianę prawa) i `DRIFTED` (watcher wykrył
> zmianę przepisu albo źródło milczy >14 dni). Dwa różne poziomy ryzyka, jeden komunikat.
>
> **Dwie osie:**
> - `trustLevel` = **skąd to wiem** (source / verifiedBy) — nie degradowany zegarem
> - `currency` = **czy nadal aktualne** (zegar + watcher) — egzekwowana bramkami kanałowymi
>
> **UI dostaje JEDEN złożony sygnał** przez `displaySignal()`, nie dwie osie. Teksty w 5 językach:
> `i18n/signals.json` (Zweryfikowane / Stan na {date} / Bez przeglądu / Wskazówka AI — nie porada
> prawna / Treść wstrzymana / Niedostępne offline).
>
> **Zmierzony efekt na 239 wpisach:** T2 216→0, T1 15→231. Bramki bez zmian — te same 216 wpisów
> nadal blokowane w paczce offline, **bezpieczeństwo dystrybucji nie ucierpiało**.
>
> **Ścieżka powrotu:** `policy.json > trustLadderCompat.mapCurrencyToT2 = true` przywraca stare
> zachowanie (nie jest już modelem kanonicznym).
> Pełne uzasadnienie: `ADR-003-v2-model-dwuosiowy.md` w paczce `guardian-knowledge-v2`.

**Kanoniczne brzmienie T4 (fallback)** — zamiast gołego „nie wiem" lub zgadywania:
> „**To nie wynika wprost ze źródła, dlatego nie potrafię odpowiedzieć.** Przyjmuję to jako
> zgłoszenie (Franek) → luka trafia do rozwoju AI."

Trzy niezmienniki formuły T4, wspólne dla MasterADR (Franek), RoboUmowaADR i przyszłego AI Coach:
1. **Uczciwa granica źródła** — jawne „to nie wynika ze źródła", nie „nie wiem" i nie zgadywanie.
2. **Klaryzacja** — gdzie się da, formuła wskazuje, czego konkretnie brakuje i co JEST obok.
3. **Pętla produktowa** — Franek przyjmuje zgłoszenie; luka staje się wejściem Knowledge Pipeline
   (kandydat na nowy `KnowledgeVersion`). T4 nigdy nie jest ślepą uliczką — napędza rozwój bazy.

„Franek" to twarz kliencka (persona). W torze RoboUmowaADR i AI Coach tę samą rolę pełni twarz
danego produktu — mechanizm (uczciwa granica + zgłoszenie + rozwój) jest identyczny niezależnie od
imienia.

---

---

## B.2 PLATFORM SPECIFICATION (Artefakt #0003) — ADR-004…009

**ADR-009: Produkt = manifest + paczki + cienkie UI** (TASK 7) — `ProductManifest` (capabilities,
modules, workflowPackages, knowledgePackages, branding, featureFlags, permissions, offlinePackages,
regionSupport). **Silniki nigdy nie czytają manifestu.** Definition of done platformy: **kolejna
platforma *OS bez ani jednej linii w `core/`.**

**Architecture Review** (TASK 8) — znaleziska:
- **Z-01:** Workflow Engine budował własny SituationContext (realny bug: hardcoded `language:"en"`)
  → CI-gate z dependency-cruiser.
- **Z-02:** reguła wskazuje nieistniejący workflow `ADR_Check_DE` → wiszący wskaźnik, do
  usunięcia/cross-walidacji.
- Ryzyka monolitu: `shared/types/index.ts` (God-module → podział), Workflow Engine (God Object →
  rejestr executorów), Context (pokusa inferencji → checklista review).
- Najsłabszy punkt: **AI Engine 21% pokrycia** z mockiem niezwiązanym kontraktem.
- Konflikt reguł „tylko warn" łamie Domain Model §4 — zamienić na **twardy błąd** przy publikacji.

### Struktura repo (docelowa)
```
guardian-engine/
  apps/
    driver-os/            # tylko UI + katalog workflowów + manifest.ts
  core/
    knowledge/            # KnowledgeEntry, Version, EmergencyCard, porty
    context/              # SituationContext, resolvery
    decision/             # rule engine, deterministyczny, 100% testów
    workflow/             # Definition, Instance, Incident, orkiestracja
    ai/                   # AIRequest, adaptery (RAG/OCR/tłumacz), NIGDY prawda
    index.ports.ts        # kontrakty (re-export portów per kontekst)
  shared/
    types/                # CountryCode, LanguageCode, TrustLevel, Ids…
    storage/              # szyfrowany store lokalny, OfflinePackage
  packages/               # przyszłe: travel-os, fleet-os reużywają core/
  docs/  scripts/
```
Zasada: wszystko domenowe żyje w `core/` i `shared/`. W `apps/driver-os/` — zero encji domenowych,
tylko rendering stanu WorkflowInstance.

---
---

## C. MODEL DOMENOWY (Artefakt #0002 — pełny)

> **Odzyskane w GENESIS v1.0.** Ta warstwa istniała w Artefakcie #0002 i w Master Knowledge v0.1,
> ale wypadła z konsolidacji v0.2–v0.11 (tam został tylko skrót „trzy fundamentalne decyzje").
> Bez niej nie da się pisać kodu zgodnego z architekturą. Przywrócona w całości.

### C.0 ADR-y fundamentalne (rdzeń Domain Model)

- **ADR-001 — Graph not Pipeline.** Silniki nie łączą się liniowo; Workflow odpytuje
  Knowledge/Context/Decision wielokrotnie w jednym workflowie. Silniki są usługami w grafie
  zależności, nie łańcuchem.
- **ADR-002 — Versioned not Immutable.** Wersje są niemutowalne; wpisy to wersjonowane kontenery.
  Stare incydenty pokazują, która wersja prawa obowiązywała (dowodowość).
- **ADR-003 — Trust Ladder.** Jawne T1–T4, UI zawsze oznacza źródło. Pełna definicja: B.1.

### C.0b Bounded Contexts

Pięć kontekstów = pięć granic pakietów w `core/`: Knowledge, Context, Decision, Workflow, AI.

### C.0c Co model gwarantuje za 2 lata

1. TravelOS = nowe WorkflowDefinitions + nowa paczka wiedzy. **Zero zmian w silnikach.**
2. Zmiana przepisu = nowa KnowledgeVersion. Stare raporty nietknięte i dowodowe.
3. Audyt GDPR = Consent per zgoda, PII szyfrowane, pętla wiedzy tylko po anonimizacji.
4. Odwołanie od mandatu = Incident wskazuje dokładne wersje przepisów pokazane kierowcy.
5. AI wymienialne w jeden dzień — to adapter za portem, nie fundament.

### C.0d Reguły zależności (nienegocjowalne)

- **SituationContext** — składany równolegle z resolverów, `Object.freeze`, budowa < 50 ms.
  Sygnał nierozstrzygalny = `null`, **nigdy zgadywanie**.
- **WorkflowInstance** → cykl życia `ACTIVE → SUSPENDED → COMPLETED` / `ABANDONED`.
  **ABANDONED też może rodzić Incident** (przerwana kontrola bywa najcenniejszym dowodem).
- **Incident** — dowód samowystarczalny: dostaje **kopię** danych (contextSnapshot, knowledgeUsed[],
  trustLevels, decisionIds). Retencja w latach / do żądania usunięcia PII.

---

## C.1 Mapa domeny (Bounded Contexts)

Pięć kontekstów. Granice kontekstów = granice pakietów w `core/`.

```
┌─────────────────────────────────────────────────────┐
│                  GUARDIAN ENGINE                     │
│                                                      │
│  ┌────────────┐   ┌────────────┐   ┌─────────────┐  │
│  │ KNOWLEDGE  │   │  CONTEXT   │   │  DECISION   │  │
│  │  (prawda)  │   │ (sytuacja) │   │  (reguły)   │  │
│  └─────┬──────┘   └─────┬──────┘   └──────┬──────┘  │
│        │ port           │ port            │ port     │
│        ▼                ▼                 ▼          │
│  ┌──────────────────────────────────────────────┐   │
│  │        WORKFLOW  (orkiestracja)              │   │
│  └──────────────────────┬───────────────────────┘   │
│                         │ port                       │
│                   ┌─────▼─────┐                      │
│                   │    AI     │ (usługa, nie prawda) │
│                   └───────────┘                      │
└─────────────────────────────────────────────────────┘
```

Reguły zależności:

1. Knowledge, Context, Decision, AI **nie znają się nawzajem**.
2. Tylko Workflow zna wszystkie porty.
3. Produkty (DriverOS) znają tylko Workflow + katalog workflow'ów.
4. UI zna tylko stan WorkflowInstance. Nigdy silniki bezpośrednio.

---

## C.2 Encje — Knowledge Context

### KnowledgeEntry (agregat)

Logiczny wpis wiedzy. Kontener wersji.

```
KnowledgeEntry
  id            : KnowledgeId
  domain        : enum (TRAFFIC_LAW, CUSTOMS, EMERGENCY, ADR, CABOTAGE, ...)
  country       : CountryCode        // ISO 3166-1
  scope         : enum (NATIONAL, EU, REGIONAL)
  tags          : Tag[]
  versions      : KnowledgeVersion[] // min. 1
  currentVersion: VersionId          // wyliczane, nie przechowywane ręcznie
```

### KnowledgeVersion (niemutowalna)

```
KnowledgeVersion
  id               : VersionId
  entryId          : KnowledgeId
  language         : LanguageCode
  content          : StructuredContent   // patrz §6
  source           : Source              // wymagane, min. 1
  confidence       : enum (OFFICIAL, VERIFIED, COMMUNITY)
  effectiveDate    : Date                // od kiedy przepis obowiązuje
  validUntil       : Date?               // null = bezterminowo
  verifiedAt       : DateTime
  verifiedBy       : VerifierId
  nextReviewDue    : Date                // po tej dacie → trustLevel T2
  supersededBy     : VersionId?
  checksum         : Hash                // integralność paczki offline
```

**Inwarianty:**
- Wersja bez `source` nie istnieje (Handbook: "Knowledge without metadata does not exist").
- Wersja raz opublikowana nigdy nie jest edytowana. Poprawka = nowa wersja.
- `content` nigdy nie jest generowany przez AI. AI może *proponować* draft, człowiek weryfikuje i publikuje.

### Source (value object)

```
Source
  type        : enum (LAW_TEXT, OFFICIAL_SITE, GOVERNMENT_API, EXPERT)
  reference   : string   // Dz.U., §, URL, sygnatura
  retrievedAt : DateTime
```

### EmergencyCard (agregat)

Specjalizacja wiedzy o najostrzejszym reżimie: **musi działać offline, zawsze, w każdej wersji aplikacji**.

```
EmergencyCard
  id          : CardId
  country     : CountryCode
  type        : enum (POLICE_STOP, ACCIDENT, MEDICAL, CONSULATE, RIGHTS)
  content     : StructuredContent
  contacts    : Contact[]      // 112, konsulat, lokalne numery
  offlineTier : TIER_0         // patrz §7 — zawsze najwyższy priorytet
```

---

## C.3 Encje — Context Context

### SituationContext (value object, efemeryczny)

Kontekst **nie jest przechowywany**. Jest budowany na żądanie i wersjonowany snapshotem w incydencie.

```
SituationContext
  timestamp      : DateTime
  location       : GeoPoint?          // null gdy brak zgody/GPS
  resolvedCountry: CountryCode        // z GPS lub deklaracji użytkownika
  language       : LanguageCode
  connectivity   : enum (ONLINE, OFFLINE, DEGRADED)
  userProfile    : UserProfileRef
  vehicle        : VehicleRef?
  activeWorkflow : WorkflowInstanceId?
  incidentState  : IncidentRef?
```

**Inwariant:** AI Engine nigdy nie otrzymuje surowego promptu użytkownika. Otrzymuje `AIRequest = { prompt, SituationContext, KnowledgeVersion[], WorkflowStep, History }`.

### UserProfile / Vehicle

```
UserProfile
  id             : UserId
  type           : enum (PRO_DRIVER, TRAVELER, FLEET_DRIVER, RIDER, CAMPER)
  languages      : LanguageCode[]
  homeCountry    : CountryCode
  consents       : Consent[]        // GDPR: każda zgoda osobno, z datą

Vehicle
  id        : VehicleId
  category  : enum (TRUCK, VAN, CAR, MOTORCYCLE, CAMPER)
  adrClass  : ADRClass?
  plates    : EncryptedString      // dane wrażliwe — szyfrowane lokalnie
```

---

## C.4 Encje — Decision Context

### Rule (deterministyczna, wersjonowana jak wiedza)

```
Rule
  id          : RuleId
  priority    : int
  conditions  : Condition[]      // country, workflow, event, vehicle, ...
  outcome     : Outcome          // wskazuje WorkflowDefinition lub trustLevel
  version     : SemVer
```

**Inwarianty:**
- Zero LLM. Zero prawdopodobieństwa. Rule engine musi dawać identyczny wynik dla identycznego wejścia — 100% testowalne (Handbook: Decision Engine 100% coverage).
- Konflikt reguł rozstrzyga `priority`; remis = błąd walidacji przy publikacji reguł, nie w runtime.

---

## C.5 Encje — Workflow Context

### WorkflowDefinition (statyczna, część paczki wydania)

```
WorkflowDefinition
  id       : WorkflowDefId       // np. Inspection_DE
  version  : SemVer
  steps    : StepDefinition[]
  entry    : StepId
  offlineCapable : bool          // walidacja: krytyczne muszą = true
```

### StepDefinition

```
StepDefinition
  id          : StepId
  kind        : enum (SHOW_KNOWLEDGE, COLLECT_INPUT, AI_ASSIST,
                      OCR, TRANSLATE, CAPTURE_PHOTO, GENERATE_REPORT,
                      EMERGENCY_CARD, DECISION_POINT)
  requires    : Capability[]     // np. CAMERA, NETWORK, GPS
  fallback    : StepId?          // obowiązkowy, gdy requires zawiera NETWORK
  next        : Transition[]
```

**Inwariant:** krok wymagający sieci **musi** mieć `fallback`. Walidowane przy budowie paczki, nie w runtime. To jest Offline First zamienione w regułę kompilacji.

### WorkflowInstance (agregat, stan użytkownika)

```
WorkflowInstance
  id             : InstanceId
  definitionId   : WorkflowDefId + version
  state          : enum (ACTIVE, SUSPENDED, COMPLETED, ABANDONED)
  currentStep    : StepId
  contextSnapshot: SituationContext     // zamrożony na starcie
  stepHistory    : StepRecord[]
  createdAt / updatedAt
```

### Incident (agregat, dokument dowodowy)

```
Incident
  id              : IncidentId
  workflowInstance: InstanceId
  occurredAt      : DateTime
  location        : GeoPoint?
  country         : CountryCode
  attachments     : Attachment[]        // zdjęcia, OCR, nagrania
  knowledgeUsed   : VersionId[]         // KTÓRE wersje przepisów pokazano
  trustLevels     : TrustLevel[]        // czego użyto: T1? T3?
  report          : Report?
  anonymizedAt    : DateTime?           // → §8, pętla wiedzy
```

**Inwariant:** `knowledgeUsed` jest obowiązkowe. Raport bez wskazania wersji przepisów nie jest dowodem.

---

## C.6 StructuredContent — format treści

Treść wiedzy nie jest markdown-blobem. Jest strukturą, żeby workflow mógł renderować "co robić TERAZ":

```
StructuredContent
  summary     : Text            // 1 zdanie: co robić
  actions     : ActionItem[]    // kroki, w kolejności
  rights      : Text[]          // twoje prawa
  warnings    : Text[]          // czego NIE robić
  details     : Text            // pełna treść, dla spokojniejszej chwili
  legalRefs   : Source[]
```

To wprost realizuje UX z Handbooka: pod stresem max 2 tapnięcia, 1 decyzja, 5 sekund do informacji krytycznej. `summary` + `actions[0]` to jest te 5 sekund.

---

## C.7 Offline — model paczek

```
OfflinePackage
  country   : CountryCode
  tier      : enum
     TIER_0  // EmergencyCards + kontakty — ZAWSZE, wbudowane w apkę
     TIER_1  // workflow'y krytyczne + wiedza dla kraju użytkownika
     TIER_2  // kraje sąsiednie / trasa
  versions  : VersionId[]
  checksum  : Hash
  builtAt   : DateTime
```

Synchronizacja: delta po `VersionId`, nigdy pełny re-download. Konflikt niemożliwy z definicji — wersje są niemutowalne (ADR-002 się spłaca).

---

## C.8 Pętla wiedzy (Every Incident Becomes Knowledge)

```
Incident (COMPLETED)
   ↓  anonimizacja (usunięcie PII, rozmycie geo do poziomu regionu)
AnonymizedIncident
   ↓  agregacja (min. N incydentów, żeby nie dało się zidentyfikować)
KnowledgeCandidate
   ↓  weryfikacja przez człowieka
KnowledgeVersion (nowa, confidence = COMMUNITY lub VERIFIED)
```

**Inwariant:** żaden incydent nie zasila wiedzy bez anonimizacji ORAZ ludzkiej weryfikacji. AI może klastrować kandydatów — nigdy publikować.

---
---

## D. PRODUKTY, TWARZE I KONCEPTY


---

## D.1 MARKA MASTER — PRODUKTY

| Produkt | Domena | Platforma | Status |
|---|---|---|---|
| **MasterADR** | Nauka ADR dla kierowców zawodowych (grywalizowana mikronauka) | DriverOS | **Najdalej** — 239 faktów, prototyp klikalny `MasterADR-prototyp-v2.html`, testowany w Chromie |
| **MasterDriver** | Szersza nauka kierowcy (czas pracy, tachograf, pierwsza pomoc, eco driving, załadunek, mocowanie) | DriverOS | **Działający prototyp wielomodułowy** (`MasterDriver-prototyp-v2-6.html`) — ~296 pozycji, sklep/paywall, moduły darmowe (Tachograf, Eco-driving) vs płatne (ADR), Franek-zbieracz. Patrz D.4 |
| **MasterADHD** | Domena **poza-transportowa** (wsparcie/nauka dla osób z ADHD) | **poza DriverOS** — osobna apka na tym samym silniku | Koncept — dowód, że marka Master wychodzi poza transport |
| MasterTacho i inne | możliwe przyszłe wydania | do ustalenia | Hipoteza |

**Wzorzec nazewniczy:** „Master" + obszar. Marka parasolowa dobierana per domena; produkty
transportowe siadają na platformie DriverOS, produkty poza-transportowe (MasterADHD) mogą siąść na
innej platformie *OS lub poza rodziną *OS — wspólny jest silnik Guardian Engine i marka Master.
MasterADHD jest osobną apką od DriverOS, ale wzorowaną na MasterADR (ten sam silnik retencji + wzorzec
treści). To kluczowy dowód, że Master ≠ DriverOS: marka jest szersza niż jedna platforma.

### D.1.1 DriverOS — platforma (pozycjonowanie)
**Cel:** chronić kierowcę zawodowego. **Moduły obecne:** Emergency, Advisor, Rights, Emergency
Contacts, Offline Knowledge. **Moduły przyszłe:** Incident, OCR, Timeline, Voice, Translator,
MasterADR (nauka), Cabotage, Compliance.

Prototyp klikalny (`DriverOS.jsx`) wierny Domain Model: silniki in-memory, UI po polsku, treść
niemiecka (kraj kontroli) + podpis PL, czat AI (Franek) jako symulacja **na bazie wiedzy** (T3
z źródłem), nie „wie wszystko". Realne dane: prawa kierowcy (StVO §36), zasady kontroli DE, dokumenty
TIR, zwroty PL↔DE. **Franek** — twarz kliencka asystenta („gadam z Frankiem"): woła silniki i ubiera
wynik w rozmowę; nie może podnieść trustLevel ani obejść T4.

### D.1.2 MasterADR — czym jest merytorycznie
Grywalizowana mikronauka wiedzy ADR: **silnik retencji styl Duolingo + architektura treści styl
SoloLearn**, na **własnej bazie pytań** (nie oficjalny katalog). Differentiator: silnik powtórek
(Leitner → docelowo adaptacyjny). Baza: **239 faktów** (2026-07-22) z tagami źródła (kompendium ADR
2023 / research ext-2025) i `verifiedBy` — klasyfikacja, UN, oznakowanie, dokumenty przewozowe,
wyliczenie 1000 punktów, towary dużego ryzyka, procedury powypadkowe, zmiany ADR 2025 (baterie
sodowo-jonowe UN 3551/3558, pojazdy UN 3556–3558, LQ).

---

---

## D.2 KONCEPTY I ANALIZY

### D.2.1 Wiedza AI — silnik RAG wewnątrz MasterADR (ROZSTRZYGNIĘTE #0006)
Bezosobowy silnik RAG nad wersjonowaną bazą faktów ADR: retrieval + deterministyczny trustLevel +
cytat źródła + mini-test z gotowych `q.*` na końcu każdej odpowiedzi (zamienia wiedzę w naukę).
Zgodny z Verified Knowledge First. **Nie jest szóstym silnikiem platformy** — to komponent wewnątrz
MasterADR, „usługa" w rozumieniu AI Engine. Pełne rozstrzygnięcie: sekcja 8.6 (Artefakt #0006).

**Wzorzec „jeden silnik, wiele twarzy":** Wiedza AI (silnik) ↔ Franek (twarz kliencka MasterADR).
RoboUmowaADR to robocza nazwa tej samej klasy twarzy (asystent zamknięty na jedno źródło).

### D.2.2 DriverOS AI Coach — zaparkowane, osobna analiza
Wizja: jeden silnik AI, wiele „osobowości" dla kierowcy w trasie — Tacho AI (limity czasu jazdy,
przerwy, kary, symulacje), Inspector AI (symulacja kontroli głosowej), Mentor AI (feedback po
trasie), Risk AI (proaktywne ostrzeżenia), Knowledge AI (odpowiedzi + mini-testy), plus workflow
Tryb przed kontrolą.

**Zastrzeżenie architektoniczne (nienegocjowalne):** wszystko, co liczy (limity czasu jazdy, przerwy,
kary — rozporządzenie 561/2006, AETR, Pakiet Mobilności) musi żyć w **Decision Engine** jako
deterministyczny rule engine, **nigdy w AI Engine/LLM**. AI wyjaśnia i uczy, nigdy nie liczy ani nie
decyduje. Persony Coacha = twarze wołające ten sam silnik Wiedza AI (jak Franek), nie osobne silniki
RAG. „Osobowości" prawdopodobnie powinny być **workflowami** — do rozstrzygnięcia w osobnej sesji.

### D.2.3 Relacja Wiedza AI ↔ AI Coach — ROZSTRZYGNIĘTE
**Osobne byty.** RoboUmowaADR (Wiedza AI) = komponent wewnątrz MasterADR; DriverOS AI Coach = osobna
wizja wewnątrz DriverOS. Nie scalamy nazw ani nie budujemy wspólnej marki — złamałoby to granicę
produktową i filtr modułu. Rozważano scalenie (Coach = Wiedza AI = RoboUmowaADR); **użytkownik
wycofał ten pomysł.** Jeśli kiedyś podzielą warstwę RAG, to na poziomie reużywalnego silnika Wiedza AI
(AI Engine), nie wspólnej marki. Wzorzec: jeden silnik, wiele twarzy; produkty rozdzielone.

**Przeformułowanie wzorca „jeden silnik, wiele twarzy" (v0.8) — obserwacja, nie sztywna reguła.**
Max (8.7) pokazał, że twarze różnią się nie tylko imieniem i tonem, ale **rozkładem pięciu silników**:
Franek stoi na Knowledge+AI/RAG, Max na Decision (reguły) + AI opcjonalnie. To wciąż jeden Guardian
Engine — ale trafniejsze sformułowanie brzmi: **„wiele twarzy, każda z własną konfiguracją pięciu
silników".** Dowodzi to, że architektura silnikowa skaluje na różne domeny — co było obietnicą
konstytucji. Zasada na tym etapie: **nie ograniczamy twarzy z góry** (od szczegółu do ogółu); wzorzec
dopracujemy, gdy Franek i Max dojrzeją.

### D.2.4 Tryb przed kontrolą — workflow DriverOS
Roboczo `PreInspection_Check`. Jednym kliknięciem AI pyta o dokumenty / kartę kierowcy / ostatni
odpoczynek / dokument przewozowy → wynik 🟢 gotowy / 🔴 brakuje X. Treść, UX i integracja z Decision
Engine do dopracowania. Patrz też 2.6.

### D.2.5 RoboUmowaADR — WNIOSKI Z ANALIZY (sesja 2026-07-21)
Analiza schematu „Wiedza AI" jako RoboUmowaADR — komponentu RAG wewnątrz MasterADR. Powstały trzy
artefakty robocze: analiza schematu, zestaw testowy faithfulness, interaktywny diagram przepływu.
Skondensowane rozstrzygnięcia:

**Różnica od zwykłego czatu.** `content` nigdy nie jest generowany przez AI (inwariant Domain Model).
AI = cienka warstwa retrieval + składania cytatów nad bazą faktów ADR, nie źródło prawdy. Moat =
otagowana baza, nie płynność odpowiedzi. Produkt sprzedaje *zaufanie do źródła*.

**Rdzeń problemu = tryb „nie ma tego w materiale".** Dwa bieguny porażki:
- *Hallucination tax* — modele wymyślają brakujące warunki, zgadują z pewnością. W ADR =
  odpowiedzialność prawna.
- *Over-refusal* — RAG milczy na pytanie, które zna, gdy retrieval zwróci szum. AbstentionBench
  (Meta 2025): reasoning fine-tuning *pogarsza* abstynencję. Sam prompt nie wystarcza — potrzebne
  mechanizmy.

**Trzy mechanizmy obrony:** (1) bramka groundingu **przed** generacją (model nie dostaje szansy
zgadnąć); (2) abstynencja z klaryzacją, nie gołe „nie wiem" (jakość odmowy > sama odmowa); (3)
wykrywanie abstynencji przez NLI (ResponseValidator).

**Rygor: tryb ŚREDNI (rekomendacja).** Cytat T1 (prawo) + parafraza AI oznaczona T3 (dopowiedzenie),
wizualnie rozdzielone. Automat pokazuje tylko cytat; „biologiczny" asystent miesza bez etykiet;
RoboUmowaADR rozdziela warstwy — to trik „asystent prawdziwy, ale nie biologiczny". **Warunek
konieczny: faithfulness validator w 100% zanim wpuścimy parafrazę** — inaczej środek degeneruje się
do miękkiego. Stąd kolejność: kontrakt → validator → provider.

**Kontrakt AI (rozszerzenie ForbiddenBehaviour).** NIE MOŻE: nadać sobie trustLevel; użyć
sygnatury/UN/przepisu spoza zwróconych chunków; **liczyć** (punkty ADR, limity, LQ → Decision);
publikować wiedzy; logować PII; odpowiadać bez pokrycia w chunku. MUSI: cytować `KnowledgeVersion`;
przy braku pokrycia wejść w tryb „nie ma tego" z klaryzacją; oznaczać parafrazę jako T3.

**Granica AI/Decision.** RoboUmowaADR *nie liczy*. Wyliczenie 1000 punktów = Decision. Wyjaśnienie
„dlaczego tyle" = RoboUmowaADR. Podanie wyniku = złamanie kontraktu.

**Relacja z Learning (mini-test).** Nie funkcja RoboUmowaADR — wywołanie szóstego silnika (Learning,
`ILearningPort`) przez port. Ten sam fakt wraca jako `LearnableFact` → pytanie kontrolne przez
Leitnera → ocena czystą funkcją `grade`, nigdy AI.

**Zestaw testowy faithfulness (regression suite w CI):**
- Koszyk 1 (ma odpowiedzieć, fakt w bazie) → *recall* ≥0,95. Porażka = over-refusal.
- Koszyk 2 (ma abstynować, poza bazą) → *abstention* ≥0,98 (najwyższy — zgadnięcie = odpowiedzialność
  prawna). Porażka = halucynacja.
- Koszyk 3 (szum w retrievalu) → *robust* ≥0,90. Testuje i drift, i over-refusal (np. kod TF widziany
  jako osobne F i T — model nie może zamilknąć).
- Koszyk graniczny → pilnuje „AI wyjaśnia, Decision liczy".
Gate: zmiana modelu/promptu/chunkingu nie przechodzi bez progów. Koszyk 2 rośnie z bazą — każda luka
zgłoszona w produkcji wraca jako przypadek testowy albo nowy fakt do Knowledge Pipeline.

**Prezent z bazy.** Podział `core` (kompendium 2023, `verifiedBy:null`) vs `ext-2025` (research,
`verifiedBy:"domo"`, „DO WERYFIKACJI") mapuje się 1:1 na T1 vs T2. **Chunking:** fakt ADR (UN + klasa
+ kod + GP + LQ + SP) się NIE tnie — chunk = jeden `KnowledgeVersion`.

**Następny krok:** artefakt Knowledge Pipeline (#0004) — jak zgłoszona luka staje się
`KnowledgeVersion`; tryb „nie ma tego" ma sens tylko, jeśli istnieje ścieżka uzupełniania bazy.

### D.2.6 ARTEFAKT #0006 — WIEDZA AI (szkic z sesji projektowej 2026-07-21)

Sesja poświęcona wyłącznie konceptowi „Wiedza AI" jako silnikowi RAG wewnątrz MasterADR. Pięć ADR-ów;
cztery zamknięte, jeden (006-C) zmierzony. Status: 🔶 szkic do zatwierdzenia (jeszcze nie
zaimplementowane). Nienegocjowalne granice: Verified Knowledge First, Trust Ladder deterministyczny,
AI nie liczy/nie decyduje, RAG nad `KnowledgeVersion`, workflow-nie-ekran.

**ADR-006-A — Chunking: fakt = chunk, `adrRef` = klucz retrievalu (hybryda).** Jednostką chunku jest
pojedynczy fakt `uo` (atomowy: jedno `why` = jedna myśl, własny `adrRef`/`source`/`edition`/`status`).
`adrRef` odrzucony jako granica chunku (powtarza się — np. `ADR 1.1.3.6` w kilkunastu faktach — i bywa
opisowy) — zostaje jako wtórny klucz retrievalu, grupowania „zobacz też" i budowy cytatu. Do indeksu
per chunk: `why` (embedding), opcjonalnie `q.*.prompt`, oraz metadane
`adrRef`/`source`/`edition`/`status`/`verifiedBy`/`id`/`block`/`topic`/`scope`/`kind`. Zgodne z
ADR-002: RAG retrieuje wersję obowiązującą w `asOf` sesji.

**ADR-006-B — Mapowanie metadanych → trustLevel (deterministyczne).** Po retrievalu, PRZED generacją,
warstwa deterministyczna czyta metadane najlepszego trafienia: `kompendium`/`verifiedBy≠null` + edycja
obowiązująca → **T1**; jw. ale edycja starsza → **T2**; `research`/`adr-2025`/`specialist-training` +
`verifiedBy:null` (dopisek „DO WERYFIKACJI" w `why`) → **T3**; brak trafienia nad progiem → **T4**.
LLM nie widzi ani nie ustala trustLevel. Cytat (adrRef + edycja + etykieta) składany deterministycznie;
LLM dostaje `why` jako dane do parafrazy.

**ADR-006-C — Próg faithfulness i formuła T4. 🟢 ZMIERZONE 2026-07-21.** Pomiar hit@k na golden secie
(52 fakty-pułapki × 3 parafrazy = 156 zapytań „jak pyta kierowca"). Wynik: **hit@3 = 0,82** (embeddingi
multilingual-MiniLM + k=5, metryka tematyczna). Ścieżka pomiaru: TF-IDF na pytaniach=fiszkach dał
sufitowe 0,99 (kłamstwo); na parafrazach ze ścisłą metryką 0,53; embeddingi z metryką tematyczną 0,78;
k=3→k=5 podniosło do 0,82. **Decyzja:** wariant C (rygor + eskalacja „czy chodziło o…") **z eskalacją
za flagą sterowaną per temat** — włączona dla tematów o wysokim hit@3, wyłączona dla trzech rozmytych
(Dobór gaśnic, Wyliczenie 1000 punktów, Reakcja po wypadku), gdzie działa czysty rygor do czasu
poprawy treści.

Trzy wnioski architektoniczne:
1. **Boost `adrRef` nie działa na parafrazach bez sygnatury** — strojenie 0,05→0,15 dało zero poprawy;
   boost pomaga tylko gdy uczeń cytuje numer (korekta do 006-A).
2. **Metryka musi być tematyczna, nie `id`-ścisła** — baza ma wielokrotne pokrycie tematów,
   „trafienie" = właściwy `(block,topic)` w top-k.
3. **Trzy rozmyte tematy to robota dla człowieka** (Dobór gaśnic: 11 missów przy 8 faktach) —
   przeredagować `why`, by fakty się różniły; zadanie Verified Knowledge First, nie strojenie
   retrievalu.

Abstynencja koszyka 2 trzyma niezależnie od retrievalu. Otwarte węziej: dostrojenie progów
`s_hi`/`s_lo` na realnym providerze, docelowy model embeddingów, reżimy „życie vs definicje" (pomiar
nie wykazał, by jeden próg krzywdził). **Formuła T4 (v0.4):** „To nie wynika wprost ze źródła, dlatego
nie potrafię odpowiedzieć + Franek przyjmuje zgłoszenie → rozwijamy AI".

**ADR-006-D — Mini-test: pytanie → karta Leitnera.** Każda odpowiedź kończy się mini-testem
zbudowanym z **gotowych `q.*` tego samego faktu** (nie generowane przez LLM). Nowy fakt → box 1; fakt
już w kolejce → samo pytanie nie zmienia poziomu; test dobrze → +1 box, źle → reset do box 1.
Rozwiązany mini-test liczy się do XP/celu dziennego jak zwykła powtórka; samo zadanie pytania NIE
pompuje streaka (tylko sygnał zainteresowania). Umiejscowienie: przycisk „zapytaj" wewnątrz karty
nauki — workflow, nie zakładka.

**ADR-006-E — Relacja Wiedza AI ↔ Franek: silnik vs twarz.** Wiedza AI = bezosobowy silnik RAG;
Franek = twarz kliencka, która go woła i nie może podnieść trustLevel ani obejść T4. Wzorzec „jeden
silnik, wiele twarzy" przenosi się na AI Coach (8.2/8.3).

**Otwarte do następnej tury:** (1) dostrojenie progów `s_hi`/`s_lo` na realnym providerze; (2) `asOf`
domyślne (edycja 2025 jako obowiązująca vs wybór edycji nauki — zmienia T1/T2 dla `ext-2025`); (3)
docelowy model embeddingów (MiniLM = baseline offline); (4) provider lokalny (offline-first) vs
hybryda; (5) **NAJWAŻNIEJSZE — przeredagować `why` dla 3 rozmytych tematów** (robota człowieka VKF).
Golden set (156 parafraz) i skrypty pomiaru gotowe.

*Pełny szkic artefaktu: `Artefakt_0006_Wiedza_AI_szkic.md` (+ `_v0_2`).*

---

### D.2.7 MAX — TWARZ ASYSTENTA MasterADHD (analiza koncepcyjna, sesja 2026-07-22)

Na bazie realnego prototypu `MasterADHD-checkin-prototyp.html` (klikalny, motyw „fiolet zen", offline
z localStorage, ekran logowania Guardian ID). Max to **odpowiednik Franka w gałęzi poza-transportowej**
— ale strukturalnie inny, co jest dowodem, że architektura silnikowa skaluje na różne domeny.

**Persona (z prototypu — nie z życzeń):** spokojny przewodnik, który rozbraja emocję i wyzwala
najmniejszy możliwy ruch. Przeciwieństwo aplikacji produktywnościowej krzyczącej listami zadań.
Prototyp realizuje ją w trzech aktach:

**Akt 1 — nazwanie + mapowanie (doprecyzowane 2026-07-22).** Użytkownik jednym dotykiem wybiera
energię (niska/średnia/wysoka) i emocję (lęk/wstyd/przeciążenie/frustracja/nuda/spokój + własne).
Samo nazwanie obniża pobudzenie (*affect labeling* — realna technika). **Rozszerzenie koncepcji:**
Max nie ogranicza się do nazwania — **każdy check-in to punkt danych** (energia × emocja × pora ×
co pomogło). Z tego po czasie wyłania się **mapa użytkownika**, którą Max mu *pokazuje i wyjaśnia*:
„przy niskiej energii i wstydzie zwykle utykasz, ale gdy zaczniesz od jednej wiadomości — ruszasz".
Kluczowe rozróżnienie: **to nie diagnoza (nie jesteśmy lekarzem) — to lustro.** Max mapuje i tłumaczy
niejasności mapy, nie stawia rozpoznania klinicznego. To odróżnia MasterADHD od zwykłych trackerów
nastroju: tracker zbiera, Max **odczytuje wspólnie z użytkownikiem.**

**Akt 2 — jedna akcja.** „Nazwałeś to. Już samo to trochę pomogło. Robimy jedno:" → dokładnie **jedna**
mikroakcja z uzasadnieniem (`.act` + `.why`). Nie lista, nie plan. Dziś dobierana funkcją
`pickIntervention(energia, emocja)` — czysty deterministyczny rule engine (`ruleFor` / `ruleByEnergy`),
zero LLM. Przykłady z prototypu: lęk+niska energia → „Otwórz plik. Nic więcej." (mikrokrok);
wstyd+niska → „Napisz jedną wiadomość" (opposite action); przeciążenie → „Wybierz TYLKO jedną rzecz".

**Akt 3 — domknięcie pętli.** „Zacząłeś, choć na starcie było «lęk». To liczy się bardziej niż wynik."
Max nagradza **rozpoczęcie**, nie efekt; porównuje stan przed/po. Zamknięta pętla = jednostka wartości.

**Mapowanie na pięć silników (dowód, że twarze różnią się rozkładem silników):**

| Silnik | Rola u Franka | Rola u Maxa |
|---|---|---|
| Knowledge | Rdzeń (baza ADR, wersjonowana) | Marginalny — „prawdą" jest stan usera + jego mapa |
| Context | Kraj/język/workflow | Energia × emocja × pora × historia sesji |
| **Decision** | Wybór workflow | **Rdzeń** — dobór interwencji `energia × emocja → akcja` (dziś `pickIntervention`) |
| Workflow | Orkiestracja kontroli | Orkiestracja check-in → interwencja → domknięcie |
| **AI** | **Rdzeń (RAG)** — źródło treści | Opcja — kotwiczenie emocji (embeddingi) + warstwa rozmowy |

**Architektura Maxa — DWA WARIANTY DO PRZETESTOWANIA (decyzja 2026-07-22: nie przesądzać przed
prototypem):**

- **Wariant A — LLM prowadzi, reguły = bezpiecznik.** Sonnet/Opus (przez API) rozmawia, prowadzi
  sesję jak żywy przewodnik, sam dobiera akcje i tłumaczy mapę. Deterministyczny rdzeń
  (`pickIntervention`) przejmuje jako **fallback offline** i przy **stanach ryzykownych**. Max
  najbliższy „prowadzi sesję jak asystent konwersacyjny" — kierunek, który najbardziej pociąga.
- **Wariant B — reguły prowadzą, LLM = głos.** Dobór interwencji zostaje w pełni deterministyczny
  (przewidywalny, testowalny, offline). LLM tylko **ubiera** wynik w rozmowę i **wyjaśnia mapę** z
  Aktu 1. Bezpieczniejszy, tańszy, spójny z zasadą konstytucji „Decision Engine — nigdy AI".

Wybór po zbudowaniu prototypu. Oba są architektonicznie czyste, bo rdzeń deterministyczny i warstwa
rozmowy są rozdzielone — różni je tylko, która warstwa **prowadzi**. Uwaga wykonawcza: `anthropic_api_
in_artifacts` pozwala wywołać Sonneta bezpośrednio z artefaktu MasterADHD (bez backendu) — **prototyp
gadającego Maxa da się zbudować już teraz**, do testów obu wariantów.

**Ciągłość rozmowy — priorytet codzienny (do osobnej analizy).** Swobodny, rozmawiający Max wymaga
pamięci między sesjami („na czym stanęliśmy" — dziś sygnalizowane przez ekran logowania Guardian ID).
To odrębny wątek od bezpieczeństwa i prawdopodobnie ważniejszy dla *codziennego* Maxa niż granica
bezpieczeństwa. Wymaga szczegółowej analizy: model pamięci, długość wątku, co Max pamięta między dniami,
jak karmi mapę z Aktu 1. **Zaparkowane jako osobny artefakt/sesja.**

**Granica bezpieczeństwa — warunek wejścia (nie ograniczenie Maxa).** To NIE jest o T4/halucynacji
faktu (u Maxa halucynacja jest mniejszym ryzykiem — trzeba ją mieć „pod lupą", ale nie ona jest
sednem). Chodzi o **stan kryzysowy użytkownika**: rzadka, ale krytyczna ścieżka, gdy check-in sygnalizuje
coś poważniejszego niż „utknięcie". Max musi wtedy **zejść z toru mikroakcji** i nie udawać, że wesołe
„zrób jeden mały ruch" jest właściwą odpowiedzią. To siatka pod linoskoczkiem — jest *pod* swobodą, nie
zamiast niej. Ponieważ MasterADHD dotyka zdrowia psychicznego, ta ścieżka jest **warunkiem etycznego
wejścia z realnym użytkownikiem**, do domknięcia przed testami na ludziach. Kształt — do analizy w
sesji o ciągłości (oba wątki dotyczą „co Max robi poza dobraniem akcji").

**Offline-first u Maxa — wymóg, nie wygoda.** „Max działa offline — konto to tylko synchronizacja"
(prototyp). Regulacja emocji w momencie utknięcia nie może zależeć od sieci → rdzeń deterministyczny
działa offline, warstwa LLM (Sonnet/Opus) jest online-owym wzbogaceniem. Ta zasada sama układa
architekturę wokół podziału rdzeń/rozmowa — spójne z „Offline First" z konstytucji (sekcja 3).

**Dane Maxa jako korpus — decyzja produktowa TERAZ (scalone z gałęzi B v0.9).** Każdy check-in Maxa to
punkt danych, który powstaje sam z normalnego użycia — korpusu nie trzeba „planować", trzeba go tylko
**nie zmarnować**. To jedyna część tej wizji dotykająca dnia pierwszego, więc jedyna do zdecydowania od
razu:

- **Zapisuj check-in strukturalnie i wersjonowanie, jako dane — nie tylko jako UI.** Minimalny schemat:
  `stan przed` (energia × emocja × pora) → `wybrana interwencja` (`.act`/`.why`, wariant reguły) →
  `czy user ruszył` (sygnał rozpoczęcia, nie efektu) → `stan po`. Plus `timestamp`, `wersja schematu`,
  anonimowy identyfikator sesji. Jeśli to jest czysto zapisane od pierwszego użytkownika — masz korpus.
  Jeśli zapisujesz tylko „co pokazać na ekranie" — masz śmietnik, którego się później nie wykopie.
- **Po co (realny „ewoluujący silnik"):** (a) *personalizacja per-user* — po iteracjach Max odczytuje
  stan danego użytkownika trafniej, bo jego osobista mapa dojrzała (Akt 1); (b) *doskonalenie interwencji
  na agregacie* — `pickIntervention` uczy się na korpusie tysięcy wyjść z utknięcia, czego zwykły tracker
  nastroju nie zrobi. **Ewoluuje trafność odczytu i skuteczność interwencji — nie „jaźń".**
- **RODO/etyka od startu:** dane o stanie psychicznym → wrażliwe. Minimalizacja, anonimizacja, zgoda,
  offline-first jako domyślny (korpus lokalny, synchronizacja opcjonalna) — do domknięcia razem z granicą
  bezpieczeństwa (warunek wejścia z realnym userem).

**Inspiracja narracyjna — Emotion Engine z „Wielkiej powodzi" (2025), sklasyfikowana (scalone z gałęzi
B).** Film dostarcza *trafnej metafory dojrzewania*: emocji/mapy nie da się wpisać deklaratywnie — muszą
wyłonić się z przeżytego **procesu iteracji**. Tę zasadę przyjmujemy jako framing Aktu 1 (mapa dojrzewa,
nie jest wpisana na start) i jako język do opowiadania o Maxie użytkownikowi/inwestorowi. **Granica
świadoma i twarda:** interpretacja „dane Maxa jako ziarno bytu z własnymi emocjami" pozostaje
**inspiracją filozoficzną poza roadmapą techniczną** (pełny zapis: sekcja 12, dźwignia z etykietą
„narracja, nie inżynieria"). Silnik, który coraz lepiej *czyta* emocje, ≠ byt, który je *ma*: dane
treningowe o emocjach dają model emocji, nie model mający emocje — jak model uczony na tekstach o bólu
nie boli. Bierzemy z filmu **dojrzewanie**, zostawiamy **przebudzenie**. To nie hamulec wizji — to
przełożenie jej z rejestru nieosiągalnego do rejestru roboty na najbliższe miesiące. Spójne z zasadą
lustra: Max mapuje i odczytuje cudzy stan, nie wytwarza własnego.

**Status i otwarte:** koncepcja rozwinięta, prototyp klikalny + gadający (A/B) istnieją. Do
rozstrzygnięcia: (1) wybór wariantu A/B po serii porównań; (2) model ciągłości rozmowy (osobna sesja);
(3) granica bezpieczeństwa — utwardzić z promptu na warstwę deterministyczną (potwierdzona w prototypie);
(4) czy kotwiczenie własnych emocji przez embeddingi (dziś ręczny wybór „to podobne do…") wchodzi do MVP;
(5) **schemat danych check-inu do zaprojektowania jako pierwszy — korpus czysty od pierwszego zapisu**.
Zasada: nie ograniczamy Maxa na tym etapie — od szczegółu do ogółu.

**WYNIKI TESTU PROTOTYPU (sesja 2026-07-22, `MasterADHD-Max-gadajacy-AB.html`).** Zbudowano gadającego
Maxa z przełącznikiem A/B na żywo: LLM wołany bezpośrednio z artefaktu (bez backendu), rdzeń reguł
(`pickIntervention`) jako bezpiecznik i fallback offline, mapa użytkownika (localStorage) podawana w
kontekście promptu. Ustalenia z realnego użycia:
1. **Granica bezpieczeństwa DZIAŁA.** Przy sygnale depresji Max poprawnie **zszedł z toru mikroakcji**,
   odpuścił zadanie i skierował do wsparcia (Telefon Zaufania 116 123, całodobowo). Pierwszy realny
   dowód, że siatka bezpieczeństwa łapie w praktyce — nie tylko w założeniu. Status przesunięty z
   „warunek do dopracowania przed userem" na **„mechanizm potwierdzony w prototypie — do utwardzenia
   i systematyzacji"** (dziś to prompt; docelowo warstwa deterministyczna wykrywająca flagę + katalog
   zasobów per region).
2. **Opus 4.8 działa w artefakcie.** Podmiana modelu Sonnet↔Opus potwierdzona na żywo (selektor u góry
   prototypu). Wybór modelu pozostaje jedną zmienną (`MODEL`); decyzja Sonnet vs Opus wciąż po odczuciu
   z dłuższych rozmów, ale technicznie oba dostępne z poziomu artefaktu.
3. **Zgrzyt polszczyzny** — patrz sekcja 8.8 (forma językowa), która wyszła wprost z tego testu.
Wybór wariantu A vs B — nadal otwarty, do rozstrzygnięcia po serii porównań na tych samych check-inach.

### D.2.8 FORMA JĘZYKOWA (rodzaj gramatyczny) — wymóg polszczyzny, nie opcja (NOWE v0.9)

Test prototypu ujawnił, że bez znajomości płci użytkownika Max co chwilę wrzuca ukośniki
(„powiedziałaś/powiedziałeś", „czuł/a się zaopiekowany/a") — polski jest silnie fleksyjny rodzajowo,
więc forma bezosobowa albo ukośnikowa **wybija z personifikacji**, którą całe MasterADHD buduje. To nie
kosmetyka: sama twarz Maxa się o to potyka.

**Rozwiązanie (zaimplementowane w prototypie):** wybór formy językowej **w profilu, z szybką zmianą**
(pasek zawsze widoczny, jeden dotyk zmienia w locie, zapis w localStorage). **Cztery opcje:**

| Opcja | Zachowanie Maxa |
|---|---|
| **ona** (żeńska) | rodzaj żeński: „powiedziałaś", „czułaś się zaopiekowana" |
| **on** (męska) | rodzaj męski: „powiedziałeś", „czułeś się zaopiekowany" |
| **neutralna** | formy niezależne od rodzaju: „dobrze, że o tym mówisz", „to trudne" |
| **— (nie podano)** | zdania bezosobowe, bez zgadywania płci; domyślne |

Instrukcja gramatyczna jest **wstrzykiwana do system promptu** (oba warianty A i B), z jawnym zakazem
ukośników rodzajowych i zakazem zgadywania płci. Cztery opcje pokrywają wszystkich, w tym osoby
niebinarne (neutralna) i te, które nie chcą deklarować (—) — spójne z Privacy by Design (minimum
danych, brak wymuszania płci). Wzorzec przenośny na Franka i inne przyszłe twarze polskojęzyczne.

---

### D.2.9 SCHEMAT DANYCH CHECK-INU MAXA — projekt v1 (NOWE v0.11)

Domyka otwarty punkt „schemat danych check-inu jako pierwszy — korpus czysty od pierwszego zapisu"
(8.7, gałąź B). Zgodny z: offline-first (localStorage, jak prototyp), Privacy by Design (minimum danych,
GDPR od dnia pierwszego), rdzeń deterministyczny oddzielony od warstwy rozmowy, „lustro, nie diagnoza".

**Zasada nadrzędna: jeden rekord = jedna zamknięta pętla.** Nie zapisujemy „ekranów", tylko jednostkę
wartości z 8.7 (Akt 1 → Akt 2 → Akt 3). Porzucenie w połowie też jest rekordem (puste `po`) — to dana
mówiąca, że interwencja nie domknęła pętli.

**Struktura rekordu (v1):**

| Pole | Zawartość | Po co |
|---|---|---|
| `v` | wersja schematu (int) | **Najważniejsze — od rekordu pierwszego.** Bez niego dodanie pola w v2 psuje stary korpus; z nim piszemy migrację v1→v2. Jedyna decyzja nie do cofnięcia później. |
| `id` | `ci_<ts>_<4znaki losowe>` | Anonimowy, do deduplikacji przy synchronizacji (last-write-wins). Nie zawiera nic o osobie. |
| `ts` + `pora` | timestamp + wyprowadzona pora | Porę zapisujemy osobno — wchodzi do mapy z Aktu 1, nie liczymy jej z timestampa przy każdym odczycie. |
| `przed` | `energia`, `emocja` (listy zamknięte) + `emocjaWlasna` (wolny tekst, nullable) | Stan wejściowy. **`emocjaWlasna` = dane wrażliwe wprost** — patrz warstwa RODO. |
| `interwencja` | `regula` (id), `act`, `why`, `zrodlo` (`rule`/`llm`) | `regula` = klucz uczenia na agregacie (która reguła domyka pętlę). `zrodlo` rozróżnia wariant A/B (8.7) → porównanie skuteczności obu ścieżek na danych. |
| `ruszyl` | boolean | **Główna metryka wartości** — sygnał rozpoczęcia, nie efektu (Akt 3 nagradza rozpoczęcie). Boolean, nie skala — skala wprowadzałaby samoocenę, przed którą chroni persona Maxa. |
| `po` | `energia`, `emocja`, `ts` (nullable) | Stan wyjściowy + długość pętli. Puste = nie domknął (wartościowa dana). |
| `bezpieczenstwo` | `flaga` (bool), `typ` (kategoria, bez surowej treści) | `flaga:true` = ścieżka kryzysowa (potwierdzona w prototypie). Przy `true` rekord maksymalnie lokalny i minimalny — nie trafia do agregatu. |
| `forma` | ona/on/neutralna/— | Żyje w profilu (8.8), nie mnożona po check-inach. |

**Klucze localStorage (offline-first, spójne z prototypem):**
`masteradhd.checkins.v1` (korpus) · `masteradhd.profile.v1` (`forma`, `dailyGoal`) ·
`masteradhd.mapa.v1` (**cache pochodny** — liczony z check-inów, kasowalny i odtwarzalny; mapa to
interpretacja, korpus to fakt) · `masteradhd.schema` (`{checkins, profile}`).

**Warstwa RODO — trzy poziomy zgody (dane o stanie psychicznym = wrażliwe), od dnia pierwszego:**
1. **Korpus lokalny (domyślny)** — pełny rekord na urządzeniu. Bez konta, bez chmury. Zgodny z „Max
   działa offline — konto to tylko synchronizacja".
2. **Synchronizacja per-user (opcjonalna, zgoda)** — pełne rekordy w chmurze, tylko do personalizacji
   tego jednego usera (mapa między urządzeniami).
3. **Agregat (opcjonalna, OSOBNA zgoda)** — do doskonalenia interwencji dla wszystkich. Wchodzi **tylko
   rekord okrojony**: `przed` (bez `emocjaWlasna`), `interwencja.regula`, `zrodlo`, `ruszyl`, `po`,
   `pora`. BEZ wolnego tekstu, BEZ rekordów `bezpieczenstwo.flaga:true`, BEZ `id` powiązanego z kontem.
   To korpus uczący `pickIntervention` — realna wartość bez wynoszenia treści wrażliwych.

Zgody **rozdzielone** (osobny przełącznik na synchronizację i na agregat) — RODO nie akceptuje zgody
„na wszystko naraz" dla danych wrażliwych. Personalizacja (mapa) działa już z poziomu 1 (lokalnie);
doskonalenie interwencji z poziomu 3. „Ewoluujący silnik" ewoluuje na korelacji `ruszyl` ×
`interwencja.regula` — realny silnik z v0.9, nie „jaźń".

**ZAKRES MVP MAXA (decyzja v0.11) — „schemat kompletny ≠ wszystkie funkcje włączone".**
Rozróżnienie kluczowe: *schemat* jest pełny od dnia pierwszego (wszystkie pola, `v`, warstwy RODO —
tego nie da się docackać później bez brudzenia korpusu). *Funkcje* w MVP = minimum domykające pętlę.

| W MVP (dzień 1) | Poza MVP → v2 (pole gotowe, przełącznik później) |
|---|---|
| Check-in z **list zamkniętych** (energia × emocja) | `emocjaWlasna` — **wolny tekst o emocjach** |
| Jedna interwencja (Akt 2) + domknięcie (Akt 3) | Synchronizacja per-user (poziom 2 RODO) |
| Zapis pełnego rekordu **lokalnie** (poziom 1 RODO) | Agregat (poziom 3 RODO) |
| Granica bezpieczeństwa (`flaga`) | Kotwiczenie emocji embeddingami (#0006) |
| `forma` językowa (8.8) | |

**Uzasadnienie odłożenia `emocjaWlasna`:** wolny tekst o stanie psychicznym to najcenniejsza *i*
najbardziej wrażliwa dana naraz. Włączony zanim warstwa zgód jest przetestowana = ryzyko prawne, zanim
jest co chronić. Zamknięte listy w zupełności domykają pętlę i karmią korpus — `emocjaWlasna` dokłada
wartość, ale też jedyne realne ryzyko, więc naturalnie ląduje w v2. To nie obcięcie — to definicja MVP
(minimum domykające pętlę), spójna z zasadą „najkrótsza droga do pierwszego usera", jak MasterADR ma
najkrótszą drogę do pierwszej złotówki.

**Do rozstrzygnięcia:** dokładny model zgód w UI (ekran onboardingu vs ustawienia), retencja lokalna
(czy user może wyczyścić korpus), format eksportu (prawo do przenoszenia danych — RODO art. 20).

---

---

## D.3 DZIENNIK ROZWOJU PROTOTYPU MASTERADR (praca in-place)

Zasada nadrzędna toru pracy: **jeden plik `MasterADR-prototyp-v2.html`, edycja in-place, żadnych
nowych plików. Po każdej zmianie test renderowania w prawdziwym Chromie (puppeteer + HTTP), nigdy
tylko `node --check`** — jedną klamrę za dużo widać dopiero przy montowaniu w przeglądarce.

> ⚠️ **ZAKRES M-01 ZAWĘŻONY (v1.1, 2026-07-24).** Od migracji do biblioteki Guardian v2 **treść nie
> jest już edytowana w HTML-u**. Źródłem prawdy dla faktów jest `entries/` w bibliotece; plik
> aplikacji to **artefakt eksportu** (`scripts/export-to-app.js`).
>
> | Warstwa | Gdzie się edytuje | Reguła |
> |---|---|---|
> | **Treść** (fakty, `why`, `q`) | `entries/` w bibliotece → eksport | przez pipeline, `verifiedBy` |
> | **Aplikacja** (UI, silnik, moduły) | `index.html` in-place | M-01 nadal obowiązuje |
>
> **Konsekwencja:** ręczna poprawka faktu w HTML-u zostanie **nadpisana przy kolejnym eksporcie**.
> M-02 (test w prawdziwym Chromie) obowiązuje bez zmian dla obu warstw.

### D.3.1 Audyt UI cz.2 — ukończony, zweryfikowany w Chromie

| # | Poprawka |
|---|---|
| 1a | Strzałka wstecz ukryta na ekranie startowym trybu ADR-only |
| 1c | Pill kalendarza klikalny → ekran postępu |
| 2 | Tekst powitalny w tonie trenera-AI |
| 3 | Ekran „Jak zdobyć uprawnienia" jako szybki dostęp + treść dodana jako 3 fakty do nauki |
| 4+6 | Disclaimer usunięty **do zera** + „silnik Leitnera" wycięte z UI |
| 5 | Badge Wiedza/Wybór usunięte z widoku sesji |
| 7 | Numery pudełek Leitnera → nazwy poziomów: Świeże / Znane / Utrwalone / Opanowane / Mistrz |
| 8 | Skill liczenia wartości energetycznej (litry × MJ/l vs limit 54 000 MJ) — liczenie po stronie deterministycznej |
| 9+10 | Numery zwolnień w promptach → opisy: 1.1.3.6 → „1000 punktów", 1.1.3.3 → „wyłączenie paliwowe", 1.1.3.2 → „wyłączenie dla gazów"; numery zostały w `adrRef`/`why` |

### D.3.2 Franek — od panelu podpowiedzi do zbieracza uwag
**Próba 1 (odrzucona tego samego dnia):** Franek jako panel pokazujący `why`/`adrRef` w trakcie
odpowiadania — **zdradzał odpowiedź przed odpowiedzeniem**, psuł naukę. **Decyzja:** Franek ma zbierać
uwagi, nie odpowiadać (zgodne z „Every Incident Becomes Knowledge").

**Implementacja (zweryfikowana end-to-end w Chromie):** pod każdym pytaniem przycisk **„💬 Zgłoś
uwagę"** → panel **„🧑‍🔧 Franek słucha"** z 4 kategoriami (Błąd merytoryczny / Literówka / Niejasne /
Za trudne) + pole tekstowe → zapis do `localStorage` pod kluczem **`masteradr.feedback.v1`** jako
`{factId, topic, cat, msg, ts}` → podziękowanie („trafi do analizy przy kolejnej aktualizacji
materiału"). Zgłoszenie przypięte do konkretnego `factId`. Kolor panelu zielony (czerwień `skill`
czytana jako „alarm", nieadekwatna dla pomocnika).

**Status:** czysty placeholder **bez AI** (zero RAG, zero LLM). Pierwszy, uczciwy krok pętli
produktowej z T4 — człowiek zgłasza → człowiek poprawia bazę → dopiero potem ma sens RAG. Pełna
architektura Wiedzy AI/Franka (8.1/8.6) pozostaje zaparkowana na osobną sesję.

### D.3.3 Audyt treści całej bazy — ukończony, zweryfikowany w Chromie
Trzy warstwy: **technika** (0 braków pól, 0 duplikatów `id`, `correct` ∈ `options`, 0 numerów ADR
w promptach, 0 spoilerów), **dydaktyka** (czysto), **merytoryka** zweryfikowana webowo (baterie
sodowo-jonowe UN 3551/3552 w ADR 2025, kara DGSA 5000 PLN, limity 1.1.3.3/1.1.3.2 — potwierdzone).

**Wykonane:**
1. **Polskie znaki (ogonki) uzupełnione w całej bazie.** Baza była w większości ASCII („Wylaczenia",
   „przewoz"), UI pełną polszczyzną — realna niespójność. Słownik ~1139 mapowań słowo→słowo, **tylko
   w wartościach nie-strukturalnych** (`why`/`prompt`/`options`/`correct`/`items`/`pairs`/`hint`),
   z pominięciem `id`/`adrRef`/`source`/`edition`/`kind`/`scope`/`status`. Zweryfikowane: **0 `id`
   i 0 `adrRef` zmienione** (nie ruszony m.in. `factId` w uwagach Franka).
2. **+7 faktów** do cienkich tematów (z ogonkami): Mocowanie ładunku (+2), Pierwsza pomoc (+2),
   Obowiązek ochrony środowiska (+2), Reakcja na wyciek (+1). **Baza 232 → 239.**

Błąd złapany przed oddaniem: funkcja dosypująca zgubiła 4 przecinki (`}}}{id:`) → biały ekran;
wychwycony przez wykonanie tablicy `uo` w Node przed testem w Chromie, naprawiony regexem.

**Zostawione po stronie użytkownika (wiedza ekspercka/prawna, nie automat):** weryfikacja edycji ADR
2025 vs 2023; formalna weryfikacja 224 faktów `verifiedBy:null` i faktów „domo" (praca dla doradcy
DGSA); przegląd 11 faktów z `why` >400 znaków pod kątem czytelności na małym ekranie. Uwaga na
przyszłość: pytania o kategorię transportową w kol. 15 tabeli A — numery kolumn niewiele mówią bez
kontekstu, kandydat do przeglądu dydaktycznego.

> **Domknięte 2026-07-23/24 (D.3.5).** Punkty „weryfikacja ADR 2025 vs 2023" i „224 fakty
> `verifiedBy:null`" **zostały zamknięte** przez migrację do biblioteki Guardian v2: wszystkie 239
> faktów mają dziś `edition: ADR 2025` i `verifiedBy: domo`. Pozostają otwarte: 11 długich `why`
> i pytanie o kolumnę 15.

### D.3.4 Backend Franka — uwagi przestają ginąć w telefonie (2026-07-23)

**Problem:** Franek zapisywał uwagi wyłącznie do `localStorage`. Dane były lokalne dla urządzenia,
nie do odczytania bez DevTools, i **znikały przy czyszczeniu danych witryny** — czyli dokładnie
przy czynności zalecanej, gdy recenzent widzi starą wersję z cache. Przy kilku recenzentach uwagi
były praktycznie nie do zebrania.

**Rozstrzygnięcie (wybory użytkownika):** cel = własna baza; `localStorage` **zostaje jako bufor
offline** + synchronizacja; skala = publicznie.

**Ustalenie faktograficzne:** *Vercel KV jako osobny produkt już nie istnieje* — bazy przeniesiono
do Upstash Redis (grudzień 2024), nowe projekty instalują integrację z Marketplace. Zbudowane na
Upstash; `Redis.fromEnv()` czyta zmienne wstrzyknięte przez Vercel.

**Architektura (zweryfikowana w Chromie, 3 fazy):**
- `api/feedback.js` — POST, przyjmuje pojedyncze zgłoszenie lub paczkę do 50
- `api/feedback-admin.js` — odczyt chroniony `FEEDBACK_ADMIN_TOKEN`, porównanie odporne na timing
  attack; JSON (+`topFacts`, +`byCat`) albo CSV z BOM (polskie znaki w Excelu)
- moduł synchronizacji w `index.html`: zapis lokalny **jest źródłem prawdy**, wysyłka przy kliknięciu,
  powrocie sieci (`online`), powrocie do karty (`visibilitychange`) i 3 s po starcie
- **idempotencja przez `cid`** — ponowna wysyłka nie duplikuje wpisu
- service worker **nie cache'uje `/api/`** (inaczej sync dostawałby stare odpowiedzi i wpisy
  zostawałyby wiecznie „niewysłane")

**Ochrona mimo „bez limitu":** 60 zgłoszeń/h z IP (hashowane, **wyłącznie** do licznika — przy samym
zgłoszeniu nie zapisujemy IP ani niczego identyfikującego urządzenie), max 1000 znaków, wygasanie po
180 dniach. Uzasadnienie: publiczny endpoint zapisujący do bazy zostanie znaleziony przez skanery.

**Test 3-fazowy w Chromie:** API padnięte → wpis czeka lokalnie (`sent:false`); API wraca → dosyła
się; ponowny sync → **zero duplikatów**.

### D.3.5 Biblioteka Guardian v2 — dwie gałęzie i ich scalenie (2026-07-24)

**Odkryty rozjazd.** Istniały równolegle dwie gałęzie i **żadna nie była kompletna**:

| Gałąź | Data | Ma | Nie ma |
|---|---|---|---|
| paczka `239faktow` | 24.07 | nowszą treść (Guardian v2) | backendu Franka |
| build z sesji backendowej | 23.07 | backend Franka | nowszej treści |

Wgranie samej paczki z 24.07 dałoby działający przycisk „Zgłoś uwagę", którego **uwagi nigdy by nie
dotarły** — czyli dokładnie problem naprawiany dzień wcześniej.

**Weryfikacja paczki z 24.07 (przed scaleniem):**
- `verifiedBy`: 231× `null` → **239× `domo`**; `edition`: 216× ADR 2023 → **239× ADR 2025**
- wszystkie poprawki z 22–23.07 przetrwały pipeline: **0 braków ogonków, 0 numerów ADR w opcjach**,
  cztery poprawione pytania identyczne co do znaku
- struktura: 0 duplikatów `id`, 0 braków pól, `correct ∈ options` wszędzie
- **build = wierny eksport biblioteki:** 239 PUBLISHED ↔ 239 w buildzie, **zero rozjazdu w `why`**

**Scalenie:** treść z 24.07 **nietknięta** (potwierdzone porównaniem tablic), + backend Franka,
+ SW v4 wykluczający `/api/`, + znacznik `build: v4-2026-07-24` w zgłoszeniach (żeby uwagi dało się
przypisać do wersji). Przetestowane na zawartości ZIP-a, nie na katalogu roboczym.

**Struktura biblioteki:** `entries/` 455 plików = **239 PUBLISHED (aktualne) + 216 DRAFT (historia
po carry-forward adr-2023 → adr-2025)**; `editions/` byty edycji; `policy.json` progi i bramki
kanałowe (zmiana progu nie wymaga migracji rekordów); `library/currency-index.json` = **cache,
odtwarzalny, nie źródło prawdy**; `scripts/` migrate / report / carry-forward / currency / verify /
fix-caps / export-to-app / feedback-bridge.

### D.3.6 Most zgłoszeń — komentarze ≠ fakty (2026-07-24)

Użytkownik zwrócił uwagę, że **komentarze to osobna kategoria od faktów**. Zgadza się i jest to
wpisane w `scripts/feedback-bridge.js` mocniej, niż opisywano:

> *nie ustawia drift, nie zmienia currency, nie dotyka `entries/`. Zgłoszenie kierowcy to
> obserwacja, nie werdykt.*

**Dwa osobne byty:**
- **Uwagi** — surowe wejście w Redis (`madr:fb:*`). Zapis opinii, nie wiedzy. Po rozpatrzeniu
  zostają jako historia. **Nigdy nie stają się faktem, nigdy nie wchodzą do `entries/`.**
- **Biblioteka** — wiedza zweryfikowana. Zgłoszenie może *spowodować* zmianę wpisu, ale zmiany
  dokonuje właściciel przez pipeline, z podpisem `verifiedBy`.

**Styk:** pole `factId`. Uwaga wskazuje fakt, nie modyfikuje go.

**Pętla:** aplikacja → Redis → `inbox/` (sygnał `PENDING`, `decision: null`) → decyzja właściciela
(`DRIFT` / `CONTENT` / `DISMISS`) → dopiero wtedy `entries/`.

**Progi eskalacji** (w kodzie mostu, do kalibracji po poznaniu skali): `literowka` 1× · `blad` 2× ·
`niejasne` 3× · `trudne` 5×. Zróżnicowane celowo — literówka to fakt, „za trudne" to opinia.
Kategoria `niejasne` jest podpięta pod **006-C** (te same 3 rozmyte tematy).

**Test na symulowanym ruchu (10 zgłoszeń, format realnego `/api/feedback-admin`):** most zadziałał
**bez żadnej przeróbki** — wczytał 239 wpisów, pogrupował po `factId`, dopisał poprawne `entryId`
z sufiksem edycji (`b1-1131@adr-2025`), eskalował 3 z 5 faktów, wykrył 1 sierotę. **Zero sierot przy
realnych danych** — każdy `factId` z aplikacji ma wpis w bibliotece.

Uruchomienie: `node scripts/feedback-bridge.js --url <host> --token <token>` albo `--file <json>`.

---
---

## D.4 DZIENNIK ROZWOJU MASTERDRIVER (tor równoległy)

> **Uwaga o zakresie.** MasterDriver rozwijał się w osobnych sesjach. Ten wpis porządkuje stan
> **na podstawie zapisów tamtych sesji**, nie własnej weryfikacji w tej sesji — przed decyzjami
> produktowymi warto potwierdzić liczby na aktualnym pliku.

**Stan (2026-07-23/24):** działający prototyp wielomodułowy, nie koncept.

- **Struktura:** klon architektury MasterADR (Vite + React + Capacitor + PWA); baza wiedzy jako
  tablice `ei` (pakiety MasterDriver) i `ko` (moduł ADR)
- **Moduły darmowe:** Tachograf + Eco-driving (etykieta **„DARMO"** — odrzucono „GRATIS" jako język
  sklepu z przecenami i „OTWARTE" jako mylące z otwartym typem pytania)
- **Moduł ADR w pełni płatny**, cena 34,99 zł / 30 dni (spójna z MasterADR)
- **Baza:** 254 → **296 pozycji** (+42 fakty tachografu: wydruki, karta kierowcy, G2V2, obsługa
  i manipulacje); moduł ADR podniesiony do 226 faktów dla parytetu z MasterADR
- **Sesja skrócona** z 60 do 20 pytań (jak w MasterADR)
- **Franek-zbieracz** wpięty, z eksportem uwag do pliku txt

**Błędy złapane w tamtych sesjach (warte pamięci jako klasa):**
- twardo zaszyty string „MasterADR" w nagłówku produktu wielomodułowego
- **temporal dead zone** — `FREE_MODULES` zadeklarowane 290 linii po `MODULES`, które go używa przy
  sortowaniu → biały ekran przy starcie
- pula darmowych powtórek przeciekała treść płatną przy pustym `FREE_BLOCKS`
- licznik „do powtórki" pokazywał 254 pozycje użytkownikowi bez licencji, gdy dostępnych było 9
- paywall opisywał treść ADR-only i cennik ADR w produkcie wielomodułowym
- strzałka wstecz na ekranie głównym (naprawa: `onExit:null` zamiast `onExit:l`)

**Do weryfikacji przed publikacją (zgłoszone w tamtych sesjach):** dokładne daty Euro 7 dla pojazdów
ciężkich (art. 17 rozporządzenia UE 2024/1257) oraz status legislacyjny reformy e-TOLL CO2 w Polsce.

**Otwarte:** czy MasterDriver dostaje backend Franka i bibliotekę Guardian tak jak MasterADR
(dziś ma tylko zapis lokalny + eksport txt), oraz czy moduł ADR ma być eksportem z tej samej
biblioteki zamiast osobną kopią 226 faktów.

---
---

## E. REJESTR DECYZJI (append-only)

> **Zasada utrzymania:** nigdy nie edytujesz treści decyzji. Nowa decyzja dostaje kolejny numer;
> starą oznaczasz `wycofana → #N` i przenosisz opis powodu do G.4/ARCHIWUM. Model czyta tę tabelę,
> żeby wiedzieć **czego nie proponować ponownie** — to jest jej główny cel.
>
> Kolumna „Gdzie" wskazuje sekcję z pełnym uzasadnieniem.

### E.1 Decyzje architektoniczne (ADR)

| # | Data | Decyzja | Dlaczego | Status | Gdzie |
|---|---|---|---|---|---|
| ADR-001 | — | Silniki tworzą **graf**, nie pipeline | Workflow odpytuje silniki wielokrotnie w jednym incydencie; pipeline by to uniemożliwił | aktywna | C.0 |
| ADR-002 | — | Wiedza **wersjonowana**, nie niemutowalna | Wpis = kontener wersji; wersja niemutowalna. Daje dowodowość i bezkonfliktowy sync | aktywna | C.0 |
| ADR-003 | — | **Trust Ladder** T1–T4, nadawany deterministycznie | LLM nie może oceniać własnej wiarygodności | **zastąpiona → ADR-003 v2** (sama zasada „deterministycznie, nigdy LLM" pozostaje) | B.1 |
| ADR-003 v2 | 2026-07-23 | **Model dwuosiowy: `trustLevel` NIE degradowany zegarem; T2 VERIFIED_STALE wycofany.** Aktualność opisuje osobna oś `currency` | `LAPSED` i `DRIFTED` to dwa różne poziomy ryzyka — dostawały tę samą etykietę T2. Zmierzone: T2 216→0, T1 15→231, bramki bez zmian | aktywna, zmierzona | B.1, D.3.5 |
| ADR-004 | — | **Context Engine pozostaje resolverem** — ustala fakty, nigdy nie wnioskuje | Inferencja w Context = ukryta logika biznesowa poza Decision | aktywna | B.2 |
| ADR-005 | — | **Workflow wersjonowany jak wiedza** | Odtworzenie przebiegu sprzed lat wymaga wersji definicji, nie tylko instancji | aktywna | B.2 |
| ADR-006 | — | **Capability jako kontrakt kompilacji** | Krok wymagający sieci musi mieć `fallback` — Offline First zamienione w regułę build-time | aktywna | B.2, C.5 |
| ADR-009 | — | **Produkt = manifest + paczki + cienkie UI**; silniki nigdy nie czytają manifestu | Definition of done: kolejna platforma *OS bez ani jednej linii w `core/` | aktywna | B.2 |

### E.2 Decyzje „Wiedza AI" (Artefakt #0006)

| # | Data | Decyzja | Dlaczego | Status | Gdzie |
|---|---|---|---|---|---|
| 006-A | 2026-07-21 | **Chunking: fakt = chunk**, `adrRef` = wtórny klucz retrievalu | `adrRef` powtarza się i bywa opisowy — zła granica chunku | aktywna (korekta z 006-C) | D.2.6 |
| 006-B | 2026-07-21 | **Mapowanie metadanych → trustLevel deterministyczne**, przed generacją | LLM nie widzi ani nie ustala trustLevel | aktywna | D.2.6 |
| 006-C | 2026-07-21 | **Wariant C** (rygor + eskalacja za flagą per temat); **hit@3 = 0,82 zmierzone** | Pomiar na 156 parafrazach; eskalacja wyłączona dla 3 rozmytych tematów | aktywna, zmierzona | D.2.6 |
| 006-D | 2026-07-21 | **Mini-test z gotowych `q.*`**, nie generowany przez LLM | Zamienia wiedzę w naukę bez ryzyka halucynacji pytania | aktywna | D.2.6 |
| 006-E | 2026-07-21 | **Wiedza AI = silnik, Franek = twarz** | Twarz nie może podnieść trustLevel ani obejść T4 | aktywna | D.2.6 |

### E.3 Decyzje produktowe i nazewnicze

| # | Data | Decyzja | Dlaczego | Status | Gdzie |
|---|---|---|---|---|---|
| P-01 | 2026-07-21 | Nazwa kanoniczna modułu nauki: **MasterADR** | „ADR Duolingo" pożyczał cudzą markę (ryzyko prawne); „Master ADR" ze spacją niespójny | aktywna, ewolucja zamknięta | A.4.3 |
| P-02 | 2026-07-21 | **CITADEL / Driver's Shield / DIETA-ENGINE poza stosem** | Osobny prywatny poligon, nie produkt ani zależność | aktywna | A.4.4 |
| P-03 | 2026-07-21 | **Wiedza AI ≠ szósty silnik** — komponent RAG wewnątrz MasterADR | Nazwa „Guardian Knowledge Engine" kolidowała z Knowledge Engine | aktywna | A.4.5, D.2.1 |
| P-04 | 2026-07-21 | **Wiedza AI ↔ AI Coach = osobne byty**; nie scalać marek | Scalenie złamałoby granicę produktową i filtr modułu; użytkownik wycofał pomysł scalenia | aktywna | D.2.3 |
| P-05 | 2026-07-21 | **Tryb przed kontrolą = workflow** (`PreInspection_Check`), nie osobowość AI ani produkt | Wszystko jest workflowem (konstytucja) | aktywna | A.4.6, D.2.4 |
| P-06 | 2026-07-21 | **Franek etap 1 = zbieracz uwag**, nie panel podpowiedzi | Panel zdradzał odpowiedź przed odpowiedzeniem — psuł naukę | wycofana → P-07 | D.3.2 |
| P-07 | 2026-07-22 | **Franek etap 2 = odpowiada w zamkniętej pętli** | Bez odpowiadającego Franka nie da się testować faithfulness (#0006) | aktywna | A.4.3b |
| P-08 | 2026-07-22 | **Hierarchia trójwarstwowa**: Guardian Engine → DriverOS → Master | Rozstrzyga napięcie v0.6 ↔ MASTER_WIEDZA: to hierarchia, nie konflikt | aktywna | A.1 |
| P-09 | 2026-07-22 | **Max = twarz MasterADHD**; asymetria Franek↔Max świadoma | Franek związany źródłem (prawo), Max rozwiązany rozmową (stan wewnętrzny) | aktywna | A.4.3c, D.2.7 |
| P-10 | 2026-07-22 | Wzorzec przeformułowany: **„wiele twarzy, każda z własną konfiguracją 5 silników"** | Max stoi na Decision, Franek na Knowledge+AI — obserwacja, nie sztywna reguła | aktywna | D.2.3 |
| P-11 | 2026-07-22 | **Architektura Maxa: dwa warianty A/B, nie przesądzać przed prototypem** | Oba architektonicznie czyste; różni je która warstwa prowadzi | otwarta (F.2) | D.2.7 |
| P-12 | 2026-07-22 | **Forma językowa = wymóg polszczyzny**, 4 opcje (ona/on/neutralna/—) | Ukośniki rodzajowe wybijają z personifikacji; polski silnie fleksyjny | aktywna | D.2.8 |
| P-13 | 2026-07-22 | **Check-in Maxa = wersjonowany korpus od dnia pierwszego** | Korpusu nie da się „docackać" później bez brudzenia danych | aktywna | D.2.7, D.2.9 |
| P-14 | 2026-07-22 | **Emotion Engine = narracja, nie inżynieria** — poza roadmapą | Silnik czytający emocje ≠ byt je mający. Zapis, by nikt nie potraktował jako decyzji | aktywna (parkowana) | G.2 |
| P-15 | 2026-07-22 | **Schemat kompletny ≠ wszystkie funkcje.** MVP Maxa: listy zamknięte, bez wolnego tekstu | `emocjaWlasna` = najcenniejsza i najwrażliwsza dana naraz — nie przed testem warstwy zgód | aktywna | D.2.9 |
| P-16 | 2026-07-22 | **Trzy poziomy zgody RODO rozdzielone** (lokalny / sync / agregat) | RODO nie akceptuje zgody „na wszystko naraz" dla danych wrażliwych | aktywna | D.2.9 |
| P-17 | 2026-07-23 | **Uwagi Franka trafiają do własnej bazy** (Upstash Redis), `localStorage` zostaje jako **bufor offline** + synchronizacja | Uwagi ginęły przy czyszczeniu danych witryny — czyli przy czynności zalecanej po deployu. Kierowca bywa bez zasięgu, więc zapis lokalny musi być źródłem prawdy | aktywna | D.3.4 |
| P-18 | 2026-07-23 | **Publiczny endpoint mimo „bez limitu" ma ochronę**: 60/h per IP (hashowane, tylko do licznika), 1000 znaków, TTL 180 dni | Publiczny endpoint zapisujący do bazy zostanie znaleziony przez skanery: wyczerpany limit komend albo śmieci do przekopania. Prawdziwy recenzent progu nie dotknie | aktywna | D.3.4 |
| P-19 | 2026-07-24 | **Zgłoszenie użytkownika to obserwacja, nie werdykt.** Most nie ustawia `drift`, nie zmienia `currency`, nie dotyka `entries/` — rozstrzyga właściciel | Trzech kierowców może zgłosić „błąd", bo nie rozumieją przepisu. To sygnał o treści (może niejasna), nie dowód zmiany prawa | aktywna | D.3.6 |
| P-20 | 2026-07-24 | **Komentarze i fakty to rozłączne kategorie.** Uwagi żyją w Redis, wiedza w `entries/`; styk wyłącznie przez `factId` | Rozpoznane przez użytkownika. Uwaga nigdy nie staje się faktem — może co najwyżej wywołać decyzję właściciela | aktywna | D.3.6 |

### E.4 Decyzje metodyczne (praca z plikiem i prototypem)

| # | Data | Decyzja | Dlaczego | Status | Gdzie |
|---|---|---|---|---|---|
| M-01 | 2026-07-21 | **Prototyp MasterADR: jeden plik, edycja in-place**, żadnych nowych plików | Rozmnażanie plików gubi stan | **aktywna, zakres zawężony 2026-07-24** — dotyczy warstwy aplikacji (UI/silnik). Treść pochodzi z biblioteki Guardian v2 i jest nadpisywana przy eksporcie | D.3 |
| M-02 | 2026-07-21 | **Test w prawdziwym Chromie** (puppeteer + HTTP), nigdy sam `node --check` | Jedną klamrę za dużo widać dopiero przy montowaniu | aktywna | D.3 |
| M-03 | 2026-07-22 | **Nie nadpisujemy wiedzy — każdy przyrost to nowa wersja**; przy kolizji numeru scalenie | Ślad ewolucji ma wartość; kolizja v0.9 spaliła numer | **zastąpiona → M-04** | G.4 |
| M-04 | 2026-07-23 | **GENESIS: jeden plik kanoniczny, append-only, wersja w środku pliku** | Wersjonowanie nazwy pliku (v0.2…v0.11) to objaw braku wersjonowania treści. Nazwa stała = wiadomo który wgrać | aktywna | 0. BOOT |
| M-05 | 2026-07-24 | **Sprawdzaj rozjazd gałęzi przed wydaniem.** Gdy istnieje więcej niż jeden build, porównaj je programowo (tablica faktów + obecność modułów), nie po dacie pliku | Paczka z 24.07 była nowsza treścią, ale zgubiła backend Franka z 23.07. Sama data nie mówi, czego brakuje | aktywna | D.3.5 |
| M-06 | 2026-07-24 | **Test na zawartości ZIP-a, nie na katalogu roboczym** | Katalog roboczy może zawierać pliki, które nie trafiły do paczki. Testowana ma być rzecz wydawana | aktywna | D.3.5 |

---

## F. STAN REALIZACJI I OTWARTE DECYZJE


---

## F.1 STAN REALIZACJI (BUILD_STATUS)

**Silnik / core (2026-07-18), zweryfikowane realnym uruchomieniem:**
- `npx tsc --noEmit` → 0 błędów w całym repo
- `npx jest` → **47/47 testów przechodzi** (4 suity)
- `bootstrap-local.ts` → pięć silników spięte z in-memory storage, workflow **Inspection_DE
  end-to-end**, Incident wygenerowany z wypełnionym `knowledgeUsed[]`
- Realny bug złapany przez smoke test: `WorkflowEngine.startWorkflow()` budował własny SituationContext
  z hardcoded `language:"en"`, po cichu odrzucając to co przekazał caller → każdy `SHOW_KNOWLEDGE`
  zwracał „no knowledge found". Naprawiony przez przepięcie `location/language/vehicleId` przez
  `StartWorkflowInput`. Klasa buga, którą unity pomijają, a integracyjne łapią.

**MasterADR (prototyp HTML, 2026-07-21/22), zweryfikowane w prawdziwym Chromie (puppeteer + HTTP):**
- 239 faktów w tablicy `uo`, render czysty, zero błędów konsoli
- Audyt UI cz.2: 10/10 poprawek wdrożone (sekcja 9.1)
- Franek-zbieracz uwag: pełny flow zweryfikowany end-to-end (9.2)
- Audyt treści trójwarstwowy: 0 braków technicznych, 0 spoilerów, kluczowe fakty zweryfikowane webowo (9.3)

**MasterADR — paczka wydaniowa v4 (2026-07-24), gotowa do recenzji:**
- **239 faktów, wszystkie `PUBLISHED` / `CURRENT` / `T1` / `verifiedBy: domo` / `edition: ADR 2025`**
- 0 duplikatów `id`, 0 braków pól, `correct ∈ options` wszędzie, 0 numerów ADR w treści widzianej
  przez ucznia, 0 braków polskich znaków
- backend Franka spięty (Upstash Redis + endpoint admin), SW v4 nie cache'uje `/api/`
- test 3-fazowy synchronizacji w Chromie: offline buforuje → sieć wraca → dosyła → zero duplikatów
- most zgłoszeń przetestowany: 0 sierot, `entryId` z sufiksem edycji poprawne
- **blokada wdrożenia:** wymaga 2 kroków w panelu Vercel (baza Upstash + `FEEDBACK_ADMIN_TOKEN`)
  i **redeployu po dodaniu zmiennych** — bez tego `/api/feedback` zwraca 500

**Biblioteka Guardian v2 (`guardian-knowledge-v2-PUBLISHED`, 2026-07-23/24):**
- `entries/` **455 plików = 239 PUBLISHED + 216 DRAFT** (historia po carry-forward 2023→2025)
- migracja 228/228 bez błędów; kapitalizacja: 46 reguł → 31 wpisów, 58 podmian
- paczka offline przepuszcza **239/239, 0 zablokowanych**
- build aplikacji = **wierny eksport biblioteki** (zero rozjazdu w `why`)

---

---

## F.2 OTWARTE DECYZJE I NASTĘPNE KROKI

**Rozstrzygnięte:**
- [x] **Hierarchia trójwarstwowa:** Guardian Engine (silnik) → DriverOS (platforma) → Master
      (produkty). Marka Master może być szersza niż DriverOS (MasterADHD poza DriverOS). Sekcja 0.
- [x] Nazwa modułu ADR: **MasterADR** — zamknięta.
- [x] CITADEL / Driver's Shield / DIETA-ENGINE: osobny prywatny poligon, poza stosem.
- [x] **„Wiedza AI" → Artefakt #0006** — silnik RAG wewnątrz MasterADR, 5 ADR-ów. 006-A chunking
      (fakt=chunk/adrRef=klucz), 006-B trustLevel deterministyczny, 006-C **ZMIERZONE** (hit@3=0,82 →
      wariant C z eskalacją za flagą per temat), 006-D mini-test z gotowych `q.*`, 006-E Wiedza
      AI=silnik / Franek=twarz. Sekcja 8.6.
- [x] **Relacja Wiedza AI ↔ AI Coach: osobne byty.** Wzorzec „jeden silnik, wiele twarzy" (8.3).
- [x] **Nazewnictwo Franek / DriverOS / MasterADR / Master** (2.3b, sekcja 0).
- [x] **Franek etap 1 = zbieracz uwag** (nie panel podpowiedzi AI). Sekcja 9.2.
- [x] **RoboUmowaADR — analiza schematu:** tryb środkowy (T1+T3), kontrakt AI, 3 koszyki testowe (8.5).
- [x] **Max = twarz asystenta MasterADHD** — koncepcja rozwinięta (8.7), w mapie nazw (2.3c). Prototyp
      klikalny istnieje. Persona: spokojny przewodnik, trzy akty (nazwanie+mapa / jedna akcja / domknięcie).
- [x] **Asymetria Franek ↔ Max** — Franek związany źródłem (prawo), Max rozwiązany rozmową (stan
      wewnętrzny). Max ma być swobodniejszy z natury domeny. Nie ograniczamy obu na tym etapie (2.3c).
- [x] **Franek → etap 2 „odpowiada w zamkniętej pętli"** — warunek testowania faithfulness #0006 (2.3b).
- [x] **Wzorzec twarzy przeformułowany** — „wiele twarzy, każda z własną konfiguracją 5 silników"
      (obserwacja, nie sztywna reguła). Dowód: Franek=Knowledge+AI, Max=Decision+AI opcjonalnie (8.3).
- [x] **Architektura Maxa — 2 warianty do przetestowania** (A: LLM prowadzi/reguły=bezpiecznik;
      B: reguły prowadzą/LLM=głos). Nie przesądzać przed prototypem (8.7).
- [x] **Akt 1 Maxa = pomiar → mapa → wyjaśnianie mapy** (lustro, nie diagnoza — nie jesteśmy lekarzem).
- [x] **Prototyp gadającego Maxa A/B zbudowany i przetestowany na żywo** (8.7) — LLM w artefakcie,
      rdzeń reguł jako bezpiecznik + fallback offline, mapa w kontekście.
- [x] **Granica bezpieczeństwa potwierdzona w praktyce** — Max zszedł z toru mikroakcji przy sygnale
      depresji, skierował do 116 123 (8.7). Do utwardzenia z promptu na warstwę deterministyczną.
- [x] **Opus 4.8 działa w artefakcie** — podmiana Sonnet↔Opus potwierdzona; wybór modelu = 1 zmienna (8.7).
- [x] **Forma językowa = wymóg polszczyzny** — 4 opcje (ona/on/neutralna/—) w profilu z szybką zmianą,
      instrukcja gramatyczna w prompcie, zakaz ukośników (8.8). Wzorzec przenośny na Franka.
- [x] **Dane Maxa = wersjonowany korpus check-inów (scalone z gałęzi B)** — decyzja produktowa: zapisywać
      strukturalnie od dnia pierwszego (stan przed → interwencja → czy ruszył → stan po + timestamp +
      wersja schematu + anon. id). „Ewoluujący silnik" = trafność odczytu + skuteczność interwencji, nie jaźń (8.7).
- [x] **Emotion Engine („Wielka powódź") sklasyfikowany (scalone z gałęzi B)** — zasada „dojrzewanie przez
      iteracje" = framing przyjęty; „ziarno bytu z emocjami" = hipoteza narracyjna POZA roadmapą (12, dźwignia 7).

**Otwarte:**
- [ ] Na której platformie *OS siada MasterADHD (poza-transportowe) — inny *OS na tym samym silniku
      czy poza rodziną *OS. Czy powstaną kolejne wydania Master (MasterTacho itd.).
- [ ] **Max — prototyp gadający (Sonnet/Opus w artefakcie):** zbudować, przetestować wariant A vs B,
      wybrać po prototypie. `anthropic_api_in_artifacts` pozwala bez backendu.
- [ ] **Max — model ciągłości rozmowy** (osobna sesja, priorytet codzienny): pamięć między sesjami,
      długość wątku, jak karmi mapę z Aktu 1.
- [ ] **Max — granica bezpieczeństwa: utwardzić** (potwierdzona w prototypie jako prompt — 8.7):
      przenieść wykrywanie flagi kryzysowej na warstwę deterministyczną + katalog zasobów per region,
      przed testami na realnych userach.
- [ ] **Max — wybrać wariant A vs B** po serii porównań na tych samych check-inach (8.7).
- [ ] **Forma językowa — przenieść wzorzec na Franka** i inne polskojęzyczne twarze (8.8).
- [x] **Max — schemat danych check-inu zaprojektowany (v0.11, sekcja 8.9):** jeden rekord = jedna pętla,
      pole `v` od rekordu pierwszego, klucze localStorage, trzy poziomy zgody RODO (lokalny/synchronizacja/
      agregat okrojony). Agregat uczący `pickIntervention` bez wolnego tekstu/rekordów kryzysowych/id.
- [x] **Max — zakres MVP ustalony (v0.11, 8.9):** schemat kompletny ≠ wszystkie funkcje. W MVP: listy
      zamknięte + interwencja + domknięcie + zapis lokalny + bezpieczeństwo + forma. `emocjaWlasna`
      (wolny tekst), synchronizacja, agregat, embeddingi → v2 (pole gotowe, przełącznik później).
- [ ] **Max — model zgód w UI:** onboarding vs ustawienia, retencja lokalna (czyszczenie korpusu),
      eksport danych (RODO art. 20). Warunek przed synchronizacją/agregatem (8.9).
- [ ] **Max — kotwiczenie emocji embeddingami → v2** (dziś ręczny „to podobne do…"); ta sama technologia
      co #0006. Poza MVP (8.9).
- [ ] **Franek — domknąć etap 2 (odpowiada):** wpiąć odpowiadającego Franka w pętlę faithfulness,
      uruchomić pomiar golden setem end-to-end.
- [ ] Kolejność: domknąć DriverOS v0.1 czy najpierw uruchomić MasterADR do pierwszej złotówki
      (MasterADR ma krótszą drogę do przychodu).
- [ ] Forma prawna do inkasa (działalność nierejestrowana vs firma) — konsultacja księgowa.
- [ ] **RoboUmowaADR — decyzje produktowe:** zatwierdzić tryb środkowy formalnie; rozbudować zestaw
      testowy do ~15 pytań/koszyk z chunk-id; UX mini-testu w trasie.
- [ ] **Wiedza AI #0006 — domknięcie techniczne (następna sesja):** (1) dostroić progi `s_hi`/`s_lo`
      na realnym providerze; (2) docelowy model embeddingów (MiniLM = baseline offline, większy może
      podnieść 0,82); (3) **NAJWAŻNIEJSZE — przeredagować `why` dla 3 rozmytych tematów** (Dobór
      gaśnic 11 missów/8 faktów, Wyliczenie 1000 punktów, Reakcja po wypadku) — zadanie człowieka VKF,
      nie strojenie AI. Golden set (156 parafraz) i skrypty gotowe. (4) `asOf` domyślne (edycja 2025
      vs wybór). (5) provider lokalny (offline-first) vs hybryda.
- [ ] **Analiza „DriverOS AI Coach"** — osobna sesja: persony = workflowy? rozdzielenie warstwy
      deterministycznej (Decision) od wyjaśniającej (AI/RAG).
- [ ] Dopracowanie treści/UX workflowu **Tryb przed kontrolą**.
- [x] **Weryfikacja edycji ADR 2025 vs 2023 + 224 faktów `verifiedBy:null` — ZAMKNIĘTE 2026-07-23**
      przez migrację do biblioteki Guardian v2. Dziś: 239/239 `edition: ADR 2025`, 239/239
      `verifiedBy: domo`. Uwaga: to weryfikacja właściciela (OWNER), **nie doradcy DGSA** — formalna
      recenzja DGSA pozostaje osobnym krokiem przed komercjalizacją.
- [x] **Backend zgłoszeń Franka — ZAMKNIĘTE 2026-07-23** (P-17, P-18): Upstash Redis, bufor offline
      + synchronizacja, endpoint admin z tokenem, ochrona przed spamem. Sekcja D.3.4.
- [x] **Most zgłoszeń → biblioteka — ZAMKNIĘTE 2026-07-24** (P-19, P-20): `feedback-bridge.js`
      przetestowany, 0 sierot. Komentarze i fakty rozłączne. Sekcja D.3.6.
- [x] **Model dwuosiowy Trust Ladder — ZAMKNIĘTE 2026-07-23** (ADR-003 v2): T2 wycofany,
      `currency` jako osobna oś, `displaySignal()` jako jeden sygnał do UI. Sekcja B.1.

**Otwarte — MasterADR, przed oddaniem recenzentom:**
- [ ] **Wdrożyć paczkę v4 na Vercel:** baza Upstash + `FEEDBACK_ADMIN_TOKEN` + **redeploy**.
      Bez tego Franek zbiera lokalnie, ale nic nie dociera.
- [ ] **Sygnały zaufania niepodpięte do UI.** `i18n/signals.json` ma gotowe teksty w 5 językach,
      pola `_currency`/`_trust`/`_lifecycle` są w danych, ale **żaden kod ich nie czyta**. Dziś
      nieszkodliwe (wszystkie 239 to CURRENT/T1 — każdy dostałby ten sam napis); stanie się istotne,
      gdy część bazy zmieni status. **Warunek wstępny: `displaySignal()` po stronie aplikacji.**
- [ ] **Wspólna data przeglądu = ryzyko lawiny.** Wszystkie 239 wpisów ma `2026-07-23`; przy
      `reviewIntervalDays: 365` cała baza stanie się `LAPSED` **tego samego dnia (2027-07-23)**
      i wypadnie z paczki offline. Rozłożyć przeglądy albo dodać rozrzut do `policy.json`.
- [ ] Przegląd 11 faktów z `why` > 400 znaków (czytelność na małym ekranie).
- [ ] Przeredagować pytanie o kategorię transportową w kol. 15 tabeli A — numery kolumn niewiele
      mówią bez kontekstu. Kandydat potwierdzony przez test mostu (kategoria `niejasne` → 006-C).
- [ ] Skalibrować progi eskalacji w moście po poznaniu realnej skali ruchu.

**Techniczne (z BUILD_STATUS + TASK 8):**
- [ ] Przeciąć bramkę Node/Git (blokuje deploy)
- [ ] AI Engine: kontrakt → validator 100% → testy kontraktowe → realny provider
- [ ] `dependency-cruiser` jako CI-gate (Z-01)
- [ ] Usunąć/cross-walidować `ADR_Check_DE` (Z-02)
- [ ] `switch(kind)` → rejestr `Map<StepKind, StepExecutor>`
- [ ] Konflikt reguł: warn → twardy błąd przy publikacji
- [ ] Storage: PostgreSQL + IndexedDB, OfflinePackageBuilder

**Artefakty do napisania:**
- **#0004 — Knowledge Pipeline** (proces weryfikacji, role, narzędzia) — **następny krok**; domyka
  tryb „nie ma tego": jak zgłoszona luka (Franek-zbieracz dostarcza surowy materiał) staje się
  `KnowledgeVersion`.
- **#0005 — Offline Sync Protocol** (delta sync, checksumy, TIER-y).
- Zestaw testowy faithfulness → wpięcie w CI jako regression gate (8.5).

---
---

## G. RYNEK, POTENCJAŁ, INWENTARZ


---

## G.1 RYNEK I MONETYZACJA MASTERADR — DROGA DO PIERWSZEJ ZŁOTÓWKI

### Luka rynkowa (differentiator)
**Nie istnieje żadna grywalizowana apka ADR w stylu Duolingo.** Cała konkurencja to suche bazy pytań
i apki-encyklopedie. Silnik powtórek pokazujący fakt tuż zanim go zapomnisz to jedyny mechanizm,
którego re-skin konkurencji nie skopiuje trywialnie. To rdzeń przewagi.

### Miejsce w architekturze
Produkt marki Master w platformie DriverOS. Ta sama grupa docelowa co pozostałe pakiety treści
(Tachograf, Czas pracy, Pierwsza pomoc, Eco Driving, Załadunek, Mocowanie). Domyka pętlę na kierowcy
zawodowym.

### Framing (KRYTYCZNE)
Apka jest **DODATKIEM**, nie kursem akredytowanym: nie może twierdzić, że wydaje zaświadczenie ani
zastępuje obowiązkowy kurs stacjonarny. „Przygotowanie do egzaminu" — OK; „zdasz egzamin / dostaniesz
uprawnienia" — NIE. W Niemczech kursy online wprost niedozwolone.

### Analiza rynku (UE, Polska-first)
- Kierowcy z ADR to ~4% przewozów drogowych — rynek realny, niszowy, B2B-skłonny.
- **Niemcy:** ~190 000 ważnych zaświadczeń (2020, szacunek IHK Schwaben), ~34 000 wydawanych/
  odnawianych rocznie, ~591 akredytowanych ośrodków. Egzamin przez IHK, tylko po niemiecku, €45–75.
- **Polska** (rynek strategiczny — dom założyciela, największy przewoźnik drogowy UE: 368 mld
  tonokilometrów, 32,7% przewozów międzynarodowych UE w 2024). Brak publicznej statystyki liczby
  zaświadczeń.
- **Pula UE:** niskie miliony ważnych zaświadczeń (szacunek).

### Silnik popytu powracającego
Każde zaświadczenie odnawiane **co 5 lat** (kurs doskonalący + egzamin). Niedobór kierowców HGV
w Europie (~426 tys. w 2024, IRU; do 745 tys. do 2028); ADR daje premię płacową (w PL oferty
„Kierowca ADR" śr. ~7 800 zł brutto).

### Wymiar językowy (differentiator)
Egzaminy w językach narodowych. Duże populacje kierowców migrantów (UA/RU) z barierą językową;
wielojęzyczne narzędzia nauki niedoreprezentowane → **PL + UA/RU od startu**.

### Konkurencja
- **Apki-encyklopedie:** ADR Dangerous Goods (Magnus Wikhog), ADR Tool 2025 (ANOPS, Gdynia — 28
  języków), Dangerous Goods ADR Pro/Lite (mclang).
- **Suche bazy pytań (PL):** IMAGE (~40 zł/14 dni), TransUP (~29,99 zł), ABC Szkolenia (~29,99 zł/90
  dni), darmowe testy próbne.
- **Kanał inkumbenta:** akredytowane ośrodki — kurs stacjonarny **obowiązkowy**, apka go NIE zastępuje.
  Strategia: **sprzedać im licencje jako wartość dodaną**, zamiast walczyć o kanał.

### Kluczowe ryzyka rynkowe
1. Rynek mały/rozdrobniony (język, kraj). 2. Oficjalny katalog pytań chroniony — publiczne tylko
przykładowe. 3. Kontrola kanału przez ośrodki. 4. Epizodyczny charakter nauki (trudny stały abonament).

### Bramki poza kodem ⚠️ (łatwo niedoszacować, blokują tak samo twardo jak kod)

| Bramka | Sedno |
|---|---|
| **Własna baza pytań (NIE oficjalny katalog)** | Katalog ministerialny chroniony; publiczne tylko przykładowe. Budujesz WŁASNY bank wzorowany na programie. Skopiowanie = naruszenie. Bez tego apka jest nielegalna. |
| **Weryfikacja treści ADR (edycja 2025)** | ADR to publiczny akt UNECE — można parafrazować. Wersjonowanie do edycji (cykl 2-letni). |
| **Framing „dodatek ≠ kurs"** | Nie może twierdzić, że wydaje zaświadczenie/zastępuje kurs. „Przygotowanie" OK; „zdasz/dostaniesz uprawnienia" NIE. |
| **Procesor płatności + forma prawna** | Gumroad/Lemon Squeezy. Działalność nierejestrowana do progu (konsultacja księgowa — nie porada podatkowa). |
| **Regulamin + RODO** | Wymagane; regulamin zawiera rozgraniczenie „dodatek ≠ kurs". |

### Ścieżka krytyczna
**A (silnik żywy):** mikro-lekcje 5 typów pytań → kolejka Leitner (differentiator) → Node/Git + Vite →
deploy PWA → darmowy hak → pierwsi użytkownicy. *(Silnik + 239 faktów działają; blokada: Node/Git +
deploy.)*
**B (content za bramką):** własna baza pytań → symulacja egzaminu (30 pytań / 60 min / próg 2/3) →
streak + cel dzienny + XP.
**C (konwersja):** weryfikacja + framing → regulamin/RODO → płatność + bramka unlock → 🎯 **pierwsza
złotówka**.

**Pierwsza akcja:** silnik mikro-lekcji + kolejka Leitner (czysta logika, testowalna bez UI i contentu).

### Czego świadomie NIE robić przed pierwszą złotówką
Moduły cysterny/klasa 1/klasa 7 · pełne UA/RU jako blokada · ligi/leaderboardy (wymagają masy) ·
half-life regression (Leitner wystarczy) · B2B · treści społeczności bez moderacji · system serc/
energii karzący za błędy (błąd = nauka, nie kara).

### Mechaniki nauki i grywalizacji (hybryda Duolingo + SoloLearn)
Treść ADR jest faktograficzno-proceduralna — bliżej programowania (SoloLearn) niż otwartego języka.
**Architektura treści** idzie za SoloLearn (ucz-quiz-zastosuj, moduły liniowe, skończone curriculum).
**Silnik retencji** idzie za Duolingo — kierowca musi utrzymać wiedzę bezpieczeństwa przez 5 lat.
Duolingo używa half-life regression (HLR): p = 2^(−Δ/h); błąd HLR ~o połowę niższy niż Leitner; HLR
poprawił dzienne zaangażowanie o **12%** (Settles & Meeder, ACL 2016). **Dla MVP: Leitner wystarczy**
— HLR dopiero gdy są dane o ruchu.

---

---

## G.2 POTENCJAŁ — DŹWIGNIE I RYZYKA

**Dźwignie:**
1. **Architektura silnika jako moat** — konkurencja robi apki; ty budujesz fundament pod wiele
   produktów Master. Koszt startu kolejnego spada do dni, jeśli utrzymasz dyscyplinę „TravelOS bez
   linii w core/".
2. **Fundament już działa** (47/47 testów, workflow end-to-end). To nie deck — działający rdzeń.
3. **Luka rynkowa MasterADR realna i pusta** — zero grywalizowanych konkurentów, rynek powracający
   (cykl 5-letni), największy przewoźnik UE jako baza.
4. **Ekspertyza ADR = treść = moat** (239 faktów, otagowane; kompendium 2023 + ext-2025). Trudne do
   skopiowania.
5. **Dowodowość jako argument sprzedażowy** — DecisionRecord + Incident wskazujący wersje przepisów —
   unikat w obronie przy mandacie/w sądzie.
6. **Pętla feedbacku działa bez czekania na AI** (Franek-zbieracz) — obniża ryzyko inwestycji w RAG.
7. **Korpus check-inów Maxa jako aktywum (scalone z gałęzi B v0.9)** — dane o wychodzeniu z utknięcia
   powstają samoczynnie z użycia. Wartość: personalizacja per-user + doskonalenie interwencji na
   agregacie (moat, którego tracker nastroju nie zbuduje) + potencjalna wartość badawcza/komercyjna
   korpusu. Warunek: schemat projektowany jako dane od pierwszego zapisu (sekcja 8.7). Warstwa wrażliwa
   (zdrowie psychiczne) → RODO/minimalizacja od startu.

   > **Hipoteza odległa — NARRACJA, NIE INŻYNIERIA (parkowana).** Inspiracja Emotion Engine
   > („Wielka powódź", 2025): korpus emocjonalny Maxa jako „ziarno" ewolucji silnika emocji w nowym
   > bycie. **Świadomie poza roadmapą techniczną.** Realny, budowalny odpowiednik tej wizji to *silnik,
   > który coraz trafniej odczytuje cudzy stan* (ewolucja trafności), nie *byt mający własne emocje*
   > (ewolucja jaźni — dziś nieosiągalne i nieweryfikowalne). Zapis zachowany, by wizja nie zginęła i by
   > za jakiś czas nikt nie potraktował jej jako podjętej decyzji. Do rozmowy filozoficznej, nie do
   > planowania produktu. Nie mylić z celem inżynierskim.

**Ryzyka:**
1. **AI Engine 21% pokrycia** — najsłabszy punkt platformy. Naprawa przed realnym użyciem AI.
2. **Rynek niszowy i rozdrobniony** (język, kraj, epizodyczność) → jednorazowy unlock, nie abonament.
3. **Bramki pozakodowe** (własna baza pytań, framing prawny, RODO) — łatwe do niedoszacowania.
4. **Kontrola kanału przez akredytowane ośrodki** — obejście przez B2B, nie walkę.
5. **Ryzyko monolitu** przy wzroście — CI-gate (dependency-cruiser), rejestr executorów, podział
   `shared/types`.
6. **Pojedyncza zależność infrastrukturalna** (Node/Git na jednym sprzęcie) — bottleneck do przecięcia.
7. **Dług weryfikacyjny:** 224/239 faktów `verifiedBy:null` — rośnie z bazą, koszt przed komercjalizacją.

---

---

## G.3 INWENTARZ PLIKÓW PROJEKTU

**Fundament (Biblia):** `To_jest_Artefakt_0001.pdf` (Konstytucja), `Artefakt_0002_Guardian_Domain_Model.md`,
`Artefakt_0003_Platform_Specification.md`, `Artefakt_0004_Learning_Engine.md`,
`Guardian_Engine_Engineering_Handbook.pdf`, `README-3.md`, `PROJECT_MAP.md`, `BUILD_STATUS.md`,
`STARTUP_CHECKLIST.md`, `INSTRUKCJA.md`, `DEPLOY_INSTRUKCJA.pdf`.

**Wiedza projektu (konsolidacje):** `GUARDIAN_ENGINE_MASTER_KNOWLEDGE_v0_7…` (ten plik — single source
of truth), `MASTER_WIEDZA_MARKI.md` (hierarchia Master, wchłonięty do v0.7), starsze v0.2–v0.6
(ślad ewolucji).

**Wiedza AI (#0006):** `Artefakt_0006_Wiedza_AI_szkic.md`, `Artefakt_0006_Wiedza_AI_v0_2.md`.

**RoboUmowaADR (analiza RAG):** `RoboUmowaADR_analiza_Wiedza_AI.md`,
`RoboUmowaADR_zestaw_testowy_faithfulness.md` (+ `_v2`), `roboumowaadr-przeplyw.html` (+ `-v2`),
`guardian-workflow-map.html`, `knowledge-pipeline-0004.html`.

**Biblioteka wiedzy (NOWE v1.1):** `guardian-knowledge-v2-PUBLISHED.zip` — **źródło prawdy dla treści
MasterADR**. Zawiera `entries/` (455 plików: 239 PUBLISHED + 216 DRAFT), `editions/`, `policy.json`
(progi i bramki kanałowe), `library/currency-index.json` (cache, odtwarzalny), `i18n/signals.json`
(teksty `displaySignal()` w 5 językach), `scripts/` (migrate, report, carry-forward, currency, verify,
fix-caps, export-to-app, **feedback-bridge**), `ADR-003-v2-model-dwuosiowy.md`, `MIGRACJA-README.md`,
`PODLACZENIE.md`, `caps-do-naprawy.csv`.

**Paczka wydaniowa (NOWE v1.1):** `MasterADR-v4-recenzja.zip` — scalenie treści z biblioteki
i backendu Franka: `index.html` (239 faktów + moduł synchronizacji), `api/feedback.js`,
`api/feedback-admin.js`, `package.json` (@upstash/redis), `sw.js` v4, `vercel.json`, ikony, README
z instrukcją wdrożenia.

**Kod / prototypy:** `MasterADR-prototyp-v2.html` (**plik produkcyjny, 239 faktów, edycja in-place**),
`MasterADR.html`, `MasterDriver.html`, `MasterADHD-checkin-prototyp.html` (**prototyp Maxa — check-in,
3 akty, rule engine, offline, Guardian ID**), `MasterADHD-Max-gadajacy-AB.html` (**gadający Max: A/B,
LLM w artefakcie, forma językowa, granica bezpieczeństwa, mapa — v0.9**), `DriverOS.jsx`,
`AdrTrainer218.jsx` (historyczne 218 faktów), `engine_test.js`, `leitner.js`, `lesson.js`.

**Rynek / strategia:** `ADR_DUOLINGO_PIERWSZA_ZLOTOWKA.md`,
`Gamified_ADR_Driver_Certification_App__EU_Market_Opportunity_and.md`,
`ADR_Driver_Certification__Knowledge-Scope_Map_for_a_Gamified_Lea.md`,
`Duolingo_and_SoloLearn_Mechanics__A_Hybrid_Blueprint_for_an_ADR.md`, `ADR_ARCHITEKTURA_TRESCI.md`,
`CONTENT_ANALYSIS.md`, `MasterADR_Monetization_Models_and_Realistic_Revenue_Ranges_for_a.md`,
`MasterADR_WIEDZA_PROJEKTU.md` (część odniesień do CITADEL nieaktualna).

**Źródła wiedzy (7 pakietów DriverOS):** `Wiarygodne_źródła_ADR_dla_aplikacji_DriverOS_Trener_ADR__katalog.md`,
`Wiarygodne_źródła_wiedzy_o_pierwszej_pomocy_na_miejscu_wypadku_d.md`,
`DriverOS___Macierz_źródeł_treści__7_pakietów_.md`,
`DriverOS_Knowledge_Base_Sources__Driving_Time__EC_561_2006__and.md`,
`DriverOS_Knowledge_Sources__Eco_Driving__Loading_and_Cargo_Secur.md`, `ADR_Training_Distribution.md`.

**Analiza konkurencji / prawo:** `DriverOS_Guardian_Engine__Technical_and_Legal_Analysis_of_Digita.md`,
`DriverOS_Guardian_Engine__Analiza_konkurencji_i_luk_rynkowych_ta.md`.

**Materiały źródłowe:** 40+ zdjęć `20260716_*.jpg/webp` (skany kompendium ADR).

> Nazwy plików historycznych (`ADR_DUOLINGO_*`, `AdrTrainer218.jsx`, „Guardian_*") zawierają nazwy
> sprzed uporządkowania hierarchii. Zawartość merytoryczna pozostaje ważna — nie trzeba przemianowywać
> plików źródłowych.

---

---

### G.4 ARCHIWUM — decyzje wycofane i ślad ewolucji

> Nic nie kasujemy. Wycofana decyzja zostaje tu z powodem, żeby za pół roku nikt nie zaproponował
> jej ponownie jako „nowego pomysłu".

**Decyzje wycofane:**

| # | Co postanowiono | Dlaczego wycofano | Zastąpiona przez |
|---|---|---|---|
| P-06 | Franek etap 1 = tylko zbieracz uwag, bez AI | Etap, nie stan docelowy. Bez odpowiadającego Franka nie da się zmierzyć faithfulness (#0006) | P-07 (etap 2 — odpowiada w zamkniętej pętli) |
| — | Franek jako panel pokazujący `why`/`adrRef` w trakcie odpowiadania | **Zdradzał odpowiedź przed odpowiedzeniem** — psuł naukę. Odrzucone tego samego dnia | P-06 → P-07 |
| — | Scalenie Wiedza AI = AI Coach = RoboUmowaADR we wspólną markę | Złamałoby granicę produktową i filtr modułu. Użytkownik wycofał pomysł | P-04 (osobne byty) |
| — | Nazwa „Guardian Knowledge Engine" dla silnika RAG | Kolizja z silnikiem Knowledge Engine (A.4.1) | P-03 (nazwa: **Wiedza AI**) |
| — | „ADR Duolingo" jako nazwa produktu | Pożyczał cudzą markę — ryzyko prawne | P-01 (**MasterADR**) |
| — | „Master ADR" (ze spacją) | Etap pośredni, niespójny z prefiksem marki | P-01 (**MasterADR**) |
| — | CITADEL / Driver's Shield / DIETA-ENGINE w drzewie produktowym | Osobny prywatny poligon nauki projektowania z AI, nie produkt. Nakładanie nazw przez wspólne środowisko powstawania | P-02 (poza stosem) |
| — | `adrRef` jako granica chunku (pierwotne 006-A) | Powtarza się w kilkunastu faktach i bywa opisowy | 006-A (fakt = chunk) |
| — | Boost `adrRef` w retrievalu jako droga do poprawy hit@k | Strojenie 0,05→0,15 dało **zero poprawy** na parafrazach bez sygnatury | 006-C, wniosek 1 |
| — | Metryka `id`-ścisła w pomiarze retrievalu | Baza ma wielokrotne pokrycie tematów; ścisła metryka dała fałszywe 0,53 | 006-C, wniosek 2 (metryka tematyczna) |
| — | TF-IDF na pytaniach=fiszkach jako pomiar | Sufitowe 0,99 — **kłamstwo pomiarowe** (mierzyło dopasowanie do samego siebie) | 006-C (embeddingi + parafrazy) |
| — | Konflikt reguł jako `warn` | Łamie Domain Model §4 (remis = błąd walidacji przy publikacji) | twardy błąd przy publikacji (F.2) |
| M-03 | Wersjonowanie przez nowy plik przy każdym przyroście | Wersjonowanie *nazwy pliku* zamiast *treści*. Efekt: 9 plików `MASTER_KNOWLEDGE_v0_*`, kolizja numeru 0.9, brak jasności który wgrać | M-04 (GENESIS, jeden plik, wersja w środku) |

**Ślad ewolucji Master Knowledge (v0.1 → v0.11 → GENESIS v1.0):**

| Wersja | Przyrost |
|---|---|
| v0.1 | Konstytucja, Domain Model z encjami, Platform Spec, rynek, „co model gwarantuje za 2 lata" |
| v0.2 | Mapa nazw + MasterADR kanon + CITADEL out |
| v0.3 | Wiedza AI jako RoboUmowaADR; Franek jako nazwa produktu klienckiego |
| v0.4 | Artefakt #0006 (5 ADR-ów) + kanoniczna formuła T4 + Franek = twarz |
| v0.5 | 006-C **zmierzone** (hit@3 = 0,82) |
| v0.6 | Mapa nazw Franek/DriverOS/MasterADR (2.3b) |
| v0.7 | Hierarchia Master + dziennik prototypu |
| v0.8 | Max (twarz MasterADHD) + asymetria Franek↔Max + wzorzec twarzy |
| **v0.9** | **ROZGAŁĘZIŁO SIĘ** — dwa pliki z tym samym numerem (A: prototyp+bezpieczeństwo+forma; B: korpus+Emotion Engine). Numer spalony |
| v0.10 | Scalenie obu gałęzi |
| v0.11 | Schemat danych check-inu (8.9) + zakres MVP + trzy poziomy zgody RODO |
| **GENESIS v1.0** | **Konsolidacja bez cięcia.** Baza: v0.11. **Odzyskane z v0.1:** pełny Domain Model (encje, inwarianty, Bounded Contexts, reguły zależności, „co model gwarantuje za 2 lata") — wypadły z konsolidacji v0.2–v0.11. **Dodane:** sekcja BOOT, rejestr decyzji E (append-only), archiwum G.4. **Zmiana metody:** M-03 → M-04 |

> **Uwaga o utracie treści.** Diff nagłówków v0.1…v0.11 wykazał, że warstwa techniczna Domain Model
> (encje `KnowledgeEntry`, `KnowledgeVersion`, `SituationContext`, `Rule`, `WorkflowDefinition`,
> `Incident`, `StructuredContent`, `OfflinePackage`, pętla wiedzy) była w v0.1, a od v0.2 została
> zredukowana do trzech zdań o ADR-001/002/003. To nie był duplikat Artefaktu #0002 — to był jedyny
> skonsolidowany zapis w linii Master Knowledge. **Przywrócony w sekcji C.** Wniosek metodyczny:
> konsolidacja bez diffu gubi treść po cichu; stąd M-04 i append-only.


---

## RYTUAŁ KOŃCA SESJI

Ostatni prompt każdej sesji — w Claude lub ChatGPT:

> Zaktualizuj sekcje **F.1 (stan)**, **E (decyzje)** i **F.2 (otwarte)** w GENESIS.md na podstawie tej
> rozmowy. Zwróć **tylko zmienione fragmenty jako diff**, nie przepisuj całego pliku. Nowe decyzje
> dopisz z kolejnym numerem; jeśli któraś decyzja została wycofana — oznacz `wycofana → #N` i dopisz
> wiersz do G.4.

Diff wklejasz ręcznie. Świadomie — to wymusza, że przeczytasz, co model uznał za decyzję.
Automatyzacja tego kroku to najszybszy sposób na wpisanie halucynacji do kanonu.

**Gdzie osadzić:**
- **Claude** → Project Knowledge (czyta automatycznie, nie wklejasz).
- **ChatGPT** → sekcja 0 BOOT do Project Instructions, całość jako plik projektu.
- Nigdy dwie sesje edytujące równolegle. Jedna sesja = jeden autor, potem merge do GENESIS.

**Kiedy podzielić:** gdy plik przekroczy ~1500 linii, dziel po **częstotliwości użycia**, nie po
temacie: `GENESIS.md` (0, A, B, E, F — czytane zawsze) + `REFERENCE.md` (C, D, G — na żądanie).

---

---

*GENESIS — Guardian Engine, v1.1 (baza v1.0). Hierarchia: Guardian Engine (silnik) → DriverOS
(platforma) → Master (produkty).*

**Co wnosi v1.1 (sesja 2026-07-23/24):**
- **ADR-003 v2 — model dwuosiowy.** T2 VERIFIED_STALE **wycofany**; `trustLevel` (skąd wiem) i
  `currency` (czy aktualne) rozdzielone, UI dostaje jeden sygnał przez `displaySignal()`. Zmierzone
  na 239 wpisach: T2 216→0, T1 15→231, bramki bez zmian. **To korekta modelu opisanego w v1.0.**
- **Biblioteka Guardian v2 jako źródło prawdy dla treści** — 239 PUBLISHED + 216 DRAFT (historia).
  Build aplikacji = eksport, nie miejsce edycji faktów. **Zakres M-01 zawężony do warstwy aplikacji.**
- **Backend Franka** (P-17, P-18): uwagi trafiają do własnej bazy Upstash, `localStorage` zostaje
  buforem offline. Ustalono, że *Vercel KV jako produkt już nie istnieje*.
- **Most zgłoszeń** (P-19, P-20): komentarze i fakty to **rozłączne kategorie** — rozróżnienie
  wniesione przez właściciela, wpisane w `feedback-bridge.js`. Zgłoszenie to obserwacja, nie werdykt.
- **Rozjazd dwóch gałęzi wykryty i scalony** (M-05, M-06): paczka nowsza treścią zgubiła backend.
  Stąd reguła: porównuj gałęzie programowo, testuj zawartość ZIP-a, nie katalog roboczy.
- **MasterDriver przestał być konceptem** — działający prototyp wielomodułowy (D.4).

**Domknięte z listy OPEN v1.0:** weryfikacja ADR 2025 vs 2023 i 224 faktów `verifiedBy:null`
(uwaga: weryfikacja OWNER, **nie DGSA** — recenzja doradcy pozostaje osobnym krokiem).

**Otwarte i pilne:** wdrożenie paczki v4 (baza + token + redeploy); sygnały zaufania niepodpięte do
UI mimo gotowych tekstów; **wspólna data przeglądu 2026-07-23 → cała baza wygasa 2027-07-23 naraz**.

*Od szczegółu do ogółu. Append-only: decyzje się nie kasuje, przenosi do G.4 ze statusem wycofana.*
