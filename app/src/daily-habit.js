// daily-habit.js — dzienny nawyk dla MasterADR: streak Z ZAMROŻENIEM + cel dzienny.
//
// ŚWIADOMIE ODDZIELNY od istniejącego "streaka sesji" (liczba poprawnych z rzędu w jednej
// lekcji) i od stanu Leitnera. Własny klucz localStorage, własny stan — nie rusza modelu
// dueAt ani progress.v2. To realizacja luki z mapy: streak bez zamrożenia = rage-quit.
//
// Logika przeniesiona 1:1 z przetestowanego core/learning/gamification.ts (63 testy),
// przepisana na zwykły JS bez zależności, żeby wpięła się w app.jsx bez build-changes.

export const HABIT_KEY = "adrtrainer.habit.v1";
export const DEFAULT_DAILY_GOAL = 15;
export const MAX_FREEZES = 2;
export const XP_PER_CORRECT = 10;
export const XP_GOAL_BONUS = 20;

export function newHabit(dailyGoal = DEFAULT_DAILY_GOAL) {
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

// Numer dnia lokalnego (dni od epoki wg lokalnej północy).
export function dayIndex(nowMs = Date.now(), tzOffsetMin = new Date().getTimezoneOffset()) {
  const localMs = nowMs - tzOffsetMin * 60 * 1000;
  return Math.floor(localMs / (24 * 60 * 60 * 1000));
}

// Rejestruje aktywność w danym dniu (≥1 ćwiczenie). Streak z zamrożeniem:
// ten sam dzień = bez zmian; +1 dzień = streak++; luka pokryta zamrożeniami = trwa;
// za duża luka = reset do 1.
export function registerActivity(state, today) {
  const last = state.lastActiveDay;
  if (last === null) {
    return { ...state, streak: 1, bestStreak: Math.max(1, state.bestStreak), lastActiveDay: today };
  }
  if (today === last) return state;
  const gap = today - last;
  if (gap === 1) {
    const streak = state.streak + 1;
    return { ...state, streak, bestStreak: Math.max(streak, state.bestStreak), lastActiveDay: today };
  }
  const missed = gap - 1;
  if (missed <= state.freezes) {
    const streak = state.streak + 1;
    return {
      ...state,
      streak,
      bestStreak: Math.max(streak, state.bestStreak),
      lastActiveDay: today,
      freezes: state.freezes - missed,
    };
  }
  return { ...state, streak: 1, lastActiveDay: today };
}

// XP + postęp celu za poprawną odpowiedź. Reset postępu przy zmianie dnia.
// Bonus dokładnie przy przekroczeniu celu (raz).
export function awardCorrect(state, today) {
  const sameDay = state.progressDay === today;
  const prev = sameDay ? state.progressToday : 0;
  const next = prev + 1;
  let xp = state.xp + XP_PER_CORRECT;
  if (prev < state.dailyGoal && next >= state.dailyGoal) xp += XP_GOAL_BONUS;
  return { ...state, xp, progressToday: next, progressDay: today };
}

export function goalMet(state, today) {
  return state.progressDay === today && state.progressToday >= state.dailyGoal;
}

export function grantFreeze(state, n = 1) {
  return { ...state, freezes: Math.min(MAX_FREEZES, state.freezes + n) };
}

// Streak zagrożony: aktywny wczoraj, nie dziś (pod komunikat ratunkowy).
export function streakAtRisk(state, today) {
  return state.lastActiveDay === today - 1 && state.streak > 0;
}

// --- Persystencja: własny klucz, odporna na brak localStorage (jak reszta apki) ---
export function loadHabit(storage) {
  try {
    const raw = storage.getItem(HABIT_KEY);
    if (!raw) return newHabit();
    return { ...newHabit(), ...JSON.parse(raw) };
  } catch (e) {
    return newHabit();
  }
}

export function saveHabit(storage, state) {
  try {
    storage.setItem(HABIT_KEY, JSON.stringify(state));
  } catch (e) {
    /* brak localStorage — trudno, nawyk działa w pamięci sesji */
  }
}
