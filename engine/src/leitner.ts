/**
 * leitner.ts — rdzeń retencji ADR Trenera (Faza 0, zero AI, offline-first).
 *
 * Czyste funkcje: stan wchodzi, nowy stan wychodzi. Stan jest w pełni
 * serializowalny (zwykłe obiekty/liczby), więc leci prosto do local storage
 * telefonu i z powrotem — bez backendu, bez klas do rehydratacji.
 *
 * Model: 5 pudełek (1..5). Poprawna odpowiedź awansuje fakt o jedno pudełko
 * w górę (max 5). Błąd zrzuca fakt na pudełko 1 (klasyczny Leitner —
 * jedna pomyłka kasuje postęp, bo to treść safety-critical: lepiej powtórzyć
 * za często niż za rzadko). Każde pudełko ma interwał powtórki; fakt jest
 * "do powtórki", gdy minął jego interwał od ostatniej odpowiedzi.
 */

export const MIN_BOX = 1;
export const MAX_BOX = 5;

/**
 * Interwały powtórki w MILISEKUNDACH wg pudełka. Uzgodnione z prototypem
 * MasterADR-vite (box 1 wraca po 10 min — lepsze dla nauki przedegzaminacyjnej
 * niż „tego samego dnia"). box 2..5 = 1/3/7/16 dni.
 */
const MINUTE = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE;
export const BOX_INTERVALS_MS: Record<number, number> = {
  1: 10 * MINUTE,
  2: 1 * DAY_MS,
  3: 3 * DAY_MS,
  4: 7 * DAY_MS,
  5: 16 * DAY_MS,
};

/** Czytelna etykieta interwału pod UI (zgodna z prototypem). */
export function intervalLabel(box: number): string {
  return ({ 1: "10 min", 2: "1 dzień", 3: "3 dni", 4: "7 dni", 5: "16 dni" } as Record<number, string>)[box] ?? "";
}

/** Stan pojedynczego faktu w kolejce powtórek. Serializowalny 1:1. */
export interface CardState {
  factId: string;
  box: number; // 1..5
  lastSeen: number | null; // epoch ms; null = nigdy nie widziany
  timesSeen: number;
  timesCorrect: number;
  lapses: number; // ile razy fakt spadł na box 1 (przeniesione z MasterADR-vite; przyda się w HLR/Faza 2)
}

/** Cała talia = mapa factId -> CardState. Serializowalna 1:1. */
export interface DeckState {
  cards: Record<string, CardState>;
}

function clampBox(box: number): number {
  if (box < MIN_BOX) return MIN_BOX;
  if (box > MAX_BOX) return MAX_BOX;
  return box;
}

/** Świeża karta dla nowego faktu — startuje w pudełku 1, nigdy nie widziana. */
export function newCard(factId: string): CardState {
  return { factId, box: MIN_BOX, lastSeen: null, timesSeen: 0, timesCorrect: 0, lapses: 0 };
}

/** Pusta talia. */
export function newDeck(): DeckState {
  return { cards: {} };
}

/**
 * Dodaje fakty do talii, jeśli jeszcze ich nie ma. Istniejących kart NIE rusza
 * (idempotentne — bezpieczne przy każdym starcie apki / dołożeniu contentu).
 * Zwraca nową talię (nie mutuje wejścia).
 */
export function ensureCards(deck: DeckState, factIds: string[]): DeckState {
  const cards = { ...deck.cards };
  for (const id of factIds) {
    if (!cards[id]) cards[id] = newCard(id);
  }
  return { cards };
}

/**
 * Rejestruje odpowiedź na fakt. Poprawna → awans o 1 pudełko (max 5).
 * Błąd → zrzut na pudełko 1. Aktualizuje liczniki i lastSeen.
 * Czysta: zwraca nową talię, nie mutuje wejścia.
 */
export function answer(
  deck: DeckState,
  factId: string,
  correct: boolean,
  now: number = Date.now(),
): DeckState {
  const existing = deck.cards[factId] ?? newCard(factId);
  const nextBox = correct ? clampBox(existing.box + 1) : MIN_BOX;
  // lapse = był powyżej box 1 i spadł przez błąd
  const lapsed = !correct && existing.box > MIN_BOX;
  const updated: CardState = {
    ...existing,
    box: nextBox,
    lastSeen: now,
    timesSeen: existing.timesSeen + 1,
    timesCorrect: existing.timesCorrect + (correct ? 1 : 0),
    lapses: existing.lapses + (lapsed ? 1 : 0),
  };
  return { cards: { ...deck.cards, [factId]: updated } };
}

/** Czy dany fakt jest do powtórki teraz? Nowy (nigdy nie widziany) = tak. */
export function isDue(card: CardState, now: number = Date.now()): boolean {
  if (card.lastSeen === null) return true;
  const intervalMs = BOX_INTERVALS_MS[card.box] ?? 0;
  const dueAt = card.lastSeen + intervalMs;
  return now >= dueAt;
}

/**
 * Kolejka powtórek: wszystkie fakty do powtórki teraz, posortowane od
 * najpilniejszych. Priorytet: niższe pudełko = słabiej znane = wyżej w kolejce;
 * przy równym pudełku najdawniej widziane idzie pierwsze; nowe fakty (lastSeen
 * null) traktujemy jako najstarsze, więc wchodzą wcześnie.
 */
export function dueQueue(deck: DeckState, now: number = Date.now()): CardState[] {
  return Object.values(deck.cards)
    .filter((c) => isDue(c, now))
    .sort((a, b) => {
      if (a.box !== b.box) return a.box - b.box;
      const aSeen = a.lastSeen ?? -Infinity;
      const bSeen = b.lastSeen ?? -Infinity;
      return aSeen - bSeen;
    });
}

/** Ile faktów czeka do powtórki (dla licznika "do powtórki dziś"). */
export function dueCount(deck: DeckState, now: number = Date.now()): number {
  return dueQueue(deck, now).length;
}

/** Prosty rozkład wiedzy: ile kart w każdym pudełku (dla paska postępu). */
export function boxDistribution(deck: DeckState): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of Object.values(deck.cards)) dist[c.box] = (dist[c.box] ?? 0) + 1;
  return dist;
}
