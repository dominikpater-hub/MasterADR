/**
 * gamification.ts — warstwa nawyku (Faza 0, offline, zero AI).
 *
 * Streak (z zamrożeniem), XP, cel dzienny. ŚWIADOMIE BEZ serc/energii i bez lig:
 *  - serca karzą za błąd, a w treści dla zawodowców błąd to sposób nauki, nie kara
 *    (ADR_DUOLINGO §6 + backlash Duolingo za Energy),
 *  - ligi wymagają masy jednoczesnych userów — martwe bez ruchu (Faza 2).
 *
 * Czyste funkcje na serializowalnym stanie — leci prosto do local storage,
 * jak reszta rdzenia. Streak liczony po DNIACH LOKALNYCH (nie epoch), bo to
 * "codzienny nawyk", więc data wejściowa to numer dnia lokalnego (patrz dayIndex).
 */

export interface GamiState {
  /** Długość bieżącej serii w dniach. */
  streak: number;
  /** Najdłuższa seria w historii (pod kamień milowy/dumę). */
  bestStreak: number;
  /** Indeks dnia ostatniej aktywności (dni lokalne od epoki). null = brak. */
  lastActiveDay: number | null;
  /** Liczba dostępnych zamrożeń (chroni pominięty dzień). */
  freezes: number;
  /** Łączne XP. */
  xp: number;
  /** Cel dzienny w liczbie ćwiczeń. */
  dailyGoal: number;
  /** Postęp w kierunku celu DZIŚ (reset przy zmianie dnia). */
  progressToday: number;
  /** Indeks dnia, do którego odnosi się progressToday. */
  progressDay: number | null;
}

export const DEFAULT_DAILY_GOAL = 15;
export const MAX_FREEZES = 2; // jak Duolingo — do dwóch zamrożeń w zapasie
export const XP_PER_CORRECT = 10;
export const XP_GOAL_BONUS = 20; // bonus za dobicie celu dziennego

/** Świeży stan gamifikacji. */
export function newGamiState(dailyGoal = DEFAULT_DAILY_GOAL): GamiState {
  return {
    streak: 0,
    bestStreak: 0,
    lastActiveDay: null,
    freezes: 0,
    xp: 0,
    dailyGoal,
    progressToday: 0,
    progressDay: null,
  };
}

/** Numer dnia lokalnego (dni od epoki wg lokalnej północy) z epoch ms + offsetu. */
export function dayIndex(nowMs: number, tzOffsetMinutes: number): number {
  const localMs = nowMs - tzOffsetMinutes * 60 * 1000;
  return Math.floor(localMs / (24 * 60 * 60 * 1000));
}

/**
 * Rejestruje aktywność w danym dniu (wywołane, gdy kierowca zrobił ≥1 ćwiczenie).
 * Aktualizuje streak z logiką zamrożenia:
 *  - ten sam dzień -> streak bez zmian,
 *  - następny dzień (luka 1) -> streak++,
 *  - luka 2+ dni -> próba pokrycia zamrożeniami; jeśli starczy, streak trwa,
 *    jeśli nie -> reset do 1.
 * Czysta: zwraca nowy stan.
 */
export function registerActivity(state: GamiState, today: number): GamiState {
  const last = state.lastActiveDay;

  // Pierwsza aktywność w życiu.
  if (last === null) {
    return { ...state, streak: 1, bestStreak: Math.max(1, state.bestStreak), lastActiveDay: today };
  }

  // Ten sam dzień — nawyk już odnotowany, nic nie ruszamy.
  if (today === last) return state;

  const gap = today - last;

  // Dzień pod rząd — seria rośnie.
  if (gap === 1) {
    const streak = state.streak + 1;
    return { ...state, streak, bestStreak: Math.max(streak, state.bestStreak), lastActiveDay: today };
  }

  // Luka. Ile dni pominięto = gap - 1. Próbujemy pokryć zamrożeniami.
  const missed = gap - 1;
  if (missed <= state.freezes) {
    const streak = state.streak + 1; // seria przetrwała dzięki zamrożeniom
    return {
      ...state,
      streak,
      bestStreak: Math.max(streak, state.bestStreak),
      lastActiveDay: today,
      freezes: state.freezes - missed,
    };
  }

  // Za duża luka — seria pada, zaczynamy od nowa.
  return { ...state, streak: 1, lastActiveDay: today };
}

/**
 * Dolicza XP i postęp celu za pojedynczą poprawną odpowiedź w danym dniu.
 * Resetuje progressToday przy zmianie dnia. Dolicza bonus dokładnie w momencie
 * PRZEKROCZENIA celu (raz). Czysta.
 */
export function awardCorrect(state: GamiState, today: number): GamiState {
  // Reset postępu, jeśli to nowy dzień.
  const sameDay = state.progressDay === today;
  const prevProgress = sameDay ? state.progressToday : 0;
  const newProgress = prevProgress + 1;

  let xp = state.xp + XP_PER_CORRECT;
  // Bonus dokładnie przy dobiciu celu (przejście z <goal na =goal).
  if (prevProgress < state.dailyGoal && newProgress >= state.dailyGoal) {
    xp += XP_GOAL_BONUS;
  }

  return { ...state, xp, progressToday: newProgress, progressDay: today };
}

/** Czy cel dzienny osiągnięty w danym dniu? */
export function goalMet(state: GamiState, today: number): boolean {
  if (state.progressDay !== today) return false;
  return state.progressToday >= state.dailyGoal;
}

/** Dodaje zamrożenie do zapasu (np. nagroda za kamień milowy), max MAX_FREEZES. */
export function grantFreeze(state: GamiState, n = 1): GamiState {
  return { ...state, freezes: Math.min(MAX_FREEZES, state.freezes + n) };
}

/**
 * Sprawdza, czy streak jest "zagrożony" — kierowca był aktywny wczoraj, ale nie
 * dziś. Pod notyfikację ratunkową ("save reminder") z Fazy 1. Czysta, tylko czyta.
 */
export function streakAtRisk(state: GamiState, today: number): boolean {
  return state.lastActiveDay === today - 1 && state.streak > 0;
}
