# ADR Driver Certification — Complete Knowledge-Scope Map for a Gamified Learning App ("ADR Duolingo")

## Streszczenie wykonawcze (Polish executive summary)

Aplikacja musi pokryć cztery poziomy uprawnień ADR dla kierowców: (1) **kurs podstawowy** (wszystkie klasy oprócz 1 i 7; egzamin 30 pytań / 60 min / zaliczenie 2/3 = 20 pkt), (2) **kurs specjalistyczny – cysterny** (18 pytań / 40 min / 12 pkt), (3) **kurs specjalistyczny – klasa 1** (15 pytań / 30 min / 10 pkt), (4) **kurs specjalistyczny – klasa 7** (15 pytań / 30 min / 10 pkt). [Adr-kurs](https://adr-kurs.pl/oferta/testy-adr/) Każdy poziom występuje w wariancie **początkowym** i **doskonalącym** (odnowienie co 5 lat). Zakres tematyczny kursu podstawowego dzieli się na 5 bloków z rozporządzenia z 29 maja 2012 r. (wymagania ogólne; główne zagrożenia; ochrona środowiska; działania zapobiegawcze i środki bezpieczeństwa; czynności po wypadku), które odpowiadają katalogowi tematów z ADR 8.2.2.3.

**Kluczowa kwestia prawna (IP):** zgodnie z rozporządzeniem Ministra Infrastruktury z 26 czerwca 2024 r. (Dz.U. 2024 poz. 964) §9 ust. 2, pytania testowe pochodzą z **katalogu pytań** przygotowanego przez „jednostkę upoważnioną na podstawie art. 9 ust. 2 ustawy" z 19 sierpnia 2011 r.; jednostka ta „podaje do publicznej wiadomości przykładowe pytania egzaminacyjne dla każdego rodzaju kursu" — publikowane są jedynie **przykładowe** pytania, pełny katalog NIE jest informacją publiczną. **Aplikacja musi budować WŁASNE, oryginalne pytania** oparte na przepisach ADR/rozporządzeniach, a nie kopiować katalogu urzędowego.

---

## TL;DR

- **The app needs four separate but nested question banks** mapped to Poland's four ADR driver certifications — Basic (30 Q / 60 min), Tank (18 Q / 40 min), Class 1 (15 Q / 30 min), Class 7 (15 Q / 30 min), all passed at 2/3 correct — with the Basic course structured into the five thematic blocks defined by the Polish training regulation of 29 May 2012, which in turn map onto the ADR 8.2.2.3 syllabus that is common across the EU (expansion-ready).
- **Build 100% original questions.** The Polish state exam draws from a restricted "katalog pytań" prepared by an authorized unit under art. 9(2) of the 2011 Act; per Dz.U. 2024 poz. 964 §9(2) and e-kierowca.pl's citation of the regulation, only sample questions ("przykładowe pytania egzaminacyjne") are published and the full catalogue is legally excluded from "informacja publiczna." Copying it is both legally risky and unnecessary — the underlying facts (ADR references) are the true fact-bank.
- **The fact-bank is fundamentally numeric and rule-based** — fire-extinguisher capacities by vehicle mass (2/8/12 kg per ADR 8.1.4.1), the 1.1.3.6 "1000-points" transport-category table, Kemler/UN plate logic, Class 1 compatibility groups, Class 7 label categories (I-WHITE/II-YELLOW/III-YELLOW) and transport index — which makes it ideal for gamified drill-style questions. Flag ADR 2025 changes (lithium/sodium-ion batteries, waste packing, in-cab documentation) as a living-content layer.

## Key Findings

### The certification architecture (Poland)
- Four courses, each **początkowy** (initial) or **doskonalący** (refresher, every 5 years). Certificate (zaświadczenie ADR) valid 5 years from the exam date.
- Exam format identical across all: written test, single-choice; per biznes.gov.pl (Zaświadczenie ADR): "Egzamin ma formę pisemnego testu i składa się z pytań **jednokrotnego wyboru z trzema możliwymi odpowiedziami**" (A/B/C); pass = at least 2/3 correct on each test taken (Dz.U. 2024 poz. 964 §11: "udzieli poprawnych odpowiedzi na co najmniej 2/3 pytań z każdego zdawanego testu").
- Question counts / times per the current **Rozporządzenie Ministra Infrastruktury z dnia 26 czerwca 2024 r. w sprawie egzaminów dla kierowców przewożących towary niebezpieczne (Dz.U. 2024 poz. 964)**, in force since 1 July 2024, which replaced the 15 Feb 2012 regulation: §9 — "30 pytań … podstawowego; 18 pytań … w cysternach; 15 pytań … klasy 1; 15 pytań … klasy 7"; §10 — "60 minut … podstawowego; 40 minut … w cysternach; 30 minut … klasy 1; 30 minut … klasy 7."
- Prerequisite: basic course must be passed before/with any specialization; minimum age 21, driving licence B/C/C+E. [Inter Cars](https://intercars.pl/blog/poradnik-kierowcy/kurs-adr-czym-jest-i-jakiego-kierowce-dotyczy/)
- Exam commission: two-person, appointed by the marszałek województwa; conducted at the training centre. Certificate issued by the marszałek within days of a positive exam protocol.

### The IP/legal status of the question catalogue
- Under the exam regulation (Dz.U. 2024 poz. 964 §9 ust. 2, verbatim): "Pytania testowe pochodzą z katalogu pytań … przygotowanego przez: 1) jednostkę upoważnioną na podstawie art. 9 ust. 2 ustawy; 2) Szefa Inspektoratu Wsparcia Sił Zbrojnych – w przypadku egzaminów dla kierowców pojazdów należących do Sił Zbrojnych RP."
- Only sample questions are published: "Jednostka ta podaje do publicznej wiadomości przykładowe pytania egzaminacyjne dla każdego rodzaju kursu dokształcającego" (e-kierowca.pl citing the regulation).
- For the parallel DGSA/doradca exam the catalogue is explicitly not public information; the same restrictive logic applies to driver questions. **Conclusion: the app must author original items.** This is confirmed as the correct legal posture.

### ADR agreement structure (source-mapping layer for the app)
ADR Annexes A and B are grouped into **9 parts**: Part 1 general provisions (definitions, exemptions, training, security); Part 2 classification; Part 3 dangerous goods list (Table A/B), limited & excepted quantities; Part 4 packing and tank use; Part 5 consignment procedures (marking, labelling, placarding, documents); Part 6 construction/testing of packagings and tanks; Part 7 conditions of carriage, loading, unloading, handling; Part 8 vehicle crews, equipment, operation, documentation (incl. 8.2 training); Part 9 vehicle construction and approval.

## Details

### LEVEL 1 — KURS PODSTAWOWY (Basic course, all classes except 1 and 7)

The Polish regulation defines the syllabus in five thematic blocks. Below, each is broken into granular, quiz-ready knowledge points with ADR references. (Legally-required exam content is the ADR-referenced material; general good-practice is flagged.)

#### Block 1 — Wymagania ogólne (general requirements)
- **Legal framework:** ADR = Accord européen relatif au transport international des marchandises Dangereuses par Route; a UN/UNECE treaty; [FreightUtils](https://www.freightutils.com/adr) in Poland implemented via the ustawa z 19.08.2011 o przewozie towarów niebezpiecznych + EU Directive 2008/68/WE. [Infor.pl](https://www.infor.pl/akt-prawny/DZU.2024.180.0000964,metryka,rozporzadzenie-ministra-infrastruktury-w-sprawie-egzaminow-dla-kierowcow-przewozacych-towary-niebezpieczne.html) ADR revised every two years (odd years); current edition ADR 2025.
- **Definitions:** dangerous goods, transport unit vs vehicle (a transport unit may be one vehicle, or a tractor + semi-trailer, or a rigid + drawbar — i.e. two vehicles but one transport unit), consignor/carrier/consignee, loader/packer/filler/tank-operator, package, overpack, bulk, tank.
- **Structure of ADR** (9 parts — as above), and how to navigate to Table A (3.2.1).
- **Participants and their duties** (ADR 1.4): main obligations of carrier, driver, consignor, loader.
- **Training obligations:** ADR 1.3 (general awareness/function-specific training for all persons involved) vs 8.2 driver certificate. As of ADR 2025, LQ crews also need documented training. [Hibiscus-plc](https://hibiscus-plc.co.uk/chemical-regulatory-updates-2025-imdg-iata-and-adr-changes/)
- **Exemptions (very high exam frequency):**
  - **1.1.3.1** — exemptions related to the nature of the transport operation (e.g., carriage by private individuals; equipment for the vehicle's own operation; fuel in vehicle tanks).
  - **1.1.3.6** — the "small load" / "1000-points" exemption per transport unit (see the transport-category table below).
  - **Limited Quantities (LQ, Ch. 3.4)** and **Excepted Quantities (EQ, Ch. 3.5)** — thresholds, marking, what relief they give; EQ codes E0–E5 in Table A column 7(b).

**Transport-category table (ADR 1.1.3.6.3 / 1.1.3.6.4)** — verified values:
| Transport category | Max total quantity per transport unit (col. 3) | Multiplication factor (1.1.3.6.4) |
|---|---|---|
| 0 | 0 (never exemptible) | not applicable (excluded) |
| 1 | 20 | ×50 |
| 2 | 333 | ×3 |
| 3 | 1000 | ×1 |
| 4 | unlimited | ×0 |

Sum of (quantity × factor) must be ≤ 1000 for the exemption to apply. [NextSDS](https://nextsds.com/tools/adr-points-calculator/) Note the important distinction: for Category 1 the "20" is the **column-3 maximum quantity**, while the **multiplication factor is ×50**; a special subset of Category-1 goods (certain explosives/gases, e.g. UN 1005, UN 1017) instead carries a ×20 factor and a 50 kg cap. Category 0 goods are excluded entirely. Even under 1.1.3.6, obligations remain: proper packaging/labelling, transport document stating points and a reference to 1.1.3.6, load securing, ADR 1.3 training, and a 2 kg fire extinguisher. **The exemption does NOT apply to tanks** — tank drivers always need the full ADR certificate and equipment.

#### Block 2 — Główne rodzaje zagrożeń (main hazard types)
- **The 9 classes** and subdivisions: 1 explosives; 2 gases (2.1 flammable, 2.2 non-flammable non-toxic, 2.3 toxic); 3 flammable liquids; 4.1 flammable solids/self-reactive/desensitized explosives, 4.2 spontaneously combustible, 4.3 emit flammable gas with water; 5.1 oxidizers, 5.2 organic peroxides; 6.1 toxic, 6.2 infectious; 7 radioactive; 8 corrosive; 9 miscellaneous (incl. lithium/sodium-ion batteries, environmentally hazardous, elevated-temperature).
- **Packing groups I/II/III** = high/medium/low danger; determine packaging performance standard. [FreightUtils](https://www.freightutils.com/adr) Examples: petrol UN 1203 PG II; diesel UN 1202 PG III.
- **UN number** — 4-digit substance identifier; **proper shipping name (PSN)**; single/generic/N.O.S. entries.
- **Hazard labels (placards, diamonds)** vs **orange plates**: labels are class-coloured diamonds (min 100×100 mm on packages, 250×250 mm placards on vehicles); orange plates are the rectangular hazard-ID plates (400×300 mm standard).
- **Kemler / Hazard Identification Number (5.3.2):** upper number on orange plate = nature/intensity of hazard (2–3 digits); first digit = primary hazard, doubling = intensification, trailing 0 = single hazard sufficient; prefix **"X"** = reacts dangerously with water (water only by expert approval). Special-meaning combinations include 22, 323, 333, 362, 382, 423, 44, 446, 462, 482, 539, 606, 623, 642, 823, 842, 90, 99. For Class 1, the classification code (division + compatibility group) is used as the HIN. Lower number = UN number. Example: **33/1203 = highly flammable liquid, petrol.**
- **Subsidiary/secondary hazards** and the 2.1.3.10 table of precedence of hazards.

#### Block 3 — Ochrona środowiska (environmental protection)
- Environmentally hazardous substances (class 9, UN 3077 solid / UN 3082 liquid) and the **environmentally hazardous substance mark** (dead fish and tree symbol) — when required and thresholds.
- Waste transport control and classification of wastes (2.1.3); ADR 2025 changes to waste packing (new 4.1.1.5.3 "lab-smalls" waste), waste paints (SP 650 permitting mixed packing/loading of UN 1263 and UN 3082), and free asbestos (SP 678).
- Behaviour of spilled substances; protection of soil/water/drains; drain-seal use.

#### Block 4 — Działania zapobiegawcze i środki bezpieczeństwa (preventive measures)
- **Fire-fighting equipment (ADR 8.1.4)** — verified verbatim from ADR 8.1.4.1/8.1.4.2. Every transport unit needs at least one portable extinguisher of ≥2 kg dry powder (classes A, B, C) suitable for an engine/cab fire. Additional requirement by maximum permissible mass of the transport unit:
  - up to and including 3.5 t: total min **4 kg**;
  - >3.5 t to 7.5 t: total min **8 kg**, of which at least one ≥6 kg;
  - >7.5 t: total min **12 kg**, of which at least one ≥6 kg;
  - carrying under 1.1.3.6: one **2 kg** extinguisher.
  Must comply with EN 3; sealed to prove unused; marked with next-inspection date; installed accessibly and weather-protected. (Note: roadside inspection failures are dominated by fire-extinguisher defects, per DGSA sources — high exam relevance.)
- **Miscellaneous & PPE equipment (ADR 8.1.5)** — for all danger labels: one wheel chock per vehicle (sized to mass and wheel diameter), two self-standing warning signs, eye-rinsing liquid (except danger labels 1, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3); per crew member: warning vest, portable lighting apparatus (8.3.4), a pair of protective gloves, eye protection (goggles). Class-specific additions: emergency escape mask per crew member for danger labels 2.3 or 6.1; shovel, drain seal and collecting container for solids/liquids with labels 3, 4.1, 4.3, 8 or 9.
- **Written instructions / instrukcje pisemne (ADR 5.4.3):** standardized **4-page model** (5.4.3.4), carried in the crew's cab and readily available, in language(s) each crew member understands, provided by the carrier before the journey; the same document is used regardless of the goods; lists crew actions in an accident plus equipment and class-by-class guidance.
- **Load segregation / mixed-loading prohibitions (7.5.2):** general ADR principle that most classes may be carried together if UN-packed and ADR-compliant (unlike IMDG); specific Class 1 rules; food-separation for toxic/infectious loads.
- **Transport documents (5.4.1):** UN number, PSN, class/labels, packing group, number and description of packages, total quantity, consignor/consignee, tunnel code (5.4.1.1.1(k)); from July 2025 documents must be in the driver's cab. [Hibiscus-plc](https://hibiscus-plc.co.uk/chemical-regulatory-updates-2025-imdg-iata-and-adr-changes/)
- **Prohibitions during loading/unloading (Part 7 / Chapter 8.3):** no smoking/naked flame, engine off (unless powering the pump), no passengers (other than crew), park with parking brake + at least one chock, no opening of packages, torches must not produce sparks in a flammable atmosphere (special provision S2).

#### Block 5 — Czynności po wypadku (post-accident procedures)
- Emergency-action sequence from the written instructions (5.4.3.4), verbatim intent: apply braking system, stop engine, isolate battery via master switch where available; avoid ignition sources (no smoking/e-cigarettes/electrical equipment); inform emergency services with as much detail as possible; put on warning vest and place self-standing warning signs; keep transport documents readily available for responders; do not walk into or touch spilled substances, avoid inhaling fumes/smoke/dust/vapours by staying upwind; where safe, use extinguishers on small tyre/brake/engine fires (do NOT tackle load-compartment fires); move away and advise others to move away; remove and safely dispose of contaminated clothing/used PPE.
- First aid basics: asphyxiation, chemical/thermal burns, frostbite (from gases), decontamination.
- Road-safety measures at the scene; correct use of fire extinguishers and PPE.

### LEVEL 2 — KURS SPECJALISTYCZNY: CYSTERNY (Tank specialization) — ADR 8.2.2.3.3
- **Behaviour of vehicles on the road, incl. load movement / surge (fala/ruch cieczy):** effect of partial loads on braking and cornering, roll-over risk, centre of gravity, baffle/surge dynamics; static electricity; roll-over prevention. [GOV.UK](https://www.gov.uk/government/publications/dangerous-goods-adr-driver-training-syllabus/dangerous-goods-adr-driver-training)
- **Requirements for vehicles and tanks:** fixed tanks (tank-vehicles), demountable tanks, tank-containers, tank swap bodies, battery-vehicles, MEGCs; construction basics (Part 6.8), shell, compartments, baffles.
- **Filling and emptying systems:** top vs bottom loading, degree/limits of filling, pressure/vacuum operation, valves, bonding/earthing, prohibition of overfilling; the driver's duty on emptying the tank.
- **ADR vehicle approval certificate (świadectwo dopuszczenia pojazdu ADR, Part 9.1.3, "czerwony pasek"):** required for vehicle types **FL, AT, EX/II, EX/III, MEMU** (and historic OX pre-2018); issued in Poland by the **Dyrektor Transportowego Dozoru Technicznego (TDT)** on written application, based on a technical inspection at an OSKP/authorized station; A4 format (210×297 mm), white with pink diagonal stripe, validity up to 1 year, renewable; ADR 2025 permits guilloche printing and a QR/barcode; separate certificates for tractor and semi-trailer. Vehicle-type meanings: FL = flammable liquids (flash point ≤60 °C) etc. in fixed tanks; AT = other tank vehicles not FL/MEMU/EX; EX/II, EX/III = explosives; MEMU = mobile explosives manufacturing unit.
- **Orange plate / marking specifics for tanks:** on tank/battery/MEMU vehicles the orange plate MUST carry the **HIN (Kemler) + UN number** (not the plain plate used for packaged goods); plain orange front/rear plus hazard placards; multi-compartment tanks carrying different substances need per-compartment plates; empty, uncleaned/degassed tanks marked accordingly.
- **Additional special provisions** applicable to tank carriage; the 1.1.3.6 exemption is not available for tanks.

### LEVEL 3 — KURS SPECJALISTYCZNY: KLASA 1 (Explosives) — ADR 8.2.2.3.4
- **Specific hazards of explosives — the six divisions:** 1.1 mass explosion; 1.2 projection; 1.3 fire/minor blast or projection; 1.4 no significant hazard; 1.5 very insensitive, mass-explosion; 1.6 extremely insensitive, no mass-explosion.
- **Compatibility groups A–S** (letters denoting the type of explosive substance/article and its compatibility for loading/stowage). The classification code = division number + compatibility group letter (e.g. **1.1D**). Note per ADR 2.2.1: articles of compatibility groups C, D and E may be packed together and assigned to group E.
- **Mixed-loading prohibitions (7.5.2.2):** packages bearing labels 1, 1.4, 1.5 or 1.6 of **different compatibility groups shall not be loaded together** unless permitted by the mixed-loading table; group **S** does not count toward quantity limits; where different divisions are loaded, the whole load is treated as the **most dangerous division** in the order 1.1, 1.5, 1.2, 1.3, 1.6, 1.4; specific permitted combinations exist (e.g. group D + group B in separate compartments; life-saving appliances of class 9 with class 1; safety devices). Mixed loading of LQ goods with explosives is prohibited except division 1.4 and UN 0161/0499.
- **Special packing/loading rules for Class 1** (4.1.5); quantity limits per transport unit; MEMU conditions (e.g. limits such as 200 kg of group D and 400 detonators unless otherwise approved).
- **Marking/labelling:** labels model 1, 1.4, 1.5, 1.6; placarding on **both sides + rear** of the vehicle; **EX/II or EX/III** vehicle approval required; tunnel codes such as B1000C / C5000D relate to net explosive mass.

### LEVEL 4 — KURS SPECJALISTYCZNY: KLASA 7 (Radioactive) — ADR 8.2.2.3.5
- **Specific hazards of ionizing radiation:** package activity is measured *inside* the package but the **label reflects the radiation level *outside*** the package; dose-rate concept; exposure-time limitation (ALARA principle).
- **Label categories (three — unique to Class 7; the driver must know the criteria):**
  - **I-WHITE** — transport index (TI) effectively 0; maximum surface dose rate ≤ 0.005 mSv/h (0.5 mrem/h). Lowest category.
  - **II-YELLOW** — TI > 0 but ≤ 1; surface dose rate > 0.005 and ≤ 0.5 mSv/h.
  - **III-YELLOW** — TI > 1 but ≤ 10; surface dose rate ≤ 2 mSv/h (also TI > 10 or up to 10 mSv/h under exclusive-use arrangements; any "highway route controlled quantity" is automatically III-YELLOW).
- **Transport index (TI):** the highest radiation level at 1 m from the package surface; the applied label category is the **higher** of the TI-based and the surface-dose-based category; TIs are summed for a vehicle/overpack; conveyance limits and (for fissile material) a criticality safety index (CSI).
- **Special packing/handling/loading/stowage:** minimum **segregation distances** from areas continuously occupied by people/animals, from undeveloped film, and from foodstuffs, computed from total TI; excepted packages; package types (Excepted, Type A/B/C, UF6); FISSILE label; a single storage group's total TI limited (e.g. ≤50) and groups kept apart.
- **Marking specifics:** RADIOACTIVE placard on **both sides + rear** of the vehicle; UN number displayed with the placard; label carries radionuclide name/symbol, activity (Bq) and TI; **OVERPACK** marking with repeated labels where inner ones are not visible.

### Reference tables the driver must be able to use
- **Table A (3.2.1)** — the dangerous goods list: UN, PSN, class, classification code, packing group, labels, LQ/EQ codes, packing/tank instructions, special provisions, transport category, and tunnel code (column 15). ~2,900+ UN entries in ADR 2025.
- **Mixed-loading / segregation** — the general principle (7.5.2) plus the Class 1 compatibility table.
- **Tunnel restriction codes (1.9.5, column 15):** category A (no restriction, unsigned), B, C, D, E (most restrictive). Codes such as **D/E** for a UN entry indicate the tunnel categories through which the substance may not pass, distinguishing bulk/tank vs packaged carriage; the **most restrictive code in a mixed load governs the whole vehicle**; carriage under 1.1.3 exemptions is not subject to tunnel restrictions (except marked LQ loads over 8 t gross for category E).
- **Transport-category / 1.1.3.6 "1000-points" table** (above).

### Initial vs refresher (początkowy vs doskonalący)
- Same scope of knowledge; the refresher condenses and updates content and emphasizes regulatory changes since the last certificate. Under ADR 8.2.2.7, refresher exams may internationally use fewer questions/shorter time, but **in Poland the exam question counts and times are identical for initial and refresher** (Dz.U. 2024 poz. 964 §9–§10 make no distinction). The refresher must be completed within the certificate's final year to renew for another 5 years.

### ADR 2025 changes to flag (living-content layer)
- New/expanded lithium-battery provisions; **sodium-ion batteries added** — per OTIF/UNECE ADR 2025 "what's new": **UN 3551** (sodium-ion batteries with organic electrolyte) and **UN 3552** (sodium-ion batteries packed with/contained in equipment), plus **UN 3556–3558** for vehicles powered by lithium-ion, lithium-metal or sodium-ion batteries; new packing instruction **P912** applies to UN 3556–3558; Class 9 classification code M4 now covers both lithium and sodium-ion batteries; manufacturers/distributors must "make available" the UN 38.3 test summary.
- Waste changes: SP 650 (waste paints, UN 1263/3082), [Bens-consulting](https://www.bens-consulting.com/en/blog/421/are-you-familiar-with-adr-2025-and-changes-it-brings) new 4.1.1.5.3 lab-smalls waste packing, SP 678 free asbestos. [Health and Safety Authority](https://www.hsa.ie/eng/your_industry/adr_-_carriage_of_dangerous_goods_by_road/news_updates/adr_2025_-_summary_of_main_changes/)
- Operational: from **1 July 2025** transport documents must be in the driver's cab; LQ crew training now required (ADR 8.2.3 clarification).
- New special provision SP/SV 677 for critically defective batteries (transport category 0). [HK Handels GmbH](https://hk-handels.com/en/blogs/news/adr-sv-677-eu-batterieverordnung-und-gefahrguttransport)

## Recommendations

**Stage 1 — Build the Basic (podstawowy) bank first, structured as five skill-trees matching the regulation blocks.** Map every question to an ADR reference so the app can show a "source" and so content survives ADR edition changes. Target the highest-frequency, most numeric topics for the earliest lessons: fire-extinguisher capacities (8.1.4), 1.1.3.6 points, Kemler/UN plates, the 8.1.5 equipment list, written-instructions actions. Benchmark to advance: a learner scoring ≥85% on a 30-question simulated exam (well above the 20/30 legal pass) before the app declares "exam-ready."

**Stage 2 — Add the three specialization banks as unlockable modules** gated behind Basic completion (mirrors the legal prerequisite). Tank is the largest commercial market (fuel/LPG); build it second and deepest (surge, świadectwo dopuszczenia, bottom-loading, per-compartment plates). Class 1 and Class 7 are niche ("wybierane przez wąską grupę kierowców") but must be built out fully for completeness.

**Stage 3 — Author all questions originally** and never ingest the official katalog (legally excluded from public information). Commission a licensed DGSA (doradca ADR) to review items for legal accuracy and current-edition correctness. Keep an "ADR edition" tag on every item so the 2027 revision can be diffed and updated.

**Stage 4 — Add an "exam simulator" mode** replicating the exact Polish format (30/18/15 questions; 60/40/30 minutes; three options A/B/C; 2/3 pass) alongside a "drill" mode using gamified spaced repetition for retention.

**Thresholds that change the plan:** if the app expands beyond Poland, swap the national-procedure layer (exam counts, świadectwo issuance, competent authority) while keeping the ADR 8.2.2.3 core intact — this is why the architecture must separate an "ADR core" schema from a thin "national wrapper." If the 2027 ADR revision introduces new classes/marks, the living-content layer absorbs it without restructuring the skill-trees.

## Caveats
- **Numeric thresholds should be re-verified against the current ADR 2025 text before publication.** Fire-extinguisher capacities (8.1.4.1/8.1.4.2), the 8.1.5 equipment list, and the 1.1.3.6 table were confirmed against ADR text reproductions and reputable DGSA/training sources; some primary UNECE pages block automated retrieval, so a final check against ADR 2025 in force is prudent.
- **The identity of the Polish "jednostka upoważniona" for the DRIVER question catalogue is not definitively confirmed.** TDT is confirmed for the DGSA/doradca exam and for vehicle-approval certificates, but the driver catalogue is prepared by the unit authorized under art. 9(2) of the 2011 Act — circumstantial evidence points to the Instytut Transportu Samochodowego (ITS), which administers driver-exam logistics, but this must be verified against the ministerial zarządzenie. Regardless of the entity, only sample questions are public and the full catalogue is not "informacja publiczna."
- Class 7 dose-rate/TI numeric bands were corroborated partly from US 49 CFR sources, which mirror the IAEA/ADR values; confirm the exact ADR 2.2.7 / 5.1.5 wording for the app.
- The Basic course excludes classes 1 and 7 by definition; the app must ensure those topics do not leak into the Basic bank (they belong only in the Class 1 / Class 7 modules).
- Older Polish sources cite the superseded 15 Feb 2012 exam regulation; the operative act since 1 July 2024 is Dz.U. 2024 poz. 964 — use it as the authority for exam format.