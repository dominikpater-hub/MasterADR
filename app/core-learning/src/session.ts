/**
 * session.ts — warstwa sesji ze stanem (Faza 0, offline, zero AI).
 *
 * Spina pętlę lekcji z silnikiem Leitnera i z zapisem talii. To jedyna warstwa
 * "z ruchomymi częściami": prowadzi kierowcę przez ćwiczenia po kolei, przyjmuje
 * odpowiedzi, wpycha je z powrotem do Leitnera i utrwala talię przez wstrzyknięty
 * storage. Sam storage jest interfejsem — na telefonie to local storage/plik,
 * w testach to atrapa w pamięci. Dzięki temu rdzeń zostaje offline-first i
 * niezależny od platformy.
 */

import { DeckState, answer, dueCount } from "./leitner";
import { Exercise, Fact, buildSession } from "./lesson";

/** Minimalny kontrakt zapisu. Na telefonie: local storage. W testach: mapa. */
export interface DeckStore {
  load(): DeckState | null;
  save(deck: DeckState): void;
}

/** Wynik pojedynczej odpowiedzi wewnątrz sesji. */
export interface AnswerResult {
  factId: string;
  correct: boolean;
  /** Ile ćwiczeń zostało w tej sesji po tej odpowiedzi. */
  remaining: number;
  /** Czy sesja się skończyła. */
  finished: boolean;
}

/** Podsumowanie zakończonej sesji (pod ekran wyniku + gamifikację). */
export interface SessionSummary {
  total: number;
  correct: number;
  /** Ile faktów wciąż czeka do powtórki po tej sesji (licznik "do powtórki"). */
  dueAfter: number;
}

/**
 * Żywa sesja nauki. Trzyma listę ćwiczeń, wskaźnik postępu i bieżącą talię.
 * NIE jest czysta z założenia — to warstwa efektów (zapis). Rdzeń pod spodem
 * (leitner/lesson) zostaje czysty i to on jest w pełni przetestowany.
 */
export class LessonSession {
  private exercises: Exercise[];
  private index = 0;
  private correctCount = 0;
  private deck: DeckState;

  private constructor(
    private facts: Fact[],
    private store: DeckStore,
    deck: DeckState,
    exercises: Exercise[],
    private now: () => number,
  ) {
    this.deck = deck;
    this.exercises = exercises;
  }

  /**
   * Startuje sesję: ładuje talię ze storage, buduje lekcję z faktów due.
   * `nowFn` wstrzykiwany dla testowalności (domyślnie Date.now).
   */
  static start(
    facts: Fact[],
    store: DeckStore,
    size = 7,
    nowFn: () => number = Date.now,
  ): LessonSession {
    const deck = store.load() ?? { cards: {} };
    const exercises = buildSession(facts, deck, nowFn(), size);
    return new LessonSession(facts, store, deck, exercises, nowFn);
  }

  /** Bieżące ćwiczenie do pokazania, albo null gdy sesja skończona. */
  current(): Exercise | null {
    return this.index < this.exercises.length ? this.exercises[this.index] : null;
  }

  /** Ile ćwiczeń zostało (włącznie z bieżącym). */
  remaining(): number {
    return Math.max(0, this.exercises.length - this.index);
  }

  /**
   * Rejestruje odpowiedź na BIEŻĄCE ćwiczenie: aktualizuje Leitnera, zapisuje
   * talię, przesuwa wskaźnik. Zapis po każdej odpowiedzi = zero utraty postępu
   * gdy apka zginie w trasie (offline-first).
   */
  submit(correct: boolean): AnswerResult {
    const ex = this.current();
    if (!ex) {
      return { factId: "", correct, remaining: 0, finished: true };
    }
    this.deck = answer(this.deck, ex.factId, correct, this.now());
    this.store.save(this.deck);
    if (correct) this.correctCount++;
    this.index++;
    return {
      factId: ex.factId,
      correct,
      remaining: this.remaining(),
      finished: this.current() === null,
    };
  }

  /** Podsumowanie — wołane po zakończeniu (pod ekran wyniku i gamifikację). */
  summary(): SessionSummary {
    return {
      total: this.exercises.length,
      correct: this.correctCount,
      dueAfter: dueCount(this.deck, this.now()),
    };
  }

  /** Aktualna talia (np. gdy warstwa wyżej chce ją odczytać po sesji). */
  deckState(): DeckState {
    return this.deck;
  }
}

/** Atrapa storage w pamięci — do testów i prototypu przed natywnym zapisem. */
export function inMemoryStore(initial: DeckState | null = null): DeckStore {
  let saved: DeckState | null = initial;
  return {
    load: () => saved,
    save: (deck) => {
      saved = JSON.parse(JSON.stringify(deck)); // symuluje round-trip serializacji
    },
  };
}
