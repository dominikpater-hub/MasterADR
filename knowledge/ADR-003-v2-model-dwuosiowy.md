# ADR-003 v2 — Trust Ladder w modelu dwuosiowym

**Status:** ZAAKCEPTOWANY · **Data:** 2026-07-23 · **Zastępuje:** ADR-003 v1 (Artefakt #0002)
**Decydent:** właściciel produktu · **Wdrożone w:** `policy.json`, `scripts/currency.js`

---

## Kontekst

ADR-003 v1 definiował cztery poziomy zaufania, w tym **T2 VERIFIED_STALE** —
„KnowledgeVersion po terminie review", prezentowany jako *„wymaga weryfikacji,
stan na [data]"*. W tym modelu **upływ czasu degradował `trustLevel`**.

Wdrożenie schematu wiedzy v2 wprowadziło niezależną oś `currency`
(`CURRENT` / `STALE` / `LAPSED` / `DRIFTED`) wraz z bramkami kanałowymi,
które decydują o dystrybucji treści per kanał (`online`, `offline_pack`,
`rag_corpus`). Powstała kolizja: **dwa mechanizmy opisywały aktualność**,
a przełącznik `trustLadderCompat.mapCurrencyToT2` odraczał rozstrzygnięcie.

## Problem

Przy `mapCurrencyToT2: true` dwa jakościowo różne stany otrzymywały
**tę samą etykietę T2**:

| stan | co realnie znaczy | etykieta w v1 |
|---|---|---|
| `LAPSED` | minął rok od przeglądu; nic nie wskazuje, że prawo się zmieniło | T2 „wymaga weryfikacji" |
| `DRIFTED` | watcher wykrył zmianę przepisu **albo** źródło milczy > 14 dni (`failClosed`) | T2 „wymaga weryfikacji" |

Wpis `DRIFTED` jest blokowany we wszystkich kanałach jako niepewny, ale
komunikat *„wymaga weryfikacji, stan na [data]"* sugeruje kierowcy lekkie
przeterminowanie — „w zasadzie prawidłowe, tylko odśwież". To utrata
rozdzielczości dokładnie tam, gdzie stawka jest najwyższa: treść
safety-critical, na podstawie której kierowca decyduje, czy zaufać.

Dodatkowo bramki kanałowe **już działały na `currency`**, więc degradacja
`trustLevel` zegarem była drugim, redundantnym mechanizmem — z ryzykiem
rozjazdu między nimi.

## Decyzja

**Model dwuosiowy. `trustLevel` nie jest degradowany upływem czasu.**

| oś | odpowiada na pytanie | wyliczana z |
|---|---|---|
| `trustLevel` | **skąd to wiem** | `source` / `verifiedBy` (ADR-006-B) |
| `currency` | **czy to nadal aktualne** | zegar przeglądu + watcher źródła |

Konsekwencje dla poziomów:

- **T1 VERIFIED** — źródło mocne (`kompendium` lub przegląd `VERIFICATION`)
- **T2 VERIFIED_STALE** — **wycofany**; aktualność opisuje `currency`
- **T3 AI_ASSISTED** — źródło słabe (`research`, `verifiedBy: null`)
- **T4 FALLBACK** — brak trafienia nad progiem (bez zmian, formuła kanoniczna)

`T2` pozostaje zarezerwowany w enumie wyłącznie dla trybu zgodności
wstecznej (`mapCurrencyToT2: true`), który nie jest już modelem kanonicznym.

## Kontrakt UI — jeden sygnał, nie dwie osie

Dwuosiowość żyje **w silniku**. Kierowca ogląda jeden komunikat, złożony
deterministycznie funkcją `displaySignal(entry, currency, trustLevel, channel, policy)`.
Kolejność reguł jest istotna: **blokada bije poziom zaufania**, bo „nie ufaj"
to inny komunikat niż „odśwież".

| warunek | `level` | `usable` | znaczenie dla kierowcy |
|---|---|---|---|
| `currency = DRIFTED` | `BLOCKED` | nie | treść wstrzymana — przepis mógł się zmienić |
| bramka kanału = `block` | `BLOCKED` | nie | niedostępne w tym kanale (np. LAPSED offline) |
| `currency = LAPSED` | `DATED` | tak | stan na datę — po terminie przeglądu |
| `currency = STALE` | `UNREVIEWED` | tak | brak przeglądu liczącego się do higieny |
| `trustLevel = T1` | `VERIFIED` | tak | zweryfikowane, bez zastrzeżeń |
| pozostałe | `AI_SOURCED` | tak | wskazówka AI, nie porada prawna |

`label` jest **kluczem i18n**, nie gotowym tekstem — aplikacje tłumaczą go
na pięć języków.

## Zmierzony efekt (239 wpisów, asOf 2026-07-23)

| | przed (`true`) | po (`false`) |
|---|---|---|
| T1 | 15 | **231** |
| T2 | 216 | **0** |
| T3 | 8 | 8 |
| `currency: LAPSED` | 216 | 216 (bez zmian) |
| bramka `offline_pack: block` | 216 | 216 (bez zmian) |

**Bezpieczeństwo dystrybucji nie ucierpiało** — te same 216 wpisów pozostaje
zablokowanych w paczce offline. Zmieniła się wyłącznie etykieta pochodzenia:
wpis ze zweryfikowanego kompendium nie udaje już „gorszego źródła" tylko
dlatego, że minął rok od przeglądu.

## Konsekwencje

**Pozytywne**
- `DRIFTED` i `LAPSED` dają różne komunikaty — rozdzielczość zachowana
- Jeden mechanizm aktualności (`currency` + bramki), koniec redundancji
- `trustLevel` stabilny: nie zmienia się bez zmiany źródła — łatwiejszy audyt
- Zgodność z ADR-006-B („LLM nie widzi ani nie ustala trustLevel")

**Koszty**
- Konsumenci (MasterADR, MasterDriver, DriverOS, RAG) muszą wołać
  `displaySignal()` zamiast czytać samo `trustLevel`
- Dokumentacja i materiały mówiące „T2 = wymaga aktualizacji" wymagają korekty
- Nowy koncept (`currency`) w modelu — ale **nie w UI**

**Ryzyko i jego ograniczenie**
- Ryzyko: konsument pominie `displaySignal()` i pokaże surowe `trustLevel`,
  gubiąc blokadę `DRIFTED`.
- Ograniczenie: `displaySignal()` zwraca `usable: false` — konsument, który
  renderuje treść bez sprawdzenia tego pola, łamie kontrakt. Do rozważenia
  bramka CI sprawdzająca, że eksportery nie serializują `trustLevel` bez
  towarzyszącego `currency`.

## Ścieżka powrotu

`policy.json > trustLadderCompat.mapCurrencyToT2 = true` przywraca zachowanie
v1 bez migracji rekordów — progi i tryb żyją w polityce, nie w 239 wpisach.
Powrót nie jest planowany; flaga istnieje jako zabezpieczenie.

## Do rozstrzygnięcia osobno

- Teksty i18n dla sześciu kluczy `signal.*` w pięciu językach
- Czy `UNREVIEWED` i `DATED` różnią się wizualnie w UI, czy dzielą jeden styl
  (dziś różnią się tylko komunikatem)
