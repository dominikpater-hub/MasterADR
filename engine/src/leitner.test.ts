import { describe, it, expect } from "vitest";
import {
  newDeck,
  newCard,
  ensureCards,
  answer,
  isDue,
  dueQueue,
  dueCount,
  boxDistribution,
  BOX_INTERVALS_MS,
  MIN_BOX,
  MAX_BOX,
} from "./leitner";

const DAY = 24 * 60 * 60 * 1000;
const T0 = 1_700_000_000_000; // stały "teraz" do testów

describe("newCard / newDeck", () => {
  it("nowa karta startuje w pudełku 1, nigdy nie widziana", () => {
    const c = newCard("def-towar");
    expect(c.box).toBe(MIN_BOX);
    expect(c.lastSeen).toBeNull();
    expect(c.timesSeen).toBe(0);
    expect(c.timesCorrect).toBe(0);
  });
  it("nowa talia jest pusta", () => {
    expect(Object.keys(newDeck().cards)).toHaveLength(0);
  });
});

describe("ensureCards", () => {
  it("dodaje brakujące fakty i nie rusza istniejących", () => {
    let deck = ensureCards(newDeck(), ["a", "b"]);
    deck = answer(deck, "a", true, T0); // a awansuje do pudełka 2
    deck = ensureCards(deck, ["a", "b", "c"]); // dokładamy c
    expect(deck.cards.a.box).toBe(2); // nietknięte
    expect(deck.cards.c.box).toBe(1); // świeże
    expect(Object.keys(deck.cards)).toHaveLength(3);
  });
  it("jest idempotentne — wielokrotne wywołanie nic nie psuje", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", true, T0);
    const before = deck.cards.a.box;
    deck = ensureCards(deck, ["a"]);
    expect(deck.cards.a.box).toBe(before);
  });
  it("nie mutuje wejścia", () => {
    const deck = newDeck();
    ensureCards(deck, ["a"]);
    expect(Object.keys(deck.cards)).toHaveLength(0);
  });
});

describe("answer — awans i zrzut", () => {
  it("poprawna odpowiedź awansuje o jedno pudełko", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", true, T0);
    expect(deck.cards.a.box).toBe(2);
    expect(deck.cards.a.timesSeen).toBe(1);
    expect(deck.cards.a.timesCorrect).toBe(1);
    expect(deck.cards.a.lastSeen).toBe(T0);
  });
  it("nie przekracza pudełka 5", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    for (let i = 0; i < 10; i++) deck = answer(deck, "a", true, T0 + i * DAY * 30);
    expect(deck.cards.a.box).toBe(MAX_BOX);
  });
  it("błąd zrzuca na pudełko 1 z dowolnego poziomu", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", true, T0);
    deck = answer(deck, "a", true, T0 + DAY);
    expect(deck.cards.a.box).toBe(3);
    deck = answer(deck, "a", false, T0 + 2 * DAY);
    expect(deck.cards.a.box).toBe(MIN_BOX);
    expect(deck.cards.a.timesCorrect).toBe(2); // licznik poprawnych nie spada
    expect(deck.cards.a.timesSeen).toBe(3);
    expect(deck.cards.a.lapses).toBe(1); // spadł z box 3 -> jeden lapse
  });

  it("lapses liczy tylko spadki z pudełka > 1, nie błąd na box 1", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", false, T0); // box 1 -> box 1, brak lapse
    expect(deck.cards.a.lapses).toBe(0);
    deck = answer(deck, "a", true, T0 + DAY); // box 2
    deck = answer(deck, "a", false, T0 + 2 * DAY); // box 2 -> 1, lapse
    expect(deck.cards.a.lapses).toBe(1);
  });
  it("odpowiedź na nieznany fakt tworzy kartę w locie", () => {
    const deck = answer(newDeck(), "ghost", true, T0);
    expect(deck.cards.ghost.box).toBe(2);
  });
  it("nie mutuje wejścia", () => {
    const deck = ensureCards(newDeck(), ["a"]);
    answer(deck, "a", true, T0);
    expect(deck.cards.a.box).toBe(1);
  });
});

describe("isDue — interwały wg pudełka", () => {
  it("nowy fakt (nigdy nie widziany) jest zawsze do powtórki", () => {
    expect(isDue(newCard("a"), T0)).toBe(true);
  });
  it("pudełko 1 wraca po 10 minutach, nie od razu", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", false, T0); // ląduje w pudełku 1, lastSeen T0
    expect(isDue(deck.cards.a, T0 + 5 * 60 * 1000)).toBe(false); // po 5 min jeszcze nie
    expect(isDue(deck.cards.a, T0 + 10 * 60 * 1000)).toBe(true); // po 10 min tak
  });
  it("pudełko 3 nie jest due przed upływem 3 dni, jest due po", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", true, T0); // box 2
    deck = answer(deck, "a", true, T0 + DAY); // box 3, lastSeen = T0+DAY
    const seen = T0 + DAY;
    expect(isDue(deck.cards.a, seen + 2 * DAY)).toBe(false);
    expect(isDue(deck.cards.a, seen + 3 * DAY)).toBe(true);
  });
  it("interwały rosną monotonicznie z numerem pudełka", () => {
    const vals = [1, 2, 3, 4, 5].map((b) => BOX_INTERVALS_MS[b]);
    for (let i = 1; i < vals.length; i++) expect(vals[i]).toBeGreaterThan(vals[i - 1]);
  });
});

describe("dueQueue — kolejność powtórek", () => {
  it("niższe pudełko ma priorytet (słabiej znane wyżej)", () => {
    let deck = ensureCards(newDeck(), ["weak", "strong"]);
    // strong awansuje do 3, weak zostaje nisko
    deck = answer(deck, "strong", true, T0);
    deck = answer(deck, "strong", true, T0 + DAY);
    deck = answer(deck, "weak", false, T0 + 10 * DAY);
    const q = dueQueue(deck, T0 + 100 * DAY);
    expect(q[0].factId).toBe("weak");
  });
  it("przy równym pudełku najdawniej widziany idzie pierwszy", () => {
    let deck = ensureCards(newDeck(), ["old", "recent"]);
    deck = answer(deck, "old", false, T0);
    deck = answer(deck, "recent", false, T0 + 5 * DAY);
    const q = dueQueue(deck, T0 + 100 * DAY);
    expect(q.map((c) => c.factId)).toEqual(["old", "recent"]);
  });
  it("pomija fakty, które nie są jeszcze due", () => {
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", true, T0); // box 2, interwał 1 dzień
    expect(dueQueue(deck, T0 + 12 * 60 * 60 * 1000)).toHaveLength(0); // pół dnia później
    expect(dueQueue(deck, T0 + DAY)).toHaveLength(1);
  });
  it("świeża talia — wszystkie fakty due od razu", () => {
    const deck = ensureCards(newDeck(), ["a", "b", "c"]);
    expect(dueCount(deck, T0)).toBe(3);
  });
});

describe("boxDistribution", () => {
  it("liczy karty w każdym pudełku", () => {
    let deck = ensureCards(newDeck(), ["a", "b", "c"]);
    deck = answer(deck, "a", true, T0); // box 2
    const dist = boxDistribution(deck);
    expect(dist[1]).toBe(2);
    expect(dist[2]).toBe(1);
    expect(dist[3]).toBe(0);
  });
});

describe("serializowalność (local-first)", () => {
  it("stan przechodzi round-trip przez JSON bez straty", () => {
    let deck = ensureCards(newDeck(), ["a", "b"]);
    deck = answer(deck, "a", true, T0);
    const restored = JSON.parse(JSON.stringify(deck));
    expect(restored).toEqual(deck);
    // i dalej działa po odtworzeniu
    const next = answer(restored, "a", true, T0 + DAY);
    expect(next.cards.a.box).toBe(3);
  });
});
