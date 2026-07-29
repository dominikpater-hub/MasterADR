/**
 * lesson.ts — pętla mikro-lekcji (Faza 0, offline, deterministyczna, zero AI).
 *
 * Bierze fakty (zweryfikowaną treść) + stan Leitnera i produkuje kolejne
 * ćwiczenia. Ten sam fakt jest testowany łatwiej gdy świeży (rozpoznanie/mcq)
 * i trudniej gdy prawie opanowany (scenariusz) — dokładnie format-ramp z
 * CONTENT_ANALYSIS: box 1–2 mcq, 3 match, 4 fill, 5 order/scenario.
 *
 * "Nieskończoność" tej fazy jest deterministyczna: N faktów × dostępne formaty,
 * bez halucynacji. Faza 2 (AI) dokłada warianty NA WIERZCH tego samego pickFormat.
 */

import { CardState, DeckState, dueQueue } from "./leitner";

export type QuestionFormat = "mcq" | "match" | "fill" | "order" | "scenario";

/** Kolejność trudności formatów — indeks = jak "produkcyjny" jest format. */
export const FORMAT_RAMP: QuestionFormat[] = ["mcq", "match", "fill", "order", "scenario"];

/**
 * Preferowany format wg pudełka Leitnera (1..5). Mapuje na format-ramp z
 * CONTENT_ANALYSIS. To PREFERENCJA — realny wybór zawęża się do formatów,
 * które dany fakt wspiera (patrz pickFormat), z mcq jako gwarantowanym fallbackiem.
 */
export const BOX_PREFERRED_FORMAT: Record<number, QuestionFormat> = {
  1: "mcq",
  2: "mcq",
  3: "match",
  4: "fill",
  5: "scenario",
};

/**
 * Fakt = jednostka zweryfikowanej treści. Minimalny kształt, łatwy do zmapowania
 * na realny adr-content-full.js. Każdy fakt MUSI wspierać mcq (walidowane przy
 * imporcie) — to gwarantowany fallback.
 */
export interface Fact {
  id: string;
  block: number; // blok programu (1..5 z ADR_ARCHITEKTURA_TRESCI)
  scope?: "podstawowy" | "specjalistyczny";
  /** Które formaty ten konkretny fakt wspiera. Musi zawierać "mcq". */
  supportedFormats: QuestionFormat[];
}

/** Ćwiczenie do pokazania: który fakt, w jakim formacie. */
export interface Exercise {
  factId: string;
  format: QuestionFormat;
  box: number;
}

/**
 * Waliduje, że każdy fakt wspiera mcq (gwarantowany fallback z CONTENT_ANALYSIS).
 * Zwraca listę id faktów, które łamią regułę — pusta = ok. Wołane przy imporcie.
 */
export function validateFacts(facts: Fact[]): string[] {
  return facts
    .filter((f) => !f.supportedFormats.includes("mcq"))
    .map((f) => f.id);
}

/**
 * Wybiera format ćwiczenia dla faktu w danym pudełku.
 * 1. Bierze preferowany format dla pudełka.
 * 2. Jeśli fakt go wspiera — używa go.
 * 3. Jeśli nie — degraduje w dół rampy do najbliższego wspieranego.
 * 4. Ostateczny fallback to zawsze mcq (gwarantowany walidacją importu).
 */
export function pickFormat(fact: Fact, box: number): QuestionFormat {
  const preferred = BOX_PREFERRED_FORMAT[box] ?? "mcq";
  if (fact.supportedFormats.includes(preferred)) return preferred;

  // Degraduj w dół rampy od preferowanego do prostszego formatu.
  const rampIdx = FORMAT_RAMP.indexOf(preferred);
  for (let i = rampIdx - 1; i >= 0; i--) {
    const candidate = FORMAT_RAMP[i];
    if (fact.supportedFormats.includes(candidate)) return candidate;
  }
  return "mcq"; // gwarantowany fallback
}

/**
 * Buduje sesję nauki: bierze fakty due z Leitnera (kolejność z dueQueue),
 * przypisuje każdemu format wg jego pudełka, obcina do rozmiaru sesji.
 * Domyślnie 7 pozycji (mikro-lekcja 5–7 z badań Duolingo/SoloLearn).
 *
 * Czysta funkcja: fakty + talia + now -> lista ćwiczeń. Zero efektów ubocznych.
 */
export function buildSession(
  facts: Fact[],
  deck: DeckState,
  now: number = Date.now(),
  size: number = 7,
): Exercise[] {
  const factById = new Map(facts.map((f) => [f.id, f]));
  const queue: CardState[] = dueQueue(deck, now);

  const exercises: Exercise[] = [];
  for (const card of queue) {
    const fact = factById.get(card.factId);
    if (!fact) continue; // karta bez faktu (np. usunięty content) — pomijamy
    exercises.push({
      factId: fact.id,
      format: pickFormat(fact, card.box),
      box: card.box,
    });
    if (exercises.length >= size) break;
  }
  return exercises;
}

/** Ile ćwiczeń realnie zbuduje sesja teraz (bez limitu rozmiaru). */
export function availableExerciseCount(
  facts: Fact[],
  deck: DeckState,
  now: number = Date.now(),
): number {
  const ids = new Set(facts.map((f) => f.id));
  return dueQueue(deck, now).filter((c) => ids.has(c.factId)).length;
}
