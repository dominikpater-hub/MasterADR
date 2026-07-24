# Podłączenie MasterADR ↔ biblioteka

## Kierunek przepływu

```
                    entries/  ←── ŹRÓDŁO PRAWDY
                       │
                       │  export-to-app.js   (build-time, jednokierunkowo)
                       ↓
                  index.html  ←── ARTEFAKT (nigdy nie edytowany ręcznie)
                       │
                       │  deploy → Vercel
                       ↓
                  kierowca / recenzent
                       │
                       │  „Wyślij uwagę" → api/feedback.js → Redis
                       ↓
                     Redis
                       │
                       │  feedback-bridge.js   (kierunek powrotny)
                       ↓
                    inbox/    ←── SYGNAŁY, nie decyzje
                       │
                       │  CZŁOWIEK czyta i rozstrzyga (P-19)
                       ↓
                    entries/
```

Pętla się domyka. Dziś urywa się na Redis.

## Dlaczego build-time, a nie fetch

Rozważane i **odrzucone**: `index.html` pobiera `knowledge.json` z sieci.

PWA jest offline-first, a service worker serwuje `index.html` network-first
z fallbackiem do cache. Osobny `knowledge.json` to drugi, niezależnie
cache'owany zasób — kierowca mógłby dostać nową aplikację ze starą bazą
albo odwrotnie. Skoro `currency` bramkuje paczkę offline, rozjazd wersji
jest dokładnie tym, czego nie chcemy. Jeden artefakt = jedna wersja.

Baza zmienia się co kilka tygodni, nie co godzinę. Fetch dokłada opóźnienie
startu i nowy tryb awarii bez korzyści dla kierowcy.

## `factId` — dlaczego to pole musi istnieć

Zgłoszenia w Redis są kluczowane po `factId`. Carry-forward zmienia `id`
wpisu (`b1-def` → `b1-def@adr-2025`), więc bez stabilnego `factId` **cała
historia uwag urwałaby się przy każdym przejściu edycji**.

Rozwiązanie: wpis ma dwa identyfikatory.

| pole | zmienia się | do czego |
|---|---|---|
| `factId` | nigdy | klucz zgłoszeń, `id` w aplikacji |
| `id` | przy carry-forward | konkretna wersja, plik w `entries/` |

Aplikacja dostaje `factId` jako `id`, a wersję w `_entryId`.

## Uruchomienie

```bash
# 1. migracja z aplikacji do biblioteki (jednorazowo)
node scripts/migrate.js --src index.html --out ./entries --owner domo --sighted

# 2. stan aktualności
node scripts/report.js

# 3. przeniesienie na obowiązującą edycję (bez tego aplikacja się skurczy)
node scripts/carry-forward.js --from adr-2023 --to adr-2025 --dry-run
node scripts/carry-forward.js --from adr-2023 --to adr-2025 --apply

# 4. eksport do aplikacji
node scripts/export-to-app.js --app index.html --out index.html --channel offline_pack

# 5. PODBIJ CACHE w sw.js  ← inaczej recenzenci zobaczą starą wersję
# 6. deploy

# 7. co jakiś czas: ściągnij zgłoszenia do inbox
node scripts/feedback-bridge.js --url https://masteradr.vercel.app --token XXX
```

## Zmierzone (239 wpisów z nowej aplikacji)

| krok | wynik |
|---|---|
| migracja | 239/239, 0 błędów |
| przed carry-forward | 216 LAPSED / 23 CURRENT |
| eksport bez carry-forward | **do aplikacji trafia 23** ⚠ |
| po carry-forward | 239 CURRENT |
| eksport po carry-forward | 239/239, 0 zablokowanych |

Bez kroku 3 aplikacja kurczy się z 239 faktów do 23. Eksporter ostrzega
o tym na stderr i przerywa, gdy bramka odrzuci wszystko.

## Czego most **nie** robi

`feedback-bridge.js` zapisuje sygnały do `inbox/` ze `status: PENDING`
i `decision: null`. Nie ustawia `drift`, nie zmienia `currency`, nie
dotyka `entries/`.

Powód: trzech kierowców może zgłosić „błąd", bo nie rozumieją przepisu.
To sygnał o treści (może niejasna), nie dowód, że prawo się zmieniło.
Kategorie niosą różną wagę:

| kategoria | co zwykle znaczy |
|---|---|
| `blad` | drift **albo** błędna treść — wymaga sprawdzenia |
| `literowka` | treść, nie prawo |
| `niejasne` | sygnał dla 006-C (te same rozmyte tematy) |
| `trudne` | dydaktyka, nie prawo |

Człowiek wpisuje `decision`: `DRIFT` / `CONTENT` / `DISMISS`.

## Sieroty

Most raportuje „sieroty" — zgłoszenia do `factId`, których nie ma
w bibliotece. Zwykle znaczy, że aplikacja wyprzedza bibliotekę albo
`factId` się rozjechało. Warto pilnować, żeby ta liczba była zerowa.
