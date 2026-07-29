# DriverOS / Guardian Engine: Analiza techniczno-prawna pozyskiwania i przetwarzania danych tachografu cyfrowego

## TL;DR
- **Dla aplikacji skierowanej do kierowcy najbardziej wykonalną ścieżką MVP jest ręczny import pliku .ddd oraz bezpośredni odczyt karty kierowcy przez czytnik CCID/USB (także na Androidzie przez OTG) — obie NIE wymagają karty przedsiębiorstwa.** Karta przedsiębiorstwa jest potrzebna wyłącznie do zgrywania pamięci masowej jednostki pojazdowej (VU) lub do zgrywania karty kierowcy przez VU.
- **Pobieranie danych z VU (jednostki pojazdowej) to ścieżka „firmowa/flotowa", nie kierowcza** — wymaga karty przedsiębiorstwa, sprzętu (klucz/terminal) i uprawnień; realnie dla DriverOS dostępna jako integracja z API telematyki (Webfleet TachoShare.connect, VDO Fleet, Stoneridge OPTAC3, GBox/Inelo) w wersji enterprise.
- **Odczyt i parsowanie plików .ddd jest technicznie w pełni wykonalne po stronie klienta** (istnieją dojrzałe biblioteki open-source), a weryfikacja podpisu cyfrowego jest możliwa dzięki publicznym certyfikatom ERCA/MSCA JRC — nie jest wymagana żadna certyfikacja, by CZYTAĆ pliki (certyfikacja/homologacja i karty dotyczą tylko oficjalnego pobierania z VU oraz samego sprzętu).

## Key Findings

1. **Typy tachografów i standardy.** Obowiązuje Rozporządzenie (UE) 165/2014 oraz akty wykonawcze 2016/799 i nowelizacja 2021/1228 (Mobility Package I). Ewolucja: tachograf cyfrowy G1 → smart tachograph Gen2 V1 (od 15.06.2019) → Gen2 V2 „G2V2" (nowe rejestracje >3,5 t od 21.08.2023). Producenci: Continental VDO „DTCO 4.1/4.1a" i Stoneridge „SE5000 Smart 2". Kluczowe daty doposażania: pojazdy międzynarodowe >3,5 t z tachografem analogowym/G1 do 31.12.2024 (okres tolerancji sankcyjnej do 28.02.2025), Gen2 V1 → V2 do 19.08.2025. Według Komisji Europejskiej (transport.ec.europa.eu): „From 1 July 2026, light commercial vehicles (between 2.5 tonnes and 3.5 tonnes) engaged in international transport for hire or reward must also have a tachograph installed" — i musi to być tachograf inteligentny II generacji wersji 2 (Smart Tacho G2V2).

2. **VU vs. karta kierowcy.** Zgodnie z przewodnikiem Road Safety Authority / CVRT do Rozp. 165/2014: „A driver's card can store up to 28 days worth of data... The vehicle unit stores data for the previous 365 days before the oldest data is overwritten." VU przechowuje w pamięci masowej pozycje GNSS, prędkości szczegółowe, zdarzenia i błędy, kalibrację, blokady firmowe. Karta kierowcy przechowuje WŁASNĄ aktywność kierowcy (jazda/odpoczynek/praca/dyspozycyjność), zdarzenia i błędy, pojazdy używane, miejsca rozpoczęcia/zakończenia dziennego okresu pracy, wpisy/wyjęcia karty. **Kluczowe: ciągły ślad pozycji GNSS jest w VU, nie na karcie kierowcy.**

3. **Formaty plików.** Standard to .ddd (kontener binarny, struktura TLV, rekordy TREP/TRTP, podpis cyfrowy). Rozszerzenia zależne od kraju/oprogramowania: .DDD (ogólne/VU), .C1B (karta kierowcy — Francja), .V1B (VU — Francja), .TGD (Hiszpania), .ESM (specyficzne dla producenta). Gen2 zmienia numery TREP z 0x01–0x05 na 0x21–0x25.

4. **Metody pozyskania danych — pełny przegląd:** (a) ręczny import istniejącego pliku .ddd; (b) bezpośredni odczyt karty kierowcy w czytniku CCID/PC-SC (bez karty przedsiębiorstwa); (c) pobranie z VU przez złącze pobierania (6-pin) z kartą przedsiębiorstwa; (d) zdalne pobieranie (DSRC/telematyka/Bluetooth); (e) Bluetooth (Gen2 V2 — VDO Fleet App, Stoneridge DigiBlu/Tacho Center) i urządzenia typu digiDL/digiBlu/Tacho2Safe; (f) API platform telematycznych; (g) CAN/OBD (ograniczone — dane bieżące, nie plik prawny).

## Details

### 1. Typy tachografów, standardy i formaty plików
Rozporządzenie 165/2014 wprowadziło tachografy inteligentne z GNSS, DSRC i interfejsem ITS. Rozporządzenie wykonawcze 2016/799 określa szczegóły techniczne, a 2021/1228 wprowadziło Gen2 V2 z: automatyczną rejestracją przekroczeń granic, rejestracją załadunku/rozładunku, zwiększeniem możliwości pamięci, autentykacją GNSS (Galileo OSNMA), bezpieczniejszym DSRC. Dla kart Gen2 V2 (wydawanych od sierpnia 2023) Komisja Europejska w Q&A do Mobility Package 1 wskazuje, że karty te pozwalają kierowcy „to be able to show driving times and rest periods of the last 56 days by showing only their driver card" (podstawa: art. 26 Rozp. 165/2014) — czyli rozszerzenie z 28 do 56 dni. VDO DTCO 4.1a i Stoneridge SE5000 Smart 2 uzyskały homologację Gen2 V2. Gen2 V2 ma interfejs Bluetooth do współpracy z aplikacjami mobilnymi (VDO Fleet App bez dodatkowego sprzętu jak SmartLink Pro).

Plik .ddd to binarny kontener z podpisem cyfrowym, dane w formacie TLV (2 bajty TAG, flaga szyfrowania, 2 bajty długości, wartość). Rozszerzenia: Francja używa .C1B (karta) i .V1B (VU); Hiszpania .TGD; .ESM i .ddd są specyficzne dla producenta. Pliki są nieczytelne w Notatniku — wymagają dedykowanego parsera.

### 2. Kto ma prawo pobierać dane — wymóg karty przedsiębiorstwa vs. prawo kierowcy
Cztery typy kart: kierowcy (aktywność, 28 dni, 5 lat ważności), przedsiębiorstwa (5 lat), warsztatowa (1 rok), kontrolna (GITD/policja).

**Karta przedsiębiorstwa działa jak klucz do VU** — blokuje dane i autoryzuje ich pobranie z pamięci masowej. Bez niej pobranie z VU jest niemożliwe [Tachomagic](https://www.tachomagic.com/faq-tachograph-company-cards.php) (dla tachografów montowanych przed 1.10.2011 zawsze; nowsze mają niuanse).

**Kluczowe rozróżnienie (potwierdzone przez dedykowany research):** bezpośredni odczyt fizycznej karty kierowcy w czytniku CCID/PC-SC NIE wymaga karty przedsiębiorstwa. Karta przedsiębiorstwa jest potrzebna wyłącznie do (a) pobrania pamięci masowej VU, lub (b) pobrania karty kierowcy PRZEZ tachograf. Potwierdza to m.in. irlandzki regulator CVRT: „A company card does not store any data as such – its function is simply to ensure that the digital tachograph vehicle unit recognises the operator before allowing data to be downloaded." Ponadto: przy pobieraniu karty kierowcy przez tachograf Stoneridge (rev 7.3+) lub VDO (1.4+) karta przedsiębiorstwa NIE jest potrzebna — verbatim z Tachosys digiDownload: „When used with either Stoneridge 7.3+ or VDO 1.4+ tachographs Driver Cards can be downloaded without needing to insert a Company Card" (potwierdza też AETRControl/TachoMi).

Kierowca ma prawo do własnych danych z karty; obowiązek regularnego pobierania danych spoczywa na przedsiębiorcy/pracodawcy.

### 3. Obowiązki terminowe i przechowywanie (kontekst compliance — silny use case dla DriverOS)
Podstawa: Rozporządzenie Komisji (UE) 581/2010. Karta kierowcy — min. co 28 dni; VU/pamięć masowa — min. co 90 dni. Przechowywanie: min. 12 miesięcy (w praktyce zalecane 24). GOV.UK (DVSA, Reg. 165/2014): „Operators must periodically download this data from digital and smart tachographs (known as the Vehicle Unit or VU) every 90 days and from driver cards every 28 days... retaining files for a minimum of one year."

W Polsce sankcje wynikają z Ustawy o transporcie drogowym z 6.09.2001 (taryfikator, zał. 1–3): 500 zł za każdego kierowcę za brak terminowego pobrania danych z karty i 500 zł za każdy pojazd za brak danych z tachografu, przy czym łączna wysokość kary dla przedsiębiorcy nie może przekroczyć 30 000 zł. Kontrola ITD w firmie może sięgnąć 12 miesięcy wstecz. Na drodze — zgodnie z Rozp. (UE) 2024/1258 zmieniającym art. 36(2) Rozp. 165/2014 — kierowca musi okazać zapisy „covering the previous 28 days and, as of 31 December 2024, covering the previous 56 days". Kontrola kartą kontrolną sięga do 365 dni z VU. To fundamentalny obszar wartości: aplikacja pomagająca kierowcy/firmie dotrzymać terminów i widzieć infringementy.

### 4. Metody pozyskania danych — szczegóły i przydatność dla aplikacji kierowcy

**(a) Ręczny import .ddd (najłatwiejsza ścieżka MVP).** Kierowca/firma już posiada pliki .ddd (z klucza, terminala, systemu telematyki). Aplikacja przyjmuje upload i parsuje. Zero barier sprzętowych, zero wymogu karty przedsiębiorstwa. Idealne na start.

**(b) Bezpośredni odczyt karty kierowcy (czytnik CCID/USB, na Androidzie przez OTG).** Bez karty przedsiębiorstwa. Czytniki PC/SC klasy CCID (device class 0x0B) nie wymagają sterowników na systemach zgodnych z PC/SC — OS dostarcza sterownik domyślny. Istnieją działające aplikacje wzorcowe: Tachogram, Lobol Driver Card Reader (obsługuje karty Gen2 V2, eksport do ddd/esm/tgd/c1b, ponad 170 tys. pobrań), TachoAndroid (tacho4u), Tachosys digiDownload+digifob, Sistemium Tacho Card Reader, AETRControl. Ograniczenie: karty kierowcy to karty stykowe (contact chip) — NFC NIE działa; wymagany czytnik stykowy (ACS ACR38/ACR39U, OmniKey, uTrust, Gemalto) + adapter OTG (uwaga na USB-C w Samsung/Oppo/OnePlus/Realme/Vivo).

**(c) Pobranie z VU przez złącze pobierania (6-pin front connector).** Wymaga karty przedsiębiorstwa włożonej do slotu tachografu + urządzenia pobierającego (klucz VDO DLK, Tacho2Safe, TachoDrive, Digidown). Czas 2–40 min. To ścieżka firmowa, nie kierowcza — mało praktyczna dla aplikacji kierowcy.

**(d) Zdalne pobieranie / DSRC / telematyka.** Urządzenie za tachografem (digiDL, Remote DL 4G) wysyła dane do chmury; karta przedsiębiorstwa hostowana centralnie. Model flotowy, wymaga inwestycji sprzętowej i karty firmy. Protokół zdalny bazuje na ISO 16844-6 (DiagnosticOnCAN).

**(e) Bluetooth (Gen2 V2).** DTCO 4.1a i SE5000 Smart 2 mają Bluetooth. VDO Fleet App i Stoneridge Tacho Center/DigiBlu umożliwiają pobieranie/monitoring przez telefon (DigiBlu strumieniuje dane w czasie rzeczywistym i bezprzewodowo pobiera pliki). Przed transmisją danych osobowych kierowca musi wyrazić zgodę (Aneks 13 do Załącznika 1C — bez zgody dane niedostępne dla aplikacji zewnętrznych). To obiecująca przyszła ścieżka, ale zależna od zamkniętych ekosystemów producentów i wciąż wdrażanej funkcjonalności; brak otwartego SDK dla dowolnej aplikacji trzeciej.

**(f) API platform telematycznych (ścieżka enterprise).** Webfleet TachoShare.connect — REST API z OAuth 2.0 (dostępny przykład klienta Java Spring, kolekcja Postman), zwraca pliki .ddd kart i VU z archiwum WTSP; wymaga zgody klienta Webfleet z aktywną usługą TachoShare. VDO Fleet/TIS-Web, Stoneridge OPTAC3 (API-based, gotowe integracje m.in. z Samsara przez token API), GBox/Inelo (Meet API — login/hasło API generowane w Panelu GBox Online, dostęp odczyt+zapis, dedykowane dla własnych systemów TMS/ERP), Frotcom (integracja z VDO Fleet), Trimble Tachotime Manager. Wszystkie zakładają, że dane są już pobrane przez system flotowy z użyciem karty firmy. Autoryzacja OAuth/klucz API; koszt subskrypcyjny.

**(g) CAN/OBD.** Interfejs ITS/D8 daje dane bieżące (prędkość, aktualna aktywność, licznik VDO Counter/Stoneridge Duo) — nie generuje prawnie ważnego, podpisanego pliku .ddd. Przydatne do funkcji „pozostały czas jazdy" (Driver Decision Support) w czasie rzeczywistym, nie do compliance archiwalnego.

### 5. Jakie dane są dostępne z każdego źródła
- **Karta kierowcy:** aktywności (jazda/inna praca/dyspozycyjność/odpoczynek), zdarzenia i błędy, pojazdy używane, miejsca rozpoczęcia/zakończenia dziennego okresu pracy, wpisy/wyjęcia karty, warunki szczególne. BEZ ciągłego śladu GNSS.
- **VU (pamięć masowa):** wszystko powyższe zagregowane dla pojazdu + pozycje GNSS (co 3h skumulowanej jazdy, start/koniec dnia, przekroczenia granic w Gen2), prędkości szczegółowe, przekroczenia prędkości, blokady firmowe, dane kalibracyjne, aktywność kontrolna.
- **Przydatność dla produktu kierowcy:** compliance czasu jazdy/odpoczynku (561/2006), pozostały czas jazdy, ostrzeżenia o infringementach, czas pracy (WTD 2002/15/EC — śr. 48h/tydz., max 60h w pojedynczym tygodniu przy średniej 48h w 4 mies., przerwy 30 min po 6h / 45 min po >9h, praca nocna max 10h/24h), śledzenie kabotażu (Gen2 granice — tylko z VU).

### 6. Aspekty prawne i GDPR/RODO
Dane tachografu to dane osobowe (imię, nazwisko, PESEL, nr prawa jazdy, aktywność, lokalizacja). RODO ma pełne zastosowanie — art. 5 (minimalizacja, ograniczenie celu, ograniczenie przechowywania), art. 6 (podstawa prawna: najczęściej wykonanie umowy/obowiązek prawny/uzasadniony interes; zgoda w relacji pracowniczej rzadko wystarcza), prawo dostępu (art. 15), przenoszenia (art. 20 — kierowca może żądać eksportu swoich danych w formacie maszynowym). Dla Gen2 Bluetooth: przed transmisją danych osobowych do aplikacji trzeciej wymagana wyraźna zgoda kierowcy w tachografie (Aneks 13). Zasada „Privacy by Design" Guardian Engine dobrze pasuje: szyfrowanie, minimalizacja, przetwarzanie po stronie klienta gdy możliwe, przejrzystość.

Przykład egzekwowania: włoski organ ochrony danych (Garante per la protezione dei dati personali) w provvedimento n. 7 z 16 stycznia 2025 (Newsletter n. 533 z 21 marca 2025, doc. web 10112287) nałożył sankcję 50 000 € na spółkę autotrasportową za niezgodne z prawem monitorowanie „circa 50 dipendenti" przez GPS na pojazdach — dane lokalizacji/prędkości/kilometrażu przechowywane „per oltre cinque mesi, in violazione dei principi di minimizzazione", bez informativy i oznaczeń (naruszenie art. 5(1)(a),(c),(e), 13 i 88 GDPR). To bezpośrednio pokazuje ryzyko nadmiernej retencji danych lokalizacyjnych i śledzenia przerw.

### 7. Certyfikacja i weryfikacja podpisu
**Nie jest wymagana żadna homologacja/certyfikacja, by CZYTAĆ pliki .ddd** — homologacja typu i karty dotyczą urządzeń wykonujących oficjalne pobieranie z VU oraz samego sprzętu tachografu. Pliki .ddd (karty i VU) są podpisane cyfrowo (komponent podpisuje pobierane z niego dane własnym kluczem prywatnym). Weryfikacja autentyczności możliwa po stronie klienta w oparciu o PKI: ERCA (European Root Certification Authority, prowadzona przez JRC Ispra) → MSCA (krajowe, certyfikaty MSCA_Card ważne 7 lat i 1 miesiąc) → certyfikaty urządzeń/kart. Publiczne certyfikaty i zestawy przykładowe są publikowane przez JRC [European Commission](https://publications.jrc.ec.europa.eu/repository/handle/JRC128280) pod `dtc.jrc.ec.europa.eu` (repozytorium ERCA) i `publications.jrc.ec.europa.eu`. Uwaga: certyfikaty są proprietarne „card-verifiable" (CV) wg Aneksu 1C Aneks 11 — NIE X.509 — więc potrzebny jest weryfikator specyficzny dla tachografu (UNECE CPS: „The public key certificate format used by the digital tachograph is proprietary and incompatible with the X.509 public key certificates").

### 8. Implementacja techniczna — biblioteki i architektura
**Biblioteki open-source do parsowania .ddd:**
- `traconiq/tachoparser` (Go; poprzednio kyburz-switzerland-ag) — obsługuje VU i kartę, Gen1/Gen2/Gen2 V2, pobiera i używa publicznych kluczy ERCA (skrypty `dl_all_pks1.py`/`dl_all_pks2.py`), serwer gRPC + CLI (`dddparser`, `dddsimple`), wyjście JSON.
- `way-platform/tachograph-go` (Go SDK+CLI) — pipeline Unmarshal → **Authenticate** (kryptograficzna weryfikacja podpisów) → Parse → Anonymize → Marshal.
- `jugglingcats/tachograph-reader` (C#/.NET) — VU i karta → XML; walidacja podpisu opcjonalna (domyślnie wyłączona).
- `defkode/esm-reader` (Ruby) — czytnik .ddd.
- ReadESM (C++/Qt, SourceForge) — czyta .tgd/.esm/.ddd/.add; wymaga libgcrypt do weryfikacji podpisów (problem: starsze wersje nie odczytują nowych TREP Gen2).
- `kuznetsovin/go_tachograph_card` (Go) — przykład odczytu karty + parsowania.
- Istnieją też forki tachographJS (JavaScript) i tachograph-card-structure (Java).

**Weryfikacja podpisu po stronie klienta:** wykonalna (tachoparser i tachograph-go to demonstrują), wymaga wbudowania publicznych certyfikatów ERCA/MSCA z JRC.

**Integracja czytnika na mobile/desktop:** Android — USB CCID przez OTG (np. ACS Android Library dla czytników ACS; karty stykowe, NIE NFC). Desktop/web — PC/SC (winscard, wymagane wsparcie protokołów T=0 i T=1). Czytniki zgodne PC/SC: ACS ACR38/ACR39U, OmniKey, uTrust, Gemalto, SCM.

**Realistyczna architektura DriverOS:**
1. **MVP:** upload/import .ddd + parser po stronie klienta/serwera + weryfikacja podpisu + analiza 561/2006 i WTD, ostrzeżenia, przypomnienia o terminach 28/90 dni.
2. **Faza 2:** bezpośredni odczyt karty kierowcy przez czytnik CCID/OTG (bez karty firmy) — funkcja „zgraj swoją kartę telefonem".
3. **Faza 3 (enterprise):** integracje z API telematyki (Webfleet TachoShare.connect OAuth, OPTAC3, GBox Meet API, VDO Fleet) dla klientów flotowych; opcjonalnie Bluetooth Gen2 V2 gdy ekosystemy dojrzeją.

## Recommendations
1. **Start od importu .ddd + silnik analizy compliance** (561/2006 drive/rest, WTD 48/60h, przerwy, przypomnienia 28/90 dni, wykrywanie infringementów). Użyj `way-platform/tachograph-go` lub `traconiq/tachoparser` jako fundamentu; wbuduj weryfikację podpisu z certyfikatami JRC ERCA. **Próg przejścia do fazy 2:** gdy retencja/parsowanie działa stabilnie dla Gen1/Gen2/Gen2 V2 i weryfikacja podpisu przechodzi na plikach testowych JRC.
2. **Faza 2 — odczyt karty kierowcy na telefonie** (czytnik stykowy CCID + OTG). To realny wyróżnik dla kierowcy indywidualnego i nie wymaga karty przedsiębiorstwa. Zweryfikuj kompatybilność czytników (ACS, OmniKey) i adapterów USB-C. Nie polegaj na NFC. **Próg:** stabilny odczyt na ≥3 modelach czytników i głównych markach telefonów z OTG.
3. **Faza 3 — integracje flotowe** przez API (Webfleet TachoShare.connect z OAuth 2.0; GBox Meet API dla rynku PL; OPTAC3). Wchodź, gdy masz klientów flotowych, którzy już pobierają dane kartą firmy. **Próg:** pierwszy klient flotowy z aktywną usługą remote download u dostawcy telematyki.
4. **RODO/Privacy by Design od początku:** przetwarzanie po stronie klienta gdy możliwe, szyfrowanie w tranzycie i spoczynku, minimalizacja (nie retencjonuj GPS dłużej niż to konieczne — patrz kara Garante 50 000 €), jawne podstawy prawne, obsługa praw dostępu/przenoszenia, DPIA dla systematycznego monitorowania.
5. **Nie buduj własnego pobierania z VU** — to wymaga karty przedsiębiorstwa i sprzętu, jest domeną systemów flotowych; taniej i szybciej integrować się z ich API.

## Caveats
- Terminy doposażania i wersje Gen2 V2 zmieniają się szybko; data 1.07.2026 dla pojazdów >2,5 t w transporcie międzynarodowym potwierdzona u KE, ale warto śledzić kolejne nowelizacje (np. 2024/1258 dot. przewozu okazjonalnego osób i wydłużenia zakresu kontroli drogowej do 56 dni).
- Funkcjonalność Bluetooth Gen2 V2 dla aplikacji trzecich jest w dużej mierze zamknięta w ekosystemach VDO/Stoneridge; brak uniwersalnego otwartego SDK — DAKO i inni deklarowali rozwój aplikacji, ale dostępność zależy od aktualizacji producentów.
- Weryfikacja podpisu wymaga proprietarnych certyfikatów CV (nie X.509) — to zwiększa złożoność implementacji; ReadESM historycznie miał trudności z nowymi formatami Gen2.
- Niuans: najnowsze karty Gen2 V2 mogą zawierać pewne rekordy „miejsc" powiązane z GNSS, ale ciągły ślad pozycji pozostaje funkcją VU, nie karty.
- Część źródeł to materiały marketingowe dostawców (Tachosys, VDO, tacho4u, Lisle); kluczowe fakty potwierdzone krzyżowo ze źródłami regulacyjnymi (KE, JRC, DVSA/GOV.UK, CVRT, RSA, EUR-Lex, Garante, UNECE) oraz z ustawą o transporcie drogowym.