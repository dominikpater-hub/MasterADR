MasterADR — paczka do recenzji (2026-07-24, v4)
===============================================

SCALENIE DWOCH GALEZI
  Tresc  : z guardian-knowledge v2 (paczka z 24.07, nowsza)
  Backend: synchronizacja Franka (z sesji 23.07)

  Obie galezie istnialy osobno — zadna nie miala calosci.
  Ta paczka laczy je bez zmiany ani jednego faktu.

ZAWARTOSC
  index.html                 239 faktow + modul synchronizacji Franka
  api/feedback.js            endpoint przyjmujacy uwagi
  api/feedback-admin.js      odczyt uwag (chroniony tokenem)
  package.json               zaleznosc @upstash/redis
  sw.js                      service worker v4 (nie cache'uje /api/)
  vercel.json                naglowki cache
  manifest.webmanifest, icon*.png, icon.svg

STAN TRESCI (bez zmian wobec paczki z 24.07)
  239 faktow, wszystkie:
    lifecycle : PUBLISHED
    currency  : CURRENT (edycja ADR 2025)
    trustLevel: T1
    verifiedBy: domo (OWNER), 2026-07-23
  Zero duplikatow ID, zero brakow pol,
  kazda poprawna odpowiedz obecna w opcjach,
  zero numerow ADR w tresci widzianej przez ucznia.


=== KROK 1: BAZA DANYCH (jednorazowo) ===

  Vercel KV jako osobny produkt juz nie istnieje — bazy przeniesiono
  do Upstash Redis. Instalujemy z Marketplace.

  1. Vercel -> projekt masteradr -> zakladka "Storage"
  2. "Create Database" -> Marketplace -> Upstash -> Redis
  3. Region: eu-central-1 (Frankfurt)
  4. Plan Free wystarczy
  5. Polacz baze z projektem

  Vercel sam wstrzykuje zmienne — nic nie przepisujesz recznie.

=== KROK 2: TOKEN DO ODCZYTU UWAG ===

  Vercel -> Settings -> Environment Variables
    Name : FEEDBACK_ADMIN_TOKEN
    Value: <dlugie haslo, min. 24 znaki>
  Zaznacz wszystkie srodowiska. Zapisz haslo — bez niego nie odczytasz uwag.

=== KROK 3: DEPLOY ===

  Rozpakuj i wgraj ZAWARTOSC katalogu (nie sam katalog).
  W korzeniu: index.html, obok katalog api/.
  Vercel wykryje package.json i zbuduje funkcje sam.

  WAZNE: po dodaniu zmiennych srodowiskowych zrob REDEPLOY,
  inaczej funkcje ich nie zobacza.


=== ODCZYT UWAG OD RECENZENTOW ===

  Przegladarka (JSON + statystyki):
    https://masteradr.vercel.app/api/feedback-admin?token=TWOJ_TOKEN

  Excel (CSV z polskimi znakami):
    ...&format=csv

  W odpowiedzi:
    total     — ile uwag lacznie
    byCat     — rozklad (blad/literowka/niejasne/trudne)
    topFacts  — 25 najczesciej zglaszanych faktow  <- tu szukaj problemow
    items     — pojedyncze uwagi, najnowsze pierwsze

  Kazda uwaga ma pole "build" (v4-2026-07-24), wiec przy kolejnych
  wersjach wiadomo, ktorej dotyczy.


=== SYNCHRONIZACJA — JAK DZIALA ===

  Zapis lokalny jest zrodlem prawdy (kierowca bywa bez zasiegu).
  Wysylka: po kliknieciu, gdy wraca internet, przy powrocie do karty,
  3 s po starcie. Kazdy wpis ma cid — ponowna wysylka nie duplikuje.

  Przetestowane w Chromie: brak sieci -> uwaga czeka lokalnie;
  siec wraca -> dosyla sie; ponowny sync -> zero duplikatow.


=== CO SWIADOMIE ZOSTAWIONE NA POZNIEJ ===

  1. Sygnaly zaufania w UI
     i18n/signals.json w paczce guardian ma gotowe teksty w 5 jezykach
     ("Zweryfikowane", "Stan na {date}", "Tresc wstrzymana"...).
     Build ich NIE pokazuje — pola _currency/_trust sa w danych,
     ale zaden kod ich nie czyta. Teraz to nieszkodliwe: wszystkie
     239 faktow to CURRENT/T1, wiec kazdy dostalby ten sam napis.
     Stanie sie istotne, gdy czesc bazy zmieni status.

  2. Wspolna data przegladu
     Wszystkie 239 wpisow ma date 2026-07-23. Przy reviewIntervalDays 365
     cala baza stanie sie LAPSED tego samego dnia (2027-07-23) i wypadnie
     z paczki offline. Warto rozlozyc przeglady albo dodac rozrzut
     do policy.json — decyzja na spokojnie.

  3. Dlugie uzasadnienia
     11 faktow ma pole "why" dluzsze niz 400 znakow. Do przegladu
     dydaktycznego, nie blokuje wydania.

  4. Kategoria transportowa w kolumnie 15
     Pytanie odwoluje sie do numeru kolumny tabeli A. Numery kolumn
     malo mowia bez kontekstu — kandydat do przeredagowania.


=== JESLI RECENZENT WIDZI STARA WERSJE ===
  DevTools -> Application -> Service Workers -> Unregister, twardy reload.
  Albo ustawienia przegladarki -> dane witryn -> usun wpis masteradr.
  UWAGA: to kasuje tez uwagi, ktore nie zdazyly sie wyslac.
  Przy kolejnym deployu podbij CACHE w sw.js (format: masteradr-vN-RRRR-MM-DD).
