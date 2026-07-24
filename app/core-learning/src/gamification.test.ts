import { describe, it, expect } from "vitest";
import {
  newGamiState,
  dayIndex,
  registerActivity,
  awardCorrect,
  goalMet,
  grantFreeze,
  streakAtRisk,
  XP_PER_CORRECT,
  XP_GOAL_BONUS,
  MAX_FREEZES,
  DEFAULT_DAILY_GOAL,
} from "./gamification";

describe("dayIndex", () => {
  // Zakotwiczone w północy UTC, żeby +3h nie przekroczyło granicy dnia.
  const MIDNIGHT = Math.floor(1_700_000_000_000 / 86_400_000) * 86_400_000;
  it("ten sam dzień lokalny daje ten sam indeks", () => {
    const d1 = dayIndex(MIDNIGHT + 60 * 60 * 1000, 0); // 01:00
    const d2 = dayIndex(MIDNIGHT + 4 * 60 * 60 * 1000, 0); // 04:00, ten sam dzień
    expect(d2).toBe(d1);
  });
  it("kolejny dzień daje indeks +1", () => {
    const d1 = dayIndex(MIDNIGHT + 60 * 60 * 1000, 0);
    const d2 = dayIndex(MIDNIGHT + 25 * 60 * 60 * 1000, 0); // +24h
    expect(d2).toBe(d1 + 1);
  });
});

describe("registerActivity — streak i zamrożenia", () => {
  it("pierwsza aktywność ustawia streak na 1", () => {
    const s = registerActivity(newGamiState(), 100);
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(1);
    expect(s.lastActiveDay).toBe(100);
  });
  it("ten sam dzień nie zmienia streaka", () => {
    let s = registerActivity(newGamiState(), 100);
    s = registerActivity(s, 100);
    expect(s.streak).toBe(1);
  });
  it("dzień pod rząd zwiększa streak", () => {
    let s = registerActivity(newGamiState(), 100);
    s = registerActivity(s, 101);
    s = registerActivity(s, 102);
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(3);
  });
  it("luka bez zamrożeń resetuje streak do 1", () => {
    let s = registerActivity(newGamiState(), 100);
    s = registerActivity(s, 101); // streak 2
    s = registerActivity(s, 105); // luka 3 dni, brak zamrożeń
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(2); // best zachowany
  });
  it("zamrożenie pokrywa pojedynczy pominięty dzień i seria trwa", () => {
    let s = newGamiState();
    s = registerActivity(s, 100); // streak 1
    s = registerActivity(s, 101); // streak 2
    s = grantFreeze(s, 1); // 1 zamrożenie
    s = registerActivity(s, 103); // pominięto dzień 102 (missed=1), pokryte
    expect(s.streak).toBe(3);
    expect(s.freezes).toBe(0);
  });
  it("zamrożenia nie starczają na zbyt dużą lukę -> reset", () => {
    let s = newGamiState();
    s = registerActivity(s, 100);
    s = grantFreeze(s, 1); // tylko 1 zamrożenie
    s = registerActivity(s, 104); // missed=3 > 1 -> reset
    expect(s.streak).toBe(1);
    expect(s.freezes).toBe(1); // niewykorzystane, bo luka za duża
  });
  it("best streak zachowuje szczyt po resecie", () => {
    let s = newGamiState();
    for (let d = 100; d <= 106; d++) s = registerActivity(s, d); // streak 7
    s = registerActivity(s, 200); // reset
    expect(s.streak).toBe(1);
    expect(s.bestStreak).toBe(7);
  });
});

describe("grantFreeze — limit", () => {
  it("nie przekracza MAX_FREEZES", () => {
    let s = newGamiState();
    s = grantFreeze(s, 5);
    expect(s.freezes).toBe(MAX_FREEZES);
  });
});

describe("awardCorrect — XP i cel dzienny", () => {
  it("dolicza XP za poprawną odpowiedź", () => {
    let s = newGamiState(3);
    s = awardCorrect(s, 100);
    expect(s.xp).toBe(XP_PER_CORRECT);
    expect(s.progressToday).toBe(1);
  });
  it("dolicza bonus dokładnie przy dobiciu celu, tylko raz", () => {
    let s = newGamiState(3);
    s = awardCorrect(s, 100); // 1
    s = awardCorrect(s, 100); // 2
    expect(s.xp).toBe(2 * XP_PER_CORRECT);
    s = awardCorrect(s, 100); // 3 = cel -> bonus
    expect(s.xp).toBe(3 * XP_PER_CORRECT + XP_GOAL_BONUS);
    s = awardCorrect(s, 100); // 4 -> już bez bonusu
    expect(s.xp).toBe(4 * XP_PER_CORRECT + XP_GOAL_BONUS);
  });
  it("resetuje postęp dzienny przy zmianie dnia (ale nie XP)", () => {
    let s = newGamiState(3);
    s = awardCorrect(s, 100);
    s = awardCorrect(s, 100);
    expect(s.progressToday).toBe(2);
    s = awardCorrect(s, 101); // nowy dzień
    expect(s.progressToday).toBe(1);
    expect(s.xp).toBe(3 * XP_PER_CORRECT); // XP kumuluje się mimo resetu postępu
  });
});

describe("goalMet", () => {
  it("false zanim cel osiągnięty, true po", () => {
    let s = newGamiState(2);
    s = awardCorrect(s, 100);
    expect(goalMet(s, 100)).toBe(false);
    s = awardCorrect(s, 100);
    expect(goalMet(s, 100)).toBe(true);
  });
  it("false dla innego dnia niż dzień postępu", () => {
    let s = newGamiState(1);
    s = awardCorrect(s, 100); // cel dobity dnia 100
    expect(goalMet(s, 101)).toBe(false);
  });
});

describe("streakAtRisk", () => {
  it("true gdy aktywny wczoraj, nieaktywny dziś", () => {
    let s = registerActivity(newGamiState(), 100);
    expect(streakAtRisk(s, 101)).toBe(true);
  });
  it("false gdy już aktywny dziś", () => {
    let s = registerActivity(newGamiState(), 101);
    expect(streakAtRisk(s, 101)).toBe(false);
  });
  it("false gdy luka już większa niż dzień", () => {
    let s = registerActivity(newGamiState(), 100);
    expect(streakAtRisk(s, 103)).toBe(false);
  });
});

describe("serializowalność", () => {
  it("stan gamifikacji przechodzi round-trip JSON", () => {
    let s = newGamiState();
    s = registerActivity(s, 100);
    s = awardCorrect(s, 100);
    const restored = JSON.parse(JSON.stringify(s));
    expect(restored).toEqual(s);
  });
});

describe("domyślne wartości", () => {
  it("domyślny cel dzienny to DEFAULT_DAILY_GOAL", () => {
    expect(newGamiState().dailyGoal).toBe(DEFAULT_DAILY_GOAL);
  });
});
