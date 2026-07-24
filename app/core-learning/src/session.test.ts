import { describe, it, expect } from "vitest";
import { LessonSession, inMemoryStore } from "./session";
import { Fact } from "./lesson";
import { newDeck, ensureCards } from "./leitner";

const T0 = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const fact = (id: string): Fact => ({
  id,
  block: 1,
  supportedFormats: ["mcq", "match", "fill", "order", "scenario"],
});

const facts = [fact("a"), fact("b"), fact("c")];

function frozenNow(t = T0) {
  return () => t;
}

describe("LessonSession — start i postęp", () => {
  it("startuje z faktów due i podaje pierwsze ćwiczenie", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a", "b", "c"]));
    const s = LessonSession.start(facts, store, 7, frozenNow());
    expect(s.remaining()).toBe(3);
    expect(s.current()?.factId).toBe("a");
  });

  it("przesuwa się przez ćwiczenia i kończy", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a", "b", "c"]));
    const s = LessonSession.start(facts, store, 7, frozenNow());
    const r1 = s.submit(true);
    expect(r1.finished).toBe(false);
    expect(r1.remaining).toBe(2);
    s.submit(true);
    const r3 = s.submit(false);
    expect(r3.finished).toBe(true);
    expect(r3.remaining).toBe(0);
    expect(s.current()).toBeNull();
  });

  it("submit po zakończeniu sesji jest bezpieczny", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a"]));
    const s = LessonSession.start([fact("a")], store, 7, frozenNow());
    s.submit(true);
    const after = s.submit(true);
    expect(after.finished).toBe(true);
    expect(after.remaining).toBe(0);
  });
});

describe("LessonSession — utrwalanie (offline-first)", () => {
  it("zapisuje talię po KAŻDEJ odpowiedzi", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a", "b", "c"]));
    const s = LessonSession.start(facts, store, 7, frozenNow());
    s.submit(true); // 'a' -> box 2
    const saved = store.load();
    expect(saved?.cards.a.box).toBe(2);
    expect(saved?.cards.a.timesSeen).toBe(1);
  });

  it("poprawna odpowiedź awansuje fakt, błąd zrzuca na box 1 — widać w storage", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a", "b", "c"]));
    const s = LessonSession.start(facts, store, 7, frozenNow());
    s.submit(true); // a correct -> box 2
    s.submit(false); // b wrong -> box 1 (bez zmiany, ale timesSeen++)
    const saved = store.load()!;
    expect(saved.cards.a.box).toBe(2);
    expect(saved.cards.b.box).toBe(1);
    expect(saved.cards.b.timesSeen).toBe(1);
  });

  it("postęp przeżywa 'restart apki' — nowa sesja czyta zapisaną talię", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a", "b", "c"]));
    // sesja 1: opanuj 'a'
    const s1 = LessonSession.start(facts, store, 7, frozenNow(T0));
    s1.submit(true); // a -> box 2, lastSeen T0
    // "restart": nowa sesja tego samego dnia — 'a' jeszcze nie due (box2=1 dzień),
    // ale b i c są due
    const s2 = LessonSession.start(facts, store, 7, frozenNow(T0 + 60 * 1000));
    const ids = [];
    let cur = s2.current();
    while (cur) {
      ids.push(cur.factId);
      cur = s2.submit(true).finished ? null : s2.current();
    }
    expect(ids).not.toContain("a"); // a jeszcze nie do powtórki
    expect(ids).toContain("b");
    expect(ids).toContain("c");
  });
});

describe("LessonSession — podsumowanie", () => {
  it("liczy poprawne i total", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a", "b", "c"]));
    const s = LessonSession.start(facts, store, 7, frozenNow());
    s.submit(true);
    s.submit(false);
    s.submit(true);
    const sum = s.summary();
    expect(sum.total).toBe(3);
    expect(sum.correct).toBe(2);
  });

  it("dueAfter spada gdy fakty awansują poza okno powtórki", () => {
    const store = inMemoryStore(ensureCards(newDeck(), ["a", "b", "c"]));
    const s = LessonSession.start(facts, store, 7, frozenNow());
    s.submit(true); // a -> box2, nie due tego samego dnia
    s.submit(true); // b -> box2
    s.submit(true); // c -> box2
    // wszystkie w box2 (interwał 1 dzień), więc tego samego dnia 0 due
    expect(s.summary().dueAfter).toBe(0);
  });
});

describe("start bez faktów due", () => {
  it("pusta sesja gdy nic nie jest do powtórki", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    const store = inMemoryStore(deck);
    const s1 = LessonSession.start([fact("a")], store, 7, frozenNow(T0));
    s1.submit(true); // a -> box2
    const s2 = LessonSession.start([fact("a")], store, 7, frozenNow(T0 + 60 * 1000));
    expect(s2.remaining()).toBe(0);
    expect(s2.current()).toBeNull();
  });
});
