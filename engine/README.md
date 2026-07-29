# ADR Trener — `core/learning` (Faza 0)

Rdzeń grywalizowanej mikronauki ADR. **Offline-first, zero AI, czyste funkcje,
serializowalny stan** (leci prosto do local storage telefonu — bez backendu).

To jest Faza 0 z roadmapy AI (`ADR_ROADMAPA_AI_4_FAZY.md`): sam Leitner, bez ani
jednego wywołania API. AI wchodzi dopiero w Fazach 1–3, warstwami, na wierzch tego
samego silnika — nic się tu nie forkuje.

## Warstwy

| Plik | Rola | Czystość |
|---|---|---|
| `src/leitner.ts` | Silnik powtórek: 5 pudełek, interwały, kolejka „do powtórki" | czyste funkcje |
| `src/lesson.ts` | Pętla mikro-lekcji: `pickFormat` (rampa mcq→scenario), `buildSession` | czyste funkcje |
| `src/session.ts` | Sesja ze stanem + zapis talii po każdej odpowiedzi | warstwa efektów |
| `src/gamification.ts` | Streak z zamrożeniem, XP, cel dzienny (bez serc, bez lig) | czyste funkcje |
| `src/index.ts` | Jeden punkt wejścia (barrel) | — |

## Uruchomienie

```bash
npm install
npm test        # 62 testy
npm run typecheck
```

## Kluczowe decyzje projektowe

- **Twardy zrzut Leitnera** (błąd → pudełko 1, nie −1): treść safety-critical,
  lepiej powtórzyć za często niż za rzadko.
- **Format rośnie z pudełkiem** (`pickFormat`): świeży fakt = rozpoznanie/mcq,
  opanowany = scenariusz. `mcq` to gwarantowany fallback (walidowany importem).
- **Zapis po każdej odpowiedzi**: zero utraty postępu, gdy apka zginie bez zasięgu.
- **Storage wstrzykiwany interfejsem** (`DeckStore`): telefon = local storage,
  testy = atrapa w pamięci. Rdzeń niezależny od platformy.
- **Bez serc/energii i bez lig**: błąd u zawodowca to nauka, nie kara; ligi martwe
  bez masy userów (Faza 2).

## Czego tu NIE ma (świadomie, Faza 0)

- **Realny content** — 218 pozycji ADR trzeba zmapować na typ `Fact` z `lesson.ts`.
- **UI** — renderer nad stanem sesji (scaffold Capacitor jest w `INSTRUKCJA.md`).
- **Symulacja egzaminu** — 30/60/próg 2/3, odłożona jako osobny tryb.
- **AI** — Fazy 1–3.

## Integracja

```ts
import { LessonSession, inMemoryStore, registerActivity, awardCorrect, dayIndex } from "./core/learning";

const session = LessonSession.start(facts, store);   // store = twój DeckStore nad local storage
let ex = session.current();                            // { factId, format, box }
const res = session.submit(true);                      // aktualizuje Leitnera + zapisuje talię
// po sesji: registerActivity/awardCorrect na stanie gamifikacji
```
