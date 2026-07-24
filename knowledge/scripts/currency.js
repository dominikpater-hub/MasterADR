/**
 * SILNIK AKTUALNOSCI (currency) — Knowledge Engine
 *
 * Odpowiada na pytanie "czy to jeszcze obowiazuje", ortogonalnie do trustLevel,
 * ktory odpowiada na "skad to wiemy" (ADR-006-B).
 *
 * Cztery stany, LICZONE a nie przechowywane:
 *   CURRENT  — edycja obowiazuje, brak sygnalu zmiany
 *   STALE    — nikt nie patrzyl od dawna, nic nie wskazuje na zmiane (higiena)
 *   LAPSED   — edycja przestala obowiazywac (znamy zakres: cala edycja)
 *   DRIFTED  — zrodlo ruszylo sie poza cyklem (nie wiemy co ani ile)
 *
 * Dlaczego liczone, nie przechowywane:
 *   nie moga sie rozjechac z rzeczywistoscia i nie wymagaja migracji przy zmianie
 *   polityki. Zmiana progu staleness = edycja policy.json, nie przebieg po 228 rekordach.
 *   To ta sama zasada co 006-B.
 *
 * Precedencja: DRIFTED > LAPSED > STALE > CURRENT
 *   DRIFTED bije LAPSED, bo "cos sie ruszylo i nie wiemy co" jest grozniejsze
 *   niz "cala edycja wygasla i wiemy dokladnie co".
 */

const DAY = 86400000;

function daysBetween(a, b) {
  return Math.floor((new Date(b) - new Date(a)) / DAY);
}

/** Czy edycja obowiazuje w dniu asOf. */
function editionActiveAt(edition, asOf) {
  const from = edition.validFrom ? new Date(edition.validFrom) : null;
  const to = edition.validTo ? new Date(edition.validTo) : null;
  const d = new Date(asOf);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

/**
 * @param entry    wpis w schemacie v2
 * @param editions mapa id -> byt edycji
 * @param policy   policy.json
 * @param asOf     data odczytu (ISO), domyslnie dzis
 * @param watchers mapa sourceId -> { lastCheckedAt } (opcjonalna)
 */
function computeCurrency(entry, editions, policy, asOf = new Date().toISOString().slice(0, 10), watchers = {}) {
  const reasons = [];

  // --- DRIFTED: sygnal zmiany zatwierdzony przez wlasciciela ---
  if (entry.drift && entry.drift.status === 'CONFIRMED') {
    return {
      currency: 'DRIFTED',
      reasons: [`sygnal zmiany zrodla zatwierdzony ${entry.drift.confirmedAt}: ${entry.drift.note || 'bez opisu'}`],
    };
  }

  // --- DRIFTED przez martwy watcher (fail-closed) ---
  if (policy.watcher && policy.watcher.failClosed) {
    const w = watchers[entry.source];
    if (w && w.lastCheckedAt) {
      const silence = daysBetween(w.lastCheckedAt, asOf);
      if (silence > policy.watcher.maxSilenceDays) {
        return {
          currency: 'DRIFTED',
          reasons: [`zrodlo "${entry.source}" niesprawdzone od ${silence} dni (limit ${policy.watcher.maxSilenceDays}) — fail-closed`],
        };
      }
    }
  }

  // --- LAPSED: ktorakolwiek edycja przestala obowiazywac ---
  // Wpis stoi na kilku edycjach (np. ADR + krajowy akt wykonawczy).
  // Wygasniecie KTOREJKOLWIEK unieaktualnia wpis — slabsze ogniwo decyduje.
  const lapsed = [];
  for (const ref of entry.editionRefs || []) {
    const ed = editions[ref];
    if (!ed) {
      return { currency: 'DRIFTED', reasons: [`brak bytu edycji "${ref}" — wpis stoi na nieznanym fundamencie`] };
    }
    if (!editionActiveAt(ed, asOf)) {
      lapsed.push({ ref, ed });
    }
  }
  if (lapsed.length) {
    return {
      currency: 'LAPSED',
      reasons: lapsed.map(({ ref, ed }) => {
        const next = ed.supersededBy ? editions[ed.supersededBy] : null;
        return `edycja ${ed.label} obowiazywala do ${ed.validTo}` +
               (next ? `, zastapiona przez ${next.label}` : '');
      }),
      migrateTo: lapsed.map(({ ed }) => ed.supersededBy).filter(Boolean),
    };
  }

  // --- STALE: higiena przegladu ---
  const st = policy.staleness || {};
  const isDraft = entry.lifecycle === 'DRAFT';

  if (isDraft && st.appliesToDraft === false) {
    return { currency: 'CURRENT', reasons: ['DRAFT — staleness nie dotyczy nieopublikowanej wiedzy'] };
  }

  const counted = (entry.review || []).filter(r =>
    r.kind === 'VERIFICATION' || (st.migrationSightingCounts && r.kind === 'MIGRATION_SIGHTED')
  );
  const dated = counted.filter(r => r.at).map(r => r.at).sort();
  const last = dated.length ? dated[dated.length - 1] : null;

  if (!last) {
    return {
      currency: 'STALE',
      reasons: counted.length
        ? ['przeglad bez daty — nie da sie policzyc wieku']
        : ['brak przegladu liczacego sie do higieny'],
    };
  }

  const age = daysBetween(last, asOf);
  if (age > (st.reviewIntervalDays || 365)) {
    return { currency: 'STALE', reasons: [`ostatni przeglad ${age} dni temu (prog ${st.reviewIntervalDays})`] };
  }

  return { currency: 'CURRENT', reasons: [`przeglad ${age} dni temu, edycja obowiazuje`] };
}

/**
 * trustLevel wg ADR-006-B — deterministyczny z metadanych.
 *
 * MODEL KANONICZNY (decyzja 2026-07-23): dwuosiowy. trustLevel odpowiada
 * WYLACZNIE na pytanie "skad to wiem" (source/verifiedBy). Na pytanie
 * "czy to nadal aktualne" odpowiada osobna os `currency`, egzekwowana
 * bramkami kanalowymi. Do UI idzie jeden zlozony sygnal — displaySignal().
 *
 * policy.trustLadderCompat.mapCurrencyToT2 = true przywraca stary,
 * jednoosiowy tryb ADR-003 (T2 = VERIFIED_STALE). Zachowany jako sciezka
 * powrotu; nie jest modelem kanonicznym.
 */
function computeTrustLevel(entry, currency, policy) {
  const verified = (entry.review || []).some(r => r.kind === 'VERIFICATION' && r.countsTowardPublication);
  const strongSource = entry.source === 'kompendium' || verified;

  const compat = policy.trustLadderCompat && policy.trustLadderCompat.mapCurrencyToT2;

  if (strongSource) {
    if (!compat) return 'T1';
    return (currency === 'CURRENT' || currency === 'STALE') ? 'T1' : 'T2';
  }
  return 'T3';
}

/** Bramka kanalowa — Decision Engine. */
function channelGate(currency, channel, policy) {
  const rules = (policy.channels || {})[channel] || {};
  return rules[currency] || 'block';
}

/**
 * displaySignal — JEDEN sygnal dla kierowcy, zlozony deterministycznie z obu osi.
 *
 * Model dwuosiowy zyje w silniku; uzytkownik nie oglada dwoch wskaznikow.
 * Kolejnosc regul jest istotna: blokada bije poziom zaufania, bo "nie ufaj"
 * to inny komunikat niz "odswiez".
 *
 *   level  — do koloru/ikony w UI
 *   label  — klucz i18n, nie gotowy tekst (aplikacja tlumaczy na 5 jezykow)
 *   trust  — surowy trustLevel, do plakietki zrodla (T1/T3)
 *   usable — czy tresc wolno w ogole pokazac w tym kanale
 */
function displaySignal(entry, currency, trustLevel, channel, policy) {
  const gate = channelGate(currency, channel, policy);

  // 1) DRIFTED — przepis mogl sie zmienic albo watcher milczy. To NIE jest
  //    "wymaga aktualizacji", to "nie ufaj". Blokada, nie poziom zaufania.
  if (currency === 'DRIFTED') {
    return { level: 'BLOCKED', label: 'signal.drifted', trust: trustLevel, usable: false };
  }

  // 2) Kanal odrzucil z innego powodu (np. LAPSED w paczce offline).
  if (gate === 'block') {
    return { level: 'BLOCKED', label: 'signal.blocked_channel', trust: trustLevel, usable: false };
  }

  // 3) Tresc dostepna, ale po terminie przegladu — uczciwe "stan na date".
  if (currency === 'LAPSED') {
    return { level: 'DATED', label: 'signal.dated', trust: trustLevel, usable: true };
  }

  // 4) Brak przegladu liczacego sie do higieny — slabszy sygnal niz LAPSED.
  if (currency === 'STALE') {
    return { level: 'UNREVIEWED', label: 'signal.unreviewed', trust: trustLevel, usable: true };
  }

  // 5) Aktualne — rozdzielczosc daje dopiero trustLevel (skad to wiem).
  if (trustLevel === 'T1') {
    return { level: 'VERIFIED', label: 'signal.verified', trust: 'T1', usable: true };
  }
  return { level: 'AI_SOURCED', label: 'signal.ai_sourced', trust: trustLevel, usable: true };
}

module.exports = { computeCurrency, computeTrustLevel, channelGate, displaySignal, editionActiveAt, daysBetween };
