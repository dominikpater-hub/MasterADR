# Guardian Knowledge — migracja schematu v2

Wynik przebiegu 2026-07-23. Wszystko odtwarzalne z `scripts/`.

## Uruchomienie u siebie

```bash
node scripts/migrate.js --src <prototyp.html> --out ./entries --owner domo --sighted
node scripts/report.js
node scripts/carry-forward.js --from adr-2023 --to adr-2025 --dry-run
```

## Co zmierzone

| | |
|---|---|
| wpisow zmigrowanych | 228 / 228, 0 bledow |
| **stan po domknieciu 2026-07-23** | |
| wpisow aktywnych | 239 — wszystkie PUBLISHED, CURRENT, T1 |
| zastapionych (historia) | 216 — poza dystrybucja |
| paczka offline | **przepuszcza 239 / 239, 0 zablokowanych** |
| kapitalizacja | 46 regul CSV -> 31 wpisow, 58 podmian |
| weryfikacja | domo (OWNER), 2026-07-23, calosc |

## Rozbieznosci wobec promptu

- `nextReviewDue` **nie istnieje** w prototypie — problem "212 wygaslo" byl przewidywaniem, nie stanem danych
- pole nazywa sie `edition`, nie `ed`
- bez recenzenta jest **220**, nie 219

## Kolizja z ADR-003 — ROZSTRZYGNIETA 2026-07-23

ADR-003 v1 definiowal T2 = VERIFIED_STALE, czyli degradowal trustLevel zegarem.
Kolidowalo to z osobna osia `currency` i bramkami kanalowymi.

**Decyzja wlasciciela: model dwuosiowy** (`mapCurrencyToT2: false`).
Pelne uzasadnienie i zmierzony efekt: `ADR-003-v2-model-dwuosiowy.md`.

- `trustLevel` = skad to wiem (source/verifiedBy) — juz NIE degradowany czasem
- `currency` = czy nadal aktualne (zegar + watcher) — egzekwowana bramkami
- UI dostaje JEDEN zlozony sygnal przez `displaySignal()`, nie dwie osie

Efekt na 239 wpisach: T2 216 -> 0, T1 15 -> 231.
Bramki bez zmian — te same 216 wpisow nadal blokowane w paczce offline.

Powod: przy `true` wpis DRIFTED (przepis mogl sie zmienic, tresc zablokowana)
dostawal ta sama etykiete T2 "wymaga aktualizacji" co LAPSED (minal rok od
przegladu, ale nic nie wskazuje na zmiane prawa). Dwa rozne poziomy ryzyka,
jeden komunikat. Zmierzone, przypadki brzegowe 3 i 5.

## Struktura

```
editions/       byty edycji z okresem obowiazywania (A)
entries/        228 wpisow, schemat v2
library/        currency-index.json — CACHE, odtwarzalny, nie zrodlo prawdy
policy.json     progi i bramki kanalowe — zmiana nie wymaga migracji rekordow
scripts/        migrate / report / carry-forward / currency
```
