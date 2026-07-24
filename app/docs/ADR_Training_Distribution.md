# ADR — Training Distribution & the ADR Publishing Process

**Status:** Draft for your decision
**Decides:** How the Training feature reaches the Play Store, and how ADR (and the other
packs) move from DRAFT to a shippable state.
**Depends on:** Domain Model §2 (Knowledge versioning), core/learning (engine + packs).

---

## 0. First, the naming — because it was hiding the real question

"Training Module" mixed two things. Fixing the vocabulary makes the decision obvious:

- **LearningPack** — one body of content (ADR, Tachograf, Czas pracy…). Seven exist, all DRAFT.
- **Training feature** — the part of DriverOS a user opens to study. It is the LearningEngine
  plus whatever packs are bundled/downloaded. This is a *DriverOS feature*, not a "module" in
  the Emergency/Advisor/Rights sense.
- **Product** — what actually gets a Play Store listing. Could be "DriverOS" (Training inside)
  or "ADR Trainer" (Training-only shell).

So the question isn't "build a Training Module." It's: **which products carry the Training
feature to the store, and with which packs inside.** That's packaging, and it's a build-config
choice on top of the engine we already have — not new engine code.

---

## 1. What the market shows (researched)

- The ADR-exam-prep niche on Polish Play Store is **real and active**: "Testy ADR" markets
  2500+ questions, exam mode, "100% pass rate"; "E-Adr" is a course-companion quiz app; "ADR
  Tool" is a reference/utility app (UN lookup, driver instructions in 25 languages).
- The category is **question-bank commodity**. Every competitor is a flat pool of questions.
  None of them has a spaced-repetition engine that shows a fact *just before you forget it* —
  that is your `leitner.ts` differentiator, and it is the one thing a re-skin competitor can't
  trivially copy.
- The **exam is concrete**: basic ADR exam = 30 questions (all classes), specialist = 18, with
  a 6-month window after the course. This gives a sharp product target and honest marketing
  ("prepares you for the 30-question basic exam") instead of vague "learn ADR."
- ADR training legally **already bundles** first aid, fire, load securing, accident procedure
  (the specialist course syllabus lists them). Your six other packs aren't unrelated modules —
  they are *the same driver's world*. That is an argument for one coherent product, not six
  strangers on a shelf.

## 2. What the strategy research shows

- **Single-app focus** wins on distribution: one growth engine, one ASO surface, one community,
  earlier profitability. The recurring warning: "software is a commodity; focusing on a single
  app eliminates the crucial risk — being unable to nail the distribution game."
- **Portfolio/multiple-app** wins on risk-spreading and per-vertical learning, but carries real
  operational drag: N listings, N review cycles, N sets of screenshots/reviews/ratings, N
  onboarding funnels, fractured focus.
- Play Store is a **full-text search** store: it indexes title + short + long description (and
  reviews). Multiple apps can each rank for their own tight keyword ("testy ADR", "tachograf
  nauka") — the genuine ASO upside of the portfolio path.

---

## 3. The two paths, head to head

### Path A — One DriverOS app, Training is a feature inside

| | |
|---|---|
| **Store presence** | One listing: "DriverOS". Training is a tab. |
| **Packs** | All 7 shipped as content; new packs arrive over-the-air, no store review. |
| **Advantages** | One codebase, one pipeline, one ASO effort. Training reuses offline packages, trust ladder, profile. A driver in a real inspection opens *one* app, not "the ADR app". Matches the "one engine" thesis. Pack updates need no APK release. |
| **Tradeoffs** | Larger install for someone who only wanted ADR flashcards. Weaker keyword targeting — one listing can't rank sharply for "testy ADR" *and* "tachograf" *and* "eco driving". Slower to test whether any single domain sells. |
| **Best when** | You believe the value is the *platform* — the driver's single companion. |

### Path B — Several standalone trainer apps (ADR Trainer, Tachograf Trainer, …)

| | |
|---|---|
| **Store presence** | N listings, each a thin shell over the same engine + one pack. |
| **Packs** | Each app bundles its pack; DriverOS proper can still bundle all. |
| **Advantages** | Sharp ASO per niche ("ADR egzamin" is a real, high-intent search). Tiny installs. Per-domain monetisation and analytics — you *learn which domain converts*. The featured brand (DriverOS) is protected while you experiment. |
| **Tradeoffs** | N review cycles, N screenshot sets, N review/rating pools to nurse from zero, duplicated onboarding. Fractured focus for a small team. Fragments the exact thing Guardian exists to unify. |
| **Best when** | You're testing the market and want cheap, independent bets before committing. |

---

## 4. Recommendation — sequence, don't choose

These are not mutually exclusive, and your architecture is *built* to have it both ways: same
engine, different pack subset, different shell. So:

1. **Build A's foundation** (DriverOS with the Training feature and all 7 packs). This is the
   platform and the long-term home.
2. **Ship one B-style probe first** to reach the store fast and learn: a standalone **"ADR
   Trainer"** — thinnest possible shell, ADR pack only, spaced-repetition as the headline
   feature. ADR is the sharpest market (proven competitors, concrete 30-question exam, real
   search intent) and your best wedge.
3. **Read the signal.** If the ADR probe converts, either spin sibling probes (Tachograf,
   Czas pracy) *or* fold the momentum into the full DriverOS listing. If it doesn't, you spent
   one thin shell, not a portfolio.

Net: **one engine, one platform (DriverOS), and one cheap standalone probe (ADR Trainer) as the
market test.** You don't commit to 5 listings, and you don't wait for the whole platform to
learn whether people pay for ADR prep.

Rule that keeps this honest: **the engine and packs never fork.** ADR Trainer and DriverOS import
the *same* `adrPack` and the *same* `core/learning`. A pack is authored once, published once,
and any shell can carry it. The moment content forks per app, the portfolio drag becomes real
and the "one engine" promise breaks.

---

## 5. The ADR publishing process (this is what "adjust ADR publishing" means)

A pack must not reach a driver as DRAFT. Publishing = moving a pack through a gated pipeline,
versioned exactly like Knowledge (Domain Model §2 / ADR-002: versions immutable, never edited
in place). Proposed states (already stubbed in `content.ts` as `reviewStatus`):

```
DRAFT  ──(DGSA / legal review)──▶  LEGAL_REVIEWED  ──(publish, freeze version)──▶  PUBLISHED
```

- **DRAFT** — researched, sourced, NOT shippable. Enforced today: `bootstrap-learning.ts`
  asserts every pack is DRAFT. A build that bundles a DRAFT pack into a store artifact should
  fail (add this as a release-time check, mirroring `validateWorkflowDefinition`).
- **LEGAL_REVIEWED** — a qualified human signed off. For ADR specifically that human is a
  **DGSA** (safety adviser); for Pierwsza pomoc, a medic/instructor. Record who and when
  (`verifiedBy`, `verifiedAt`) — same metadata rule as Knowledge: "content without a verifier
  does not exist."
- **PUBLISHED** — frozen at a content SemVer. A correction is a *new version*, never an edit,
  so a user's past exam attempts still reference the pack version they studied.

**Concrete next steps for ADR publishing:**
1. Add `verifiedBy` / `verifiedAt` / `reviewNotes` to `LearningPack` (mirror KnowledgeVersion).
2. Add a release-gate function (`assertPublishable(pack)`) that throws unless
   `reviewStatus === "PUBLISHED"`; call it in the store-build script, not at runtime.
3. Expand the ADR pack from 4 facts to real exam coverage (target the 30-question basic scope:
   classes, placarding, documents, equipment, tunnels, loading/securing, first aid, accident).
4. Route it through a DGSA for `LEGAL_REVIEWED`, then publish v1.0.0 frozen.
5. Only then bundle it into the ADR Trainer probe.

This makes the publishing process identical for every pack and every shell — which is the whole
point. ADR is just the first one through the gate.
