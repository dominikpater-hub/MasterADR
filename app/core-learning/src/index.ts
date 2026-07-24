/**
 * core/learning — rdzeń Trenera ADR (Faza 0, offline-first, zero AI).
 *
 * Jeden punkt wejścia. Warstwa wyżej (UI, natywna apka) importuje stąd:
 *   import { LessonSession, buildSession, registerActivity } from "./core/learning";
 *
 * Warstwy (od czystej logiki do efektów):
 *   leitner.ts      — silnik powtórek (5 pudełek, interwały, kolejka due)
 *   lesson.ts       — pętla mikro-lekcji (pickFormat, rampa formatów, buildSession)
 *   session.ts      — sesja ze stanem + zapis talii (jedyna warstwa z efektami)
 *   gamification.ts — streak z zamrożeniem, XP, cel dzienny (bez serc, bez lig)
 */

export * from "./leitner";
export * from "./lesson";
export * from "./session";
export * from "./gamification";
