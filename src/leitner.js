// ---------- SILNIK LEITNERA ----------
// Jedno źródło prawdy dla logiki powtórek w apce (koniec kopii inline w app.jsx).
// Zachowuje kształt stanu apki: { id, box, dueAt, seen, correct, lapses }.
// Interwały i logika pudełek są IDENTYCZNE z engine/ (core-learning, 63 testy):
//   box: correct -> min(box+1,5); wrong -> 1
//   dueAt = now + INTERVALS[box]   (isDue liczone przez dueAt <= now)
export const MIN = 60 * 1000;
export const DAY = 24 * 60 * 60 * 1000;

export const INTERVALS = {
  1: 10 * MIN,
  2: DAY,
  3: 3 * DAY,
  4: 7 * DAY,
  5: 16 * DAY,
};

export const newFact = (id) => ({
  id,
  box: 1,
  dueAt: null,
  seen: 0,
  correct: 0,
  lapses: 0,
});

export function review(f, answer, now) {
  const seen = f.seen + 1;
  if (answer === "correct") {
    const box = Math.min(f.box + 1, 5);
    return { ...f, box, dueAt: now + INTERVALS[box], seen, correct: f.correct + 1 };
  }
  return {
    ...f,
    box: 1,
    dueAt: now + INTERVALS[1],
    seen,
    correct: 0,
    lapses: f.box > 1 ? f.lapses + 1 : f.lapses,
  };
}

export function buildQueue(facts, now, { max = 20, newLimit = 20 } = {}) {
  const due = [],
    fresh = [];
  for (const f of facts) {
    if (f.dueAt === null) fresh.push(f);
    else if (f.dueAt <= now) due.push(f);
  }
  due.sort((a, b) => a.dueAt - b.dueAt);
  fresh.sort((a, b) => a.box - b.box || (a.id < b.id ? -1 : 1));
  return [...due, ...fresh.slice(0, newLimit)].slice(0, max);
}

export const FORMAT_BY_BOX = {
  1: ["mcq"],
  2: ["mcq", "match"],
  3: ["match", "fill"],
  4: ["fill", "order"],
  5: ["order", "scenario"],
};

export function pickFormat(box, supported, rand = 0) {
  const b = Math.max(1, Math.min(5, box));
  const pref = FORMAT_BY_BOX[b].filter((f) => supported.includes(f));
  const pool = pref.length ? pref : supported;
  return pool[Math.min(pool.length - 1, Math.floor(rand * pool.length))];
}
