import { describe, it, expect } from "vitest";
import {
  Fact,
  validateFacts,
  pickFormat,
  buildSession,
  availableExerciseCount,
  FORMAT_RAMP,
} from "./lesson";
import { newDeck, ensureCards, answer } from "./leitner";

const T0 = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

const fullFact = (id: string, block = 1): Fact => ({
  id,
  block,
  supportedFormats: ["mcq", "match", "fill", "order", "scenario"],
});

describe("validateFacts", () => {
  it("przepuszcza fakty wspierające mcq", () => {
    expect(validateFacts([fullFact("a"), fullFact("b")])).toEqual([]);
  });
  it("wyłapuje fakt bez mcq (złamany fallback)", () => {
    const bad: Fact = { id: "bad", block: 1, supportedFormats: ["match", "fill"] };
    expect(validateFacts([fullFact("ok"), bad])).toEqual(["bad"]);
  });
});

describe("pickFormat — rampa i degradacja", () => {
  it("fakt wspierający wszystko dostaje format preferowany dla pudełka", () => {
    const f = fullFact("a");
    expect(pickFormat(f, 1)).toBe("mcq");
    expect(pickFormat(f, 2)).toBe("mcq");
    expect(pickFormat(f, 3)).toBe("match");
    expect(pickFormat(f, 4)).toBe("fill");
    expect(pickFormat(f, 5)).toBe("scenario");
  });
  it("degraduje w dół rampy gdy preferowany format nie jest wspierany", () => {
    // fakt wspiera tylko mcq i match; w pudełku 5 (pref scenario) schodzi do match
    const f: Fact = { id: "a", block: 1, supportedFormats: ["mcq", "match"] };
    expect(pickFormat(f, 5)).toBe("match");
    expect(pickFormat(f, 4)).toBe("match"); // pref fill -> match
    expect(pickFormat(f, 3)).toBe("match"); // pref match -> match
    expect(pickFormat(f, 1)).toBe("mcq");
  });
  it("spada do mcq gdy nic innego nie pasuje", () => {
    const f: Fact = { id: "a", block: 1, supportedFormats: ["mcq"] };
    for (let box = 1; box <= 5; box++) expect(pickFormat(f, box)).toBe("mcq");
  });
  it("rampa jest w ustalonej kolejności trudności", () => {
    expect(FORMAT_RAMP).toEqual(["mcq", "match", "fill", "order", "scenario"]);
  });
});

describe("buildSession", () => {
  it("świeża talia: buduje ćwiczenia dla wszystkich faktów, wszystkie mcq (box 1)", () => {
    const facts = [fullFact("a"), fullFact("b"), fullFact("c")];
    const deck = ensureCards(newDeck(), ["a", "b", "c"]);
    const session = buildSession(facts, deck, T0, 7);
    expect(session).toHaveLength(3);
    expect(session.every((e) => e.format === "mcq")).toBe(true);
    expect(session.every((e) => e.box === 1)).toBe(true);
  });
  it("obcina sesję do zadanego rozmiaru", () => {
    const facts = Array.from({ length: 20 }, (_, i) => fullFact(`f${i}`));
    const deck = ensureCards(newDeck(), facts.map((f) => f.id));
    expect(buildSession(facts, deck, T0, 7)).toHaveLength(7);
    expect(buildSession(facts, deck, T0, 5)).toHaveLength(5);
  });
  it("format rośnie z pudełkiem — opanowany fakt dostaje trudniejszy format", () => {
    const facts = [fullFact("a")];
    let deck = ensureCards(newDeck(), ["a"]);
    // awansuj 'a' do pudełka 3
    deck = answer(deck, "a", true, T0);
    deck = answer(deck, "a", true, T0 + DAY);
    const session = buildSession(facts, deck, T0 + 100 * DAY, 7);
    expect(session[0].box).toBe(3);
    expect(session[0].format).toBe("match");
  });
  it("pomija karty bez odpowiadającego faktu (usunięty content)", () => {
    const facts = [fullFact("a")];
    const deck = ensureCards(newDeck(), ["a", "ghost"]);
    const session = buildSession(facts, deck, T0, 7);
    expect(session.map((e) => e.factId)).toEqual(["a"]);
  });
  it("nie pokazuje faktu, który nie jest jeszcze due", () => {
    const facts = [fullFact("a")];
    let deck = ensureCards(newDeck(), ["a"]);
    deck = answer(deck, "a", true, T0); // box 2, interwał 1 dzień
    expect(buildSession(facts, deck, T0 + 60 * 60 * 1000, 7)).toHaveLength(0);
  });
  it("słabszy fakt (niższe pudełko) idzie przed mocniejszym w sesji", () => {
    const facts = [fullFact("weak"), fullFact("strong")];
    let deck = ensureCards(newDeck(), ["weak", "strong"]);
    deck = answer(deck, "strong", true, T0);
    deck = answer(deck, "strong", true, T0 + DAY);
    deck = answer(deck, "weak", false, T0 + 2 * DAY);
    const session = buildSession(facts, deck, T0 + 100 * DAY, 7);
    expect(session[0].factId).toBe("weak");
  });
});

describe("availableExerciseCount", () => {
  it("liczy fakty due (dla 'nieskończoność jest deterministyczna')", () => {
    const facts = [fullFact("a"), fullFact("b")];
    const deck = ensureCards(newDeck(), ["a", "b"]);
    expect(availableExerciseCount(facts, deck, T0)).toBe(2);
  });
});
