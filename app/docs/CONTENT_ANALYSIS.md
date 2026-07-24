# DriverOS Training Parts — Content & Research Analysis

Seven training modules, authored as **content packs** for the shared learning engine
(`core/learning/`). Each pack is a set of researched facts; the engine (Leitner spaced
repetition + lesson format-selection) consumes every pack identically. Adding a module =
adding a pack. Zero engine changes.

**Status of all content: `DRAFT`.** Every fact carries a `sourceRef` and every pack is
flagged `reviewStatus: "DRAFT"` — meaning researched but **not yet legally/medically
reviewed**. Do not ship to a real driver without sign-off. This is enforced in code:
`bootstrap-learning.ts` asserts all packs are DRAFT.

---

## What each module covers, and why

### Czas pracy (driving & rest times) — most regulation-precise
The hard numbers drivers get fined on. Facts: 9h daily driving (10h twice/week), 45-min
break after 4.5h (splittable 15+30), 56h weekly / 90h fortnightly, 11h daily rest (9h
reduced max 3×), 45h weekly rest with the cabin-ban. Source: Regulation (EC) 561/2006,
arts. 6–8, plus the Mobility Package cabin/return rules. This is the highest-value module
because the penalties are steep and the numbers are exact.

### Tachograf — the device, kept separate from Czas pracy on purpose
A distinct regime (Regulation (EU) 165/2014), not the same as working-time rules — the app
must not conflate them. Facts: the four statutory activity symbols, driver card, manual
entries (a missing entry = serious infringement), the 56-day card rule, and the **1 July
2026** extension to vehicles over 2.5t in international/cabotage work — a live, current change
worth teaching now.

### Pierwsza pomoc (first aid at a road accident) — driver/bystander scope
Not a medical course; the chain-of-survival actions a driver actually performs. Facts: order
(secure scene → assess → call → aid), 112 and what to report, hi-vis + warning triangle,
recovery position (only if breathing), when to start CPR (dispatcher instructs via 112), and
"always suspect spinal injury." Sources: Polish first-aid guidance (LUX MED, PRRM).
**Flag: medical content — needs review by a paramedic/instructor, not just a lawyer.**

### Eco Driving — behavioural, not legal
Fuel-efficiency technique. Facts: anticipation/reading ahead, shift timing and using torque,
speed vs aerodynamic drag, idle reduction, cruise control + tyre pressure. Sources: Michelin
Business, Energy Saving Trust, fleet training material.

### Załadunek (loading) — weight & distribution
The load-planning half. Facts: even/low distribution with heavy items over axles near the
headboard, axle-overload consequences, headboard and the 0.8g forward force, driver's shared
legal responsibility (can refuse to drive), and re-checking after the first km/breaks.
Sources: European Best Practices on Cargo Securing, IRU, Directive 2014/47/EU.

### Mocowanie (load securing) — the EN 12195-1 half
The securing standard. Facts: three methods (lashing/blocking/locking), LC (lashing capacity,
daN), STF/SHF, friction and anti-slip mats, lashing angle (<30° = poor effect), and the design
accelerations (0.8g forward, 0.5g rearward/sideways). Sources: EN 12195-1:2010, IRU Safe Load
Securing, EN 12195-2.

### ADR — hazardous goods basics
Carried over and expanded from the prototype's `class-3` example. Facts: class 3 (flammable
liquids), warning placards (rhombus), transport document (UN number/name/class), spill
procedure. Sources: ADR Agreement. **Flag: needs a DGSA (ADR adviser) review.**

---

## Overlap decisions I made deliberately

- **Tachograf vs Czas pracy kept as two modules.** They're two different EU regulations
  (165/2014 vs 561/2006). Drivers and enforcement treat them separately; merging them would
  teach a wrong mental model. The 2.5t/July-2026 change touches both — it appears in each from
  its own angle.
- **Załadunek vs Mocowanie kept separate.** Loading (weight distribution, axle loads) and
  securing (lashings, EN 12195-1 calculation) are distinct competencies and distinct roadside
  checks. The 0.8g forward force appears in both because it's the bridge between them.

---

## Format ramp (same for every module)

Each fact declares which question formats it supports; the engine escalates by Leitner box:
box 1–2 recognition (`mcq`), 3 matching, 4 fill, 5 ordering/scenario. Every fact supports
`mcq` as a guaranteed fallback (validated at import). So a fact is tested by recognition when
fresh and by production/scenario once nearly mastered — the same fact, harder angle over time.

---

## What's next on content

1. **Legal/medical review** to move packs DRAFT → LEGAL_REVIEWED → PUBLISHED.
2. Country variants: these are EU-wide / PL-facing; DE-specific figures (fines) belong in the
   assistance-stack Knowledge Engine, not here — keep legal *thresholds* in learning, legal
   *advice* in Knowledge.
3. More facts per pack (currently 4–6 each; a real module wants 20–40).
4. Wire `LearningSession` into a DriverOS UI screen (thin renderer over the session state).
