// MasterADR — kod aplikacji przeniesiony 1:1 z prototypu (React.createElement, bez JSX).
// Źródło: masterADR/prototyp/MasterADR.html. Silnik Leitnera + 218 pozycji ADR.
// Jedyna zmiana vs prototyp: React z importu (bundle Vite) zamiast globalu z CDN + Babel.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { loadHabit, saveHabit, registerActivity, awardCorrect, dayIndex, goalMet } from "./daily-habit.js";
import { t, getLang, setLang, LANGS } from "./i18n.js";
import { MIN, DAY, INTERVALS, newFact, review, buildQueue, FORMAT_BY_BOX, pickFormat } from "./leitner.js";

/* ── Override dla samodzielnego trenera ADR ──
   Ten prototyp to CZYSTY moduł ADR. Redefiniujemy klucz zapisu, żeby nie
   kolidował z trenerem kierowcy. (ALL/MODULES zostają — AdrTrainer i tak
   startuje w module ADR; picker jest nieosiągalny przez root AdrApp.) */
try {
  window.__ADR_ONLY__ = true;
} catch (e) {}

// adr-content-full.js — PEŁNA baza ADR z projektu ZIP (218 pozycji)
// 134 fakty + 84 ćwiczenia (skille). Źródło: KOMPENDIUM ADR 2023 (Celebiaś DGSA).
// Wygenerowane z src/data/ ZIP — treść zachowana 1:1, wzbogacona o topic/kind z curriculum.
// Formaty: mcq/scenario (options+correct), fill (correct+hint), match (pairs), order (items+correct).

const BLOCKS = [{
  id: 1,
  name: "Wymagania ogólne"
}, {
  id: 2,
  name: "Główne zagrożenia"
}, {
  id: 3,
  name: "Ochrona środowiska"
}, {
  id: 4,
  name: "Środki bezpieczeństwa"
}, {
  id: 5,
  name: "Po wypadku"
}];
const KIND_LABEL = {
  skill: "Ćwiczenie",
  fact: "Wiedza",
  ref: "Odnośnik"
};
const KIND_WEIGHT = {
  skill: 0,
  fact: 1,
  ref: 2
};
const FACTS = [{"id":"b1-1131","block":1,"topic":"Wyłączenia w praktyce","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.1.3.1","source":"kompendium","page":8,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Zwolnienia z charakteru operacji transportowych 1.1.3.1: osoby fizyczne przewożące w małych fabrycznych opakowaniach (np. paliwo do 240 l), przewóz o charakterze pomocniczym, przewóz nadzorowany przez służby ratunkowe, przewóz w celu ratowania życia lub ochrony środowiska, przewóz próżnych zbiorników transportowych.","q":{"mcq":{"prompt":"Osoba fizyczna może przewieźć w małych fabrycznych opakowaniach paliwo do:","options":["60 l","240 l","1000 l"],"correct":"240 l"},"scenario":{"prompt":"Przewóz w celu ratowania życia. Czy podlega ADR?","options":["Tak, pełne ADR","Nie, zwolnienie dla akcji ratowniczej","Tylko dokument przewozowy"],"correct":"Nie, zwolnienie dla akcji ratowniczej"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-1131@adr-2025"},{"id":"b1-1132-gazy","block":1,"topic":"Wyłączenia w praktyce","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.1.3.2","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Zwolnienia dla gazów 1.1.3.2: gazy w zbiornikach pojazdu do napędu; gazy w zbiornikach przewożonych pojazdów — wartość energetyczna max 54 000 MJ. Łączna objętość: 1080 kg dla LNG i CNG, 2250 l dla LPG. Także gazy w wyposażeniu (gaśnice, napompowane koła), w żywności, w sprzęcie sportowym.","q":{"mcq":{"prompt":"Maksymalna wartość energetyczna paliwa w zbiornikach przewożonych pojazdów (wyłączenie dla gazów):","options":["24 000 MJ","54 000 MJ","108 000 MJ"],"correct":"54 000 MJ"},"match":{"prompt":"Dopasuj limit łączny dla gazów (wyłączenie dla gazów):","pairs":{"LNG i CNG":"1080 kg","LPG":"2250 l"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-1132-gazy@adr-2025"},{"id":"b1-1133-paliwo","block":1,"topic":"Wyłączenia w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.3","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill","match"],"why":"Zwolnienie 1.1.3.3 — paliwo w zbiornikach pojazdu służące do jego napędu lub pracy wyposażenia: do 1500 l na jednostkę transportową, nie więcej niż 500 l na przyczepie. W zbiornikach dodatkowych (kanistrach) nie więcej niż 60 l.","q":{"mcq":{"prompt":"Limit paliwa w zbiornikach pojazdu (do jego napędu) na jednostkę transportową:","options":["500 l","1000 l","1500 l"],"correct":"1500 l"},"fill":{"prompt":"W zbiornikach dodatkowych (kanistrach) nie więcej niż ___ litrów.","correct":"60","hint":"liczba"},"match":{"prompt":"Dopasuj limit paliwa w zbiornikach pojazdu (wyłączenie paliwowe):","pairs":{"Jednostka transportową":"1500 l","Przyczepa":"500 l","Kanistry":"60 l"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-1133-paliwo@adr-2025"},{"id":"b1-1136-gasnica","block":1,"topic":"Wyliczenie 1000 punktów","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.1.3.6 / 8.1.4","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","mcq"],"why":"Pojazd przewożący towary niebezpieczne na zwolnieniu 1.1.3.6 musi być wyposażony w 1 gaśnice 2 kg typu ABC.","q":{"scenario":{"prompt":"Przewóz na zwolnieniu „1000 punktów”. Ile gaśnic i jakiej wielkości?","options":["Żadnej","1 gaśnica 2 kg typu ABC","2 gaśnice po 6 kg"],"correct":"1 gaśnica 2 kg typu ABC"},"mcq":{"prompt":"Gaśnica przy zwolnieniu „1000 punktów” musi być typu:","options":["A","ABC","CO2"],"correct":"ABC"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-1136-gasnica@adr-2025"},{"id":"b1-1136","block":1,"topic":"Wyliczenie 1000 punktów","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.1.3.6","source":"kompendium","page":10,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Zwolnienie 1.1.3.6 (tzw. 1000 pkt) — pod uwagę bierze się ilość towaru na jednostce transportowej. WYMAGANE: opakowania certyfikowane i oznakowane, gaśnica 2 kg ABC z data przeglądu, prawidłowy dokument przewozowy, szkolenie stanowiskowe. NIE MUSISZ: oznakowywać pojazdu tablicami, mieć zaświadczenia ADR, instrukcji pisemnej, wyposażenia (skrzynki ADR), stosować się do znaków drogowych ADR, wyznaczać DGSA, przestrzegać zakazu przewozu pasażerów.","q":{"mcq":{"prompt":"Przy zwolnieniu „1000 punktów” (liczysz ilość × mnożnik kategorii) kierowca NIE musi:","options":["Mieć gaśnicy","Mieć zaświadczenia ADR i tablic pomarańczowych","Prawidłowo zapakować towaru"],"correct":"Mieć zaświadczenia ADR i tablic pomarańczowych"},"fill":{"prompt":"Suma punktów (ilość × mnożnik kategorii) nie może przekroczyć ___ na jednostkę transportową.","correct":"1000","hint":"liczba"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-1136@adr-2025"},{"id":"b1-def","block":1,"topic":"Podstawy prawne","kind":"ref","scope":"podstawowy","adrRef":"ADR 1.1","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Umowa ADR powstała w 1957 r. w Genewie. Składa się z 2 załączników A i B. Nowelizowana co 2 lata.","q":{"mcq":{"prompt":"Co ile lat nowelizowana jest umowa ADR?","options":["Co roku","Co 2 lata","Co 5 lat"],"correct":"Co 2 lata"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-def@adr-2025"},{"id":"b1-dgsa","block":1,"topic":"Podstawy prawne","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.8.3","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"DGSA to doradca ds. bezpieczeństwa. Powinna go wyznaczyć każda firma pakująca, ładująca, transportująca lub rozładowująca towary niebezpieczne. Kara za niewyznaczenie: 5000 PLN.","q":{"mcq":{"prompt":"Kara za niewyznaczenie doradcy DGSA w firmie wynosi:","options":["1000 PLN","5000 PLN","10000 PLN"],"correct":"5000 PLN"},"scenario":{"prompt":"Firma tylko załadowuje towary niebezpieczne, nie przewozi. Czy musi wyznaczyć DGSA?","options":["Nie, tylko przewoźnicy","Tak, załadowca również","Tylko przy klasie 1"],"correct":"Tak, załadowca również"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-dgsa@adr-2025"},{"id":"b1-droga-uprawnienia","block":1,"topic":"Zakres uprawnień","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.2 / ustawa PL","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["order","scenario"],"why":"Droga do uprawnień ADR: 1) kurs w akredytowanym ośrodku (podstawowy, a dla cystern/klasy 1/klasy 7 dodatkowo specjalistyczny), 2) egzamin państwowy przed Urzędem Marszałkowskim, 3) zaświadczenie ADR wydawane przez marszałka, 4) ważność 5 lat. Uprawnień nie zdobywa się z aplikacji — ta apka przygotowuje Cię do egzaminu.","q":{"order":{"prompt":"Ułóż kolejność drogi do uprawnień ADR:","items":["Egzamin państwowy przed Urzędem Marszałkowskim","Kurs w akredytowanym ośrodku","Zaświadczenie ADR od marszałka","Ważność 5 lat"],"correct":["Kurs w akredytowanym ośrodku","Egzamin państwowy przed Urzędem Marszałkowskim","Zaświadczenie ADR od marszałka","Ważność 5 lat"]},"scenario":{"prompt":"Chcesz wozić paliwo w cysternie. Jaki kurs Cię obowiązuje?","options":["Tylko podstawowy","Podstawowy + specjalistyczny cysterny","Żaden — wystarczy egzamin"],"correct":"Podstawowy + specjalistyczny cysterny"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-droga-uprawnienia@adr-2025"},{"id":"b1-egzamin-prog","block":1,"topic":"Zakres uprawnień","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.2.2 / ustawa PL","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Egzamin państwowy to test jednokrotnego wyboru nadzorowany przez Urząd Marszałkowski. Próg zaliczenia to co najmniej dwie trzecie poprawnych odpowiedzi. Kurs podstawowy: 30 pytań (próg 20). Kurs cysterny: 18 pytań.","q":{"mcq":{"prompt":"Ile poprawnych odpowiedzi trzeba na egzaminie ADR podstawowym (30 pytań)?","options":["15","20","25"],"correct":"20"},"fill":{"prompt":"Próg zaliczenia egzaminu ADR to co najmniej ___ trzecie poprawnych odpowiedzi.","correct":"dwie","hint":"ułamek słownie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-egzamin-prog@adr-2025"},{"id":"b1-eq","block":1,"topic":"Wyłączenia w praktyce","kind":"fact","scope":"podstawowy","adrRef":"ADR 3.5","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill","scenario"],"why":"Ilości wyłączone (EQ), przepis 3.5: materiały w opakowaniach wewnętrznych nie mogą być większe niż 1 kg (1000 g) lub 1 litr (1000 ml). Opakowanie NIE musi być certyfikowane, brak nalepek ostrzegawczych. Wymaga szkolenia stanowiskowego, NIE kursu ADR. W dokumencie zapis \"Towary niebezpieczne w ilościach wyłączonych\" oraz liczba sztuk przesyłek.","q":{"mcq":{"prompt":"Limit opakowania wewnętrznego przy ilościach wyłączonych (EQ):","options":["1 kg lub 1 litr","5 kg lub 5 litrów","30 kg lub 30 litrów"],"correct":"1 kg lub 1 litr"},"fill":{"prompt":"Przy EQ opakowanie ___ musi być certyfikowane (NIE / MUSI).","correct":"nie","hint":"nie albo musi"},"scenario":{"prompt":"Wieziesz towar w ilościach wyłączonych. Czy potrzebujesz kursu ADR?","options":["Tak","Nie, wystarczy szkolenie stanowiskowe","Tylko przy klasie 8"],"correct":"Nie, wystarczy szkolenie stanowiskowe"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-eq@adr-2025"},{"id":"b1-inne-galezie","block":1,"topic":"Podstawy prawne","kind":"fact","scope":"podstawowy","adrRef":"RID / ADN / IMDG / ICAO TI","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Poza ADR (drogowy) istnieją: RID — kolejowy, ADN — śródlądowy, IMDG — morski, ICAO TI — lotniczy.","q":{"match":{"prompt":"Dopasuj umowę do gałęzi transportu:","pairs":{"RID":"kolejowy","ADN":"śródlądowy","IMDG":"morski","ICAO TI":"lotniczy"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-inne-galezie@adr-2025"},{"id":"b1-jtr","block":1,"topic":"Jednostka i sposoby przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.2.1","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Jednostka transportową to pojazd silnikowy z przyczepa lub bez, albo ciągnik z naczepa. Ciągnik + naczepa = JEDNA jednostka, choc to dwa pojazdy. Ważne przy liczeniu wyposażenia i wyłączeń.","q":{"mcq":{"prompt":"Ciągnik siodłowy z naczepa stanowi:","options":["Dwie jednostki transportowe","Jedna jednostkę transportową","Zależy od ładunku"],"correct":"Jedna jednostkę transportową"},"scenario":{"prompt":"Zestaw 40 t. Wyposażenie ADR liczysz na:","options":["Każdy pojazd osobno","Cała jednostkę transportową","Tylko ciągnik"],"correct":"Cała jednostkę transportową"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-jtr@adr-2025"},{"id":"b1-kat0","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Dla towarów kategorii transportowej 0 KAŻDA ilość oznacza pełny ADR — limit wynosi 0, nie ma mnożnika. Dotyczy to także próżnych opakowań po towarach kategorii 0.","q":{"mcq":{"prompt":"Towary kategorii transportowej 0 przewozi się:","options":["Bez ograniczeń","Zawsze na pełnym ADR, każda ilość","Do 20 kg na wyłączeniu"],"correct":"Zawsze na pełnym ADR, każda ilość"},"scenario":{"prompt":"Próżne, nieoczyszczone opakowanie po towarze kategorii 0. Jaki reżim?","options":["Zwolnienie „1000 punktów”","Pełny ADR","Kategoria 4, bez ograniczeń"],"correct":"Pełny ADR"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-kat0@adr-2025"},{"id":"b1-kat1-wyjatek","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"W kategorii transportowej 1 występuje wyjątek: dla UN 0081, 0082, 0084, 0241, 0331, 0332, 0482, 1005 i 1017 maksymalna ilość całkowita na jednostkę transportową wynosi 50 kg, a mnożnik to x20 (zamiast standardowych 20 i x50).","q":{"mcq":{"prompt":"Dla UN 1005 i UN 1017 (kategoria 1) maksymalna ilość na jednostkę wynosi:","options":["20 kg","50 kg","333 kg"],"correct":"50 kg"},"scenario":{"prompt":"Przewozisz UN 1017 (chlor). Jaki mnożnik stosujesz przy liczeniu punktów?","options":["x50 (standard kąt. 1)","x20 (wyjątek)","x3"],"correct":"x20 (wyjątek)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-kat1-wyjatek@adr-2025"},{"id":"b1-kat4","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Kategoria transportową 4 — każda ilość \"na wyłączeniu\", mnożnik 0, bez ograniczeń. Należą tu: próżne opakowania po towarach niebezpiecznych (z wyłączeniem tych z kategorii 0), materiały wybuchowe 1.4S oraz WSZYSTKIE butle po gazach. Butle po gazach może przewozić kierowca bez zaświadczenia ADR.","q":{"mcq":{"prompt":"Wszystkie butle po gazach należą do kategorii transportowej:","options":["1","2","4"],"correct":"4"},"scenario":{"prompt":"Wieziesz puste butle po gazach. Czy potrzebujesz zaświadczenia ADR?","options":["Tak, zawsze","Nie — kategoria 4, bez ograniczeń","Tylko powyżej 10 butli"],"correct":"Nie — kategoria 4, bez ograniczeń"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-kat4@adr-2025"},{"id":"b1-kategorie-transportowe","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3 / kol. 15","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Jest 5 kategorii transportowych (0-1-2-3-4). Kategorie transportowe to NIE klasy ani grupy pakowania. Limity na jednostkę transportową: kąt. 0 = 0 (zawsze pełny ADR), kąt. 1 = 20 (mnożnik x50), kąt. 2 = 333 (x3), kąt. 3 = 1000 (x1), kąt. 4 = bez ograniczeń (mnożnik 0). Kategorie sprawdza się w kolumnie 15 tabeli A.","q":{"match":{"prompt":"Dopasuj kategorię transportową do limitu ilości:","pairs":{"Kategoria 1":"20","Kategoria 2":"333","Kategoria 3":"1000","Kategoria 4":"bez ograniczeń"}},"mcq":{"prompt":"Kategorię transportową dla danego numeru UN sprawdzisz w tabeli A w kolumnie:","options":["kolumnie 1","kolumnie 15","kolumnie 20"],"correct":"kolumnie 15"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-kategorie-transportowe@adr-2025"},{"id":"b1-kurs-cysterny-prog","block":1,"topic":"Zakres uprawnień","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.2.1","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Kurs specjalistyczny ADR cysterny jest wymagany dla cystern powyżej 1 m3 (1000 l). Pozwala przewozić wszystkie klasy poza 1 i 7 w cysternach.","q":{"mcq":{"prompt":"Od jakiej pojemności cysterny wymagany jest kurs specjalistyczny?","options":["Powyżej 500 l","Powyżej 1 m3 (1000 l)","Powyżej 3 m3"],"correct":"Powyżej 1 m3 (1000 l)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-kurs-cysterny-prog@adr-2025"},{"id":"b1-lq-oznakowanie-pojazdu","block":1,"topic":"Wyłączenia w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 3.4.13","source":"kompendium","page":10,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Jednostki transportowe powyżej 12 t DMC przewożące powyżej 8 t brutto towarów LQ muszą być oznakowane znakiem LQ z przodu i tyłu pojazdu (250 x 250 mm). Nadawca musi poinformować przewoźnika o całkowitej ilości LQ. Oznakowanie zamienne z tablicami pomarańczowymi.","q":{"mcq":{"prompt":"Kiedy pojazd z towarami LQ musi być oznakowany z przodu i tyłu?","options":["Zawsze","Powyżej 12 t DMC i powyżej 8 t brutto ładunku LQ","Nigdy"],"correct":"Powyżej 12 t DMC i powyżej 8 t brutto ładunku LQ"},"scenario":{"prompt":"Ciężarówka 24 t DMC, 10 t brutto towarów LQ. Oznakowanie?","options":["Bez oznakowania","Znak LQ z przodu i tyłu","Tablice pomarańczowe z numerami"],"correct":"Znak LQ z przodu i tyłu"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-lq-oznakowanie-pojazdu@adr-2025"},{"id":"b1-lq-tunel-e","block":1,"topic":"Wyłączenia w praktyce","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.9.5 / 3.4","source":"kompendium","page":10,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Jednostki transportowe oznakowane znakiem LQ (powyżej 8 t brutto) NIE MOGĄ wjeżdżać do tunelu kategorii E.","q":{"mcq":{"prompt":"Pojazd oznakowany znakiem LQ powyżej 8 t brutto nie może wjechać do tunelu kategorii:","options":["B","D","E"],"correct":"E"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-lq-tunel-e@adr-2025"},{"id":"b1-lq","block":1,"topic":"Wyłączenia w praktyce","kind":"fact","scope":"podstawowy","adrRef":"ADR 3.4","source":"kompendium","page":10,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Ilości ograniczone (LQ), przepis 3.4: opakowania kombinowane max 5 kg/l wewnętrzne i 30 kg/l opakowanie. Można przewozić do ładowności auta. Oznakowanie: kwadrat obrócony o 45 stopni z czarno-białymi trójkątami.","q":{"mcq":{"prompt":"Limity opakowań przy ilościach ograniczonych (LQ):","options":["1 kg/l wewnętrzne","max 5 kg/l wewnętrzne i 30 kg/l opakowanie","10 kg/l i 50 kg/l"],"correct":"max 5 kg/l wewnętrzne i 30 kg/l opakowanie"},"match":{"prompt":"Dopasuj limit LQ:","pairs":{"Opakowanie wewnętrzne":"5 kg/l","Opakowanie zewnętrzne":"30 kg/l"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-lq@adr-2025"},{"id":"b1-luzem-przepisy","block":1,"topic":"Jednostka i sposoby przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR kol. 10/17 Tabeli A","source":"kompendium","page":6,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Przewóz luzem = materiał sypki bez opakowania, wprost do skrzyni/kontenera. Wolno go wieźć TYLKO wtedy, gdy tabela A na to pozwala — w kolumnie 10 lub 17 musi widnieć kod BK albo VC. BK (Bulk Container) = dozwolony określony typ kontenera do przewozu luzem. VC (Vehicle/Container) = warunki, w jakich wolno wieźć luzem danym pojazdem lub kontenerem. Dla kontrastu: kody P (np. P200, P900) to instrukcje PAKOWANIA — dotyczą przewozu w sztukach przesyłki, nie luzem. Kody S (np. S1, S2) to przepisy dot. bezpieczeństwa przewozu. Jeśli w kolumnach luzem NIE ma BK ani VC — przewóz luzem jest zakazany.","q":{"mcq":{"prompt":"Przewóz luzem jest dozwolony, gdy w tabeli A (kol. 10 lub 17) wskazano przepis:","options":["P200 lub P900 (to instrukcje pakowania)","BK1, BK2, BK3, VC1, VC2 lub VC3","S1 lub S2 (to przepisy bezpieczeństwa)"],"correct":"BK1, BK2, BK3, VC1, VC2 lub VC3"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-luzem-przepisy@adr-2025"},{"id":"b1-mnozniki","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.4","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Mnożniki kategorii transportowych: kąt. 1 = x50, kąt. 2 = x3, kąt. 3 = x1, kąt. 4 = 0. Suma iloczynów nie może przekroczyć 1000.","q":{"match":{"prompt":"Dopasuj kategorię do mnożnika:","pairs":{"Kategoria 1":"x50","Kategoria 2":"x3","Kategoria 3":"x1","Kategoria 4":"0"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-mnozniki@adr-2025"},{"id":"b1-nadawca","block":1,"topic":"Uczestnicy przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.4.2.1","source":"kompendium","page":28,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Nadawca: upewnia się że towary są sklasyfikowane i dopuszczone do przewozu, zaopatruje przewoźnika w dokumenty przewozowe, używa wyłącznie dopuszczonych opakowań/DPPL/cystern ze znakami ADR, odpowiada za oznakowanie kontenerów. Nadawca działa PRZED przewozem i na papierze (klasyfikacja, dokumenty) — nie mylić z załadowca, który fizycznie układa towar na pojeździe.","q":{"mcq":{"prompt":"Kto odpowiada za oznakowanie kontenerów?","options":["Kierowca","Nadawca","Odbiorca"],"correct":"Nadawca"},"scenario":{"prompt":"Kto ma sklasyfikować towar i wystawić dokument przewozowy — zanim towar w ogóle trafi na pojazd?","options":["Załadowca","Nadawca","Przewoźnik"],"correct":"Nadawca"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-nadawca@adr-2025"},{"id":"b1-odbiorca","block":1,"topic":"Uczestnicy przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.4.2.3","source":"kompendium","page":28,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Odbiorca: nie opóźnia przyjęcia towarów bez konieczności, sprawdza po rozładunku spełnienie wymagań ADR. Kontener może zwrócić przewoźnikowi dopiero po usunięciu naruszenia. Haczyk: odbiorca PRZYJMUJE towar — fizyczne zdejmowanie, czyszczenie i odkażanie po rozładunku to obowiązek rozładowcy, nie odbiorcy (choc często to ta sama firma).","q":{"mcq":{"prompt":"Odbiorca stwierdził naruszenie przepisów ADR w kontenerze. Może go zwrócić przewoźnikowi:","options":["Natychmiast","Dopiero po usunięciu naruszenia","Nigdy"],"correct":"Dopiero po usunięciu naruszenia"},"scenario":{"prompt":"Po rozładunku kontener trzeba oczyścić i odkazić oraz zdjąć nalepki. Czyj to obowiązek?","options":["Odbiorcy","Rozładowcy","Przewoźnika"],"correct":"Rozładowcy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-odbiorca@adr-2025"},{"id":"b1-odstepstwa","block":1,"topic":"Podstawy prawne","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.5","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Strony umowy mogą wprowadzać umowy specjalne dopuszczające odstępstwa od przepisów. Odstępstwa nie mogą być dłuższe niż 5 lat.","q":{"mcq":{"prompt":"Umowy specjalne (odstępstwa od ADR) mogą obowiązywać maksymalnie:","options":["1 rok","5 lat","bezterminowo"],"correct":"5 lat"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-odstepstwa@adr-2025"},{"id":"b1-prozne-oznakowanie","block":1,"topic":"Wyliczenie 1000 punktów","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.1.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Próżne, NIEOCZYSZCZONE opakowania pozostają oznakowane tak jak w stanie ładownym. NIE usuwamy nalepek ostrzegawczych ani numerów UN.","q":{"mcq":{"prompt":"Próżne, nieoczyszczone opakowanie po towarze niebezpiecznym:","options":["Zdejmujemy nalepki","Pozostaje oznakowane jak w stanie ładownym","Oznaczamy napisem PUSTE"],"correct":"Pozostaje oznakowane jak w stanie ładownym"},"scenario":{"prompt":"Rozładowałeś DPPL po farbie. Opakowanie nieoczyszczone. Co z nalepka klasy 3?","options":["Usuwam ją","Zostaje — nieoczyszczone = jak ładowne","Zamieniam na nalepkę 9"],"correct":"Zostaje — nieoczyszczone = jak ładowne"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-prozne-oznakowanie@adr-2025"},{"id":"b1-przepisy-szczegolne","block":1,"topic":"Wyłączenia w praktyce","kind":"ref","scope":"podstawowy","adrRef":"ADR 3.3","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Zwolnienia z przepisów szczególnych: 598 — akumulatory, 168 — przewóz azbestu, 188 — akumulatory litowe zawarte w urządzeniach (nie podlega ADR).","q":{"match":{"prompt":"Dopasuj przepis szczególny do towaru:","pairs":{"168":"azbest","188":"akumulatory litowe w urządzeniach","598":"akumulatory"}},"mcq":{"prompt":"Akumulatory litowe zawarte w urządzeniu obejmuje przepis szczególny:","options":["168","188","598"],"correct":"188"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-przepisy-szczegolne@adr-2025"},{"id":"b1-przewoznik","block":1,"topic":"Uczestnicy przewozu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.4.2.2","source":"kompendium","page":28,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Przewoźnik: upewnia się WZROKOWO czy pojazd i ładunek nie mają oczywistych wad, wycieków, nieszczelności, braków w wyposażeniu; sprawdza czy pojazd nie jest nadmiernie załadowany; sprawdza nalepki, znaki i tablice; sprawdza wyposażenie.","q":{"mcq":{"prompt":"Kontrola wzrokowa pojazdu i ładunku przed jazdą to obowiązek:","options":["Nadawcy","Przewoźnika","Rozładowcy"],"correct":"Przewoźnika"},"scenario":{"prompt":"Zauważyłeś wyciek z DPPL przed wyjazdem. Czyj to obowiązek reagować?","options":["Odbiorcy","Przewoźnika (kontrola wzrokowa)","Nikogo, to problem nadawcy"],"correct":"Przewoźnika (kontrola wzrokowa)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-przewoznik@adr-2025"},{"id":"b1-rodzaje-przewozu","block":1,"topic":"Jednostka i sposoby przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.2.1","source":"kompendium","page":6,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Trzy sposoby przewozu: w sztukach przesyłki (opakowania), luzem (nieopakowane materiały stałe), w cysternie.","q":{"match":{"prompt":"Dopasuj sposób przewozu do przykładu:","pairs":{"W sztukach":"kanistry, butle, DPPL","Luzem":"zużyte akumulatory nieopakowane","W cysternie":"paliwo w zbiorniku"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-rodzaje-przewozu@adr-2025"},{"id":"b1-role-rozroznianie","block":1,"topic":"Uczestnicy przewozu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.4","source":"kompendium","page":28,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Najczęstsza pomyłka to mylenie ROL, które brzmią podobnie. Klucz po czasowniku: nadawca KLASYFIKUJE i daje dokumenty (działa PRZED przewozem, na papierze). Przewoźnik OGLĄDA wzrokowo pojazd tuż przed jazdą. Załadowca UKŁADA sztuki na pojeździe i pilnuje segregacji. Napełniający LEJE do cystern. Rozładowca CZYŚCI po rozładunku. Odbiorca PRZYJMUJE (nie opóźnia). Zapamiętaj: klasyfikuje=nadawca, ogląda=przewoźnik, układa=załadowca, leje=napełniający, czyści=rozładowca, przyjmuje=odbiorca.","q":{"scenario":{"prompt":"Cysterna ma zostać napełniona olejem napędowym. Kto odpowiada za to, by nie przepełnić i by cysterna była dopuszczona do tego towaru?","options":["Załadowca","Napełniający","Nadawca"],"correct":"Napełniający"},"match":{"prompt":"Dopasuj role po jej kluczowym czasowniku:","pairs":{"Klasyfikuje i daje dokumenty":"nadawca","OGLĄDA pojazd przed jazdą":"przewoźnik","UKŁADA sztuki, pilnuje segregacji":"załadowca","Napełnia cysternę":"napełniający","CZYŚCI po rozładunku":"rozładowca"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-role-rozroznianie@adr-2025"},{"id":"b1-rozladowca","block":1,"topic":"Uczestnicy przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.4.3.7","source":"kompendium","page":28,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Rozładowca: sprawdza czy rozładowano właściwe towary (porównanie dokumentu ze sztuka przesyłki), sprawdza uszkodzenia, po rozładunku usuwa pozostałości z zewnętrznej powierzchni, zamyka zawory, zapewnia oczyszczenie i odkażenie. Z całkowicie oczyszczonego kontenera ZDEJMUJE nalepki i tablice.","q":{"mcq":{"prompt":"Kto zdejmuje nalepki i tablice z całkowicie oczyszczonego kontenera?","options":["Nadawca","Rozładowca","Przewoźnik"],"correct":"Rozładowca"},"scenario":{"prompt":"Kontener został rozładowany, oczyszczony i odkażony. Co z nalepkami?","options":["Zostają na kontenerze","Należy je usunąć","Zaklejamy tasma"],"correct":"Należy je usunąć"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-rozladowca@adr-2025"},{"id":"b1-szkolenie","block":1,"topic":"Zakres uprawnień","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.3 / 8.2","source":"kompendium","page":8,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Korzystając ze wszystkich wyłączeń kierowca NIE musi posiadać zaświadczenia ADR. Powinien przejść na koszt pracodawcy szkolenie stanowiskowe (wg 1.3), inne niż kurs ADR.","q":{"mcq":{"prompt":"Kierowca przewożący towary na wyłączeniu:","options":["Musi mieć zaświadczenie ADR","Wystarczy szkolenie stanowiskowe na koszt pracodawcy","Nie potrzebuje żadnego szkolenia"],"correct":"Wystarczy szkolenie stanowiskowe na koszt pracodawcy"},"scenario":{"prompt":"Wieziesz towar w ilościach wyłączonych (EQ). Czy potrzebujesz kursu ADR?","options":["Tak, pełnego kursu","Nie, wystarczy szkolenie stanowiskowe","Tylko przy klasie 3"],"correct":"Nie, wystarczy szkolenie stanowiskowe"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-szkolenie@adr-2025"},{"id":"b1-uczestnicy","block":1,"topic":"Uczestnicy przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.4","source":"kompendium","page":28,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Sześciu uczestników przewozu i ich JEDEN kluczowy obowiązek: nadawca (klasyfikuje i dopuszcza do przewozu, daje dokumenty), przewoźnik (sprawdza wzrokowo pojazd i ładunek przed jazdą), załadowca (układa sztuki na pojeździe, pilnuje segregacji), napełniający (napełnia cysterny), rozładowca (sprawdza i czyści po rozładunku), odbiorca (nie opóźnia przyjęcia). Uczysz się po czasowniku — każda rola ma inny.","q":{"match":{"prompt":"Dopasuj uczestnika do głównego obowiązku:","pairs":{"Nadawca":"klasyfikuje i dopuszcza do przewozu","Przewoźnik":"wzrokowa kontrola pojazdu przed jazdą","Załadowca":"układa sztuki i pilnuje segregacji","Napełniający":"napełnia cysterny","Rozładowca":"sprawdza i czyści po rozładunku","Odbiorca":"nie opóźnia przyjęcia towaru"}},"scenario":{"prompt":"Firma pakuje kanistry, układa je na pojeździe i pilnuje, by nie załadować razem klas, których nie wolno. W jakiej roli występuje przy tych czynnościach?","options":["Nadawcy","Załadowcy","Przewoźnika"],"correct":"Załadowcy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-uczestnicy@adr-2025"},{"id":"b1-ustawa-pl","block":1,"topic":"Podstawy prawne","kind":"ref","scope":"podstawowy","adrRef":"Dz.U. 2011 nr 227 poz. 1367","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"W Polsce obowiązuje Ustawa o przewozie towarów niebezpiecznych z 19.08.2011 (Dz.U. 2011 nr 227 poz. 1367).","q":{"mcq":{"prompt":"Polska ustawa regulująca przewóz towarów niebezpiecznych pochodzi z roku:","options":["2005","2011","2019"],"correct":"2011"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-ustawa-pl@adr-2025"},{"id":"b1-wartosc-energetyczna","block":1,"topic":"Wyłączenia w praktyce","kind":"ref","scope":"podstawowy","adrRef":"ADR 1.1.3.2 uwaga 1","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Wartości energetyczne paliw: olej napędowy 36 MJ/l, benzyna silnikowa 32 MJ/l, gaz ziemny/biogaz 35 MJ/Nm3, LPG 24 MJ/l, etanol 21 MJ/l, olej napędowy bio 33 MJ/l, paliwo emulsyjne 32 MJ/l, wodór 11 MJ/Nm3.","q":{"match":{"prompt":"Dopasuj paliwo do wartości energetycznej:","pairs":{"Olej napędowy":"36 MJ/l","Benzyna silnikowa":"32 MJ/l","LPG":"24 MJ/l","Wodór":"11 MJ/Nm3"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-wartosc-energetyczna@adr-2025"},{"id":"b1-waznosc","block":1,"topic":"Zakres uprawnień","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.2.2.8","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Zaświadczenie o przeszkoleniu kierowcy wydaje się na okres 5 lat. W ostatnim roku ważności można je przedłużyć na kolejny okres.","q":{"mcq":{"prompt":"Zaświadczenie ADR wydaje się na okres:","options":["3 lata","5 lat","10 lat"],"correct":"5 lat"},"fill":{"prompt":"Zaświadczenie ADR można przedłużyć w ___ roku jego ważności.","correct":"ostatnim","hint":"którym"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-waznosc@adr-2025"},{"id":"b1-wejscie-przepisow","block":1,"topic":"Podstawy prawne","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.6","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Nowe przepisy ADR wchodzą zawsze 1 stycznia w roku nieparzystym. Do końca czerwca obowiązuje okres przejściowy — można używać starej lub nowej wersji.","q":{"mcq":{"prompt":"Kiedy wchodzą w życie nowe przepisy ADR?","options":["1 stycznia roku parzystego","1 stycznia roku nieparzystego","1 lipca każdego roku"],"correct":"1 stycznia roku nieparzystego"},"fill":{"prompt":"Okres przejściowy pozwalający używać starej wersji przepisów trwa do końca ___ (miesiąc).","correct":"czerwca","hint":"miesiąc, dopełniacz"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-wejscie-przepisow@adr-2025"},{"id":"b1-zakres-podstawowy","block":1,"topic":"Zakres uprawnień","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.2.1","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"ADR podstawowy pozwala przewozić wszystkie klasy poza 1 i 7 w sztukach przesyłki oraz luzem, a także w cysternach stałych i odejmowalnych do 1000 l i kontenerach-cysternach do 3000 l. Taki przewóz NIE wymaga świadectwa dopuszczenia pojazdu (\"czerwonego paska\").","q":{"mcq":{"prompt":"ADR podstawowy pozwala przewozić w cysternach stałych o pojemności do:","options":["500 l","1000 l","3000 l"],"correct":"1000 l"},"scenario":{"prompt":"Masz ADR podstawowy. Kontener-cysterna 2500 l z olejem napędowym — możesz?","options":["Nie, potrzeba kursu cysterny","Tak, kontenery-cysterny do 3000 l są w zakresie podstawowym","Tylko z eskorta"],"correct":"Tak, kontenery-cysterny do 3000 l są w zakresie podstawowym"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-zakres-podstawowy@adr-2025"},{"id":"b1-zaladowca","block":1,"topic":"Uczestnicy przewozu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.4.3.1","source":"kompendium","page":28,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Załadowca to ten, kto UMIESZCZA zapakowany towar (sztuki przesyłki, kontenery) NA pojazd — nie mylić z napełniającym (ten napełnia cysterny) ani z pakującym (ten wkłada towar do opakowań). Załadowca: przekazuje do przewozu tylko towar dopuszczony, sprawdza czy opakowania nie są uszkodzone, przestrzega zakazów ładowania razem (segregacja) i zasad mocowania. Haczyk: załadowca patrzy na STAN opakowania i zgodność załadunku, a nie klasyfikuje towaru (to nadawca).","q":{"mcq":{"prompt":"Kto odpowiada za przestrzeganie zakazów ładowania razem (segregacji) przy załadunku sztuk przesyłki?","options":["Nadawca","Załadowca","Odbiorca"],"correct":"Załadowca"},"scenario":{"prompt":"Widzisz uszkodzone opakowanie w chwili umieszczania go na pojeździe. Czyj to obowiązek nie przyjąć takiej sztuki do załadunku?","options":["Nadawcy","Załadowcy","Odbiorcy"],"correct":"Załadowcy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-zaladowca@adr-2025"},{"id":"b1-zaswiadczenie-wydanie","block":1,"topic":"Zakres uprawnień","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.2.2.8 / ustawa PL","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Po zdanym egzaminie marszałek wydaje zaświadczenie ADR (plastikowa karta) w ciągu 14 dni; w praktyce dociera pocztą w 1-3 tygodnie. Ważność 5 lat. Żeby przedłużyć, w ostatnim roku ważności robisz kurs doskonalący i ponownie zdajesz egzamin, zanim dokument wygaśnie.","q":{"mcq":{"prompt":"Kto wydaje zaświadczenie ADR po zdanym egzaminie?","options":["Akredytowany osrodek szkolenia","Marszałek województwa","Transportowy Dozór Techniczny"],"correct":"Marszałek województwa"},"scenario":{"prompt":"Twoje zaświadczenie ADR wygasa za 8 miesięcy. Co robisz, żeby zachować ciągłość?","options":["Czekam aż wygaśnie i robie kurs od nowa","W ostatnim roku ważności kurs doskonalący + egzamin, zanim wygaśnie","Nic — odnawia się samo"],"correct":"W ostatnim roku ważności kurs doskonalący + egzamin, zanim wygaśnie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b1-zaswiadczenie-wydanie@adr-2025"},{"id":"b2-grupy-pakowania","block":2,"topic":"Klasyfikacja","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.1.1.3","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Grupy pakowania określają natężenie zagrożenia dominującego: I — zagrożenie duże, II — średnie, III — małe. Grup pakowania NIE MAJĄ klasy 1, 2, 5.2, 6.2, 7 oraz przedmioty.","q":{"mcq":{"prompt":"Które klasy NIE mają grup pakowania?","options":["Tylko 2 i 7","1, 2, 5.2, 6.2, 7 oraz przedmioty","Tylko 1 i 7"],"correct":"1, 2, 5.2, 6.2, 7 oraz przedmioty"},"match":{"prompt":"Dopasuj grupę pakowania do natężenia zagrożenia:","pairs":{"I":"duże","II":"średnie","III":"małe"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-grupy-pakowania@adr-2025"},{"id":"b2-ino","block":2,"topic":"Klasyfikacja","kind":"fact","scope":"podstawowy","adrRef":"ADR 3.1.2.8","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Litery I.N.O. po nazwie oznaczają \"inaczej nie określony\". Wymaga się wtedy uzupełnienia o nazwy techniczne, np. UN 1964 WĘGLOWODORY GAZOWE, MIESZANINA SPRĘŻONA I.N.O (zawiera wodór i argon) 2.1 (B/D).","q":{"mcq":{"prompt":"Skrót I.N.O. po nazwie przewozowej oznacza:","options":["Inaczej nie określony","Instrukcja nadawcy obowiązkowa","Ilość nieograniczona"],"correct":"Inaczej nie określony"},"scenario":{"prompt":"W dokumencie widzisz UN 1964 ... I.N.O. Czego wymaga taki zapis?","options":["Nic dodatkowego","Uzupełnienia o nazwy techniczne składników","Zgody TDT"],"correct":"Uzupełnienia o nazwy techniczne składników"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-ino@adr-2025"},{"id":"b2-klasa3-temp","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.2.3","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Klasa 3 — materiały ciekłe zapalne o temperaturze zapłonu nie wyższej niż 60 stopni C, np. UN 1202, UN 1203. Uwaga: unikać zagłębień terenu.","q":{"mcq":{"prompt":"Temperatura zapłonu materiałów klasy 3 nie jest wyższa niż:","options":["23 st. C","60 st. C","100 st. C"],"correct":"60 st. C"},"fill":{"prompt":"Klasa 3 to materiały ciekłe zapalne o temperaturze zapłonu do ___ stopni C.","correct":"60","hint":"liczba"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-klasa3-temp@adr-2025"},{"id":"b2-klasa9-temp","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.2.9","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Klasa 9 obejmuje m.in. azbest (wdychany w postaci drobnego pyłu), materiały w podwyższonej temperaturze — stałe powyżej 240 st. C, ciekłe powyżej 100 st. C, akumulatory litowe, przedmioty ratownicze, materiały zagrażające środowisku wodnemu.","q":{"mcq":{"prompt":"Materiał ciekły klasy 9 w podwyższonej temperaturze to powyżej:","options":["60 st. C","100 st. C","240 st. C"],"correct":"100 st. C"},"match":{"prompt":"Dopasuj stan skupienia do progu podwyższonej temperatury:","pairs":{"Stały":"powyżej 240 st. C","Ciekły":"powyżej 100 st. C"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-klasa9-temp@adr-2025"},{"id":"b2-klasyfikacja-kto","block":2,"topic":"Klasyfikacja","kind":"ref","scope":"podstawowy","adrRef":"ADR czesc 2","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Za klasyfikację odpowiada PRODUCENT, NADAWCA oraz Instytut Przemysłu Organicznego (IPO). Dla klasy 7 — Państwowa Agencja Atomistyki (PAA).","q":{"mcq":{"prompt":"Kto odpowiada za klasyfikację materiałów promieniotwórczych (klasa 7)?","options":["IPO","Państwowa Agencja Atomistyki","TDT"],"correct":"Państwowa Agencja Atomistyki"},"match":{"prompt":"Dopasuj odpowiedzialność za klasyfikację:","pairs":{"Klasy 1-9 (poza 7)":"producent, nadawca, IPO","Klasa 7":"Państwowa Agencja Atomistyki"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-klasyfikacja-kto@adr-2025"},{"id":"b2-kod-opakowania-xyz","block":2,"topic":"Odczyt opakowania","kind":"skill","scope":"podstawowy","adrRef":"ADR 6.1.2","source":"kompendium","page":8,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Litera na drugim miejscu kodu opakowania wskazuje, dla której grupy pakowania może być użyte: X — dla I, II, III GP; Y — dla II, III GP; Z — tylko dla III GP.","q":{"match":{"prompt":"Dopasuj literę kodu opakowania do grup pakowania:","pairs":{"X":"I, II, III GP","Y":"II, III GP","Z":"III GP"}},"mcq":{"prompt":"Opakowanie z litera Y może być użyte dla grup pakowania:","options":["Tylko I","II i III","Wszystkich"],"correct":"II i III"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-kod-opakowania-xyz@adr-2025"},{"id":"b2-nalepka-9a","block":2,"topic":"Klasy zagrożeń","kind":"ref","scope":"podstawowy","adrRef":"ADR 5.2.2.2","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Nalepka 9A jest stosowana dla numerów UN 3090, UN 3091, UN 3480, UN 3481 — ogniwa i akumulatory litowe.","q":{"mcq":{"prompt":"Nalepka 9A jest stosowana dla:","options":["Azbestu","Ogniw i akumulatorów litowych (UN 3090, 3091, 3480, 3481)","Suchego lodu"],"correct":"Ogniw i akumulatorów litowych (UN 3090, 3091, 3480, 3481)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-nalepka-9a@adr-2025"},{"id":"b2-nalepka-wymiary","block":2,"topic":"Odczyt opakowania","kind":"ref","scope":"podstawowy","adrRef":"ADR 5.2.2.2","source":"kompendium","page":7,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Nalepka wskazująca zagrożenie na sztuce przesyłki ma rozmiar 100 mm x 100 mm. Może być więcej niż jedna — zagrożenie dominujące i dodatkowe.","q":{"mcq":{"prompt":"Rozmiar nalepki ostrzegawczej na sztuce przesyłki:","options":["100 x 100 mm","250 x 250 mm","300 x 400 mm"],"correct":"100 x 100 mm"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-nalepka-wymiary@adr-2025"},{"id":"b2-nie-podlega-adr","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 3.3 SP 188","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Nie podlegają ADR: akumulatory i ogniwa litowe wg przepisu 188, pojazdy poddane fumigacji (zagrożenie uduszeniem), czynniki chłodzące np. UN 1845 suchy lód (zagrożenie uduszeniem).","q":{"match":{"prompt":"Dopasuj towar do jego statusu:","pairs":{"Akumulatory litowe wg przepisu 188":"nie podlega ADR","Suchy lód UN 1845":"nie podlega ADR","Jednostka poddana fumigacji":"nie podlega ADR"}},"scenario":{"prompt":"Wieziesz suchy lód (UN 1845) jako czynnik chłodzący. Jakie zagrożenie główne?","options":["Pożar","Uduszenie","Zatrucie"],"correct":"Uduszenie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-nie-podlega-adr@adr-2025"},{"id":"b2-numer-cyfry","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":18,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Cyfry numeru rozpoznawczego zagrożenia: 2 — emisja gazu spowodowana ciśnieniem lub reakcja chemiczna, 3 — zapalność materiałów ciekłych i gazów, 4 — zapalność materiałów stałych, 5 — działanie utleniające, 6 — działanie trujące lub ryzyko zakażenia, 7 — działanie promieniotwórcze, 8 — działanie żrące, 9 — ryzyko samorzutnej i gwałtownej reakcji.","q":{"match":{"prompt":"Dopasuj cyfrę numeru zagrożenia do znaczenia:","pairs":{"2":"emisja gazu","3":"zapalność cieczy","5":"działanie utleniające","8":"działanie żrące"}},"mcq":{"prompt":"Cyfra 9 w numerze rozpoznawczym zagrożenia oznacza:","options":["Działanie żrące","Ryzyko samorzutnej i gwałtownej reakcji","Emisje gazu"],"correct":"Ryzyko samorzutnej i gwałtownej reakcji"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-numer-cyfry@adr-2025"},{"id":"b2-numer-podwojenie","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Powtórzenie cyfry wskazuje na nasilenie oznaczonego ta cyfra zagrożenia, np. 33 = materiał łatwo zapalny ciekły (temperatura zapłonu niższa niż 23 st. C).","q":{"mcq":{"prompt":"Powtórzenie cyfry w numerze rozpoznawczym oznacza:","options":["Dwa różne zagrożenia","Nasilenie zagrożenia","Brak zagrożenia dodatkowego"],"correct":"Nasilenie zagrożenia"},"scenario":{"prompt":"Tablica 33/1203. Co oznacza 33?","options":["Materiał zapalny o temp. zapłonu 23-60 st. C","Materiał łatwo zapalny ciekły, temp. zapłonu poniżej 23 st. C","Gaz palny"],"correct":"Materiał łatwo zapalny ciekły, temp. zapłonu poniżej 23 st. C"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-numer-podwojenie@adr-2025"},{"id":"b2-numer-x","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Litera X przed numerem rozpoznawczym zagrożenia oznacza niebezpieczna reakcje z wodą. Woda może być stosowana jedynie za zgoda specjalistów. UWAGA: nie mylić z X w kodzie opakowania, który określa mocne opakowanie do I, II, III grupy pakowania.","q":{"mcq":{"prompt":"Litera X przed numerem rozpoznawczym zagrożenia oznacza:","options":["Materiał wybuchowy","Niebezpieczna reakcje z wodą","Mocne opakowanie"],"correct":"Niebezpieczna reakcje z wodą"},"scenario":{"prompt":"Na tablicy widzisz X423. Czy można gasić wodą?","options":["Tak, zawsze","Tylko za zgoda specjalistów","Woda jest zalecana"],"correct":"Tylko za zgoda specjalistów"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-numer-x@adr-2025"},{"id":"b2-numer-zero","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Jeśli w numerze rozpoznawczym zagrożenia występuje 0 (zero), to zawsze na drugiej pozycji. Oznacza, ze NIE ma zwiększenia zagrożenia ani zagrożenia dodatkowego, a towar zwykle należy do II lub III grupy pakowania. Nie dotyczy gazów.","q":{"mcq":{"prompt":"Zero na drugim miejscu numeru rozpoznawczego oznacza:","options":["Nasilenie zagrożenia","Brak zwiększenia zagrożenia i zagrożenia dodatkowego","Reakcje z wodą"],"correct":"Brak zwiększenia zagrożenia i zagrożenia dodatkowego"},"scenario":{"prompt":"Numer 30 na tablicy. Do której grupy pakowania zwykle należy taki towar?","options":["I","II lub III","Nie ma grupy pakowania"],"correct":"II lub III"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-numer-zero@adr-2025"},{"id":"b2-numery-przyklady","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":18,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Przykłady odczytu: 20 = gaz duszący lub niestwarzający zagrożenia dodatkowego, 23 = gaz palny, 26 = gaz trujący, 30 = materiał zapalny ciekły (23-60 st. C), 33 = materiał łatwo zapalny ciekły (poniżej 23 st. C), 80 = materiał żrący lub słabo żrący, 88 = materiał silnie żrący.","q":{"match":{"prompt":"Dopasuj numer rozpoznawczy do znaczenia:","pairs":{"20":"gaz duszący","23":"gaz palny","80":"materiał żrący","88":"materiał silnie żrący"}},"scenario":{"prompt":"Cysterna z tablica 33 / 1203 przewozi:","options":["Chlor","Benzynę","Azotan amonu"],"correct":"Benzynę"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-numery-przyklady@adr-2025"},{"id":"b2-numery-specjalne","block":2,"topic":"Odczyt tablicy","kind":"ref","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Następujące zestawienia cyfr mają znaczenie specjalne: 22, 323, 333, 362, 382, 423, 44, 446, 462, 482, 539, 606, 623, 642, 823, 842, 90 i 99. Przykłady: 90 = materiał zagrażający środowisku, 99 = różne materiały niebezpieczne przewożone w podwyższonej temperaturze, 333 = materiał piroforyczny ciekły, 606 = materiał zakaźny.","q":{"match":{"prompt":"Dopasuj numer specjalny do znaczenia:","pairs":{"90":"zagrażający środowisku","99":"podwyższona temperatura","333":"piroforyczny ciekły","606":"materiał zakaźny"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-numery-specjalne@adr-2025"},{"id":"b2-opakowania-waznosc","block":2,"topic":"Odczyt opakowania","kind":"skill","scope":"podstawowy","adrRef":"ADR 4.1.1.15","source":"kompendium","page":7,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"W większości wypadków (DPPL, kanistry, bębny) opakowania mogą być używane przez 5 lat od daty produkcji. Po 2,5 roku powinno być przeprowadzone badanie. Data produkcji zapisana jako cyfry miesiąca i roku, np. 07 21 = lipiec 2021, używany do lipca 2026.","q":{"mcq":{"prompt":"Przez ile lat od daty produkcji można używać DPPL?","options":["2,5 roku","5 lat","10 lat"],"correct":"5 lat"},"fill":{"prompt":"Po ___ roku (liczba) od produkcji opakowania powinno być przeprowadzone badanie.","correct":"2,5","hint":"liczba z przecinkiem"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-opakowania-waznosc@adr-2025"},{"id":"b2-overpack","block":2,"topic":"Odczyt opakowania","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.1.2","source":"kompendium","page":7,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Jeśli używamy opakowania zbiorczego (skrzyni, klatki, palety) i nalepki lub numery UN nie są widoczne na zewnątrz, należy je ponowić. Gdy w opakowaniu są 2 rodzaje towaru (np. klasy 3 i 8), na zewnątrz muszą być wszystkie wzory nalepek (3 i 8). Jeśli nalepka jest ta sama dla wszystkich opakowań, wystarczy na palecie 1 nalepka. Należy umieścić napis OPAKOWANIE ZBIORCZE — OVERPACK (język kraju nadania i angielski lub niemiecki lub francuski).","q":{"mcq":{"prompt":"Napis na opakowaniu zbiorczym to:","options":["ZBIORCZE","OPAKOWANIE ZBIORCZE - OVERPACK","PALETA ADR"],"correct":"OPAKOWANIE ZBIORCZE - OVERPACK"},"scenario":{"prompt":"Paleta z towarami klasy 3 i klasy 8, nalepki niewidoczne. Co na zewnątrz?","options":["Tylko nalepka 3","Wszystkie wzory nalepek: 3 i 8","Żadna"],"correct":"Wszystkie wzory nalepek: 3 i 8"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-overpack@adr-2025"},{"id":"b2-oznakowanie-sztuki","block":2,"topic":"Odczyt opakowania","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.2","source":"kompendium","page":7,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Na każdej sztuce przesyłki musi znajdować się: numer UN przewożonego towaru, znak certyfikacji opakowania (symbol ONZ — litery \"un\" w kołku), nalepka wskazująca zagrożenie (100x100 mm), prawidłowa nazwa przewozowa (dla klas 1, 2, 7), strzałki kierunkowe nr 11 dla opakowań z naczyniami wewnętrznymi z materiałami ciekłymi.","q":{"mcq":{"prompt":"Prawidłowa nazwa przewozowa na sztuce przesyłki jest wymagana dla klas:","options":["Wszystkich","1, 2 i 7","Tylko 3 i 8"],"correct":"1, 2 i 7"},"match":{"prompt":"Dopasuj element oznakowania sztuki przesyłki:","pairs":{"Numer UN":"identyfikacja towaru","Symbol ONZ (un w kołku)":"certyfikacja opakowania","Strzalki kierunkowe nr 11":"naczynia wewnętrzne z cieczami"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-oznakowanie-sztuki@adr-2025"},{"id":"b2-pietrowanie","block":2,"topic":"Odczyt opakowania","kind":"fact","scope":"podstawowy","adrRef":"ADR 6.5.2.2.2","source":"kompendium","page":8,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Piętrowanie towarów niebezpiecznych jest dopuszczone, jeśli odpowiednie oznakowanie na opakowaniu wskazuje na taka możliwość (rys. 6.5.2.2.2.1 — DPPL przeznaczony do spietrzania, z podanym max obciążeniem w kg; rys. 6.5.2.2.2.2 — DPPL NIE przeznaczony do spietrzania).","q":{"mcq":{"prompt":"Czy można piętrować DPPL?","options":["Zawsze","Tylko jeśli oznakowanie na opakowaniu na to wskazuje","Nigdy"],"correct":"Tylko jeśli oznakowanie na opakowaniu na to wskazuje"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-pietrowanie@adr-2025"},{"id":"b2-podklasy2","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.2.2","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Klasa 2 (gazy): 2.1 gazy palne, 2.2 gazy niepalne i nietrujące (mogą być duszące), 2.3 gazy trujące. Zagrożenie dominujące: wysokie ciśnienie, emisja gazu, odmrożenia, wybuch przy ogrzaniu.","q":{"match":{"prompt":"Dopasuj podklasę gazu:","pairs":{"2.1":"gazy palne","2.2":"niepalne i nietrujące","2.3":"gazy trujące"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-podklasy2@adr-2025"},{"id":"b2-podklasy4","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.2.41-43","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Klasa 4: 4.1 materiały zapalne stałe, samoreaktywne, polimeryzujące i wybuchowe odczulone stałe; 4.2 materiały podatne na samozapalenie (piroforyczne, tytan, rozdrobnione metale, fosfor biały); 4.3 materiały wytwarzające w zetknięciu z wodą gazy palne — muszą być przewożone w pojazdach zamkniętych.","q":{"match":{"prompt":"Dopasuj podklasę klasy 4:","pairs":{"4.1":"zapalne stałe, samoreaktywne","4.2":"podatne na samozapalenie","4.3":"wytwarzają z wodą gazy palne"}},"mcq":{"prompt":"Materiały klasy 4.3 muszą być przewożone:","options":["W pojazdach otwartych","W pojazdach zamkniętych","Tylko w cysternach"],"correct":"W pojazdach zamkniętych"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-podklasy4@adr-2025"},{"id":"b2-podklasy5","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.2.51-52","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Klasa 5: 5.1 materiały utleniające — wzmagają palenie, same nie muszą się palić, nie mieszać z materiałami zapalnymi (np. trocinami); 5.2 nadtlenki organiczne typu A-F, niektóre mogą być wybuchowe.","q":{"match":{"prompt":"Dopasuj podklasę klasy 5:","pairs":{"5.1":"utleniające (wzmagają palenie)","5.2":"nadtlenki organiczne"}},"mcq":{"prompt":"Z czym NIE wolno mieszać materiałów utleniających (5.1)?","options":["Z wodą","Z materiałami zapalnymi, np. trocinami","Z piaskiem"],"correct":"Z materiałami zapalnymi, np. trocinami"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-podklasy5@adr-2025"},{"id":"b2-podklasy6","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.2.61-62","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Klasa 6: 6.1 materiały trujące — zagrożenie śmiertelnym zatruciem przez połknięcie, wdychanie lub przez skórę; 6.2 materiały zakaźne — odpady medyczne, kliniczne, szpitalne, wirusy, bakterie, priony. UWAGA: NIE występują jednocześnie zakaźne i trujące.","q":{"match":{"prompt":"Dopasuj podklasę klasy 6:","pairs":{"6.1":"trujące","6.2":"zakaźne"}},"mcq":{"prompt":"Czy może wystąpić materiał jednocześnie zakaźny i trujący?","options":["Tak, często","Nie — takie połączenie nie występuje","Tylko w klasie 9"],"correct":"Nie — takie połączenie nie występuje"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-podklasy6@adr-2025"},{"id":"b2-tablice-gladkie","block":2,"topic":"Odczyt tablicy","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.3.2","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Tablice odblaskowe pomarańczowe mają wymiary 300 x 400 mm (+/- 10%) z czarna ramka o szerokości 15 mm. Tablice powinny przetrwać w pożarze 15 minut. Dopuszcza się tablice 300 x 120 mm (obramowanie 10 mm) w pojazdach bez miejsca na standardowa, np. osobowych. Tablic gładkich używa się zwykle przy przewozie w sztukach przesyłki.","q":{"mcq":{"prompt":"Wymiary standardowej tablicy pomarańczowej to:","options":["250 x 250 mm","300 x 400 mm","400 x 400 mm"],"correct":"300 x 400 mm"},"fill":{"prompt":"Tablica pomarańczowa powinna przetrwać w pożarze ___ minut.","correct":"15","hint":"liczba"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-tablice-gladkie@adr-2025"},{"id":"b2-tablice-ramka","block":2,"topic":"Odczyt tablicy","kind":"ref","scope":"podstawowy","adrRef":"ADR 5.3.2.2.1","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Tablica standardowa 300 x 400 mm ma czarna ramkę o szerokości 15 mm. Tablica mała 300 x 120 mm ma obramowanie 10 mm.","q":{"match":{"prompt":"Dopasuj rozmiar tablicy do szerokości ramki:","pairs":{"300 x 400 mm":"ramka 15 mm","300 x 120 mm":"ramka 10 mm"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-tablice-ramka@adr-2025"},{"id":"b2-temp-kontrolowana","block":2,"topic":"Klasy zagrożeń","kind":"fact","scope":"podstawowy","adrRef":"ADR 7.1.7","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Klasy 4.1 i 5.2 mogą wymagać temperatury kontrolowanej podczas przewozu (reakcja egzotermiczna). Wymagana jest możliwość sprawdzenia temperatury oraz procedura postępowania. Termometr z 2 czujnikami. Temperaturę sprawdza się co 4-6 h i rejestruje. Należy określić procedury na wypadek utraty możliwości utrzymania temperatury.","q":{"mcq":{"prompt":"Co ile godzin sprawdza się temperaturę przy przewozie w temperaturze kontrolowanej?","options":["Co 1-2 h","Co 4-6 h","Co 12 h"],"correct":"Co 4-6 h"},"scenario":{"prompt":"Przewozisz nadtlenek organiczny w temperaturze kontrolowanej. Ile czujników ma termometr?","options":["1","2","4"],"correct":"2"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-temp-kontrolowana@adr-2025"},{"id":"b2-un-pozycje","block":2,"topic":"Klasyfikacja","kind":"fact","scope":"podstawowy","adrRef":"ADR 3.1.2","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match","scenario"],"why":"Numer UN (nazywany też numerem ONZ) to czterocyfrowy numer rozpoznawczy. Może być przypisany do JEDNEJ substancji, np. UN 1090 ACETON, albo do POZYCJI GRUPOWEJ — kilku towarów o podobnych właściwościach, np. UN 1263 FARBA.","q":{"mcq":{"prompt":"UN 1263 FARBA to przykład:","options":["Jednej substancji","Pozycji grupowej","Numeru zagrożenia"],"correct":"Pozycji grupowej"},"match":{"prompt":"Dopasuj numer UN do typu pozycji:","pairs":{"UN 1090 ACETON":"jedna substancja","UN 1263 FARBA":"pozycja grupowa"}},"scenario":{"prompt":"Numer UN nazywany jest również numerem:","options":["Kemlera","ONZ","rozpoznawczym zagrożenia"],"correct":"ONZ"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-un-pozycje@adr-2025"},{"id":"b2-zagrozenie-dodatkowe","block":2,"topic":"Klasyfikacja","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.1.1.2","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Zagrożenie dodatkowe określane jest kodem literowym, np. F — palne, T — trujące. Jest to DRUGA nalepka w dokumencie przewozowym (kod klasyfikacyjny).","q":{"mcq":{"prompt":"Litera F w kodzie klasyfikacyjnym oznacza:","options":["Palne","Trujące","Żrące"],"correct":"Palne"},"match":{"prompt":"Dopasuj kod literowy do zagrożenia:","pairs":{"F":"palne","T":"trujące"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-zagrozenie-dodatkowe@adr-2025"},{"id":"b2-zagrozenie-dominujace","block":2,"topic":"Klasyfikacja","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.1.3.10","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Zagrożenie dominujące przypisuje towar do jednej z 13 klas (licząc podklasy osobno) — jest to PIERWSZA nalepka. Nazwę klasy można znaleźć powyżej każdej z nalepek w instrukcji pisemnej. Klasa 2 (gazy) ma kilka nalepek.","q":{"mcq":{"prompt":"Zagrożenie dominujące określa:","options":["Druga nalepkę w dokumencie","Pierwsza nalepkę — przypisanie do klasy","Grupę pakowania"],"correct":"Pierwsza nalepkę — przypisanie do klasy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b2-zagrozenie-dominujace@adr-2025"},{"id":"b3-numer-zagrozenia-90","block":3,"topic":"Materiały zagrażające środowisku","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"adr-2025","page":null,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Numer rozpoznawczy zagrożenia (górny numer na tablicy pomarańczowej) dla materiałów zagrażających środowisku UN 3077 i UN 3082 to 90. Należy do znaczeń specjalnych.","q":{"mcq":{"prompt":"Jaki numer rozpoznawczy zagrożenia mają materiały zagrażające środowisku UN 3077 i UN 3082?","options":["90","99","X80"],"correct":"90"},"fill":{"prompt":"Numer rozpoznawczy zagrożenia dla materiału zagrażającego środowisku (UN 3077 / 3082) to ___.","correct":"90","hint":"dwie cyfry, znaczenie specjalne"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-numer-zagrozenia-90"},{"id":"b3-obowiazek-srodowisko","block":3,"topic":"Obowiązek ochrony środowiska","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.4.1 / 7.5.1","source":"adr-2025","page":null,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Każdy uczestnik przewozu ma obowiązek podejmować środki zapobiegające szkodzie w środowisku podczas przewozu, załadunku i rozładunku. To ogólna zasada — niezależnie od tego, czy doszło do wycieku.","q":{"mcq":{"prompt":"Kiedy kierowca ma obowiązek chronić środowisko przed skażeniem towarem niebezpiecznym?","options":["Przez cały czas przewozu, załadunku i rozładunku","Tylko po wycieku","Tylko przy materialach klasy 9"],"correct":"Przez cały czas przewozu, załadunku i rozładunku"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-obowiazek-srodowisko"},{"id":"b3-odpady-dokument","block":3,"topic":"Odpady","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1.1.3","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Słowo ODPAD powinno się znaleźć po numerze UN, np. UN 1230 odpad metanol 3 (6.1) II, (D/E).","q":{"mcq":{"prompt":"Gdzie w dokumencie przewozowym umieszcza się słowo ODPAD?","options":["Na końcu zapisu","Po numerze UN, przed nazwa","W osobnej rubryce"],"correct":"Po numerze UN, przed nazwa"},"scenario":{"prompt":"Prawidłowy zapis odpadu w dokumencie to:","options":["UN 1230 metanol odpad","UN 1230 odpad metanol 3 (6.1) II, (D/E)","odpad UN 1230 metanol"],"correct":"UN 1230 odpad metanol 3 (6.1) II, (D/E)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-odpady-dokument@adr-2025"},{"id":"b3-odpady-klasyfikacja","block":3,"topic":"Odpady","kind":"fact","scope":"podstawowy","adrRef":"ADR 2.1.3 / 5.4.1.1.3","source":"adr-2025","page":null,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Odpad podlega ADR, jeśli spełnia kryteria którejś z klas zagrożenia. W dokumencie przed nazwę wpisuje się słowo ODPAD (np. UN 1230 ODPAD METANOL). Za klasyfikację odpowiada nadawca/producent, a NIE kierowca.","q":{"mcq":{"prompt":"Kiedy odpad podlega przepisom ADR?","options":["Gdy spełnia kryteria którejś z klas zagrożenia ADR","Zawsze — każdy odpad","Nigdy — odpady są wyłączone z ADR"],"correct":"Gdy spełnia kryteria którejś z klas zagrożenia ADR"},"scenario":{"prompt":"Kto odpowiada za sklasyfikowanie odpadu jako towaru niebezpiecznego ADR?","options":["Nadawca / producent odpadu","Kierowca podczas załadunku","Odbiorca po dostawie"],"correct":"Nadawca / producent odpadu"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-odpady-klasyfikacja"},{"id":"b3-odpady-tablica","block":3,"topic":"Odpady","kind":"fact","scope":"podstawowy","adrRef":"przepisy krajowe","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Oznakowanie pojazdów przewożących ODPADY w Polsce zawiera tylko jedna tablice ODPADY 30 x 40 cm z przodu pojazdu. NIE jest wymagane przy przewozie odpadów sklasyfikowanych jako ADR. W transporcie międzynarodowym odpadów sklasyfikowanych jako ADR używamy oznakowania ADR i \"A\" z przodu i z tyłu jednostki (Niemcy, Austria, Czechy).","q":{"mcq":{"prompt":"Tablica ODPADY w Polsce ma wymiary i umieszczenie:","options":["30 x 40 cm, z przodu pojazdu","40 x 30 cm, z tyłu","30 x 40 cm, z obu stron"],"correct":"30 x 40 cm, z przodu pojazdu"},"match":{"prompt":"Dopasuj oznakowanie odpadów:","pairs":{"Polska":"tablica ODPADY 30x40 z przodu","Niemcy, Austria, Czechy":"znak \"A\" z przodu i tyłu"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-odpady-tablica@adr-2025"},{"id":"b3-srodowisko-wyciek","block":3,"topic":"Obowiązek ochrony środowiska","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.4.1","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","mcq"],"why":"Przy wycieku materiału zagrażającego środowisku kierowca ma, o ile to bezpieczne, ograniczyć skażenie: zatrzymać wyciek u źródła, nie dopuścić do przedostania się substancji do kanalizacji, rowów, cieków wodnych. Nie spłukiwać wodą do studzienek — to roznosi skażenie.","q":{"scenario":{"prompt":"Z pojazdu wycieka substancja szkodliwa dla środowiska w pobliżu kratki kanalizacyjnej. Co robisz?","options":["Spłukuję wodą do kratki","Zabezpieczam kratkę i tamuję wyciek, o ile to bezpieczne","Czekam aż wsiąknie w ziemię"],"correct":"Zabezpieczam kratkę i tamuję wyciek, o ile to bezpieczne"},"mcq":{"prompt":"Czego NIE wolno robić przy wycieku substancji groźnej dla środowiska?","options":["Tamować wycieku u źródła","Spłukiwać jej wodą do kanalizacji","Zabezpieczać studzienek"],"correct":"Spłukiwać jej wodą do kanalizacji"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-srodowisko-wyciek"},{"id":"b3-srodowisko-znak-ryba","block":3,"topic":"Obowiązek ochrony środowiska","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.2.1.8","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Materiały zagrażające środowisku wodnemu oznacza się znakiem: ryba i drzewo (martwa ryba i uschnięte drzewo) na białym tle. Znak ostrzega, że substancja jest niebezpieczna dla organizmów wodnych i środowiska — wymaga szczególnej ostrożności przy wycieku.","q":{"mcq":{"prompt":"Jaki symbol oznacza materiał zagrażający środowisku wodnemu?","options":["Płomień","Martwa ryba i uschnięte drzewo","Czaszka"],"correct":"Martwa ryba i uschnięte drzewo"},"scenario":{"prompt":"Na sztuce przesyłki widzisz znak z rybą i drzewem. O czym Cię ostrzega?","options":["Towar łatwopalny","Towar groźny dla środowiska wodnego","Towar radioaktywny"],"correct":"Towar groźny dla środowiska wodnego"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-srodowisko-znak-ryba"},{"id":"b3-un-srodowisko","block":3,"topic":"Materiały zagrażające środowisku","kind":"fact","scope":"podstawowy","adrRef":"ADR 3.2.1","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Materiał zagrażający środowisku: stan stały UN 3077, stan ciekły UN 3082. Należą do klasy 9.","q":{"match":{"prompt":"Dopasuj stan skupienia do numeru UN:","pairs":{"Stały":"UN 3077","Ciekły":"UN 3082"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-un-srodowisko@adr-2025"},{"id":"b3-wyciek-sekwencja","block":3,"topic":"Reakcja na wyciek","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["order","scenario"],"why":"Kolejność przy wycieku (o ile bezpieczne): 1) zatrzymać pojazd w bezpiecznym miejscu i wyłączyć silnik, 2) zabezpieczyć teren i ostrzec innych, 3) ograniczyć wyciek u źródła i nie dopuścić do kanalizacji, 4) powiadomić służby (112) podając dane z tablicy. Życie ludzkie ma pierwszeństwo przed ochroną mienia i środowiska.","q":{"order":{"prompt":"Ułóż kolejność reakcji na wyciek:","items":["Ograniczyć wyciek u źródła","Zatrzymać pojazd i wyłączyć silnik","Powiadomić służby (112)","Zabezpieczyć teren i ostrzec innych"],"correct":["Zatrzymać pojazd i wyłączyć silnik","Zabezpieczyć teren i ostrzec innych","Ograniczyć wyciek u źródła","Powiadomić służby (112)"]},"scenario":{"prompt":"Zauważasz wyciek w trasie. Co jest bezwzględnie ważniejsze niż ratowanie ładunku?","options":["Zdążyć na rozładunek","Bezpieczeństwo ludzi","Uniknięcie mandatu"],"correct":"Bezpieczeństwo ludzi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-wyciek-sekwencja"},{"id":"b3-wyciek-srodowisko","block":3,"topic":"Reakcja na wyciek","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Jeżeli jest to właściwe i bezpieczne, zapobiec przedostaniu się uwolnionych materiałów do środowiska wodnego lub kanalizacji oraz zebrać uwolnione materiały, używając wyposażenia przewożonego w jednostce transportowej (osłona otworów kanalizacyjnych, łopata, pojemnik).","q":{"scenario":{"prompt":"Wyciek płynu w pobliżu studzienki kanalizacyjnej. Pierwsza reakcja:","options":["Spłukać woda do kanalizacji","Użyć osłony otworów kanalizacyjnych i zebrać materiał","Zostawić do wyschnięcia"],"correct":"Użyć osłony otworów kanalizacyjnych i zebrać materiał"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-wyciek-srodowisko@adr-2025"},{"id":"b3-znak-srodowisko","block":3,"topic":"Materiały zagrażające środowisku","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.2.1.8.1","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Znak wymagany dla materiałów zagrażających środowisku (ryba i drzewo). Umieszcza się go na opakowaniach większych niż 5 kg lub 5 litrów. Zagrożenie w przypadku przedostania się do środowiska wodnego lub kanalizacji.","q":{"mcq":{"prompt":"Znak \"ryba i drzewo\" umieszcza się na opakowaniach większych niż:","options":["1 kg lub 1 litr","5 kg lub 5 litrów","30 kg lub 30 litrów"],"correct":"5 kg lub 5 litrów"},"fill":{"prompt":"Znak materiału zagrażającego środowisku przedstawia rybę i ___.","correct":"drzewo","hint":"roslina"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-znak-srodowisko@adr-2025"},{"id":"b3-znak-temperatura","block":3,"topic":"Materiały zagrażające środowisku","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.2.1.8.1","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Znak dla towarów w podwyższonej temperaturze (czerwony trójkąt z termometrem): materiały stałe powyżej 240 st. C, ciekłe powyżej 100 st. C. Zagrożenie poparzeniem. Wskazówka: unikać kontaktu z gorącymi częściami jednostki transportowej i z uwolnionym materiałem.","q":{"mcq":{"prompt":"Znak z termometrem w czerwonym trójkącie oznacza:","options":["Materiał zagrażający środowisku","Materiał w podwyższonej temperaturze","Materiał promieniotworczy"],"correct":"Materiał w podwyższonej temperaturze"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b3-znak-temperatura@adr-2025"},{"id":"b4-austria-eskorta","block":4,"topic":"Decyzja o tunelu","kind":"ref","scope":"podstawowy","adrRef":"wymogi krajowe","source":"kompendium","page":24,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"W niektórych krajach wymaga się dodatkowych wymogów, np. w Austrii jednostka transportową powinna być wyposażona w lampę o świetle pomarańczowym. Jednostki, których oznakowanie na tablicy rozpoczyna się od cyfry 2 lub zawierające podwojne cyfry 3, 4, 5, 6, 8 lub poprzedzone litera X wymagaja eskorty podczas przejazdu przez tunele.","q":{"mcq":{"prompt":"W Austrii jednostka transportową z ADR powinna być wyposażona w:","options":["Lampę o świetle pomarańczowym","Radio CB","Kamerę cofania"],"correct":"Lampę o świetle pomarańczowym"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-austria-eskorta@adr-2025"},{"id":"b4-certyfikat-pakowania","block":4,"topic":"Praca z dokumentem","kind":"ref","scope":"podstawowy","adrRef":"ADR 5.4.2","source":"kompendium","page":14,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Certyfikat pakowania kontenera/pojazdu wymagany jest przed załadunkiem, który poprzedza przewóz MORSKI. Może być elementem dokumentu MULTIMODAL DANGEROUS GOODS FORM lub DGN.","q":{"mcq":{"prompt":"Certyfikat pakowania kontenera wymagany jest przed przewozem:","options":["Drogowym","Morskim","Kolejowym"],"correct":"Morskim"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-certyfikat-pakowania@adr-2025"},{"id":"b4-cv2-plomien","block":4,"topic":"Decyzja o załadunku","kind":"fact","scope":"podstawowy","adrRef":"ADR CV2 / 7.5.11","source":"kompendium","page":24,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Przed dokonaniem załadunku powierzchnia ładunkowa pojazdu lub kontenera powinna zostać dokładnie oczyszczona. Zabrania się używania otwartego płomienia wewnątrz pojazdu lub kontenera oraz w ich pobliżu, a także podczas załadunku i rozładunku (przepis szczególny CV2 — 7.5.11).","q":{"mcq":{"prompt":"Przed załadunkiem powierzchnia ładunkowa powinna być:","options":["Sucha","Dokładnie oczyszczona","Wyłożona folia"],"correct":"Dokładnie oczyszczona"},"scenario":{"prompt":"Załadunek towaru ADR. Czy można używać otwartego płomienia w pobliżu pojazdu?","options":["Tak, poza kabina","Nie — zakaz wg CV2","Tylko przy klasie 9"],"correct":"Nie — zakaz wg CV2"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-cv2-plomien@adr-2025"},{"id":"b4-cv28-zywnosc","block":4,"topic":"Decyzja o załadunku","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.5.4 / CV28","source":"kompendium","page":24,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match","scenario"],"why":"Jeżeli w kolumnie 18 tabeli wskazany jest przepis szczególny CV28, towar należy oddzielić od żywności lub karmy dla zwierząt: (a) ciągłymi przegrodami o wysokości nie mniejszej niż sztuki przesyłek oznaczone nalepkami 6.1, 6.2, 9; (b) sztukami przesyłek, które NIE są zaopatrzone w nalepki 6.1, 6.2, 9; (c) wolna przestrzenią o szerokości nie mniej niż 0,8 m lub przez całkowite przykrycie (plandeka, pokrywa z tektury). Dotyczy UN 2212, 2315, 2590, 3151, 3152, 3245.","q":{"mcq":{"prompt":"Minimalna szerokość wolnej przestrzeni oddzielającej towar od żywności (CV28):","options":["0,5 m","0,8 m","1,2 m"],"correct":"0,8 m"},"match":{"prompt":"Dopasuj sposób oddzielenia od żywności wg CV28:","pairs":{"Ciągle przegrody":"wysokość nie mniejsza niż sztuki przesyłek","Wolna przestrzeń":"min. 0,8 m","Całkowite przykrycie":"plandeka lub pokrywa"}},"scenario":{"prompt":"Przewozisz UN 2212 (azbest) i artykuły spozywcze. Co robisz?","options":["Ładuje razem bez ograniczeń","Oddzielam wg CV28 — przegroda lub 0,8 m wolnej przestrzeni","Odmawiam przewozu"],"correct":"Oddzielam wg CV28 — przegroda lub 0,8 m wolnej przestrzeni"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-cv28-zywnosc@adr-2025"},{"id":"b4-cv3-cv15","block":4,"topic":"Decyzja o załadunku","kind":"ref","scope":"podstawowy","adrRef":"ADR CV3 / CV15","source":"kompendium","page":24,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Przepisy dotyczące manipulowania i układania wprowadzają ograniczenie masy ładunku na jednostkę transportową (na \"otwartych tablicach\"). Dotyczy towarów klasy 1, 4.1, 5.2 (samoreaktywne, nadtlenki organiczne typu B, C, D, E, F), które mają właściwości wybuchowe. Ograniczenia zawarte w przepisach CV3 i CV15.","q":{"mcq":{"prompt":"Ograniczenie masy ładunku na jednostkę transportową zawierają przepisy:","options":["CV2 i CV28","CV3 i CV15","S1 i S3"],"correct":"CV3 i CV15"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-cv3-cv15@adr-2025"},{"id":"b4-cysterna-wielokomorowa","block":4,"topic":"Oznakowanie pojazdu w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.1.3","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Dla numerów UN 1202, UN 1203, UN 1223, UN 1268, UN 1863 można oznakować cysternę wielokomorowa tak, jakby wiozła jeden produkt — najniebezpieczniejszy z przewożonych.","q":{"mcq":{"prompt":"Cysternę wielokomorowa z UN 1202 i UN 1203 można oznakować:","options":["Osobno każda komore","Jak jeden produkt — najniebezpieczniejszy z przewożonych","Bez tablic"],"correct":"Jak jeden produkt — najniebezpieczniejszy z przewożonych"},"scenario":{"prompt":"Cysterna wielokomorowa: olej napędowy (UN 1202) i benzyna (UN 1203). Jakie oznakowanie?","options":["Dwie różne tablice","Tablica dla benzyny — najniebezpieczniejszej","Tablica dla oleju"],"correct":"Tablica dla benzyny — najniebezpieczniejszej"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-cysterna-wielokomorowa@adr-2025"},{"id":"b4-dokument-jezyk","block":4,"topic":"Praca z dokumentem","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.1.4.1","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Dokument przewozowy sporządza się w języku kraju nadania, a w transporcie międzynarodowym również w języku angielskim lub niemieckim lub francuskim. Dokument przewozowy należy przechowywać 3 miesiące.","q":{"mcq":{"prompt":"W transporcie międzynarodowym dokument przewozowy sporządza się dodatkowo w języku:","options":["Tylko angielskim","Angielskim lub niemieckim lub francuskim","Dowolnym"],"correct":"Angielskim lub niemieckim lub francuskim"},"fill":{"prompt":"Dokument przewozowy należy przechowywać ___ miesiące.","correct":"3","hint":"liczba"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-dokument-jezyk@adr-2025"},{"id":"b4-dokument-kto","block":4,"topic":"Praca z dokumentem","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.1","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Za dokument przewozowy odpowiedzialny jest NADAWCA. Dokument powinien być sporządzony w języku kraju nadania, a w transporcie międzynarodowym również w języku angielskim lub niemieckim lub francuskim. Nie musi być sporządzony pismem maszynowym ani wydrukowany.","q":{"mcq":{"prompt":"Kto odpowiada za dokument przewozowy?","options":["Przewoźnik","Nadawca","Kierowca"],"correct":"Nadawca"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-dokument-kto@adr-2025"},{"id":"b4-dokument-zapisy","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1.1","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Zapisy specjalne w dokumencie: \"Przewóz zgodny z 1.1.4.2.1\" — przewóz multimodalny; \"ODPAD\" po numerze UN; \"próżny DPPL, 8\" — próżne opakowania z numerem nalepki; \"GORĄCY\" gdy nazwa nie zawiera PODWYŻSZONA TEMPERATURA lub STOPIONY; \"ZAGRAŻAJĄCY ŚRODOWISKU\" gdy spełnia kryteria (nie stosuje się do UN 3077 i UN 3082).","q":{"match":{"prompt":"Dopasuj zapis w dokumencie do sytuacji:","pairs":{"Przewóz zgodny z 1.1.4.2.1":"przewóz multimodalny","próżny DPPL, 8":"próżne opakowanie","GORĄCY":"materiał w podwyższonej temperaturze"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-dokument-zapisy@adr-2025"},{"id":"b4-dokument-zawartosc","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1.1.1","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["order","scenario"],"why":"Kolejność zapisu w dokumencie przewozowym: numer UN, prawidłowa nazwa przewozowa, numery nalepek, grupa pakowania (GP), kod tunelu. Przykład: UN 1203 Benzyna Silnikowa zagrażający środowisku, 3, II, (D/E).","q":{"order":{"prompt":"Ulóz kolejność zapisu w dokumencie przewozowym:","items":["Numery nalepek","Numer UN","Prawidłowa nazwa przewozowa","Grupa pakowania"],"correct":["Numer UN","Prawidłowa nazwa przewozowa","Numery nalepek","Grupa pakowania"]},"scenario":{"prompt":"W dokumencie: UN 1580 CHLOROPIKRYNA 6.1 GP I. Co to mówi kierowcy?","options":["Materiał zapalny, małe zagrożenie","Materiał trujący, silnie (I grupa pakowania)","Gaz duszący"],"correct":"Materiał trujący, silnie (I grupa pakowania)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-dokument-zawartosc@adr-2025"},{"id":"b4-duze-ryzyko-cel","block":4,"topic":"Towary dużego ryzyka","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.10","source":"kompendium","page":25,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Ochrona towarów ma na celu zminimalizowanie ryzyka kradzieży oraz użycia ich niezgodnie z przeznaczeniem. W szczególności zapobieżenie kradzieży pojazdów, kradzieży towarów, zamachom na zaparkowane pojazdy.","q":{"mcq":{"prompt":"Celem ochrony towarów dużego ryzyka (dział 1.10) jest:","options":["Ochrona przed pozarem","Minimalizacja ryzyka kradzieży i użycia niezgodnie z przeznaczeniem","Ochrona środowiska"],"correct":"Minimalizacja ryzyka kradzieży i użycia niezgodnie z przeznaczeniem"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-duze-ryzyko-cel@adr-2025"},{"id":"b4-duze-ryzyko-progi","block":4,"topic":"Towary dużego ryzyka","kind":"ref","scope":"podstawowy","adrRef":"ADR 1.10.3.1","source":"kompendium","page":26,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Progi towarów dużego ryzyka: klasa 1 (1.1, 1.2, 1.3) — każda ilość w sztukach; gazy palne nietrujące (F, FC) — cysterna 3000 l; gazy trujące (T, TF, TC, TO, TFC, TOC) — każda ilość; klasa 3 GP I i II — cysterna 3000 l; klasa 6.1 GP I — każda ilość; klasa 8 GP I — cysterna 3000 l.","q":{"match":{"prompt":"Dopasuj towar do progu dużego ryzyka (cysterna):","pairs":{"Gazy palne nietrujące (F, FC)":"3000 l","Materiały zapalne ciekłe GP I i II":"3000 l","Materiały żrące GP I":"3000 l"}},"mcq":{"prompt":"Materiały trujące I grupy pakowania (6.1) są towarem dużego ryzyka w ilości:","options":["Powyżej 3000 l","Każda ilość","Powyżej 1000 kg"],"correct":"Każda ilość"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-duze-ryzyko-progi@adr-2025"},{"id":"b4-gasnice-liczba","block":4,"topic":"Dobór gaśnic","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.4","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Minimalna liczba gaśnic na jednostce transportowej wynosi 2 — niezależnie od dopuszczalnej masy całkowitej. Jedna gaśnica 12 kg NIE wystarczy: zawsze muszą być co najmniej dwie.","q":{"mcq":{"prompt":"Minimalna liczba gaśnic na jednostce transportowej z towarem ADR wynosi:","options":["1","2","3"],"correct":"2"},"scenario":{"prompt":"Masz jedna gaśnice 12 kg na zestawie 40 t. Czy to spełnia wymóg?","options":["Tak, pojemność się zgadza","Nie — muszą być minimum 2 gaśnice","Tak, jeśli ma aktualny przegląd"],"correct":"Nie — muszą być minimum 2 gaśnice"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-gasnice-liczba@adr-2025"},{"id":"b4-gasnice-pojemnosc","block":4,"topic":"Dobór gaśnic","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.4","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match","scenario"],"why":"Minimalna całkowita pojemność gaśnic wg dopuszczalnej masy całkowitej jednostki transportowej: do 3,5 t = 4 kg; powyżej 3,5 do 7,5 t = 8 kg; powyżej 7,5 t = 12 kg. Gaśnice muszą być typu ABC.","q":{"mcq":{"prompt":"Min. łączna pojemność gaśnic dla jednostki powyżej 7,5 t:","options":["4 kg","8 kg","12 kg"],"correct":"12 kg"},"match":{"prompt":"Dopasuj masę jednostki do min. łącznej pojemności gaśnic:","pairs":{"do 3,5 t":"4 kg","3,5-7,5 t":"8 kg","powyżej 7,5 t":"12 kg"}},"scenario":{"prompt":"Zestaw 40 t z towarem ADR. Min. łączna pojemność gaśnic:","options":["8 kg","12 kg","6 kg"],"correct":"12 kg"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-gasnice-pojemnosc@adr-2025"},{"id":"b4-gasnice-rozklad","block":4,"topic":"Dobór gaśnic","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.1.4.1","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Rozkład gaśnic: co najmniej jedna gaśnica do gaszenia pożaru silnika lub kabiny o minimalnej pojemności 2 kg (dla każdej kategorii masy). Wymagana gaśnica dodatkowa: min. 2 kg dla jednostki do 3,5 t; min. 6 kg dla jednostki powyżej 3,5 t.","q":{"match":{"prompt":"Dopasuj masę jednostki do min. pojemności gaśnicy DODATKOWEJ:","pairs":{"do 3,5 t":"2 kg","powyżej 3,5 t":"6 kg"}},"mcq":{"prompt":"Gaśnica do gaszenia pożaru silnika lub kabiny musi mieć min. pojemność:","options":["2 kg","6 kg","12 kg"],"correct":"2 kg"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-gasnice-rozklad@adr-2025"},{"id":"b4-gasnice-s3","block":4,"topic":"Dobór gaśnic","kind":"skill","scope":"podstawowy","adrRef":"ADR przepis S3","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Zgodnie z przepisem S3 dla towarów klasy 6.2 (zakaźne) niezależnie od DMC pojazdu wystarczy gaśnica 2 kg typu ABC, a latarka może być o dowolnej konstrukcji.","q":{"mcq":{"prompt":"Dla towarów klasy 6.2 (zakaźne) wg przepisu S3 wystarczy gaśnica:","options":["2 kg ABC niezależnie od DMC","12 kg","6 kg"],"correct":"2 kg ABC niezależnie od DMC"},"scenario":{"prompt":"Wieziesz odpady medyczne (6.2) zestawem 20 t. Ile gaśnicy potrzebujesz wg S3?","options":["12 kg jak dla każdego zestawu","Wystarczy 2 kg ABC","8 kg"],"correct":"Wystarczy 2 kg ABC"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-gasnice-s3@adr-2025"},{"id":"b4-instrukcje-forma","block":4,"topic":"Praca z dokumentem","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.3","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Instrukcje pisemne zawierają: sprzet ochrony ogólnej i indywidualnej, czynności w razie wypadku lub awarii, charakterystyke zagrożeń, wzory nalepek. Muszą być dostępne w języku zrozumiałym dla załogi, przechowywane w kabinie kierowcy w łatwo dostepnym miejscu, wydrukowane W KOLORZE. Po zakończeniu transportu powinny pozostać w pojeździe. Wymagane tylko na \"otwartych tablicach\".","q":{"mcq":{"prompt":"Instrukcje pisemne muszą być wydrukowane:","options":["Czarno-bialo","W kolorze","Dowolnie"],"correct":"W kolorze"},"match":{"prompt":"Dopasuj zawartość instrukcji pisemnej:","pairs":{"Sprzet ochrony":"wyposażenie 8.1.5","Czynności w razie wypadku":"procedura awaryjna","Wzory nalepek":"charakterystyka zagrożeń"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-instrukcje-forma@adr-2025"},{"id":"b4-instrukcje-kto","block":4,"topic":"Praca z dokumentem","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.3","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Za instrukcje pisemne odpowiedzialny jest PRZEWOŹNIK. Instrukcje są zgodne ze wzorem zawartym w umowie ADR i uniwersalne — dla każdego produktu takie same. Należy się z nimi zapoznać przed rozpoczęciem transportu.","q":{"mcq":{"prompt":"Kto odpowiada za instrukcje pisemne?","options":["Nadawca","PRZEWOŹNIK","Kierowca"],"correct":"PRZEWOŹNIK"},"scenario":{"prompt":"Instrukcje pisemne dla przewozu benzyny i dla przewozu kwasu są:","options":["Różne","Takie same — wzór uniwersalny","Zależne od nadawcy"],"correct":"Takie same — wzór uniwersalny"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-instrukcje-kto@adr-2025"},{"id":"b4-kontener-cysterna","block":4,"topic":"Oznakowanie pojazdu w praktyce","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.3.1.3","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Kontener-cysterna powinien być oznakowany nalepkami ostrzegawczymi z 4 stron.","q":{"mcq":{"prompt":"Kontener-cysterna oznakowany jest nalepkami z:","options":["2 stron","3 stron","4 stron"],"correct":"4 stron"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-kontener-cysterna@adr-2025"},{"id":"b4-kontrola","block":4,"topic":"Towary dużego ryzyka","kind":"fact","scope":"podstawowy","adrRef":"art. 99 ustawy","source":"kompendium","page":26,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Kontrola przewozu zgodnie z art. 99 ustawy o transporcie towarów niebezpiecznych może być przeprowadzana na drogach i parkingach przez: inspektorów Inspekcji Transportu Drogowego, funkcjonariuszy Policji, Straży Granicznej, Służb Celnych oraz żołnierzy Żandarmerii Wojskowej (w zakresie przewozu wykonywanego przez siły zbrojne).","q":{"mcq":{"prompt":"Kto NIE może kontrolować przewozu ADR na drodze?","options":["ITD","Straż Pożarna","Policja"],"correct":"Straż Pożarna"},"scenario":{"prompt":"Żandarmeria Wojskowa może kontrolować Twój przewóz ADR:","options":["Zawsze","Tylko w zakresie przewozu wykonywanego przez siły zbrojne","Nigdy"],"correct":"Tylko w zakresie przewozu wykonywanego przez siły zbrojne"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-kontrola@adr-2025"},{"id":"b4-ladunek-calkowity","block":4,"topic":"Decyzja o załadunku","kind":"ref","scope":"podstawowy","adrRef":"ADR 1.2.1","source":"kompendium","page":24,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Ładunek całkowity oznacza ładunek pochodzący od jednego nadawcy, mającego wyłączne prawo do używania pojazdu lub kontenera wielkiego, a wszystkie czynności załadunkowe i rozładunkowe wykonywane są zgodnie z instrukcjami nadawcy lub odbiorcy. W odniesieniu do materiałów promieniotwórczych odpowiednim określeniem jest \"używanie wyłączne\".","q":{"mcq":{"prompt":"W odniesieniu do materiałów promieniotwórczych \"ładunek całkowity\" nazywa się:","options":["Przewóz dedykowany","Używanie wyłączne","Transport zamknięty"],"correct":"Używanie wyłączne"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-ladunek-calkowity@adr-2025"},{"id":"b4-lopata-oslona","block":4,"topic":"Dobór wyposażenia","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.5.3","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Łopata, osłona otworów kanalizacyjnych i pojemnik do zbierania pozostałości są wymagane TYLKO dla nalepek 3, 4.1, 4.3, 8 lub 9. Niezależnie od ilości członków załogi — tylko 1 sztuka w pojeździe.","q":{"mcq":{"prompt":"Łopata, osłona kanalizacji i pojemnik wymagane są przy nalepkach:","options":["2.3 i 6.1","3, 4.1, 4.3, 8 lub 9","Wszystkich"],"correct":"3, 4.1, 4.3, 8 lub 9"},"scenario":{"prompt":"Załoga 2 osoby, przewóz klasy 3. Ile łopat?","options":["Dwie","Jedna — niezależnie od liczby załogi","Żadna"],"correct":"Jedna — niezależnie od liczby załogi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-lopata-oslona@adr-2025"},{"id":"b4-maska-ucieczkowa","block":4,"topic":"Dobór wyposażenia","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.5.3","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Maska ucieczkowa dla KAŻDEGO członka załogi pojazdu powinna być przewożona w jednostce transportowej w przypadku nalepek ostrzegawczych 2.3 lub 6.1.","q":{"mcq":{"prompt":"Maska ucieczkowa wymagana jest przy nalepkach:","options":["3 i 8","2.3 lub 6.1","4.1 i 9"],"correct":"2.3 lub 6.1"},"scenario":{"prompt":"Przewozisz gaz trujący (2.3), załoga 2 osoby. Ile masek ucieczkowych?","options":["Jedna","Dwie — na każdego członka załogi","Żadna"],"correct":"Dwie — na każdego członka załogi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-maska-ucieczkowa@adr-2025"},{"id":"b4-nadzor-parkingi","block":4,"topic":"Ruch drogowy i postoj","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.4 / S1(6), S14-S24","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","order"],"why":"Pojazdy przewożące towary niebezpieczne w ilościach podanych w przepisach specjalnych S1(6) i S14 do S24 powinny być nadzorowane lub mogą być zaparkowane bez nadzoru na parkingach strzeżonych lub strzeżonych miejscach na terenie przedsiębiorstwa. W razie braku takich warunków: (a) parking nadzorowany przez personel poinformowany o właściwościach ładunku i miejscu pobytu kierowcy; (b) parking gdzie pojazd nie jest narażony na uszkodzenie; (c) miejsce na otwartym terenie, oddzielone od głównych dróg i budynków mieszkalnych.","q":{"mcq":{"prompt":"Pojazd z towarami wg S1(6) i S14-S24 może być zaparkowany bez nadzoru:","options":["Na każdym parkingu","Na parkingu strzeżonym lub strzeżonym miejscu na terenie przedsiębiorstwa","Tylko przy drodze"],"correct":"Na parkingu strzeżonym lub strzeżonym miejscu na terenie przedsiębiorstwa"},"order":{"prompt":"Ulóz alternatywy postoju wg kolejności z przepisów (a, b, c):","items":["Otwarty teren z dala od dróg i budynków","Parking nadzorowany przez poinformowany personel","Parking gdzie pojazd nie jest narażony na uszkodzenie"],"correct":["Parking nadzorowany przez poinformowany personel","Parking gdzie pojazd nie jest narażony na uszkodzenie","Otwarty teren z dala od dróg i budynków"]}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-nadzor-parkingi@adr-2025"},{"id":"b4-oznakowanie-luzem-cysterna","block":4,"topic":"Oznakowanie pojazdu w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.1 / 5.3.2","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Jednostki przewożące towary LUZEM lub W CYSTERNIE powinny być oznakowane tablicami Z NUMERAMI z przodu i tyłu jednostki transportowej oraz nalepkami z TRZECH stron — z obu boków oraz z tyłu.","q":{"mcq":{"prompt":"Pojazd przewożący towar luzem lub w cysternie oznakowuje się nalepkami:","options":["Z dwóch stron","Z trzech stron — oba boki i tył","Z czterech stron"],"correct":"Z trzech stron — oba boki i tył"},"scenario":{"prompt":"Cysterna z olejem napędowym. Gdzie tablice z numerami?","options":["Tylko z przodu","Z przodu i tyłu jednostki","Na bokach"],"correct":"Z przodu i tyłu jednostki"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-oznakowanie-luzem-cysterna@adr-2025"},{"id":"b4-oznakowanie-sztuki-pojazd","block":4,"topic":"Oznakowanie pojazdu w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Jednostki przewożące towary niebezpieczne w SZTUKACH PRZESYŁKI (np. butle gazowe, DPPL, kanistry, BIG-BAGi) powinny być oznakowane WYŁĄCZNIE tablicami BEZ numerów z przodu i tyłu pojazdu. NIE stosujemy w takim przypadku nalepek.","q":{"mcq":{"prompt":"Pojazd przewożący towary w sztukach przesyłki oznakowuje się:","options":["Tablicami z numerami","Tablicami bez numerów z przodu i tyłu","Nalepkami z trzech stron"],"correct":"Tablicami bez numerów z przodu i tyłu"},"scenario":{"prompt":"Wieziesz kanistry z farba (sztuki przesyłki). Czy umieszczasz nalepki na pojeździe?","options":["Tak, z obu boków","Nie — przy sztukach przesyłki nalepek nie stosujemy","Tak, z tyłu"],"correct":"Nie — przy sztukach przesyłki nalepek nie stosujemy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-oznakowanie-sztuki-pojazd@adr-2025"},{"id":"b4-oznakowanie-wariant2","block":4,"topic":"Oznakowanie pojazdu w praktyce","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.3.2.1.2","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Drugi sposób oznakowania jednostki przewożącej jeden ładunek luzem lub w cysternie: tablice BEZ numerów z przodu i tyłu pojazdu oraz tablice Z NUMERAMI na obu bokach. Nalepki ostrzegawcze muszą być umieszczone z obu boków i z tyłu pojazdu.","q":{"mcq":{"prompt":"W wariancie drugim oznakowania cysterny tablice z numerami umieszcza się:","options":["Z przodu i tyłu","Na obu bokach","Tylko z tyłu"],"correct":"Na obu bokach"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-oznakowanie-wariant2@adr-2025"},{"id":"b4-pasazerowie","block":4,"topic":"Ruch drogowy i postoj","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.3.1","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"W pojeździe \"na pełnym ADR\" nie wolno przewozić pasażerów, a jedynie członków załogi. Każdy członek załogi musi mieć dokument tożsamości.","q":{"mcq":{"prompt":"Kogo wolno przewozić w pojeździe na pełnym ADR?","options":["Dowolnych pasażerów","Tylko członków załogi","Pasażerów za zgoda nadawcy"],"correct":"Tylko członków załogi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-pasazerowie@adr-2025"},{"id":"b4-plan-ochrony-wymogi","block":4,"topic":"Towary dużego ryzyka","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.10","source":"kompendium","page":26,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Zapamiętaj: plan ochrony WYMAGA legitymowania kierowcy i wykazu osób. NIE WYMAGA specjalnego znakowania przesyłek lub pojazdów, nadzoru GPS ani konwojenta.","q":{"mcq":{"prompt":"Plan ochrony towarów dużego ryzyka NIE wymaga:","options":["Legitymowania kierowcy","Nadzoru GPS i konwojenta","Wykazu osób"],"correct":"Nadzoru GPS i konwojenta"},"scenario":{"prompt":"Przewozisz towar dużego ryzyka. Czy pojazd musi mieć GPS?","options":["Tak, obowiazkowo","Nie — plan ochrony nie wymaga GPS","Tylko przy klasie 1"],"correct":"Nie — plan ochrony nie wymaga GPS"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-plan-ochrony-wymogi@adr-2025"},{"id":"b4-plan-ochrony","block":4,"topic":"Towary dużego ryzyka","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.10.3.2","source":"kompendium","page":25,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Plan ochrony zawiera m.in.: szczegółowy podział obowiązków i wykaz osób, wykaz towarów niebezpiecznych podlegających ochronie, opis czynności i ocenę zagrożeń, plan szkolenia i procedury postępowania, procedury powiadamiania, procedury oceny i testowania planów, działania zapewniające ochronę fizyczna informacji, działania ograniczające dostęp do informacji.","q":{"mcq":{"prompt":"Plan ochrony towarów dużego ryzyka musi zawierać m.in.:","options":["Trasę przejazdu","Wykaz osób i wykaz towarów podlegających ochronie","Numer rejestracyjny"],"correct":"Wykaz osób i wykaz towarów podlegających ochronie"},"match":{"prompt":"Dopasuj element planu ochrony:","pairs":{"Wykaz osób":"podział obowiązków","Plan szkolenia":"procedury postępowania","Ochrona informacji":"ograniczenie dostepu"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-plan-ochrony@adr-2025"},{"id":"b4-plyn-do-oczu","block":4,"topic":"Dobór wyposażenia","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.5.2","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Płyn do płukania oczu NIE jest wymagany przy nalepkach 1, 1.4, 1.5, 1.6, 2.1, 2.2 i 2.3. Płyn to tylko 1 sztuka w pojeździe, niezależnie od ilości członków załogi.","q":{"mcq":{"prompt":"Ile płynu do płukania oczu musi być w pojeździe?","options":["Jedna sztuka niezależnie od liczby załogi","Po jednej na każdego członka załogi","Dwie sztuki"],"correct":"Jedna sztuka niezależnie od liczby załogi"},"scenario":{"prompt":"Przewozisz gazy palne (2.1). Czy potrzebujesz płynu do płukania oczu?","options":["Tak, zawsze","Nie — przy nalepkach 2.1 nie jest wymagany","Tylko przy cysternie"],"correct":"Nie — przy nalepkach 2.1 nie jest wymagany"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-plyn-do-oczu@adr-2025"},{"id":"b4-predkosc","block":4,"topic":"Ruch drogowy i postoj","kind":"skill","scope":"podstawowy","adrRef":"przepisy krajowe","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Dla przewozu towarów niebezpiecznych NIE obowiązuje podwyższenie prędkości w terenie zabudowanym. Maksymalnie 50 km/h.","q":{"mcq":{"prompt":"Maksymalna prędkość pojazdu z towarem ADR w terenie zabudowanym:","options":["50 km/h","60 km/h","70 km/h"],"correct":"50 km/h"},"scenario":{"prompt":"Teren zabudowany, znak dopuszcza 60 km/h. Wieziesz ADR. Ile możesz jechać?","options":["60 km/h","50 km/h — podwyższenie nie obowiązuje przy ADR","70 km/h"],"correct":"50 km/h — podwyższenie nie obowiązuje przy ADR"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-predkosc@adr-2025"},{"id":"b4-segregacja-zakazy","block":4,"topic":"Decyzja o załadunku","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.5.2.1","source":"kompendium","page":25,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Zakazy ładowania razem do jednego pojazdu lub kontenera zawarte są w przepisie 7.5.2.1. W uproszczeniu dotyczą towarów klasy 1 (wybuchowe), 4.1 + 1 (samoreaktywne) oraz 5.2 + 1 (nadtlenki organiczne) o właściwościach wybuchowych.","q":{"mcq":{"prompt":"Zakazy ładowania razem dotyczą w uproszczeniu:","options":["Wszystkich klas","Klasy 1, 4.1+1 i 5.2+1 o właściwościach wybuchowych","Tylko klas 6 i 8"],"correct":"Klasy 1, 4.1+1 i 5.2+1 o właściwościach wybuchowych"},"scenario":{"prompt":"Chcesz załadować razem klasę 3 i klasę 8. Czy wolno?","options":["Nie, zawsze zabronione","Tak — ładowanie razem tych klas jest dozwolone","Tylko w cysternie"],"correct":"Tak — ładowanie razem tych klas jest dozwolone"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-segregacja-zakazy@adr-2025"},{"id":"b4-sprawozdanie-roczne","block":4,"topic":"Praca z dokumentem","kind":"ref","scope":"podstawowy","adrRef":"ADR 1.8.3.6","source":"kompendium","page":15,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Każda firma ładująca, przewożąca, rozładowująca towary niebezpieczne musi wyznaczyć doradcę DGSA. Sporządza on sprawozdanie roczne do ITD, składane do 28 lutego za poprzedni rok. Za niezłożenie sprawozdania kara wynosi 5000 PLN.","q":{"mcq":{"prompt":"Do kiedy składa się sprawozdanie roczne do ITD?","options":["Do 31 stycznia","Do 28 lutego","Do 31 marca"],"correct":"Do 28 lutego"},"fill":{"prompt":"Kara za niezłożenie sprawozdania rocznego wynosi ___ PLN.","correct":"5000","hint":"liczba"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-sprawozdanie-roczne@adr-2025"},{"id":"b4-swiadectwo-typy","block":4,"topic":"Praca z dokumentem","kind":"fact","scope":"podstawowy","adrRef":"ADR 9.1.1.2","source":"kompendium","page":15,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Oznaczenia pojazdów wymagających świadectwa: EX/II i EX/III — przewóz klasy 1 (wybuchowe); FL i AT — cysterny; MEMU — mobilna jednostka do wytwarzania materiałów wybuchowych.","q":{"match":{"prompt":"Dopasuj oznaczenie pojazdu do zastosowania:","pairs":{"EX/II, EX/III":"przewóz klasy 1 (wybuchowe)","FL, AT":"cysterny","MEMU":"mobilna jednostka wytwarzania wybuchowych"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-swiadectwo-typy@adr-2025"},{"id":"b4-swiadectwo","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 9.1.3","source":"kompendium","page":15,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Świadectwo dopuszczenia (tzw. \"czerwony pasek\") wymagane jest przy przewozie towarów klasy 1 (pojazdy EX/II, EX/III) oraz w cysternach (pojazdy FL, AT) i MEMU. Potwierdza specjalna konstrukcje pojazdu. Wydawany w Polsce przez TDT na maksymalny okres JEDNEGO ROKU. Pojazdy przewożące sztuki przesyłki (poza wybuchowymi) i luzem NIE muszą mieć świadectwa — np. butle z gazem, DPPL, kanistry.","q":{"mcq":{"prompt":"Świadectwo dopuszczenia pojazdu wydawane jest na maksymalny okres:","options":["1 roku","5 lat","Bezterminowo"],"correct":"1 roku"},"scenario":{"prompt":"Przewozisz butle z gazem i kanistry (sztuki przesyłki). Czy pojazd potrzebuje \"czerwonego paska\"?","options":["Tak, zawsze przy ADR","Nie — sztuki przesyłki poza klasa 1 nie wymagaja świadectwa","Tylko powyżej 3,5 t"],"correct":"Nie — sztuki przesyłki poza klasa 1 nie wymagaja świadectwa"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-swiadectwo@adr-2025"},{"id":"b4-tunel-brak-kodu","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.9.5 / kol. 15","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Do tunelu kategorii E mogą wjeżdżać pojazdy z towarami, które w kolumnie 15 tabeli A mają \"(-)\" — czyli brak kodu tunelowego. Należą tu m.in. UN 2814, 2900, 2919, 3166, 3171, 3331, 3359, 3373, 3549.","q":{"mcq":{"prompt":"Kod tunelowy \"(-)\" w kolumnie 15 oznacza:","options":["Zakaz wszystkich tuneli","Brak ograniczeń — można wjechać do każdego tunelu","Tylko tunel A"],"correct":"Brak ograniczeń — można wjechać do każdego tunelu"},"scenario":{"prompt":"Wieziesz UN 3373 (kod tunelowy \"-\"). Tunel kategorii E — wjeżdżasz?","options":["Nie, zakaz","Tak — kod \"(-)\" pozwala na każdy tunel","Tylko z eskorta"],"correct":"Tak — kod \"(-)\" pozwala na każdy tunel"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-tunel-brak-kodu@adr-2025"},{"id":"b4-tunel-zachowanie","block":4,"topic":"Decyzja o tunelu","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.6 / przepisy ruchu","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match","scenario"],"why":"W tunelu ZAKAZUJE się: palenia, używania okularów przeciwsłonecznych, używania telefonu komórkowego i radia CB. W tunelu NALEŻY: stosować się do znaków i sygnałów, słuchać komunikatów radiowych, włączyć światła mijania.","q":{"mcq":{"prompt":"Czego NIE wolno robić w tunelu przewożąc ADR?","options":["Włączać świateł mijania","Używać okularów przeciwsłonecznych i telefonu","Słuchać komunikatów radiowych"],"correct":"Używać okularów przeciwsłonecznych i telefonu"},"match":{"prompt":"Dopasuj zachowanie w tunelu:","pairs":{"Palenie":"zakazane","Okulary przeciwsloneczne":"zakazane","Światła mijania":"nakazane","Komunikaty radiowe":"nakazane"}},"scenario":{"prompt":"Wjeżdżasz do tunelu z ADR. Co robisz ze światłami?","options":["Gaszę wszystkie","Włączam światła mijania","Włączam awaryjne"],"correct":"Włączam światła mijania"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-tunel-zachowanie@adr-2025"},{"id":"b4-tunele-kategorie","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.9.5","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Kategorie tuneli: A — bez ograniczeń (znak D-37, nieoznakowany), B, C, D, E — coraz bardziej restrykcyjne. Kod (B) = zagrażające wybuchem o bardzo dużym zasięgu; (C) = wybuch o dużym zasięgu lub działanie trujące o dużym zasięgu; (D) = jw. lub duży pożar; (E) = zakaz dla ilości ograniczonych powyżej 8 t brutto.","q":{"mcq":{"prompt":"Która kategoria tunelu jest najbardziej restrykcyjna?","options":["Kategoria A","Kategoria C","Kategoria E"],"correct":"Kategoria E"},"scenario":{"prompt":"Towar ma kod tunelowy (B). Przez które tunele możesz przejechać?","options":["Wszystkie","Tylko A (nieoznakowany / D-37)","A, B i C"],"correct":"Tylko A (nieoznakowany / D-37)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-tunele-kategorie@adr-2025"},{"id":"b4-tunele-kod","block":4,"topic":"Decyzja o tunelu","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.9.5 / kol. 15","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Kategoria tunelu podaje informacje, która umożliwia przewoźnikowi (kierowcy) precyzyjne określenie kategorii tunelu, przez które NIE jest dozwolony przewóz konkretnego towaru. Podana jest pod znakiem B-13a w postaci litery B, C, D lub E.","q":{"mcq":{"prompt":"Kategoria tunelu podana jest pod znakiem:","options":["B-13","B-13a","D-37"],"correct":"B-13a"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-tunele-kod@adr-2025"},{"id":"b4-wyposazenie-jednostka","block":4,"topic":"Dobór wyposażenia","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.1.5","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Wyposażenie na jednostkę transportową: klin pod koła dla KAŻDEGO pojazdu (o rozmiarze odpowiednim do DMC i średnicy kol), dwa stojące znaki ostrzegawcze, płyn do płukania oczu.","q":{"mcq":{"prompt":"Ile stojących znaków ostrzegawczych wymaganych na jednostce transportowej?","options":["Jeden","Dwa","Cztery"],"correct":"Dwa"},"match":{"prompt":"Przypisz wyposażenie do zakresu:","pairs":{"Klin pod koła":"dla każdego pojazdu","Dwa znaki ostrzegawcze":"na jednostkę transportową"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-wyposazenie-jednostka@adr-2025"},{"id":"b4-wyposazenie-zaloga","block":4,"topic":"Dobór wyposażenia","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.1.5.2","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Dla KAŻDEGO członka załogi pojazdu: kamizelka ostrzegawcza, przenosne urządzenie oświetleniowe (latarka), para rękawic ochronnych, ochrona oczu (okulary).","q":{"mcq":{"prompt":"Kamizelka ostrzegawcza, latarka, rękawice i okulary przypadają:","options":["Jedna sztuka na pojazd","Na każdego członka załogi","Tylko dla kierowcy"],"correct":"Na każdego członka załogi"},"match":{"prompt":"Przypisz wyposażenie do zakresu:","pairs":{"Kamizelka ostrzegawcza":"na każdego członka załogi","Płyn do płukania oczu":"jedna sztuka na pojazd","Klin pod koła":"dla każdego pojazdu"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-wyposazenie-zaloga@adr-2025"},{"id":"b4-znak-b13","block":4,"topic":"Ruch drogowy i postoj","kind":"skill","scope":"podstawowy","adrRef":"znaki drogowe PL","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Znak B-13 oznacza zakaz wjazdu dla pojazdów przewożących towary niebezpieczne klas: 1, gazy palne (2F), 3, 4.1, 4.2, 4.3, 5.1, 5.2 — czyli wszystkie nalepki z płomieniem.","q":{"mcq":{"prompt":"Znak B-13 dotyczy towarów:","options":["Zagrażających środowisku","Z nalepkami z płomieniem (1, 2F, 3, 4.1, 4.2, 4.3, 5.1, 5.2)","Trujacych"],"correct":"Z nalepkami z płomieniem (1, 2F, 3, 4.1, 4.2, 4.3, 5.1, 5.2)"},"scenario":{"prompt":"Wieziesz benzynę (klasa 3). Czy obowiązuje Cię znak B-13?","options":["Nie","Tak — klasa 3 ma nalepkę z płomieniem","Tylko w cysternie"],"correct":"Tak — klasa 3 ma nalepkę z płomieniem"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-znak-b13@adr-2025"},{"id":"b4-znak-b13a","block":4,"topic":"Ruch drogowy i postoj","kind":"skill","scope":"podstawowy","adrRef":"znaki drogowe PL","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Znak B-13a / C-3h oznacza zakaz wjazdu dla pojazdów przewożących towary niebezpieczne WSZYSTKICH KLAS oznakowanych tablicami pomarańczowymi.","q":{"mcq":{"prompt":"Znak B-13a zakazuje wjazdu pojazdom:","options":["Tylko z klasa 1","Wszystkich klas oznakowanych tablicami pomarańczowymi","Tylko cysternom"],"correct":"Wszystkich klas oznakowanych tablicami pomarańczowymi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-znak-b13a@adr-2025"},{"id":"b4-znak-b14","block":4,"topic":"Ruch drogowy i postoj","kind":"skill","scope":"podstawowy","adrRef":"znaki drogowe PL","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Znak B-14 oznacza zakaz wjazdu ze szkodliwymi dla środowiska wodnego: gazy trujące, żrące, klasa 3, 4.3, 6.1, 6.2, 8, część klasy 9 + znak \"ryba\" (zagrażający środowisku).","q":{"mcq":{"prompt":"Znak B-14 dotyczy towarów:","options":["Z nalepkami z płomieniem","Szkodliwych dla środowiska wodnego","Wybuchowych"],"correct":"Szkodliwych dla środowiska wodnego"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-znak-b14@adr-2025"},{"id":"b4-znaki-pozostale","block":4,"topic":"Ruch drogowy i postoj","kind":"fact","scope":"podstawowy","adrRef":"znaki drogowe PL","source":"kompendium","page":22,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"D-37 — dozwolony wjazd z wszystkimi towarami niebezpiecznymi (tunel). C-17 — nakazany kierunek jazdy dla pojazdów przewożących towary niebezpieczne. T-23i, T-23j, T-23h — tabliczki precyzujące rodzaj towaru.","q":{"match":{"prompt":"Dopasuj znak do znaczenia:","pairs":{"B-13a":"zakaz — wszystkie klasy z tablicami","D-37":"dozwolony wjazd z wszystkimi towarami","C-17":"nakazany kierunek jazdy"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b4-znaki-pozostale@adr-2025"},{"id":"b5-dgsa-zdarzenie","block":5,"topic":"Powiadamianie służb","kind":"fact","scope":"podstawowy","adrRef":"ADR 1.8.5","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"O każdym zdarzeniu należy poinformować doradcę DGSA w firmie w celu oceny, czy nie jest wymagane sporządzenie raportu powypadkowego.","q":{"mcq":{"prompt":"Kogo należy poinformować o każdym zdarzeniu z towarem niebezpiecznym?","options":["Tylko policję","Doradcę DGSA w firmie","Nadawcę"],"correct":"Doradcę DGSA w firmie"},"scenario":{"prompt":"Doszło do kolizji z niewielkim wyciekiem. Kto ocenia czy potrzebny raport powypadkowy?","options":["Kierowca","Doradca DGSA","Policja"],"correct":"Doradca DGSA"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-dgsa-zdarzenie@adr-2025"},{"id":"b5-dokument-awaryjny","block":5,"topic":"Powiadamianie służb","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.1","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Najważniejszym dokumentem w sytuacji awaryjnej jest DOKUMENT PRZEWOZOWY, ponieważ zawiera informacje na temat towaru i jego właściwości.","q":{"mcq":{"prompt":"Najważniejszy dokument w sytuacji awaryjnej to:","options":["Instrukcja pisemną","Dokument przewozowy","Świadectwo dopuszczenia"],"correct":"Dokument przewozowy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-dokument-awaryjny@adr-2025"},{"id":"b5-fissile","block":5,"topic":"Wskazówki per klasa","kind":"ref","scope":"podstawowy","adrRef":"ADR 5.4.3.4 tabela","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Nalepka 7E (FISSILE — materiał rozszczepialny) oznacza zagrożenie reakcja łańcuchowa.","q":{"mcq":{"prompt":"Nalepka FISSILE (7E) oznacza zagrożenie:","options":["Napromieniowaniem zewnetrznym","Reakcja łańcuchowa","Poparzeniem"],"correct":"Reakcja łańcuchowa"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-fissile@adr-2025"},{"id":"b5-gasnica-parametry","block":5,"topic":"Gaszenie pożaru","kind":"skill","scope":"podstawowy","adrRef":"praktyka gaszenia","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","mcq"],"why":"Strumień proszku kierujemy w źródło płomieni od strony nawietrznej. Czas wyładowania gaśnicy 6 kg to około 10 s, a 2 kg to około 6 s. Zasięg gaśnic to około 4 m.","q":{"match":{"prompt":"Dopasuj gaśnice do czasu wyładowania:","pairs":{"Gaśnica 6 kg":"około 10 s","Gaśnica 2 kg":"około 6 s"}},"mcq":{"prompt":"Zasięg gaśnicy proszkowej wynosi około:","options":["1 m","4 m","10 m"],"correct":"4 m"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-gasnica-parametry@adr-2025"},{"id":"b5-gaszenie","block":5,"topic":"Gaszenie pożaru","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","mcq"],"why":"Jeżeli jest to właściwe i bezpieczne, użyć gaśnic w celu ugaszenia małego lub będącego w fazie początkowej pożaru, obejmującego opony, hamulce lub przedział silnika. Członkowie załogi NIE powinni gasić pożaru obejmującego przedział ładunkowy. Nie gasimy ładunku.","q":{"scenario":{"prompt":"Zapalila się przestrzeń ładunkowa z towarem niebezpiecznym. Twoje działanie:","options":["Gaszę gaśnica pokladowa","Oddalam się i wzywam straż — nie gasimy ładunku","Otwieram ładunek"],"correct":"Oddalam się i wzywam straż — nie gasimy ładunku"},"mcq":{"prompt":"Gaśnica pokladowa kierowca może gasić:","options":["Pożar przestrzeni ladunkowej","Mały pożar opon, hamulców lub silnika","Każdy pożar"],"correct":"Mały pożar opon, hamulców lub silnika"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-gaszenie@adr-2025"},{"id":"b5-kolejnosc-informacji","block":5,"topic":"Powiadamianie służb","kind":"skill","scope":"podstawowy","adrRef":"procedury krajowe","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["order","scenario"],"why":"Kolejność przekazywanych informacji: miejsce zdarzenia, rodzaj zdarzenia (wypadek, kolizja, wyciek), skutki zdarzenia, liczba ofiar, rozmiar zdarzenia (ile pojazdów, osób), numery UN przewożonego towaru, sposób jego przewozu (luzem, cysterna), ilość towaru niebezpiecznego, czy nastąpiło jego uwolnienie.","q":{"order":{"prompt":"Ulóz kolejność informacji przekazywanych służbom:","items":["Numery UN przewożonego towaru","Miejsce zdarzenia","Rodzaj zdarzenia","Liczba ofiar"],"correct":["Miejsce zdarzenia","Rodzaj zdarzenia","Liczba ofiar","Numery UN przewożonego towaru"]},"scenario":{"prompt":"Dzwonisz po służby. Od czego zaczynasz?","options":["Od numeru UN","Od miejsca zdarzenia","Od marki pojazdu"],"correct":"Od miejsca zdarzenia"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-kolejnosc-informacji@adr-2025"},{"id":"b5-kolejnosc","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["order","scenario"],"why":"Czynności wg instrukcji pisemnej: zahamować pojazd, wyłączyć silnik i odłączyć akumulator wyłącznikiem głównym; unikać źródeł zapłonu (nie palić, nie używać e-papierosów, nie włączać urządzeń elektrycznych); powiadomić służby ratownicze; założyć kamizelkę i ustawić stojące znaki ostrzegawcze; zapewnić ratownikom dostęp do dokumentów; nie wchodzić na uwolnione materiały, pozostawać po stronie nawietrznej.","q":{"order":{"prompt":"Ulóz kolejność działań po wypadku wg instrukcji pisemnej:","items":["Powiadomić służby ratownicze","Zahamować pojazd, wyłączyć silnik, odłączyć akumulator","Założyć kamizelkę i ustawić znaki ostrzegawcze"],"correct":["Zahamować pojazd, wyłączyć silnik, odłączyć akumulator","Powiadomić służby ratownicze","Założyć kamizelkę i ustawić znaki ostrzegawcze"]},"scenario":{"prompt":"Wyciek z cysterny. Z której strony się ustawiasz?","options":["Po stronie nawietrznej","Po stronie zawietrznej","Bez znaczenia"],"correct":"Po stronie nawietrznej"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-kolejnosc@adr-2025"},{"id":"b5-mocowanie-kontrola","block":5,"topic":"Mocowanie ładunku","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.5.7","source":"kompendium","page":40,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","mcq"],"why":"Kierowca odpowiada za sprawdzenie zamocowania ładunku przed jazdą i po każdej przerwie, na której mogło dojść do przemieszczenia. Luźny pas, uszkodzona burta lub przesunięta paleta to podstawa do przerwania jazdy i poprawy mocowania.","q":{"scenario":{"prompt":"Po przerwie zauważasz, że jeden pas mocujący się poluzował. Co robisz?","options":["Jadę dalej, poprawię na rozładunku","Poprawiam mocowanie przed dalszą jazdą","Zdejmuję pas, skoro luźny"],"correct":"Poprawiam mocowanie przed dalszą jazdą"},"mcq":{"prompt":"Kiedy kierowca powinien sprawdzić zamocowanie ładunku?","options":["Tylko przy załadunku","Przed jazdą i po przerwach, na których mogło się przesunąć","Tylko gdy zatrzyma go kontrola"],"correct":"Przed jazdą i po przerwach, na których mogło się przesunąć"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-mocowanie-kontrola"},{"id":"b5-mocowanie-sila","block":5,"topic":"Mocowanie ładunku","kind":"fact","scope":"podstawowy","adrRef":"ADR 7.5.7.1","source":"kompendium","page":40,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Ładunek musi być zamocowany tak, by przy gwałtownym hamowaniu nie przesunął się i nie zagroził stabilności pojazdu. Siły w transporcie: do przodu ok. 0,8 masy ładunku (hamowanie), do tyłu i na boki ok. 0,5 masy. Dlatego mocowanie z przodu musi być najmocniejsze.","q":{"mcq":{"prompt":"W którą stronę działa największa siła na ładunek podczas jazdy?","options":["Do przodu (hamowanie) — ok. 0,8 masy","Do tyłu — ok. 0,8 masy","Na boki — ok. 1,0 masy"],"correct":"Do przodu (hamowanie) — ok. 0,8 masy"},"scenario":{"prompt":"Wieziesz palety, które mogą się przesunąć przy ostrym hamowaniu. Gdzie mocowanie musi być najsilniejsze?","options":["Z tyłu ładunku","Z przodu ładunku (kierunek hamowania)","Po bokach"],"correct":"Z przodu ładunku (kierunek hamowania)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-mocowanie-sila"},{"id":"b5-mocowanie","block":5,"topic":"Mocowanie ładunku","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.5.7","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","match"],"why":"Do mocowania ładunku używamy atestowanych pasów, burt przesuwanych, przegród nastawnych, mat antypoślizgowych, konstrukcji pojazdu (punkty kotwiczenia) lub wypełnienia pustych przestrzeni. Siła działająca na ładunek zmniejsza się wraz ze wzrostem promienia zakrętu. Ładunek ciekły w przypadku piętrowania należy umieszczać jak najniżej. Ładunek można piętrować tylko jeśli konstrukcja opakowania na to pozwala. Kąt pasa maksymalnie 45 stopni.","q":{"mcq":{"prompt":"Ładunek ciekły przy piętrowaniu należy umieszczać:","options":["Jak najwyzej","Jak najniżej","Na srodku"],"correct":"Jak najniżej"},"match":{"prompt":"Dopasuj element mocowania:","pairs":{"Atestowane pasy":"mocowanie ładunku","Maty antyposlizgowe":"zwiekszenie tarcia","Wypelnienie pustych przestrzeni":"zapobiega przesuwaniu"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-mocowanie@adr-2025"},{"id":"b5-numery-alarmowe","block":5,"topic":"Powiadamianie służb","kind":"fact","scope":"podstawowy","adrRef":"procedury krajowe","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Powiadamianie na numer 112 lub 999, 998 lub 997. Należy przekazać wszystkie dostępne informacje.","q":{"mcq":{"prompt":"Numery alarmowe przy zdarzeniu z towarem niebezpiecznym:","options":["Tylko 112","112 lub 999, 998, 997","Tylko 998"],"correct":"112 lub 999, 998, 997"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-numery-alarmowe@adr-2025"},{"id":"b5-oznakowanie-miejsca","block":5,"topic":"Reakcja po wypadku","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.1.5 / 5.4.3.4","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq"],"why":"Założyć kamizelkę ostrzegawcza i odpowiednio umieścić stojące znaki ostrzegawcze (dwa). Zapewnić przybylym ratownikom łatwy dostęp do dokumentów przewozowych.","q":{"mcq":{"prompt":"Czym zabezpieczasz miejsce zdarzenia z wyposażenia ADR?","options":["Jednym znakiem","Dwoma stojącymi znakami ostrzegawczymi","Tylko światłami"],"correct":"Dwoma stojącymi znakami ostrzegawczymi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-oznakowanie-miejsca@adr-2025"},{"id":"b5-pierwsza-pomoc-kontakt","block":5,"topic":"Pierwsza pomoc","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.3 (instrukcje pisemne)","source":"adr-2025","page":null,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Przy kontakcie substancji ze skórą lub oczami: natychmiast płukać miejsce duża ilością letniej wody przez co najmniej 15-20 minut, zdejmując skażoną odzież. NIE stosować środków neutralizujących. DO WERYFIKACJI: treść medyczna, przegląd ratownik/instruktor.","q":{"mcq":{"prompt":"Co zrobić przy kontakcie substancji niebezpiecznej ze skórą lub oczami?","options":["Płukać duża ilością letniej wody min. 15-20 minut","Przetrzeć sucha szmatka","Posmarować kremem neutralizujacym"],"correct":"Płukać duża ilością letniej wody min. 15-20 minut"},"scenario":{"prompt":"Substancją żrąca prysnęła kierowcy do oka. Pierwsza czynność?","options":["Natychmiast płukać oko letnią wodą, szeroko otwierając powiekę","Zamknąć oko i czekać na pogotowie","Przetrzeć oko i zneutralizować substancja zasadowa"],"correct":"Natychmiast płukać oko letnią wodą, szeroko otwierając powiekę"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-pierwsza-pomoc-kontakt"},{"id":"b5-pierwsza-pomoc-numer","block":5,"topic":"Pierwsza pomoc","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.3","source":"kompendium","page":38,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","fill"],"why":"Numer alarmowy w całej Unii Europejskiej to 112. Zgłaszając wypadek z towarem niebezpiecznym, podaj: miejsce, numer UN i nalepki z tablicy, rodzaj zdarzenia, liczbę poszkodowanych. Instrukcje pisemne (te w kabinie) opisują pierwsze czynności dla każdej klasy zagrożenia.","q":{"mcq":{"prompt":"Jaki jest numer alarmowy w Unii Europejskiej?","options":["997","112","999"],"correct":"112"},"fill":{"prompt":"Wspólny numer alarmowy w UE to ___.","correct":"112","hint":"trzy cyfry"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-pierwsza-pomoc-numer"},{"id":"b5-pierwsza-pomoc-wdychanie","block":5,"topic":"Pierwsza pomoc","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.3 (instrukcje pisemne)","source":"kompendium","page":38,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Przy wdychaniu par lub gazów: wyprowadzić poszkodowanego na świeże powietrze, na strefę nawietrzną (wiatr od pleców), zapewnić spokój i ciepło, wezwać pomoc. Nie wolno samemu wchodzić w strefę skażoną bez ochrony — ryzyko, że ratownik też straci przytomność. DO WERYFIKACJI: treść medyczna.","q":{"mcq":{"prompt":"Poszkodowany nawdychał się par substancji. Pierwsza czynność?","options":["Podać mu wodę do picia","Wyprowadzić na świeże powietrze, strefę nawietrzną","Położyć na wznak w kabinie"],"correct":"Wyprowadzić na świeże powietrze, strefę nawietrzną"},"scenario":{"prompt":"Widzisz osobę nieprzytomną w chmurze gazu. Co robisz najpierw?","options":["Wbiegam i wyciągam ją natychmiast","Nie wchodzę bez ochrony, wzywam służby i zabezpieczam teren","Czekam aż gaz się rozproszy"],"correct":"Nie wchodzę bez ochrony, wzywam służby i zabezpieczam teren"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-pierwsza-pomoc-wdychanie"},{"id":"b5-pierwsza-pomoc","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Zdjąć zanieczyszczone ubranie i użyte zanieczyszczone wyposażenie ochronne oraz usunąć je w sposób bezpieczny. Unikać wdychania oparów, dymu, pyłu i pary poprzez pozostawanie po stronie nawietrznej. Nie wchodzić na uwolnione materiały i nie dotykać ich.","q":{"mcq":{"prompt":"Co zrobić z zanieczyszczonym ubraniem po kontakcie z materiałem?","options":["Wyprać","Zdjąć i usunąć w sposób bezpieczny","Zostawić na sobie"],"correct":"Zdjąć i usunąć w sposób bezpieczny"},"scenario":{"prompt":"Uwolniony materiał na jezdni. Twoje zachowanie:","options":["Sprawdzam co to, dotykając","Nie wchodzę, nie dotykam, pozostaje po stronie nawietrznej","Rozgarniam łopata"],"correct":"Nie wchodzę, nie dotykam, pozostaje po stronie nawietrznej"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-pierwsza-pomoc@adr-2025"},{"id":"b5-wiele-zagrozen","block":5,"topic":"Wskazówki per klasa","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4 uwaga 1","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"UWAGA 1 z instrukcji pisemnej: w przypadku towarów niebezpiecznych stwarzających więcej niż jedno zagrożenie oraz ładunków mieszanych, stosuje się KAŻDA z określonych dla nich wskazówek.","q":{"mcq":{"prompt":"Towar stwarza więcej niż jedno zagrożenie. Które wskazówki stosujesz?","options":["Tylko dla zagrożenia dominującego","KAŻDA z określonych wskazówek","Żadnych"],"correct":"KAŻDA z określonych wskazówek"},"scenario":{"prompt":"Ładunek mieszany: klasa 3 i klasa 6.1. Jakie wskazówki stosujesz?","options":["Tylko dla klasy 3","Obie — dla klasy 3 i 6.1","Wybieram jedna"],"correct":"Obie — dla klasy 3 i 6.1"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-wiele-zagrozen@adr-2025"},{"id":"b5-wskazowki-klasy","block":5,"topic":"Wskazówki per klasa","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4 tabela","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Wskazówki dodatkowe z instrukcji pisemnej: klasa 1 — schronić się i pozostać z dala od okien; 2.1/2.2/2.3 — schronić się, unikać zagłębień terenu; 5.1/5.2 — nie dopuszczać do zmieszania z materiałami zapalnymi lub palnymi (np. trocinami); 6.1 — użyć maski ucieczkowej; 7 — ograniczyć czas narażenia; 4.3 — uwolniony materiał utrzymywać w stanie suchym, pod przykryciem.","q":{"match":{"prompt":"Dopasuj klasę do wskazówki z instrukcji pisemnej:","pairs":{"Klasa 1":"schronić się, z dala od okien","Klasa 5.1":"nie mieszać z materiałami palnymi","Klasa 6.1":"użyć maski ucieczkowej","Klasa 7":"ograniczyć czas narażenia"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-wskazowki-klasy@adr-2025"},{"id":"b5-zajecia-praktyczne-info","block":5,"topic":"Reakcja po wypadku","kind":"ref","scope":"podstawowy","adrRef":"program kursu (Dz.U. 2021 poz. 2150)","source":"curriculum","page":null,"edition":"ADR 2025","status":"info","verifiedBy":"domo","formats":["mcq"],"why":"INFO: zajęcia praktyczne z pierwszej pomocy i gaszenia pożaru są obowiązkowa częścią kursu stacjonarnego ADR. Trening w aplikacji utrwala wiedzę, realny skill ćwiczy się na kursie z instruktorem.","q":{"mcq":{"prompt":"Gdzie ćwiczy się praktycznie gaszenie pożaru i pierwsza pomoc w ramach ADR?","options":["Na zajęciach praktycznych kursu stacjonarnego z instruktorem","Wyłącznie w aplikacji","Nie ma zajęć praktycznych w kursie ADR"],"correct":"Na zajęciach praktycznych kursu stacjonarnego z instruktorem"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-zajecia-praktyczne-info"},{"id":"b5-zrodla-zaplonu","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["mcq","scenario"],"why":"Unikać źródeł zapłonu, w szczególności nie palić, nie używać papierosów elektronicznych lub podobnych urządzeń oraz nie włączać żadnych urządzeń elektrycznych.","q":{"mcq":{"prompt":"Po wypadku z towarem niebezpiecznym NIE wolno:","options":["Zakładać kamizelki","Włączać urządzeń elektrycznych i używać e-papierosów","Powiadamiac służb"],"correct":"Włączać urządzeń elektrycznych i używać e-papierosów"},"scenario":{"prompt":"Wyciek benzyny. Chcesz oświetlić miejsce telefonem. Czy można?","options":["Tak","Nie — nie włączamy urządzeń elektrycznych","Tylko latarka z wyposażenia"],"correct":"Nie — nie włączamy urządzeń elektrycznych"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"b5-zrodla-zaplonu@adr-2025"},{"id":"s-1132-oblicz-energia","block":1,"topic":"Wyłączenia w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.2","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["fill","scenario"],"why":"Limit 54 000 MJ to nie liczba do wykucia — to wynik mnożenia. Wartość energetyczna = litry paliwa razy wartość energetyczna tego paliwa (kol. z uwagi 1: olej napędowy 36 MJ/l, benzyna 32 MJ/l, LPG 24 MJ/l). Przykład graniczny: 1500 l oleju napędowego x 36 MJ/l = 54 000 MJ — dokładnie na limicie. Żeby sprawdzić, czy przewóz gazu/paliwa w zbiornikach przewożonych pojazdów mieści się w wyłączeniu dla gazów, liczysz iloczyn i porównujesz z 54 000 MJ.","q":{"fill":{"prompt":"Przewozisz pojazd ze zbiornikiem 1000 l oleju napędowego (36 MJ/l). Ile MJ wartości energetycznej? (litry x MJ/l)","correct":"36000","hint":"litry x MJ/l"},"scenario":{"prompt":"Zbiornik 1500 l oleju napędowego (36 MJ/l). Ile to MJ i czy mieści się w wyłączeniu dla gazów (limit 54 000 MJ)?","options":["54 000 MJ — dokładnie na limicie, mieści się","54 000 MJ — przekroczone, pelne ADR","36 000 MJ — z zapasem"],"correct":"54 000 MJ — dokładnie na limicie, mieści się"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1132-oblicz-energia@adr-2025"},{"id":"s-1136-co-zostaje","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6","source":"kompendium","page":10,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Wyłączenie 1.1.3.6 nie zwalnia ze wszystkiego. ZOSTAJE: certyfikowane i oznakowane opakowania, gaśnica 2 kg ABC z data przeglądu, dokument przewozowy, szkolenie stanowiskowe. ODPADA: tablice pomarańczowe, zaświadczenie ADR, instrukcja pisemną, skrzynka ADR, znaki drogowe ADR, DGSA, zakaz pasażerów.","q":{"match":{"prompt":"Przewóz na zwolnieniu „1000 punktów” — co zostaje, a co odpada?","pairs":{"Gaśnica 2 kg ABC":"zostaje","Dokument przewozowy":"zostaje","Tablice pomarańczowe":"odpada","Zaświadczenie ADR":"odpada"}},"scenario":{"prompt":"Jedziesz na zwolnieniu „1000 punktów”. Kontrola pyta o instrukcję pisemną. Musisz ją mieć?","options":["Tak, zawsze","Nie — instrukcja odpada przy zwolnieniu „1000 punktów”","Tylko przy klasie 3"],"correct":"Nie — instrukcja odpada przy zwolnieniu „1000 punktów”"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-co-zostaje@adr-2025"},{"id":"s-1136-gdzie-kategoria","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR kol. 15 Tabeli A","source":"kompendium","page":10,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Żeby policzyć punkty, najpierw musisz znać kategorię transportową towaru. Sprawdzasz ją w tabeli A, w kolumnie 15 (ta sama kolumna zawiera kod tunelowy w nawiasie).","q":{"scenario":{"prompt":"Chcesz policzyć punkty do zwolnienia „1000 punktów”. Skąd bierzesz kategorię transportową towaru?","options":["Z dokumentu przewozowego","Z tabeli A, kolumna 15","Z instrukcji pisemnej"],"correct":"Z tabeli A, kolumna 15"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-gdzie-kategoria@adr-2025"},{"id":"s-1136-kat0-blokada","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Kategoria 0 ma limit 0 — każda ilość oznacza pełny ADR. Nie ma znaczenia, ze suma punktów z pozostałych towarów jest niska. Kategoria 0 blokuje wyłączenie całkowicie.","q":{"scenario":{"prompt":"Ładunek: 5 kg towaru kategorii 0 + 50 l kategorii 3 (razem 50 punktów). Czy przysługuje wyłączenie „1000 punktów”?","options":["Tak, 50 punktów to mało","Nie — kategoria 0 zawsze oznacza pełny ADR","Tak, jeśli kategoria 0 nie przekracza 20 kg"],"correct":"Nie — kategoria 0 zawsze oznacza pełny ADR"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-kat0-blokada@adr-2025"},{"id":"s-1136-kat1-wyjatek-oblicz","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["fill","scenario"],"why":"UN 1017 (chlor) należy do wyjątku kategorii 1: limit 50 kg, mnożnik x20 zamiast x50. 20 kg x 20 = 400 punktów.","q":{"fill":{"prompt":"Wieziesz 20 kg UN 1017 (wyjątek kategorii 1, mnożnik x20). Ile punktów?","correct":"400","hint":"ilość x mnożnik wyjątku"},"scenario":{"prompt":"UN 1005 i UN 1017 w kategorii 1 mają mnożnik:","options":["x50 jak cała kategoria 1","x20 — wyjątek","x3"],"correct":"x20 — wyjątek"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-kat1-wyjatek-oblicz@adr-2025"},{"id":"s-1136-kat4-zero","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["fill","scenario"],"why":"Kategoria 4 ma mnożnik 0 — nie dolicza się do sumy niezależnie od ilości. 500 kg kąt. 4 = 0 punktów. Liczy się tylko 100 l kąt. 3 = 100 punktów.","q":{"fill":{"prompt":"Ładunek: 500 kg kategorii 4 + 100 l kategorii 3. Ile punktów?","correct":"100","hint":"uwaga na mnożnik kąt. 4"},"scenario":{"prompt":"Wieziesz 2 tony towaru kategorii 4. Ile to punktów?","options":["2000","0 — kategoria 4 ma mnożnik zero","666"],"correct":"0 — kategoria 4 ma mnożnik zero"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-kat4-zero@adr-2025"},{"id":"s-1136-mnozniki-tabela","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.4","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Podstawa liczenia punktów: ilość x mnożnik kategorii. Kąt. 1 = x50, kąt. 2 = x3, kąt. 3 = x1, kąt. 4 = x0. Suma nie może przekroczyć 1000.","q":{"match":{"prompt":"Dopasuj kategorię transportową do mnożnika:","pairs":{"Kategoria 1":"x50","Kategoria 2":"x3","Kategoria 3":"x1","Kategoria 4":"x0"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-mnozniki-tabela@adr-2025"},{"id":"s-1136-oblicz-1","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["fill"],"why":"Kategoria 2 ma mnożnik x3. 100 l x 3 = 300 punktów. Wynik poniżej 1000 — wyłączenie przysługuje.","q":{"fill":{"prompt":"Wieziesz 100 l towaru kategorii transportowej 2. Ile punktów?","correct":"300","hint":"ilość x mnożnik"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-oblicz-1@adr-2025"},{"id":"s-1136-oblicz-2","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["fill"],"why":"Sumujemy iloczyny: 50 l kąt. 2 = 50 x 3 = 150. 200 kg kąt. 3 = 200 x 1 = 200. Razem 350 punktów. Wyłączenie przysługuje.","q":{"fill":{"prompt":"Ładunek: 50 l kategorii 2 + 200 kg kategorii 3. Ile punktów łącznie?","correct":"350","hint":"zsumuj iloczyny"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-oblicz-2@adr-2025"},{"id":"s-1136-oblicz-3","block":1,"topic":"Wyliczenie 1000 punktów","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["fill","scenario"],"why":"300 l kąt. 2 = 300 x 3 = 900 punktów. Dołożenie 200 kg kąt. 3 (x1 = 200) daje 1100 — przekroczenie 1000. Wyłączenie nie przysługuje, jedziesz na pełnym ADR.","q":{"fill":{"prompt":"Ładunek: 300 l kategorii 2 + 200 kg kategorii 3. Ile punktów?","correct":"1100","hint":"liczba"},"scenario":{"prompt":"Wyszło 1100 punktów. Co to oznacza?","options":["Zwolnienie „1000 punktów” przysługuje","Przekroczone 1000 — pełny ADR","Trzeba podzielić ładunek na dwa kursy"],"correct":"Przekroczone 1000 — pełny ADR"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-1136-oblicz-3@adr-2025"},{"id":"s-2025-baterie-sodowe","block":2,"topic":"Zmiany ADR 2025","kind":"skill","scope":"podstawowy","adrRef":"ADR 2025 UN 3551/3552","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["match","scenario"],"why":"ZMIANA ADR 2025: wprowadzono baterie sodowo-jonowe — UN 3551 (z elektrolitem organicznym) i UN 3552 (zapakowane z urządzeniem lub w urządzeniu). Kod klasyfikacyjny M4 obejmuje teraz baterie litowe i sodowo-jonowe. Kompendium ADR 2023 tego nie zawiera.","q":{"match":{"prompt":"Dopasuj numer UN (ADR 2025):","pairs":{"UN 3551":"baterie sodowo-jonowe z elektrolitem organicznym","UN 3552":"baterie sodowo-jonowe w urządzeniu lub z urządzeniem"}},"scenario":{"prompt":"Wieziesz baterie sodowo-jonowe. Która klasa i numer UN (ADR 2025)?","options":["Klasa 9, UN 3480 jak litowe","Klasa 9, UN 3551","Nie podlega ADR"],"correct":"Klasa 9, UN 3551"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-2025-baterie-sodowe"},{"id":"s-2025-dokument-kabina","block":4,"topic":"Zmiany ADR 2025","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1 (2025)","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["scenario"],"why":"ZMIANA ADR 2025: od 1 lipca 2025 dokumenty przewozowe muszą znajdować się w kabinie kierowcy. Wcześniej dopuszczalne było inne umiejscowienie. Kompendium ADR 2023 tego nie zawiera.","q":{"scenario":{"prompt":"Kontrola pyta o dokument przewozowy. Został w biurze przewoźnika. Zgodnie z ADR 2025:","options":["To dopuszczalne, wystarczy przesłać skan","Naruszenie — od lipca 2025 dokument musi być w kabinie","Zależy od klasy towaru"],"correct":"Naruszenie — od lipca 2025 dokument musi być w kabinie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-2025-dokument-kabina"},{"id":"s-2025-lq-szkolenie","block":1,"topic":"Zmiany ADR 2025","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.2.3 (2025)","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["scenario"],"why":"ZMIANA ADR 2025: doprecyzowano wymóg szkolenia załogi przewożącej towary w ilościach ograniczonych (LQ). Mimo złagodzenia przepisów dla LQ, szkolenie stanowiskowe pozostaje wymagane i powinno być udokumentowane. Kompendium ADR 2023 tego nie precyzuje.","q":{"scenario":{"prompt":"Wieziesz towary w ilościach ograniczonych (LQ). Czy potrzebujesz szkolenia?","options":["Nie, LQ jest całkowicie zwolnione","Tak — szkolenie stanowiskowe, wymóg doprecyzowany w ADR 2025","Tak, pełny kurs ADR"],"correct":"Tak — szkolenie stanowiskowe, wymóg doprecyzowany w ADR 2025"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-2025-lq-szkolenie"},{"id":"s-2025-pojazdy-baterie","block":2,"topic":"Zmiany ADR 2025","kind":"skill","scope":"podstawowy","adrRef":"ADR 2025 UN 3556-3558","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["match"],"why":"ZMIANA ADR 2025: wprowadzono osobne numery dla pojazdów napędzanych bateriami — UN 3556 (litowo-jonowa), UN 3557 (litowo-metalowa), UN 3558 (sodowo-jonowa). Stosuje się nową instrukcję pakowania P912. Kompendium ADR 2023 tego nie zawiera.","q":{"match":{"prompt":"Dopasuj numer UN do pojazdu (ADR 2025):","pairs":{"UN 3556":"pojazd z bateria litowo-jonowa","UN 3557":"pojazd z bateria litowo-metalowa","UN 3558":"pojazd z bateria sodowo-jonowa"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-2025-pojazdy-baterie"},{"id":"s-butle-po-gazach","block":1,"topic":"Wyłączenia w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Wszystkie butle po gazach należą do kategorii transportowej 4 — mnożnik 0, bez ograniczeń ilościowych. Może je przewozić kierowca bez zaświadczenia ADR. Uwaga: butle pozostają oznakowane jak w stanie ładownym.","q":{"scenario":{"prompt":"Wieziesz 30 pustych butli po propanie. Potrzebujesz zaświadczenia ADR?","options":["Tak, powyżej 20 butli","Nie — wszystkie butle po gazach to kategoria 4, bez ograniczeń","Tylko jeśli są nieoczyszczone"],"correct":"Nie — wszystkie butle po gazach to kategoria 4, bez ograniczeń"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-butle-po-gazach@adr-2025"},{"id":"s-co-nie-podlega-adr","block":2,"topic":"Klasy zagrożeń","kind":"skill","scope":"podstawowy","adrRef":"ADR 3.3 SP 188","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Nie podlegają ADR: akumulatory i ogniwa litowe zawarte w urządzeniach wg przepisu 188, pojazdy poddane fumigacji, czynniki chłodzące jak UN 1845 suchy lód. Uwaga: mimo ze nie podlegają ADR, nadal stwarzają zagrożenie — fumigacja i suchy lód grozą uduszeniem.","q":{"match":{"prompt":"Dopasuj status:","pairs":{"Baterie litowe w urządzeniu (przepis 188)":"nie podlega ADR","Suchy lód UN 1845":"nie podlega ADR","Jednostka po fumigacji":"nie podlega ADR"}},"scenario":{"prompt":"Wieziesz suchy lód jako czynnik chłodzący. Nie podlega ADR — czy zagrożenie znika?","options":["Tak, brak ADR = brak zagrożenia","Nie — nadal grozi uduszeniem, wymaga przewietrzania","Tylko powyżej 100 kg"],"correct":"Nie — nadal grozi uduszeniem, wymaga przewietrzania"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-co-nie-podlega-adr@adr-2025"},{"id":"s-cv28-zywnosc-decyzja","block":4,"topic":"Decyzja o załadunku","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.5.4 / CV28","source":"kompendium","page":24,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Gdy w kolumnie 18 tabeli A jest przepis CV28, towar trzeba oddzielić od żywności i karmy. Sposoby: ciągle przegrody, sztuki bez nalepek 6.1/6.2/9 jako bufor, wolna przestrzeń min. 0,8 m, albo całkowite przykrycie (plandeka, pokrywa).","q":{"scenario":{"prompt":"Wieziesz towar z przepisem CV28 i artykuły spozywcze. Nie masz przegrody. Co robisz?","options":["Ładuje razem, CV28 to zalecenie","Zostawiam min. 0,8 m wolnej przestrzeni albo przykrywam całkowicie","Odmawiam przewozu"],"correct":"Zostawiam min. 0,8 m wolnej przestrzeni albo przykrywam całkowicie"},"match":{"prompt":"Sposoby oddzielenia od żywności (CV28):","pairs":{"Wolna przestrzeń":"min. 0,8 m","Ciągle przegrody":"wysokość jak sztuki przesyłek","Przykrycie":"plandeka lub pokrywa"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-cv28-zywnosc-decyzja@adr-2025"},{"id":"s-cysterna-wielokomorowa-decyzja","block":4,"topic":"Oznakowanie pojazdu w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.1.3","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Dla UN 1202, 1203, 1223, 1268 i 1863 można oznakować cysternę wielokomorowa tak, jakby wiozła jeden produkt — ten najniebezpieczniejszy z przewożonych. Benzyna (UN 1203, numer 33) jest niebezpieczniejsza niż olej napędowy (UN 1202, numer 30).","q":{"scenario":{"prompt":"Cysterna wielokomorowa: olej napędowy (UN 1202) i benzyna (UN 1203). Jaka tablica?","options":["Dwie różne tablice na komorach","33/1203 — najniebezpieczniejszy z przewożonych","30/1202"],"correct":"33/1203 — najniebezpieczniejszy z przewożonych"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-cysterna-wielokomorowa-decyzja@adr-2025"},{"id":"s-data-opakowania","block":2,"topic":"Odczyt opakowania","kind":"skill","scope":"podstawowy","adrRef":"ADR 4.1.1.15","source":"kompendium","page":7,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Data produkcji na opakowaniu zapisana jest jako miesiąc i rok, np. 07 21 = lipiec 2021. Opakowanie można używać 5 lat od daty produkcji, czyli do lipca 2026. Po 2,5 roku (styczen 2024) powinno być przeprowadzone badanie.","q":{"scenario":{"prompt":"Na DPPL widzisz oznaczenie 07 21. Do kiedy możesz go używać?","options":["Do lipca 2023","Do lipca 2026 (5 lat od produkcji)","Bezterminowo"],"correct":"Do lipca 2026 (5 lat od produkcji)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-data-opakowania@adr-2025"},{"id":"s-dgsa-czy-potrzebny","block":1,"topic":"Podstawy prawne","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.8.3","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Doradcę DGSA powinna wyznaczyć KAŻDA firma pakująca, ładująca, transportująca lub rozładowująca towary niebezpieczne — nie tylko przewoźnicy. Kara za niewyznaczenie: 5000 PLN. DGSA sprawdza szkolenia, sporządza sprawozdanie roczne i raport powypadkowy.","q":{"scenario":{"prompt":"Jednoosobowa firma transportową, wozisz tylko paliwo w cysternie. Potrzebujesz DGSA?","options":["Nie, to za mała firma","Tak — każda firma transportująca towary niebezpieczne musi wyznaczyć doradcę","Tylko jeśli zatrudniasz kierowców"],"correct":"Tak — każda firma transportująca towary niebezpieczne musi wyznaczyć doradcę"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-dgsa-czy-potrzebny@adr-2025"},{"id":"s-dokument-1136-punkty","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1.1.10","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Przy zastosowaniu zwolnienia 1.1.3.6 należy w dokumencie umieścić zapis o całkowitej ilości towaru dla kategorii transportowej oraz o \"punktach\" (wartości obliczonej), np. kategoria transportową 2 — 100 l — 300 punktów.","q":{"scenario":{"prompt":"Jedziesz na zwolnieniu „1000 punktów”. Co dodatkowo musi być w dokumencie?","options":["Nic dodatkowego","Całkowita ilość dla kategorii transportowej i wartość obliczona (punkty)","Numer zaświadczenia ADR"],"correct":"Całkowita ilość dla kategorii transportowej i wartość obliczona (punkty)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-dokument-1136-punkty@adr-2025"},{"id":"s-dokument-odczyt","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Nawet nie znając języka dokumentu, kierowca odczyta właściwości towaru po numerze nalepki i grupie pakowania. UN 1580 CHLOROPIKRYNA 6.1 GP I: 6.1 = trujący, GP I = silnie (największe zagrożenie).","q":{"scenario":{"prompt":"W dokumencie: UN 1580 CHLOROPIKRYNA 6.1 GP I. Co to mówi bez znajomości języka?","options":["Materiał zapalny, małe zagrożenie","Materiał trujący, silnie — I grupa pakowania","Gaz duszący"],"correct":"Materiał trujący, silnie — I grupa pakowania"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-dokument-odczyt@adr-2025"},{"id":"s-dokument-odpad-zapis","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1.1.3","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Słowo ODPAD umieszcza się PO numerze UN, przed nazwa: UN 1230 odpad metanol 3 (6.1) II, (D/E).","q":{"scenario":{"prompt":"Który zapis odpadu w dokumencie jest prawidłowy?","options":["odpad UN 1230 metanol 3 (6.1) II, (D/E)","UN 1230 odpad metanol 3 (6.1) II, (D/E)","UN 1230 metanol odpad 3 (6.1) II, (D/E)"],"correct":"UN 1230 odpad metanol 3 (6.1) II, (D/E)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-dokument-odpad-zapis@adr-2025"},{"id":"s-dokument-prozny","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.1.1.6","source":"kompendium","page":12,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Zapis dla próżnych opakowań powinien zawierać nazwę opakowania oraz numery nalepek znajdujących się na opakowaniu, np. \"próżny DPPL, 8\".","q":{"scenario":{"prompt":"Wieziesz próżny, nieoczyszczony DPPL po kwasie (nalepka 8). Jak zapisać w dokumencie?","options":["DPPL pusty","próżny DPPL, 8","UN 0000 puste opakowanie"],"correct":"próżny DPPL, 8"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-dokument-prozny@adr-2025"},{"id":"s-gasic-czy-nie","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Kierowca gasi TYLKO mały lub początkowy pożar obejmujący opony, hamulce lub przedział silnika — i tylko jeśli to bezpieczne. Pożaru przedziału ładunkowego NIE gasi. Nie gasimy ładunku.","q":{"match":{"prompt":"Gasić czy nie?","pairs":{"Początkowy pożar opony":"gasić jeśli bezpiecznie","Pożar przedziału ładunkowego":"NIE gasić","Pożar silnika w fazie początkowej":"gasić jeśli bezpiecznie"}},"scenario":{"prompt":"Pali się naczepa z ładunkiem ADR. Masz 2 gaśnice po 6 kg. Co robisz?","options":["Próbuje gasić — mam 12 kg","Oddalam się i wzywam straż — nie gasimy ładunku","Otwieram naczepe żeby sprawdzić"],"correct":"Oddalam się i wzywam straż — nie gasimy ładunku"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-gasic-czy-nie@adr-2025"},{"id":"s-gasnica-technika","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"praktyka gaszenia","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Strumień proszku kierujemy w źródło płomieni, stojąc od strony nawietrznej. Gaśnica 6 kg wystarcza na ok. 10 sekund, 2 kg na ok. 6 sekund. Zasięg około 4 m. Masz jedna próbę — celuj w źródło, nie w płomień.","q":{"scenario":{"prompt":"Gasisz początkowy pożar opony gaśnica 6 kg. Ile masz czasu?","options":["Około 30 sekund","Około 10 sekund","Około 2 minut"],"correct":"Około 10 sekund"},"match":{"prompt":"Parametry gaśnic:","pairs":{"Gaśnica 6 kg":"ok. 10 s","Gaśnica 2 kg":"ok. 6 s","Zasięg strumienia":"ok. 4 m"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-gasnica-technika@adr-2025"},{"id":"s-gasnice-1136","block":4,"topic":"Dobór gaśnic","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.6 / 8.1.4","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Pojazd na wyłączeniu 1.1.3.6 musi mieć 1 gaśnice 2 kg typu ABC. Wyłączenie zwalnia z pełnego wyposażenia, ale NIE z gaśnicy.","q":{"scenario":{"prompt":"Jedziesz na zwolnieniu „1000 punktów” zestawem 20 t. Ile gaśnic?","options":["Dwie, łącznie 12 kg jak przy pełnym ADR","Jedna 2 kg ABC","Żadna — wyłączenie zwalnia"],"correct":"Jedna 2 kg ABC"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-gasnice-1136@adr-2025"},{"id":"s-gasnice-3t","block":4,"topic":"Dobór gaśnic","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.4","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Bus 3 t = do 3,5 t. Wymagane: 2 gaśnice, łączna pojemność 4 kg — czyli 2 kg do silnika/kabiny + 2 kg dodatkowa.","q":{"scenario":{"prompt":"Bus 3 t z towarem ADR. Jakie gaśnice?","options":["Jedna 4 kg","Dwie gaśnice, łącznie 4 kg (2 kg + 2 kg)","Dwie po 6 kg"],"correct":"Dwie gaśnice, łącznie 4 kg (2 kg + 2 kg)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-gasnice-3t@adr-2025"},{"id":"s-gasnice-40t","block":4,"topic":"Dobór gaśnic","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.4","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","fill"],"why":"Zestaw 40 t = powyżej 7,5 t. Wymagane: minimum 2 gaśnice, łączna pojemność 12 kg, w tym co najmniej jedna 2 kg do silnika/kabiny i co najmniej jedna dodatkowa 6 kg. Typ ABC.","q":{"scenario":{"prompt":"Zestaw 40 t. Masz jedna gaśnice 12 kg. Czy spełniasz wymóg?","options":["Tak, pojemność się zgadza","Nie — muszą być minimum 2 gaśnice","Tak, jeśli ma aktualny przegląd"],"correct":"Nie — muszą być minimum 2 gaśnice"},"fill":{"prompt":"Zestaw 40 t: minimalna łączna pojemność gaśnic to ___ kg.","correct":"12","hint":"liczba"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-gasnice-40t@adr-2025"},{"id":"s-gasnice-s3-6-2","block":4,"topic":"Dobór gaśnic","kind":"skill","scope":"podstawowy","adrRef":"ADR przepis S3","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Przepis S3: dla klasy 6.2 (zakaźne) niezależnie od DMC pojazdu wystarczy gaśnica 2 kg typu ABC, a latarka może być dowolnej konstrukcji. To wyjątek od tabeli mas.","q":{"scenario":{"prompt":"Zestaw 24 t z odpadami medycznymi (klasa 6.2). Ile gaśnicy wg przepisu S3?","options":["12 kg jak dla każdego zestawu powyżej 7,5 t","Wystarczy 2 kg ABC — wyjątek S3","8 kg"],"correct":"Wystarczy 2 kg ABC — wyjątek S3"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-gasnice-s3-6-2@adr-2025"},{"id":"s-gdzie-sprawdzic","block":1,"topic":"Podstawy prawne","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1 / zrodla","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Kierowca nie musi pamiętać wszystkiego — musi wiedzieć, gdzie sprawdzić. Wykaz krajów ADR, dodatkowe wymagania krajowe i wykaz tuneli: masteradr.pl/kraje. Tabela A, instrukcje pisemne i formularz multimodalny do pobrania: doradca-adr.com/dokumenty-do-pobrania. Wątpliwości w firmie rozstrzyga doradca DGSA.","q":{"match":{"prompt":"Gdzie sprawdzasz? Dopasuj źródło:","pairs":{"Wymagania krajowe i wykaz tuneli":"masteradr.pl/kraje","Tabela A i instrukcje pisemne":"doradca-adr.com/dokumenty-do-pobrania","Watpliwosc w firmie":"doradca DGSA"}},"scenario":{"prompt":"Jedziesz do Austrii pierwszy raz. Skąd sprawdzisz dodatkowe wymagania tego kraju?","options":["Z instrukcji pisemnej","Z wykazu krajów ADR (masteradr.pl/kraje)","Z tablicy pomarańczowej"],"correct":"Z wykazu krajów ADR (masteradr.pl/kraje)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-gdzie-sprawdzic@adr-2025"},{"id":"s-grupa-pakowania-ktore-klasy","block":2,"topic":"Klasyfikacja","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.1.1.3","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Grup pakowania NIE MAJĄ klasy 1, 2, 5.2, 6.2, 7 oraz przedmioty. Jeśli w dokumencie przy klasie 2 widzisz grupę pakowania — to błąd. Grupa pakowania określa natężenie zagrożenia dominującego: I duże, II średnie, III małe.","q":{"scenario":{"prompt":"W dokumencie: UN 1978 PROPAN 2.1 GP II. Co jest nie tak?","options":["Nic, zapis prawidłowy","Klasa 2 nie ma grup pakowania — GP II nie powinno tam być","Propan to klasa 3"],"correct":"Klasa 2 nie ma grup pakowania — GP II nie powinno tam być"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-grupa-pakowania-ktore-klasy@adr-2025"},{"id":"s-grupa-pakowania-natezenie","block":2,"topic":"Klasyfikacja","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.1.1.3","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Grupa pakowania = natężenie zagrożenia dominującego. I = duże, II = średnie, III = małe. Benzyna UN 1203 = II. Olej napędowy UN 1202 = III. Im niższa cyfra rzymska, tym groźniejszy towar.","q":{"match":{"prompt":"Dopasuj grupę pakowania do natężenia zagrożenia:","pairs":{"I":"duże zagrożenie","II":"średnie zagrożenie","III":"małe zagrożenie"}},"scenario":{"prompt":"Dwa towary: jeden GP I, drugi GP III. Który jest groźniejszy?","options":["GP III","GP I — I oznacza duże zagrożenie","Takie same"],"correct":"GP I — I oznacza duże zagrożenie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-grupa-pakowania-natezenie@adr-2025"},{"id":"s-ino-uzupelnienie","block":2,"topic":"Klasyfikacja","kind":"skill","scope":"podstawowy","adrRef":"ADR 3.1.2.8","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"I.N.O. = inaczej nie określony. Wymaga uzupełnienia o nazwy techniczne składników w nawiasie, np. UN 1964 WĘGLOWODORY GAZOWE, MIESZANINA SPRĘŻONA I.N.O (zawiera wodór i argon) 2.1 (B/D). Bez tego zapis jest niekompletny.","q":{"scenario":{"prompt":"W dokumencie: UN 1964 WĘGLOWODORY GAZOWE, MIESZANINA SPRĘŻONA I.N.O. 2.1. Czego brakuje?","options":["Niczego, zapis pełny","Nazw technicznych składników w nawiasie","Numeru nalepki"],"correct":"Nazw technicznych składników w nawiasie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-ino-uzupelnienie@adr-2025"},{"id":"s-jtr-paliwo-zestaw","block":1,"topic":"Jednostka i sposoby przewozu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.3 / 1.2.1","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Limit 1500 l dotyczy CAŁEJ jednostki transportowej, nie każdego pojazdu osobno. Ciągnik 1000 l + naczepa 400 l = 1400 l na jednostkę — mieści się. Ale uwaga: na przyczepie limit to dodatkowo max 500 l.","q":{"scenario":{"prompt":"Ciągnik ma zbiorniki 1000 l, naczepa dodatkowy zbiornik 400 l. Razem 1400 l. Czy mieści się w wyłączeniu paliwowym (paliwo w zbiornikach pojazdu do jego napędu)?","options":["Nie — każdy pojazd ma limit 1500 l osobno, więc jest problem","Tak — 1400 l na cała jednostkę, poniżej 1500 l","Nie — przekroczony limit"],"correct":"Tak — 1400 l na cała jednostkę, poniżej 1500 l"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-jtr-paliwo-zestaw@adr-2025"},{"id":"s-jtr-wyposazenie-liczba","block":1,"topic":"Jednostka i sposoby przewozu","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.5 / 1.2.1","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Pułapka: klin pod koła liczy się NA KAŻDY POJAZD (ciągnik + naczepa = 2 kliny), ale stojące znaki ostrzegawcze liczy się NA JEDNOSTKĘ TRANSPORTOWĄ (zestaw = 2 znaki, nie 4). Ciągnik z naczepa to jedna jednostka, ale dwa pojazdy.","q":{"scenario":{"prompt":"Ciągnik siodłowy z naczepa. Ile klinów i ile stojących znaków ostrzegawczych?","options":["1 klin, 2 znaki","2 kliny (każdy pojazd), 2 znaki (jednostka)","2 kliny, 4 znaki"],"correct":"2 kliny (każdy pojazd), 2 znaki (jednostka)"},"match":{"prompt":"Zestaw: ciągnik + naczepa. Ile sztuk?","pairs":{"Klin pod koła":"2 — na każdy pojazd","Stojące znaki ostrzegawcze":"2 — na jednostkę","Płyn do płukania oczu":"1 — na pojazd"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-jtr-wyposazenie-liczba@adr-2025"},{"id":"s-kanistry-przekroczenie","block":1,"topic":"Wyłączenia w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.3","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Limit paliwa w zbiornikach dodatkowych (kanistrach) to 60 l. Przekroczenie tego limitu oznacza, ze wyłączenie 1.1.3.3 nie przysługuje dla nadwyżki — trzeba stosować przepisy ADR.","q":{"scenario":{"prompt":"Wieziesz 100 l paliwa w kanistrach. Czy to się mieści w wyłączeniu paliwowym?","options":["Tak, do 1500 l","Nie — limit dla kanistrów to 60 l","Tak, jeśli kanistry są atestowane"],"correct":"Nie — limit dla kanistrów to 60 l"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-kanistry-przekroczenie@adr-2025"},{"id":"s-klasa9-co-tam","block":2,"topic":"Klasy zagrożeń","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.2.9","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Klasa 9 to \"różne\" — wpadają tu towary bez wspólnego mianownika: azbest, materiały w podwyższonej temperaturze (stałe >240 st. C, ciekłe >100 st. C), akumulatory litowe, przedmioty ratownicze, materiały zagrażające środowisku wodnemu (UN 3077/3082).","q":{"match":{"prompt":"Które towary należą do klasy 9?","pairs":{"Azbest":"klasa 9","Baterie litowe":"klasa 9","Asfalt 150 st. C":"klasa 9 (podwyższona temperatura)"}},"scenario":{"prompt":"Wieziesz asfalt o temperaturze 150 st. C. Czy to towar niebezpieczny?","options":["Nie, to zwykly asfalt","Tak — klasa 9, materiał ciekły powyżej 100 st. C","Tak, klasa 3"],"correct":"Tak — klasa 9, materiał ciekły powyżej 100 st. C"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-klasa9-co-tam@adr-2025"},{"id":"s-kod-klasyfikacyjny","block":2,"topic":"Klasyfikacja","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.1.1.2","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Zagrożenie dodatkowe określane jest kodem literowym: F = palne, T = trujące. Kod klasyfikacyjny mówi więcej niż sama klasa — np. gaz z kodem TF to gaz trujący i palny jednocześnie. To druga nalepka w dokumencie przewozowym.","q":{"match":{"prompt":"Dopasuj kod literowy do zagrożenia:","pairs":{"F":"palne","T":"trujące"}},"scenario":{"prompt":"Gaz o kodzie klasyfikacyjnym TF. Jakie ma zagrożenia?","options":["Tylko trujący","Trujący i palny jednocześnie","Tylko palny"],"correct":"Trujący i palny jednocześnie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-kod-klasyfikacyjny@adr-2025"},{"id":"s-kod-opakowania-y","block":2,"topic":"Odczyt opakowania","kind":"skill","scope":"podstawowy","adrRef":"ADR 6.1.2","source":"kompendium","page":8,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Litera na drugim miejscu kodu opakowania: X = dla I, II i III grupy pakowania; Y = dla II i III; Z = tylko dla III. Opakowanie Y nie nadaje się do towaru I grupy pakowania.","q":{"scenario":{"prompt":"Opakowanie z kodem 1A2/Y. Chcesz zapakować towar I grupy pakowania. Możesz?","options":["Tak, Y pasuje do wszystkich","Nie — Y jest tylko dla II i III grupy","Tak, jeśli towar jest ciekły"],"correct":"Nie — Y jest tylko dla II i III grupy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-kod-opakowania-y@adr-2025"},{"id":"s-kto-klasyfikuje-nie-ty","block":2,"topic":"Klasyfikacja","kind":"skill","scope":"podstawowy","adrRef":"ADR czesc 2","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Za klasyfikację odpowiada PRODUCENT, NADAWCA i IPO (dla klasy 7 — PAA). Kierowca NIE klasyfikuje towaru. Jeśli masz wątpliwości co do klasyfikacji, nie zgadujesz — pytasz nadawcę albo doradcę DGSA.","q":{"scenario":{"prompt":"Nadawca dal Ci towar bez nalepki. Mówi, ze \"to chyba klasa 3\". Co robisz?","options":["Naklejam nalepkę 3 — brzmi sensownie","Nie klasyfikuje towaru — to obowiązek nadawcy, żądam prawidłowej klasyfikacji","Wioze bez nalepki"],"correct":"Nie klasyfikuje towaru — to obowiązek nadawcy, żądam prawidłowej klasyfikacji"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-kto-klasyfikuje-nie-ty@adr-2025"},{"id":"s-ktora-edycja","block":1,"topic":"Podstawy prawne","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.6","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"ADR nowelizowany jest co 2 lata, nowe przepisy wchodzą 1 stycznia roku NIEPARZYSTEGO. Edycje: 2021, 2023, 2025, 2027... Wiedza sprzed dwóch lat może być już nieaktualna — dlatego każde szkolenie i materiał trzeba sprawdzić pod kątem edycji.","q":{"scenario":{"prompt":"Masz materiał szkoleniowy oznaczony \"ADR 2023\". Jest rok 2026. Co to znaczy?","options":["Materiał jest aktualny, ADR się nie zmienia","Weszła już edycja 2025 — materiał może być miejscami nieaktualny","Materiał wygasł i jest bezużyteczny"],"correct":"Weszła już edycja 2025 — materiał może być miejscami nieaktualny"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-ktora-edycja@adr-2025"},{"id":"s-ladowanie-3-8","block":4,"topic":"Decyzja o załadunku","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.5.2.1","source":"kompendium","page":25,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"W ADR większość klas można ładować razem przy prawidłowym opakowaniu (inaczej niż w transporcie morskim IMDG). Zakazy 7.5.2.1 dotyczą w uproszczeniu klasy 1 oraz 4.1+1 i 5.2+1 o właściwościach wybuchowych.","q":{"scenario":{"prompt":"Chcesz załadować razem kanistry z benzyna (3) i kwasem (8). Wolno?","options":["Nie, różne klasy nigdy razem","Tak — ładowanie razem tych klas jest dozwolone","Tylko w osobnych kontenerach"],"correct":"Tak — ładowanie razem tych klas jest dozwolone"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-ladowanie-3-8@adr-2025"},{"id":"s-ladowanie-klasa1","block":4,"topic":"Decyzja o załadunku","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.5.2.1","source":"kompendium","page":25,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Zakazy ładowania razem koncentrują się na klasie 1 (materiały wybuchowe). Wyjątkiem jest podklasa 1.4S, która ma najłagodniejszy reżim. Szczegóły w tabeli 7.5.2.1.","q":{"scenario":{"prompt":"Która grupa towarów ma najwięcej zakazów ładowania razem?","options":["Klasa 9","Klasa 1 — materiały wybuchowe","Klasa 3"],"correct":"Klasa 1 — materiały wybuchowe"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-ladowanie-klasa1@adr-2025"},{"id":"s-luzem-czy-wolno","block":1,"topic":"Jednostka i sposoby przewozu","kind":"skill","scope":"podstawowy","adrRef":"ADR kol. 10/17 Tabeli A","source":"kompendium","page":6,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Przewóz luzem NIE jest dozwolony domyślnie. Wolno tylko wtedy, gdy w tabeli A w kolumnie 10 lub 17 wskazany jest przepis szczególny BK1, BK2, BK3, VC1, VC2 lub VC3. Przepisy BK wskazują specjalny rodzaj kontenera. Przykład: UN 3257 (materiał o podwyższonej temperaturze ciekły) może być luzem na podstawie VC3.","q":{"scenario":{"prompt":"Chcesz przewieźć materiał stały luzem. Gdzie sprawdzasz, czy wolno?","options":["W instrukcji pisemnej","W tabeli A, kolumna 10 lub 17 — musi być BK lub VC","Na tablicy pomarańczowej"],"correct":"W tabeli A, kolumna 10 lub 17 — musi być BK lub VC"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-luzem-czy-wolno@adr-2025"},{"id":"s-multimodal-przepisy","block":1,"topic":"Podstawy prawne","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.4.2.1 / IMDG","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Poza ADR (droga) obowiązują: RID (kolej), ADN (śródlądowy), IMDG (morski), ICAO TI (lotniczy). Przy przewozie multimodalnym przesyłki mogą być oznakowane wg kodeksu morskiego lub lotniczego — wtedy w dokumencie zapis \"Przewóz zgodny z 1.1.4.2.1\". Przed przewozem morskim wymagany jest certyfikat pakowania kontenera.","q":{"scenario":{"prompt":"Wieziesz kontener do portu, dalej płynie promem. Jakie przepisy obowiązują na morzu?","options":["Dalej ADR","IMDG — kodeks morski","ICAO TI"],"correct":"IMDG — kodeks morski"},"match":{"prompt":"Dopasuj umowę do gałęzi transportu:","pairs":{"ADR":"drogowy","RID":"kolejowy","IMDG":"morski","ICAO TI":"lotniczy"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-multimodal-przepisy@adr-2025"},{"id":"s-odstepstwa-umowy","block":1,"topic":"Podstawy prawne","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.5","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Kraje mogą wprowadzać dodatkowe wymagania (np. przejazd tunelami, okresowe zakazy ruchu) oraz umowy specjalne dopuszczające odstępstwa od przepisów. Odstępstwa nie mogą trwać dłużej niż 5 lat. Wykaz na masteradr.pl/kraje.","q":{"scenario":{"prompt":"Umowa specjalna dopuszczająca odstępstwo od ADR może obowiązywać maksymalnie:","options":["1 rok","5 lat","Bezterminowo do odwołania"],"correct":"5 lat"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-odstepstwa-umowy@adr-2025"},{"id":"s-okres-przejsciowy","block":1,"topic":"Podstawy prawne","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.6","source":"kompendium","page":1,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Nowe przepisy wchodzą 1 stycznia roku nieparzystego, ale do końca czerwca obowiązuje okres przejściowy — można stosować \"stara\" LUB \"nowa\" wersje przepisów. Od 1 lipca obowiązuje już tylko nowa.","q":{"scenario":{"prompt":"Marzec roku nieparzystego. Twoje instrukcje pisemne są wg poprzedniej edycji ADR. Kontrola. Czy to naruszenie?","options":["Tak, od stycznia obowiązuje nowa edycja","Nie — do końca czerwca trwa okres przejściowy, wolno stosować stara wersje","Tak, ale kara jest symboliczna"],"correct":"Nie — do końca czerwca trwa okres przejściowy, wolno stosować stara wersje"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-okres-przejsciowy@adr-2025"},{"id":"s-oznakowanie-decyzja","block":4,"topic":"Oznakowanie pojazdu w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3","source":"kompendium","page":21,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Sposób oznakowania zależy od sposobu przewozu. Sztuki przesyłki: tablice gładkie (bez numerów) przód i tył, BEZ nalepek na pojeździe. Luzem lub cysterna: tablice z numerami przód i tył + nalepki z trzech stron (oba boki i tył). Kontener-cysterna: nalepki z 4 stron.","q":{"match":{"prompt":"Dopasuj sposób przewozu do oznakowania:","pairs":{"Sztuki przesyłki":"tablice gładkie przód i tył, bez nalepek","Luzem lub cysterna":"tablice z numerami + nalepki z 3 stron","Kontener-cysterna":"nalepki z 4 stron"}},"scenario":{"prompt":"Wieziesz butle gazowe i DPPL (sztuki przesyłki). Jak oznakować pojazd?","options":["Tablice z numerami i nalepki z boków","Tablice gładkie bez numerów, przód i tył, bez nalepek","Bez oznakowania"],"correct":"Tablice gładkie bez numerów, przód i tył, bez nalepek"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-oznakowanie-decyzja@adr-2025"},{"id":"s-paliwo-limity","block":1,"topic":"Wyłączenia w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.1.3.3","source":"kompendium","page":9,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Wyłączenie 1.1.3.3 dla paliwa w zbiornikach pojazdu: do 1500 l na jednostkę transportową, nie więcej niż 500 l na przyczepie, w kanistrach nie więcej niż 60 l.","q":{"scenario":{"prompt":"Ciągnik 800 l + naczepa 400 l + 2 kanistry po 20 l = 1240 l. Czy mieści się w wyłączeniu paliwowym (paliwo w zbiornikach pojazdu)?","options":["Nie, przekroczone 1000 l","Tak — 1240 l poniżej 1500 l, kanistry 40 l poniżej 60 l","Tylko bez kanistrów"],"correct":"Tak — 1240 l poniżej 1500 l, kanistry 40 l poniżej 60 l"},"match":{"prompt":"Dopasuj limit paliwa (wyłączenie paliwowe):","pairs":{"Jednostka transportową":"1500 l","Przyczepa":"500 l","Kanistry":"60 l"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-paliwo-limity@adr-2025"},{"id":"s-podklasa-4","block":2,"topic":"Klasy zagrożeń","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.2.41-43","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Klasa 4: 4.1 zapalne stałe i samoreaktywne, 4.2 podatne na samozapalenie (piroforyczne, fosfor biały, rozdrobnione metale), 4.3 wydzielają z wodą gazy palne. Skutek praktyczny: 4.3 MUSZĄ być w pojazdach zamkniętych, a uwolniony materiał trzyma się w stanie suchym pod przykryciem.","q":{"match":{"prompt":"Dopasuj podklasę klasy 4:","pairs":{"4.1":"zapalne stałe, samoreaktywne","4.2":"samozapalne (piroforyczne)","4.3":"z wodą wydzielają gazy palne"}},"scenario":{"prompt":"Wieziesz materiał klasy 4.3. Zaczyna padać deszcz, plandeka przecieka. Problem?","options":["Nie, woda nie szkodzi","Tak — 4.3 z wodą wydziela gazy palne, musi być pojazd zamknięty","Tylko przy dużej ilości"],"correct":"Tak — 4.3 z wodą wydziela gazy palne, musi być pojazd zamknięty"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-podklasa-4@adr-2025"},{"id":"s-podklasa-5","block":2,"topic":"Klasy zagrożeń","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.2.51-52","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Klasa 5.1 (utleniające) same nie muszą się palić, ale WZMAGAJĄ palenie. Nie wolno ich mieszać z materiałami zapalnymi — np. trocinami. W kontakcie mogą gwałtownie reagować, wybuchać, powodować pożar. 5.2 to nadtlenki organiczne (typy A-F), niektóre wybuchowe.","q":{"scenario":{"prompt":"Materiał utleniający (5.1) rozsypał się na trociny w naczepie. Zagrożenie?","options":["Żadne, 5.1 sam się nie pali","Poważne — utleniacz z materiałem palnym może gwałtownie reagować i zapalić się","Tylko przy ogrzaniu powyżej 100 st. C"],"correct":"Poważne — utleniacz z materiałem palnym może gwałtownie reagować i zapalić się"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-podklasa-5@adr-2025"},{"id":"s-podklasa-6-pulapka","block":2,"topic":"Klasy zagrożeń","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.2.61-62","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Klasa 6.1 = trujące (zatrucie przez połknięcie, wdychanie, skórę). Klasa 6.2 = zakaźne (odpady medyczne, wirusy, bakterie, priony). PUŁAPKA: NIE występują materiały jednocześnie zakaźne I trujące — takie połączenie nie istnieje w ADR.","q":{"scenario":{"prompt":"Czy może istnieć materiał jednocześnie zakaźny (6.2) i trujący (6.1)?","options":["Tak, często występuje","Nie — takie połączenie nie występuje w ADR","Tylko w odpadach medycznych"],"correct":"Nie — takie połączenie nie występuje w ADR"},"match":{"prompt":"Dopasuj podklasę klasy 6:","pairs":{"6.1":"trujące","6.2":"zakaźne (odpady medyczne, wirusy)"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-podklasa-6-pulapka@adr-2025"},{"id":"s-podklasa-gazu","block":2,"topic":"Klasy zagrożeń","kind":"skill","scope":"podstawowy","adrRef":"ADR 2.2.2","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Klasa 2: 2.1 gazy palne (propan), 2.2 gazy niepalne i nietrujące — MOGĄ BYĆ DUSZĄCE (azot, argon), 2.3 gazy trujące (chlor). Pułapka: 2.2 nie jest \"bezpieczny\" — dusi, wypierając tlen. Dlatego przy gazach unika się zagłębień terenu.","q":{"match":{"prompt":"Dopasuj gaz do podklasy:","pairs":{"Propan":"2.1 palny","Azot":"2.2 niepalny, duszący","Chlor":"2.3 trujący"}},"scenario":{"prompt":"Wyciek azotu (2.2) w zagłębieniu terenu. Czy to groźne?","options":["Nie, azot jest niepalny i nietrujący","Tak — dusi, wypierając tlen; unikać zagłębień","Tylko przy otwartym ogniu"],"correct":"Tak — dusi, wypierając tlen; unikać zagłębień"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-podklasa-gazu@adr-2025"},{"id":"s-pozycja-grupowa","block":2,"topic":"Klasyfikacja","kind":"skill","scope":"podstawowy","adrRef":"ADR 3.1.2","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Numer UN może być przypisany do JEDNEJ substancji (UN 1090 ACETON) albo do POZYCJI GRUPOWEJ — kilku towarów o podobnych właściwościach (UN 1263 FARBA). Przy pozycji grupowej pod jednym numerem UN kryją się różne produkty.","q":{"scenario":{"prompt":"UN 1263 FARBA. Czy to jedna konkretna substancją?","options":["Tak, jedna farba","Nie — to pozycja grupowa, wiele produktów o podobnych właściwościach","To numer zagrożenia"],"correct":"Nie — to pozycja grupowa, wiele produktów o podobnych właściwościach"},"match":{"prompt":"Dopasuj typ pozycji:","pairs":{"UN 1090 ACETON":"jedna substancja","UN 1263 FARBA":"pozycja grupowa"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-pozycja-grupowa@adr-2025"},{"id":"s-prozne-nalepki","block":1,"topic":"Wyłączenia w praktyce","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.1.3","source":"kompendium","page":11,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Próżne, nieoczyszczone opakowania pozostają oznakowane tak jak w stanie ładownym. Nie usuwa się nalepek ostrzegawczych ani numerów UN. Zdejmuję się je dopiero po całkowitym oczyszczeniu (robi to rozładowca).","q":{"scenario":{"prompt":"Rozładowałeś DPPL po farbie, nieoczyszczony. Co robisz z nalepka klasy 3?","options":["Usuwam — jest pusty","Zostawiam — nieoczyszczone oznakowane jak ładowne","Zaklejam tasma"],"correct":"Zostawiam — nieoczyszczone oznakowane jak ładowne"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-prozne-nalepki@adr-2025"},{"id":"s-przypisz-klase","block":2,"topic":"Klasyfikacja","kind":"skill","scope":"podstawowy","adrRef":"ADR czesc 2","source":"kompendium","page":3,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Rozpoznanie klasy po towarze to podstawa. Benzyna i olej napędowy = klasa 3 (ciecze zapalne). Propan/butan = klasa 2 (gazy). Kwas siarkowy = klasa 8 (żrące). Baterie litowe = klasa 9. Azotan amonu = klasa 5.1 (utleniający).","q":{"match":{"prompt":"Dopasuj towar do klasy:","pairs":{"Benzyna":"klasa 3","Propan w butli":"klasa 2","Kwas siarkowy":"klasa 8","Baterie litowe":"klasa 9"}},"scenario":{"prompt":"Wieziesz azotan amonu, który podtrzymuje spalanie. Która klasa?","options":["Klasa 3 — bo palny","Klasa 5.1 — utleniający","Klasa 9"],"correct":"Klasa 5.1 — utleniający"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-przypisz-klase@adr-2025"},{"id":"s-sposob-przewozu-rozpoznanie","block":1,"topic":"Jednostka i sposoby przewozu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.2.1 / 5.3","source":"kompendium","page":6,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Rozpoznanie sposobu przewozu decyduje o oznakowaniu pojazdu. Sztuki przesyłki to opakowania: kanistry, bębny, butle, DPPL, worki, BIG-BAGi, wiązki. Luzem to NIEOPAKOWANE materiały stałe, np. zużyte akumulatory. Cysterna to zbiornik z wyposażeniem.","q":{"match":{"prompt":"Dopasuj ładunek do sposobu przewozu:","pairs":{"BIG-BAGi z granulatem":"sztuki przesyłki","Zużyte akumulatory nieopakowane":"luzem","Paliwo w zbiorniku":"cysterna","Butle gazowe na palecie":"sztuki przesyłki"}},"scenario":{"prompt":"Wieziesz BIG-BAGi. To sztuki przesyłki czy luzem?","options":["Luzem — materiał sypki","Sztuki przesyłki — BIG-BAG to opakowanie","Zależy od masy"],"correct":"Sztuki przesyłki — BIG-BAG to opakowanie"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-sposob-przewozu-rozpoznanie@adr-2025"},{"id":"s-swiadectwo-kiedy","block":4,"topic":"Praca z dokumentem","kind":"skill","scope":"podstawowy","adrRef":"ADR 9.1.3","source":"kompendium","page":15,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Świadectwo dopuszczenia (\"czerwony pasek\") wymagane jest dla pojazdów EX/II i EX/III (klasa 1), FL i AT (cysterny) oraz MEMU. Pojazdy przewożące sztuki przesyłki (poza wybuchowymi) i luzem NIE muszą go mieć — np. butle z gazem, DPPL, kanistry.","q":{"scenario":{"prompt":"Wieziesz butle z gazem i kanistry na skrzyni. Czy pojazd potrzebuje świadectwa dopuszczenia?","options":["Tak, zawsze przy ADR","Nie — sztuki przesyłki poza klasa 1 nie wymagaja świadectwa","Tak, powyżej 3,5 t"],"correct":"Nie — sztuki przesyłki poza klasa 1 nie wymagaja świadectwa"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-swiadectwo-kiedy@adr-2025"},{"id":"s-tablica-268-1017","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":18,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Numer 268 = gaz trujący żrący. Cyfra 2 = emisja gazu, 6 = działanie trujące, 8 = działanie żrące. UN 1017 = chlor. Wymagana maska ucieczkowa (nalepka 2.3).","q":{"scenario":{"prompt":"Tablica 268 / 1017 (chlor). Jakie wyposażenie dodatkowe jest wymagane?","options":["Łopata i pojemnik","Maska ucieczkowa dla każdego członka załogi","Tylko gaśnica 2 kg"],"correct":"Maska ucieczkowa dla każdego członka załogi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tablica-268-1017@adr-2025"},{"id":"s-tablica-33-1203","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Górny numer 33: cyfra 3 = zapalność cieczy, podwojenie = nasilenie, czyli materiał łatwo zapalny ciekły o temperaturze zapłonu poniżej 23 st. C. Dolny 1203 = benzyna silnikowa.","q":{"scenario":{"prompt":"Cysterna z tablica 33 / 1203. Co wieziesz i jakie jest główne zagrożenie?","options":["Olej napędowy, zagrożenie środowiska","Benzynę, materiał łatwo zapalny (zapłon poniżej 23 st. C)","Chlor, gaz trujący"],"correct":"Benzynę, materiał łatwo zapalny (zapłon poniżej 23 st. C)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tablica-33-1203@adr-2025"},{"id":"s-tablica-90-3082","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":20,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Numer 90 = materiał zagrażający środowisku, różne materiały niebezpieczne. UN 3082 = materiał zagrażający środowisku wodnemu, ciekły, i.n.o. (klasa 9).","q":{"scenario":{"prompt":"Cysterna z tablica 90 / 3082. Wyciek do rowu. Co jest głównym problemem?","options":["Pożar","Skażenie środowiska wodnego","Wybuch"],"correct":"Skażenie środowiska wodnego"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tablica-90-3082@adr-2025"},{"id":"s-tablica-sklad-cyfr","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":18,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match"],"why":"Numer rozpoznawczy składa się z cyfr o stalym znaczeniu: 2 emisja gazu, 3 zapalność cieczy, 4 zapalność ciał stałych, 5 utleniające, 6 trujące/zakaźne, 7 promieniotwórcze, 8 żrące, 9 gwałtowna reakcja. Składając je czytasz zagrożenie bez tabeli.","q":{"match":{"prompt":"Rozłóż numer na zagrożenia:","pairs":{"26":"gaz trujący","80":"materiał żrący","336":"łatwo zapalny ciekły trujący","539":"nadtlenek organiczny zapalny"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tablica-sklad-cyfr@adr-2025"},{"id":"s-tablica-x-woda","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Litera X przed numerem = materiał reaguje niebezpiecznie z wodą. Woda może być użyta tylko za zgoda specjalistów. To informacja ratująca życie przy gaszeniu.","q":{"scenario":{"prompt":"Tablica X423. Pali się ładunek. Straż pyta czy można lać wodę. Twoja odpowiedź:","options":["Tak, woda gasi wszystko","NIE bez zgody specjalistów — X oznacza niebezpieczna reakcje z wodą","Tylko mało wody"],"correct":"NIE bez zgody specjalistów — X oznacza niebezpieczna reakcje z wodą"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tablica-x-woda@adr-2025"},{"id":"s-tablica-zero","block":2,"topic":"Odczyt tablicy","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Zero na drugiej pozycji oznacza brak zagrożenia dodatkowego i brak nasilenia. Towar zwykle należy do II lub III grupy pakowania. Numer 30 = materiał zapalny ciekły (23-60 st. C).","q":{"scenario":{"prompt":"Tablica 30 / 1202. Co mówi Ci zero na drugiej pozycji?","options":["Materiał jest wybuchowy","Brak zagrożenia dodatkowego, zwykle II lub III grupa pakowania","Reaguje z woda"],"correct":"Brak zagrożenia dodatkowego, zwykle II lub III grupa pakowania"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tablica-zero@adr-2025"},{"id":"s-temp-kontrolowana-kiedy","block":2,"topic":"Klasy zagrożeń","kind":"skill","scope":"podstawowy","adrRef":"ADR 7.1.7","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Temperatury kontrolowanej mogą wymagać klasy 4.1 (samoreaktywne) i 5.2 (nadtlenki organiczne) — reakcja egzotermiczna. Wtedy: termometr z 2 czujnikami, sprawdzanie co 4-6 h, rejestracja, procedura na wypadek utraty kontroli temperatury. Zapis w dokumencie: TEMPERATURA KONTROLOWANA / TEMPERATURA AWARYJNA.","q":{"scenario":{"prompt":"Wieziesz nadtlenek organiczny w temperaturze kontrolowanej. Co ile sprawdzasz temperaturę?","options":["Co godzinę","Co 4-6 h, z rejestracja","Raz na początku trasy"],"correct":"Co 4-6 h, z rejestracja"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-temp-kontrolowana-kiedy@adr-2025"},{"id":"s-tunel-b","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.9.5","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Kod (B) = zakaz w tunelach B, C, D i E. Przejechać można tylko tunelem kategorii A (nieoznakowany lub ze znakiem D-37). To najbardziej restrykcyjny kod dla przewozu.","q":{"scenario":{"prompt":"Kod tunelowy (B). Przez które tunele możesz przejechać?","options":["Wszystkie","Tylko A (nieoznakowany lub D-37)","A, B i C"],"correct":"Tylko A (nieoznakowany lub D-37)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tunel-b@adr-2025"},{"id":"s-tunel-de-cysterna","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.9.5","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Kod (D/E) czytamy: D dotyczy cysterny i luzem, E dotyczy sztuk przesyłki. Cysterna z kodem D nie może wjechać do tunelu D ani E. Do C, B i A może.","q":{"scenario":{"prompt":"Dokument: kod tunelowy (D/E). Wieziesz w CYSTERNIE. Tunel kategorii D — wjeżdżasz?","options":["Tak","Nie — dla cysterny obowiązuje D, zakaz w tunelu D i E","Tylko z eskorta"],"correct":"Nie — dla cysterny obowiązuje D, zakaz w tunelu D i E"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tunel-de-cysterna@adr-2025"},{"id":"s-tunel-de-sztuki","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.9.5","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Kod (D/E): przy przewozie w sztukach przesyłki obowiązuje E — zakaz tylko w tunelu kategorii E. Do D, C, B i A wolno.","q":{"scenario":{"prompt":"Ten sam kod (D/E), ale wieziesz w SZTUKACH Przesyłki. Tunel kategorii D — wjeżdżasz?","options":["Nie","Tak — dla sztuk obowiązuje E, zakaz dopiero w tunelu E","Tylko noca"],"correct":"Tak — dla sztuk obowiązuje E, zakaz dopiero w tunelu E"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tunel-de-sztuki@adr-2025"},{"id":"s-tunel-gdzie-kod","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR kol. 15","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Kod tunelowy towaru znajdziesz w dokumencie przewozowym (w nawiasie na końcu zapisu) oraz w tabeli A w kolumnie 15. Kategorie tunelu na drodze odczytasz z tabliczki pod znakiem B-13a.","q":{"scenario":{"prompt":"Skąd wiesz, jaki kod tunelowy ma Twój towar?","options":["Z tablicy pomarańczowej","Z dokumentu przewozowego (nawias) lub tabeli A kolumna 15","Z instrukcji pisemnej"],"correct":"Z dokumentu przewozowego (nawias) lub tabeli A kolumna 15"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tunel-gdzie-kod@adr-2025"},{"id":"s-tunel-lq","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR 3.4 / 1.9.5","source":"kompendium","page":10,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Jednostka powyżej 12 t DMC przewożąca powyżej 8 t brutto towarów w ilościach ograniczonych (LQ) musi być oznakowana znakiem LQ i NIE MOŻE wjeżdżać do tunelu kategorii E.","q":{"scenario":{"prompt":"Ciężarówka 24 t DMC, 10 t brutto towarów LQ. Tunel kategorii E — wjeżdżasz?","options":["Tak, LQ jest zwolnione","Nie — LQ powyżej 8 t brutto ma zakaz tunelu E","Tak, jeśli nie ma tablic"],"correct":"Nie — LQ powyżej 8 t brutto ma zakaz tunelu E"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tunel-lq@adr-2025"},{"id":"s-tunel-minus","block":4,"topic":"Decyzja o tunelu","kind":"skill","scope":"podstawowy","adrRef":"ADR 1.9.5 / kol. 15","source":"kompendium","page":23,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Kod \"(-)\" w kolumnie 15 tabeli A oznacza brak ograniczeń tunelowych — wolno wjechać do każdego tunelu, łącznie z E. Dotyczy m.in. UN 2814, 2900, 2919, 3166, 3171, 3331, 3359, 3373, 3549.","q":{"scenario":{"prompt":"Kod tunelowy \"(-)\". Tunel kategorii E — wjeżdżasz?","options":["Nie, E to zawsze zakaz","Tak — kod (-) oznacza brak ograniczeń","Tylko jeśli masz eskorte"],"correct":"Tak — kod (-) oznacza brak ograniczeń"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-tunel-minus@adr-2025"},{"id":"s-un-3077-3082","block":3,"topic":"Materiały zagrażające środowisku","kind":"skill","scope":"podstawowy","adrRef":"ADR 3.2.1","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Materiał zagrażający środowisku: UN 3077 gdy STAŁY, UN 3082 gdy CIEKŁY. Oba należą do klasy 9. Numer rozpoznawczy zagrożenia dla nich to 90.","q":{"scenario":{"prompt":"Wieziesz ciekły materiał zagrażający środowisku. Który numer UN?","options":["UN 3077","UN 3082","UN 1203"],"correct":"UN 3082"},"match":{"prompt":"Dopasuj stan skupienia do numeru UN:","pairs":{"STAŁY":"UN 3077","CIEKŁY":"UN 3082"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-un-3077-3082@adr-2025"},{"id":"s-uprawnienia-cysterna","block":1,"topic":"Zakres uprawnień","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.2.1","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"ADR podstawowy obejmuje cysterny stałe i odejmowalne do 1000 l oraz kontenery-cysterny do 3000 l. Powyżej tych progów wymagany jest kurs specjalistyczny cysterny (od 1 m3 = 1000 l).","q":{"scenario":{"prompt":"Masz tylko ADR podstawowy. Kontener-cysterna 2500 l z olejem napędowym — możesz?","options":["Nie, każda cysterna wymaga kursu","Tak — kontenery-cysterny do 3000 l są w zakresie podstawowym","Tylko do 1000 l"],"correct":"Tak — kontenery-cysterny do 3000 l są w zakresie podstawowym"},"match":{"prompt":"Zakres ADR podstawowego:","pairs":{"Cysterna stala/odejmowalna":"do 1000 l","Kontener-cysterna":"do 3000 l"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-uprawnienia-cysterna@adr-2025"},{"id":"s-uprawnienia-klasy","block":1,"topic":"Zakres uprawnień","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.2.1","source":"kompendium","page":13,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"ADR podstawowy pozwala przewozić wszystkie klasy POZA 1 (wybuchowe) i 7 (promieniotwórcze), w sztukach przesyłki oraz luzem. Klasa 1 i 7 wymagaja osobnych kursów specjalistycznych.","q":{"scenario":{"prompt":"Masz ADR podstawowy. Których klas NIE wolno Ci wieźć?","options":["Klasy 3 i 8","Klasy 1 i 7","Klasy 6.1 i 6.2"],"correct":"Klasy 1 i 7"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-uprawnienia-klasy@adr-2025"},{"id":"s-wiatr-opary","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Należy unikać wdychania oparów, dymu, pyłu i pary poprzez pozostawanie po stronie NAWIETRZNEJ — czyli tam, skąd wieje wiatr. Wiatr wieje od Ciebie w stronę zdarzenia, nie odwrotnie.","q":{"scenario":{"prompt":"Wyciek z cysterny, wiatr wieje z zachodu. Gdzie się ustawiasz?","options":["Na wschód od wycieku (z wiatrem)","Na zachód od wycieku (strona nawietrzną)","Bez znaczenia"],"correct":"Na zachód od wycieku (strona nawietrzną)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-wiatr-opary@adr-2025"},{"id":"s-wypadek-sekwencja","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["order"],"why":"Sekwencja z instrukcji pisemnej: najpierw zabezpiecz pojazd (zahamuj, wyłącz silnik, odłącz akumulator), potem załóż kamizelkę i ustaw znaki, powiadom służby, zapewnij ratownikom dostęp do dokumentów. Oddał się po stronie nawietrznej.","q":{"order":{"prompt":"Ulóz kolejność działań po wypadku:","items":["Powiadom służby ratownicze","Zahamuj, wyłącz silnik, odłącz akumulator","Załóż kamizelkę, ustaw znaki ostrzegawcze","Zapewnij ratownikom dostęp do dokumentów"],"correct":["Zahamuj, wyłącz silnik, odłącz akumulator","Załóż kamizelkę, ustaw znaki ostrzegawcze","Powiadom służby ratownicze","Zapewnij ratownikom dostęp do dokumentów"]}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-wypadek-sekwencja@adr-2025"},{"id":"s-wyposazenie-ilosci","block":4,"topic":"Dobór wyposażenia","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.5","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Na każdego członka załogi: kamizelka, latarka, rękawice, ochrona oczu, maska ucieczkowa (gdy wymagana). Po 1 sztuce w pojeździe niezależnie od załogi: płyn do płukania oczu, łopata, osłona kanalizacji, pojemnik. Klin — dla każdego pojazdu. Znaki stojące — 2 na jednostkę.","q":{"match":{"prompt":"Załoga 2 osoby — ile sztuk?","pairs":{"Kamizelka":"2 (na każdego)","Maska ucieczkowa":"2 (na każdego)","Płyn do płukania oczu":"1 (na pojazd)","Łopata":"1 (na pojazd)"}},"scenario":{"prompt":"Załoga 2 osoby, przewóz klasy 3. Ile łopat musisz mieć?","options":["Dwie — po jednej na osobę","Jedna — niezależnie od liczby załogi","Żadnej"],"correct":"Jedna — niezależnie od liczby załogi"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-wyposazenie-ilosci@adr-2025"},{"id":"s-wyposazenie-klasa2-3","block":4,"topic":"Dobór wyposażenia","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.5.3","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario","match"],"why":"Nalepka 2.3 (gazy trujące) wymaga maski ucieczkowej dla każdego członka załogi. Jednocześnie płyn do płukania oczu NIE jest wymagany przy nalepkach 1, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3. Łopata też nie — 2.3 nie jest na liście 3/4.1/4.3/8/9.","q":{"scenario":{"prompt":"Wieziesz chlor (nalepka 2.3), załoga 2 osoby. Czego potrzebujesz?","options":["2 maski ucieczkowe, bez płynu do oczu i łopaty","1 maska, płyn do oczu, łopata","Tylko łopata"],"correct":"2 maski ucieczkowe, bez płynu do oczu i łopaty"},"match":{"prompt":"Nalepka 2.3 — co wymagane, co nie:","pairs":{"Maska ucieczkowa":"wymagana","Płyn do płukania oczu":"niewymagany","Łopata":"niewymagana"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-wyposazenie-klasa2-3@adr-2025"},{"id":"s-wyposazenie-klasa3","block":4,"topic":"Dobór wyposażenia","kind":"skill","scope":"podstawowy","adrRef":"ADR 8.1.5","source":"kompendium","page":16,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Nalepka 3 należy do grupy 3, 4.1, 4.3, 8, 9 — wymagana łopata, osłona otworów kanalizacyjnych i pojemnik do zbierania pozostałości (po 1 sztuce). Płyn do płukania oczu też wymagany (nie jest na liście wyłączeń 1/2.x).","q":{"scenario":{"prompt":"Wieziesz benzynę (nalepka 3). Jakie wyposażenie dodatkowe poza standardem?","options":["Maska ucieczkowa","Łopata, osłona kanalizacji, pojemnik","Nic dodatkowego"],"correct":"Łopata, osłona kanalizacji, pojemnik"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-wyposazenie-klasa3@adr-2025"},{"id":"s-x-opakowanie-vs-tablica","block":2,"topic":"Odczyt opakowania","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.3.2.3 / 6.1.2","source":"kompendium","page":17,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Pułapka egzaminacyjna: litera X ma DWA różne znaczenia. Na tablicy pomarańczowej (przed numerem zagrożenia) = niebezpieczna reakcja z wodą. W kodzie opakowania = mocne opakowanie do I, II i III grupy pakowania. To nie ma ze soba związku.","q":{"scenario":{"prompt":"Litera X w kodzie opakowania oznacza:","options":["Niebezpieczna reakcje z wodą","Mocne opakowanie do I, II i III grupy pakowania","Materiał wybuchowy"],"correct":"Mocne opakowanie do I, II i III grupy pakowania"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-x-opakowanie-vs-tablica@adr-2025"},{"id":"s-zgloszenie-sluzbom","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"procedury krajowe","source":"kompendium","page":27,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["order","scenario"],"why":"Kolejność informacji dla służb: miejsce zdarzenia, rodzaj zdarzenia, skutki, liczba ofiar, rozmiar (ile pojazdów/osób), numery UN, sposób przewozu (luzem/cysterna), ilość towaru, czy nastąpiło uwolnienie. Numer UN odczytasz z tablicy lub dokumentu.","q":{"order":{"prompt":"Ulóz kolejność informacji przekazywanych służbom:","items":["Numery UN i ilość towaru","Miejsce zdarzenia","Rodzaj zdarzenia i skutki","Liczba ofiar"],"correct":["Miejsce zdarzenia","Rodzaj zdarzenia i skutki","Liczba ofiar","Numery UN i ilość towaru"]},"scenario":{"prompt":"Skąd bierzesz numer UN do zgłoszenia, jeśli dokument spłonął?","options":["Z pamięci","Z tablicy pomarańczowej na pojeździe","Dzwonie do przewoźnika"],"correct":"Z tablicy pomarańczowej na pojeździe"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-zgloszenie-sluzbom@adr-2025"},{"id":"s-znak-srodowisko-prog","block":3,"topic":"Materiały zagrażające środowisku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.2.1.8.1","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Znak materiału zagrażającego środowisku (ryba i uschnięte drzewo) umieszcza się na opakowaniach WIĘKSZYCH niż 5 kg lub 5 litrów. Poniżej tego progu znak nie jest wymagany.","q":{"scenario":{"prompt":"Kanister 3 l z materiałem zagrażającym środowisku. Czy potrzebny znak ryba/drzewo?","options":["Tak, zawsze","Nie — znak od opakowań powyżej 5 kg lub 5 l","Tylko przy transporcie międzynarodowym"],"correct":"Nie — znak od opakowań powyżej 5 kg lub 5 l"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-znak-srodowisko-prog@adr-2025"},{"id":"s-znak-temperatura-prog","block":3,"topic":"Materiały zagrażające środowisku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.2.1.8.1","source":"kompendium","page":4,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["match","scenario"],"why":"Znak podwyższonej temperatury (czerwony trójkąt z termometrem) dotyczy materiałów stałych powyżej 240 st. C i ciekłych powyżej 100 st. C. Zagrożenie poparzeniem — unikać kontaktu z gorącymi częściami jednostki i z uwolnionym materiałem.","q":{"match":{"prompt":"Dopasuj próg podwyższonej temperatury:","pairs":{"Materiał stały":"powyżej 240 st. C","Materiał ciekły":"powyżej 100 st. C"}},"scenario":{"prompt":"Ciekły materiał o temperaturze 120 st. C. Czy wymaga znaku podwyższonej temperatury?","options":["Nie, próg to 240 st. C","Tak — dla ciekłych próg to 100 st. C","Tylko w cysternie"],"correct":"Tak — dla ciekłych próg to 100 st. C"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-znak-temperatura-prog@adr-2025"},{"id":"s-zrodla-zaplonu-decyzja","block":5,"topic":"Reakcja po wypadku","kind":"skill","scope":"podstawowy","adrRef":"ADR 5.4.3.4","source":"kompendium","page":2,"edition":"ADR 2025","status":"core","verifiedBy":"domo","formats":["scenario"],"why":"Po wypadku należy unikać źródeł zapłonu: nie palić, nie używać e-papierosów, NIE WŁĄCZAĆ żadnych urządzeń elektrycznych. Telefon jako latarka to urządzenie elektryczne — użyj latarki z wyposażenia ADR (jest przystosowana).","q":{"scenario":{"prompt":"Noc, wyciek benzyny, chcesz oświetlić miejsce. Czego używasz?","options":["Telefonu — ma najlepsza latarkę","Latarki z wyposażenia ADR","Zapalniczki"],"correct":"Latarki z wyposażenia ADR"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"s-zrodla-zaplonu-decyzja@adr-2025"},{"id":"x-baterie-sodowe-2025","block":2,"topic":"Zmiany ADR 2025","kind":"fact","scope":"podstawowy","adrRef":"ADR 2025 UN 3551/3552","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["mcq"],"why":"ROZSZERZENIE (poza kompendium): ADR 2025 wprowadza baterie sodowo-jonowe — UN 3551 (z elektrolitem organicznym) i UN 3552 (zapakowane z urządzeniem lub w urządzeniu). Kod klasyfikacyjny M4 obejmuje teraz baterie litowe i sodowo-jonowe. DO WERYFIKACJI.","q":{"mcq":{"prompt":"Baterie sodowo-jonowe z elektrolitem organicznym (ADR 2025) mają numer:","options":["UN 3480","UN 3551","UN 3090"],"correct":"UN 3551"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"x-baterie-sodowe-2025"},{"id":"x-dokument-kabina-2025","block":4,"topic":"Zmiany ADR 2025","kind":"fact","scope":"podstawowy","adrRef":"ADR 5.4.1 (zmiana 2025)","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["mcq"],"why":"ROZSZERZENIE (poza kompendium): według źródeł dot. ADR 2025 od 1 lipca 2025 dokumenty przewozowe muszą znajdować się w kabinie kierowcy. Kompendium ADR 2023 tego nie zawiera. DO WERYFIKACJI.","q":{"mcq":{"prompt":"Gdzie od lipca 2025 musi znajdować się dokument przewozowy?","options":["W biurze przewoźnika","W kabinie kierowcy","U nadawcy"],"correct":"W kabinie kierowcy"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"x-dokument-kabina-2025"},{"id":"x-kamizelka-eniso20471-2025","block":4,"topic":"Zmiany ADR 2025","kind":"fact","scope":"podstawowy","adrRef":"ADR 2025, 8.1.5 + EN ISO 20471:2023","source":"key-amendments-2025","page":null,"edition":"ADR 2025","status":"rozszerzenie","verifiedBy":"domo","formats":["mcq"],"why":"ROZSZERZENIE (poza kompendium): ADR 2025 doprecyzowuje, ze kamizelka ostrzegawcza w wyposażeniu pojazdu ma spełniać normę EN ISO 20471:2023 (lepsza widoczność w słabym świetle). DO WERYFIKACJI DGSA.","q":{"mcq":{"prompt":"Jaka normę ma spełniać kamizelka ostrzegawcza wg ADR 2025?","options":["EN ISO 20471:2023","EN 471:1994 (stara)","Dowolna kamizelka odblaskowa"],"correct":"EN ISO 20471:2023"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"x-kamizelka-eniso20471-2025"},{"id":"x-lq-szkolenie-2025","block":1,"topic":"Zmiany ADR 2025","kind":"fact","scope":"podstawowy","adrRef":"ADR 8.2.3 (doprecyzowanie 2025)","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["mcq"],"why":"ROZSZERZENIE (poza kompendium): według źródeł dot. ADR 2025 doprecyzowano wymóg szkolenia załogi przewożącej towary w ilościach ograniczonych (LQ). DO WERYFIKACJI — kompendium ADR 2023 tego nie precyzuje.","q":{"mcq":{"prompt":"Czy załoga przewożąca towary LQ wymaga udokumentowanego szkolenia (ADR 2025)?","options":["Nie, LQ jest całkowicie zwolnione","Tak, wymóg doprecyzowany w ADR 2025","Tylko powyżej 8 t"],"correct":"Tak, wymóg doprecyzowany w ADR 2025"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"x-lq-szkolenie-2025"},{"id":"x-pojazdy-baterie-2025","block":2,"topic":"Zmiany ADR 2025","kind":"fact","scope":"podstawowy","adrRef":"ADR 2025 UN 3556-3558","source":"research","page":null,"edition":"ADR 2025","status":"ext-2025","verifiedBy":"domo","formats":["match"],"why":"ROZSZERZENIE (poza kompendium): ADR 2025 wprowadza numery UN 3556 (pojazd napędzany bateria litowo-jonowa), UN 3557 (litowo-metalowa), UN 3558 (sodowo-jonowa). Stosuje się nową instrukcję pakowania P912. DO WERYFIKACJI.","q":{"match":{"prompt":"Dopasuj numer UN do rodzaju pojazdu (ADR 2025):","pairs":{"UN 3556":"pojazd z bateria litowo-jonowa","UN 3557":"pojazd z bateria litowo-metalowa","UN 3558":"pojazd z bateria sodowo-jonowa"}}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"x-pojazdy-baterie-2025"},{"id":"x-segregacja-klasa1-uproszczenie-2025","block":4,"topic":"Zmiany ADR 2025","kind":"fact","scope":"specjalistyczny","adrRef":"ADR 2025, 7.5.2.2","source":"key-amendments-2025","page":null,"edition":"ADR 2025","status":"rozszerzenie","verifiedBy":"domo","formats":["mcq"],"why":"ROZSZERZENIE (poza kompendium): ADR 2025 upraszcza matryce mieszanego ładowania, szczególnie dla klasy 1 (materiały wybuchowe). Zakres specjalistyczny. DO WERYFIKACJI DGSA.","q":{"mcq":{"prompt":"Co ADR 2025 zmienił w zasadach mieszanego ładowania?","options":["Uprościł matryce, szczególnie dla klasy 1","Zniósł wszystkie ograniczenia segregacji","Wprowadził zakaz mieszanego ładowania"],"correct":"Uprościł matryce, szczególnie dla klasy 1"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"x-segregacja-klasa1-uproszczenie-2025"},{"id":"x-sp677-baterie-uszkodzone-2025","block":1,"topic":"Zmiany ADR 2025","kind":"fact","scope":"podstawowy","adrRef":"ADR 2025, SP 677 (3.3)","source":"specialist-training","page":null,"edition":"ADR 2025","status":"rozszerzenie","verifiedBy":"domo","formats":["mcq"],"why":"ROZSZERZENIE (poza kompendium): ADR 2025 wprowadza przepis szczególny SP 677 dla baterii litowych i sodowo-jonowych uszkodzonych w sposób krytyczny. Takie baterie przewozi się jako kategoria transportową 0 — nigdy nie podlegają wyłączeniu 1.1.3.6. DO WERYFIKACJI DGSA.","q":{"mcq":{"prompt":"Do jakiej kategorii transportowej ADR 2025 przypisuje krytycznie uszkodzone baterie (SP 677)?","options":["Kategoria 0 (nigdy nie zwolniona)","Kategoria 2","Kategoria 4 (bez ograniczeń)"],"correct":"Kategoria 0 (nigdy nie zwolniona)"}},"_currency":"CURRENT","_trust":"T1","_editionRef":"adr-2025","_lifecycle":"PUBLISHED","_entryId":"x-sp677-baterie-uszkodzone-2025"}];
function supportedFormats(f) {
  return f.formats || [];
}

/** Tematy bloku w kolejności pierwszego wystąpienia, z przeplotem skill->fact. */
function topicsOfBlock(blockId) {
  const items = FACTS.filter(f => f.block === blockId);
  const order = [];
  for (const it of items) if (!order.includes(it.topic)) order.push(it.topic);
  return order.map(name => {
    const ti = items.filter(i => i.topic === name);
    const skills = ti.filter(i => i.kind === 'skill');
    const facts = ti.filter(i => i.kind === 'fact');
    const refs = ti.filter(i => i.kind === 'ref');
    const woven = [];
    const max = Math.max(skills.length, facts.length);
    for (let i = 0; i < max; i++) {
      if (skills[i]) woven.push(skills[i]);
      if (facts[i]) woven.push(facts[i]);
    }
    return {
      name,
      items: [...woven, ...refs],
      total: ti.length
    };
  });
}

// packs-content.js — moduły treningowe DriverOS (poza ADR).
// Treść odzyskana z sesji projektowej (pakiety czas-pracy/tachograf/pierwsza-pomoc/
// mocowanie/załadunek) + uzupełnienia na bazie tych samych źródeł:
// Rozp. (WE) 561/2006, Rozp. (UE) 165/2014, EN 12195-1, wytyczne pierwszej pomocy.
// STATUS: DRAFT — wymaga weryfikacji przed publikacją (bramka z repo obowiązuje).
// Format znormalizowany do trenera: { id, module, formats, why, q:{...}, ref }

const PACKS = [];

/* ---------- MODUŁY: ADR (218, bloki/tematy) + 6 pakietów (płaskie) ----------
   Jeden silnik konsumuje każdy moduł identycznie — moduł to dane, nie kod.   */
const PACK_FACTS = PACKS.flatMap(p => p.facts.map(f => ({
  ...f,
  module: p.id,
  block: p.title,
  topic: p.title,
  kind: "fact",
  adrRef: f.ref,
  page: null
})));
const ADR_FACTS = FACTS.map(f => ({
  ...f,
  module: "adr"
}));
const ALL = [...ADR_FACTS, ...PACK_FACTS];
const MODULES = [{
  id: "adr",
  title: "ADR",
  icon: "⚠️",
  count: ADR_FACTS.length,
  structured: true
}, ...PACKS.map(p => ({
  id: p.id,
  title: p.title,
  icon: p.icon,
  count: p.facts.length,
  structured: false
}))];

/* ══════════════════════════════════════════════════════════════════════
   DriverOS · Trener ADR — 218 pozycji, blok → temat → zadania
   Styl DriverOS. Silnik Leitnera. Materiał opracowany na bazie umowy ADR.
   ══════════════════════════════════════════════════════════════════════ */

const C = {
  bg: "#0E1117",
  card: "#171B22",
  line: "#232833",
  edge: "#2C3340",
  text: "#E8EAED",
  dim: "#6B7280",
  faint: "#4B515C",
  red: "#C1121F",
  green: "#1B7F4B",
  greenLite: "#5FA777",
  amber: "#D98F3F",
  danger: "#D98880",
  skill: "#C1121F",
  fact: "#5FA777",
  ref: "#6B7280",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace"
};

/* ---------- SILNIK LEITNERA ---------- */
/* Wydzielony do ./leitner.js (B5) — jedno źródło logiki powtórek, koniec kopii inline.
   INTERVALS/review/buildQueue są 1:1 z engine/ (core-learning, 63 testy). */
const norm = v => typeof v === "string" ? v.trim().toLowerCase() : v;
const arrEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((x, i) => norm(x) === norm(b[i]));
const mapEq = (a, b) => {
  const ka = Object.keys(a),
    kb = Object.keys(b);
  return ka.length === kb.length && ka.every(k => norm(a[k]) === norm(b[k]));
};

/* ---------- projekcja: fakt + format -> pytanie (dane gotowe z ZIP) ---------- */
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = Math.floor(seed * 233280) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor(s / 233280 * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildQuestion(f, format, seed) {
  const q = f.q[format];
  const base = {
    id: f.id,
    block: f.block,
    topic: f.topic,
    kind: f.kind,
    format,
    why: f.why,
    okMsg: f.okMsg,
    badMsg: f.badMsg,
    adrRef: f.adrRef,
    page: f.page
  };
  if (format === "mcq" || format === "scenario") return {
    ...base,
    prompt: q.prompt,
    options: seededShuffle(q.options, seed),
    correct: q.correct
  };
  if (format === "fill") return {
    ...base,
    prompt: q.prompt,
    hint: q.hint,
    correct: q.correct
  };
  if (format === "match") return {
    ...base,
    prompt: q.prompt,
    pairs: q.pairs,
    right: seededShuffle(Object.values(q.pairs), seed),
    correct: q.pairs
  };
  if (format === "order") return {
    ...base,
    prompt: q.prompt,
    scrambled: q.items || seededShuffle(q.correct, seed + 0.3),
    correct: q.correct
  };
  return null;
}
const FMT_LABEL = {
  mcq: "Wybór",
  match: "Dopasowanie",
  fill: "Uzupełnij",
  order: "Kolejność",
  scenario: "Scenariusz"
};

/* ══════════════════════════════════════════════════════════════════════
   WARSTWA ZAPISU (shared/storage z Artefaktu #0004)
   Port z dwiema implementacjami: localStorage (produkcja) + pamięć (fallback).
   Dane użytkownika (FactState[]) — NIE wiedza. W produkcji szyfrowane at-rest.
   ══════════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = "adrtrainer.progress.v2";
function makeStorage() {
  // detekcja localStorage — w artefakcie czatu niedostępny, w apce ze sklepu działa
  let hasLS = false;
  try {
    const t = "__t";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    hasLS = true;
  } catch (e) {
    hasLS = false;
  }
  if (hasLS) {
    return {
      mode: "local",
      load() {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch (e) {
          return null;
        }
      },
      save(states) {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
        } catch (e) {}
      },
      clear() {
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
      }
    };
  }
  // fallback: pamięć (prototyp) — znika po zamknięciu, ale apka nie pęka
  let mem = null;
  return {
    mode: "memory",
    load: () => mem,
    save: s => {
      mem = s;
    },
    clear: () => {
      mem = null;
    }
  };
}
const storage = makeStorage();

// Surowy magazyn klucz-wartość dla modułu dziennego nawyku (własny klucz HABIT_KEY).
// Ta sama detekcja co makeStorage: działa w apce ze sklepu, degraduje do pamięci w czacie.
const rawStore = (() => {
  let mem = {};
  let hasLS = false;
  try {
    const t = "__t";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    hasLS = true;
  } catch (e) {
    hasLS = false;
  }
  return {
    getItem(k) {
      if (hasLS) { try { return window.localStorage.getItem(k); } catch (e) { return mem[k] ?? null; } }
      return mem[k] ?? null;
    },
    setItem(k, v) {
      if (hasLS) { try { window.localStorage.setItem(k, v); return; } catch (e) {} }
      mem[k] = v;
    },
  };
})();

/** Liczy zaległe powtórki z zapisanego stanu — dla Dashboard (badge, podpowiedzi AI).
    Nie renderuje trenera; czyta ten sam storage. Realna liczba, nie atrapa. */
function countDueReviews() {
  const saved = storage.load();
  const states = mergeStates(saved);
  const now = Date.now();
  return states.filter(s => s.dueAt !== null && s.dueAt <= now).length;
}

/** Scala zapisane stany z aktualną bazą: nowe fakty dochodzą, usunięte znikają. */
function mergeStates(saved) {
  const byId = new Map((saved || []).map(s => [s.id, s]));
  return ALL.map(f => byId.get(f.id) || newFact(f.id));
}

/* ══════════════════════════════════════════════════════════════════════
   FREEMIUM / LICENCJA — bramka „2 bloki za darmo, reszta płatna".
   Bloki 1-2 darmowe (pełny silnik Leitnera na próbce). Bloki 3-5 płatne.
   Odblokowanie: klucz licencyjny z Lemon Squeezy (kupno POZA apką — zgodne
   z zasadą Google Play „consumption-only", bez płatności wewnątrz apki).
   Klucz aktywowany lokalnie; walidacja online przez API Lemon Squeezy,
   z łagodnym fallbackiem offline (klucz raz zaktywowany działa bez sieci).
   ══════════════════════════════════════════════════════════════════════ */
const FREE_BLOCKS = [1, 2];
const LICENSE_KEY_STORAGE = "masteradr.license.v1";
// Cena i link — do podmiany na realny produkt w panelu Lemon Squeezy.
const PRICE_LABEL = "34,99 zł / 14 dni";
const BUY_URL = "https://masteradr.lemonsqueezy.com/buy/PODMIEN-NA-REALNY-LINK";

const license = (() => {
  let mem = null;
  let ok = false;
  try {
    const t = "__ls_probe__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    ok = true;
  } catch (e) {
    ok = false;
  }
  return {
    load() {
      if (ok) {
        try {
          return window.localStorage.getItem(LICENSE_KEY_STORAGE);
        } catch (e) {
          return mem;
        }
      }
      return mem;
    },
    save(key) {
      if (ok) {
        try {
          window.localStorage.setItem(LICENSE_KEY_STORAGE, key);
          return;
        } catch (e) {}
      }
      mem = key;
    },
    clear() {
      if (ok) {
        try {
          window.localStorage.removeItem(LICENSE_KEY_STORAGE);
        } catch (e) {}
      }
      mem = null;
    }
  };
})();

// Czy istnieje zapisany (aktywowany wcześniej) klucz. Nie waliduje online —
// raz aktywowany klucz działa offline (kierowca w trasie bez zasięgu).
function hasLicense() {
  // Paywall wyłączony — darmo do testów (decyzja audytu). Wszystko odblokowane.
  return true;
}

function isBlockLocked(blockId) {
  if (FREE_BLOCKS.includes(blockId)) return false;
  return !hasLicense();
}

// Czy lista faktów dotyka choć jednego zablokowanego bloku.
function idsHaveLocked(ids) {
  if (hasLicense()) return false;
  const set = new Set(ids);
  return FACTS.some(f => set.has(f.id) && !FREE_BLOCKS.includes(f.block));
}

// Aktywacja klucza w Lemon Squeezy. Zwraca {ok, msg}.
// Endpoint publiczny License API — nie wymaga sekretu w apce.
async function activateLicense(rawKey) {
  const key = (rawKey || "").trim();
  if (key.length < 4) return { ok: false, msg: "Wpisz poprawny klucz." };
  // ⚠️ KLUCZ TESTOWY — USUŃ PRZED PUBLIKACJĄ. Odblokowuje bez sieci, do testów UI.
  if (key === "MASTERADR-TEST-2026") {
    license.save(key);
    return { ok: true, msg: "Tryb testowy — odblokowano pełny dostęp." };
  }
  try {
    const res = await fetch("https://api.lemonsqueezy.com/v1/licenses/activate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: "license_key=" + encodeURIComponent(key) + "&instance_name=" + encodeURIComponent("MasterADR")
    });
    const data = await res.json().catch(() => ({}));
    if (data && (data.activated || data.valid)) {
      license.save(key);
      return { ok: true, msg: "Odblokowano pełny dostęp." };
    }
    return { ok: false, msg: (data && data.error) || "Klucz nieważny lub wyczerpany." };
  } catch (e) {
    // Brak sieci: przyjmij klucz o poprawnym formacie, zwaliduje się przy okazji.
    if (/^[A-Za-z0-9-]{8,}$/.test(key)) {
      license.save(key);
      return { ok: true, msg: "Zapisano klucz (offline). Zweryfikuje się przy sieci." };
    }
    return { ok: false, msg: "Brak połączenia i klucz w złym formacie." };
  }
}

/* ══════════════════════════════════════════════════════════════════════ */
/* TRYB SYMULACJI EGZAMINU — osobny od nauki.
   Różnice od sesji Leitnera (celowe):
   - stała, LOSOWA pula 30 pytań (format realnego egzaminu podstawowego),
   - timer 60 min (odlicza, po 0 = auto-oddanie),
   - BEZ feedbacku po każdym pytaniu (jak na prawdziwym egzaminie),
   - BEZ zapisu do Leitnera (egzamin sprawdza, nie uczy),
   - można wracać do pytań (przód/tył) i zmieniać odpowiedź przed oddaniem,
   - wynik na końcu: próg 2/3 (20/30) = zdany.
   Reużywa buildQuestion / QuestionBody / norm / mapEq / arrEq / btn / C. */
const EXAM_COUNT = 30;
const EXAM_MIN = 60;
const EXAM_PASS = 20; // 2/3 z 30

function pickExamPool(facts) {
  // Losuj EXAM_COUNT faktów; z każdego jedno pytanie w losowym wspieranym formacie.
  const usable = facts.filter(f => f && f.q && supportedFormats(f).length);
  const shuffled = [...usable].sort(() => Math.random() - 0.5).slice(0, EXAM_COUNT);
  return shuffled.map((f, i) => {
    const fmts = supportedFormats(f);
    const fmt = fmts[Math.floor(Math.random() * fmts.length)];
    return buildQuestion(f, fmt, (i + 1) / (EXAM_COUNT + 1));
  });
}

function examCheck(q, given) {
  if (given == null) return false;
  if (["mcq", "scenario", "fill"].includes(q.format)) return norm(given) === norm(q.correct);
  if (q.format === "match") return mapEq(q.correct, given);
  if (q.format === "order") return arrEq(q.correct, given);
  return false;
}

function ExamMode({
  facts,
  onExit
}) {
  const [pool] = useState(() => pickExamPool(facts));
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // idx -> given
  const [secs, setSecs] = useState(EXAM_MIN * 60);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (done) return;
    if (secs <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [secs, done]);

  function finish() {
    let correct = 0;
    pool.forEach((q, i) => {
      if (examCheck(q, answers[i])) correct++;
    });
    setResult({
      correct,
      total: pool.length,
      passed: correct >= EXAM_PASS
    });
    setDone(true);
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const answered = Object.keys(answers).length;

  if (done && result) {
    return /*#__PURE__*/React.createElement("div", {
      style: { minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }
    },
      /*#__PURE__*/React.createElement("div", { style: { fontSize: 64, marginBottom: 8 } }, result.passed ? "✅" : "❌"),
      /*#__PURE__*/React.createElement("h1", { style: { fontSize: 28, fontWeight: 900, margin: "0 0 4px" } }, result.passed ? "Zdane!" : "Niezdane"),
      /*#__PURE__*/React.createElement("p", { style: { fontSize: 40, fontWeight: 900, margin: "8px 0", fontFamily: C.mono } }, result.correct, " / ", result.total),
      /*#__PURE__*/React.createElement("p", { style: { color: C.dim, margin: "0 0 24px" } }, "Próg zaliczenia: ", EXAM_PASS, "/", result.total, " (⅔). ", result.passed ? "Na prawdziwym egzaminie też dasz radę — powodzenia!" : "Jeszcze trochę powtórek i będzie dobrze."),
      /*#__PURE__*/React.createElement("button", { style: btn(C.text, C.bg), onClick: onExit }, "Wróć")
    );
  }

  const q = pool[idx];
  return /*#__PURE__*/React.createElement("div", {
    style: { minHeight: "100vh", background: C.bg, color: C.text, display: "flex", flexDirection: "column" }
  },
    /* pasek: czas + postęp */
    /*#__PURE__*/React.createElement("div", {
      style: { padding: "14px 20px", borderBottom: `1px solid ${C.card}`, display: "flex", justifyContent: "space-between", alignItems: "center" }
    },
      /*#__PURE__*/React.createElement("span", { style: { fontFamily: C.mono, fontSize: 18, fontWeight: 800, color: secs < 300 ? "#e5484d" : C.text } }, "⏱ ", mm, ":", ss),
      /*#__PURE__*/React.createElement("span", { style: { fontSize: 13, color: C.dim } }, "Odpowiedziano: ", answered, "/", pool.length)
    ),
    /* pytanie */
    /*#__PURE__*/React.createElement("div", { style: { flex: 1, padding: 20, overflowY: "auto" } },
      /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: C.dim, marginBottom: 8, fontFamily: C.mono } }, "Pytanie ", idx + 1, " / ", pool.length, " · ", q.topic),
      /*#__PURE__*/React.createElement("h2", { style: { fontSize: 20, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.35 } }, q.prompt),
      /*#__PURE__*/React.createElement(QuestionBody, {
        question: q,
        phase: "answer",
        onSubmit: given => setAnswers(a => ({ ...a, [idx]: given }))
      }),
      answers[idx] != null && /*#__PURE__*/React.createElement("p", { style: { color: C.dim, fontSize: 13, marginTop: 12 } }, "✓ Odpowiedź zapisana. Możesz ją zmienić lub przejść dalej.")
    ),
    /* nawigacja */
    /*#__PURE__*/React.createElement("div", {
      style: { padding: 16, borderTop: `1px solid ${C.card}`, display: "flex", gap: 8 }
    },
      /*#__PURE__*/React.createElement("button", { style: { ...btn(C.card, C.text), flex: 1 }, disabled: idx === 0, onClick: () => setIdx(i => Math.max(0, i - 1)) }, "← Wstecz"),
      idx + 1 < pool.length
        ? /*#__PURE__*/React.createElement("button", { style: { ...btn(C.text, C.bg), flex: 1 }, onClick: () => setIdx(i => Math.min(pool.length - 1, i + 1)) }, "Dalej →")
        : /*#__PURE__*/React.createElement("button", { style: { ...btn("#3aa675", "#fff"), flex: 1 }, onClick: finish }, "Zakończ i sprawdź")
    )
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
function AdrTrainer({
  onExit,
  initialModule
}) {
  const [screen, setScreen] = useState("modules");
  try { window.__go = setScreen; } catch (e) {}
  useEffect(() => {
    if (!initialModule) return;
    if (initialModule === "adr") {
      setScreen("home");
      return;
    }
    const pk = PACKS.find(p => p.id === initialModule);
    if (pk) startSessionFromIds(pk.facts.map(f => f.id), pk.title);
    // eslint-disable-next-line
  }, [initialModule]); // modules | home(ADR) | block | session | done | progress | rest
  const [activeBlock, setActiveBlock] = useState(null);
  const [states, setStates] = useState(() => mergeStates(storage.load()));
  // Dzienny nawyk (streak z zamrożeniem + cel dzienny) — osobny od streaka sesji.
  const [habit, setHabit] = useState(() => loadHabit(rawStore));
  // Stan licencji — przerysowuje UI (kłódki, dostęp) po aktywacji klucza.
  const [licensed, setLicensed] = useState(() => hasLicense());
  const refreshLicense = () => setLicensed(hasLicense());

  // zapis przy każdej zmianie postępu (w produkcji: localStorage; w prototypie: pamięć)
  useEffect(() => {
    storage.save(states);
  }, [states]);
  const [queue, setQueue] = useState([]);
  const [qi, setQi] = useState(0);
  const [question, setQuestion] = useState(null);
  const [phase, setPhase] = useState("answer");
  const [lastCorrect, setLastCorrect] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    correct: 0,
    total: 0
  });
  const [boxJump, setBoxJump] = useState(null);
  const [sessionLabel, setSessionLabel] = useState("");
  const [restInfo, setRestInfo] = useState(null);
  const now = () => Date.now();
  const fOf = id => ALL.find(f => f.id === id);
  const stateOf = id => states.find(s => s.id === id);

  /* --- sesja z dowolnej listy id (blok, temat, mieszana) --- */
  function startSessionFromIds(ids, label, force = false) {
    // Bramka freemium: jeśli sesja dotyka płatnego bloku i brak licencji → paywall.
    if (!licensed && idsHaveLocked(ids)) {
      setScreen("paywall");
      return;
    }
    const pool = states.filter(s => ids.includes(s.id));
    let q = buildQueue(pool, now(), {
      max: 20,
      newLimit: 20
    });
    if (q.length === 0) {
      if (!force) {
        setRestInfo({
          label,
          nextDue: nextDueAt(pool),
          ids
        });
        setScreen("rest");
        return;
      }
      q = [...pool].sort((a, b) => a.box - b.box || (a.id < b.id ? -1 : 1)).slice(0, 20);
    }
    setQueue(q);
    setQi(0);
    setSessionStats({
      correct: 0,
      total: 0
    });
    setStreak(0);
    setSessionLabel(label);
    loadQuestion(q, 0);
    setScreen("session");
  }
  const startMixed = (force = false) => {
    // Bez licencji: powtórka dnia miesza tylko darmowe bloki (nie wpycha w paywall).
    const base = window.__ADR_ONLY__ ? ADR_FACTS : ALL;
    const pool = licensed ? base : base.filter(f => f.block == null || FREE_BLOCKS.includes(f.block));
    return startSessionFromIds(pool.map(f => f.id), "Powtórka dnia", force);
  };
  const startExam = () => {
    // Symulacja egzaminu = pełen zakres → funkcja Pro. Bez licencji → paywall.
    if (!licensed) {
      setScreen("paywall");
      return;
    }
    setScreen("exam");
  };
  const startBlock = blockId => startSessionFromIds(FACTS.filter(f => f.block === blockId).map(f => f.id), `Blok ${blockId}`);
  const startTopic = (blockId, topicName) => startSessionFromIds(FACTS.filter(f => f.block === blockId && f.topic === topicName).map(f => f.id), topicName);
  function nextDueAt(pool) {
    const fut = pool.map(s => s.dueAt).filter(d => d && d > now());
    return fut.length ? Math.min(...fut) : null;
  }
  function loadQuestion(q, idx) {
    if (idx >= q.length) return;
    const st = q[idx];
    const f = fOf(st.id);
    const fmt = pickFormat(st.box, supportedFormats(f), 0.5);
    setQuestion(buildQuestion(f, fmt, (idx + 1) / (q.length + 1)));
    setPhase("answer");
    setBoxJump(null);
  }
  function submit(given) {
    let ok = false;
    if (["mcq", "scenario", "fill"].includes(question.format)) ok = norm(given) === norm(question.correct);else if (question.format === "match") ok = mapEq(question.correct, given);else if (question.format === "order") ok = arrEq(question.correct, given);
    const prev = stateOf(question.id);
    const next = review(prev, ok ? "correct" : "wrong", now());
    setStates(all => all.map(s => s.id === question.id ? next : s));
    setBoxJump({
      from: prev.box,
      to: next.box
    });
    setLastCorrect(ok);
    setPhase("feedback");
    setSessionStats(s => ({
      correct: s.correct + (ok ? 1 : 0),
      total: s.total + 1
    }));
    setStreak(st => {
      const ns = ok ? st + 1 : 0;
      setBestStreak(b => Math.max(b, ns));
      return ns;
    });
    // Dzienny nawyk: każda odpowiedź liczy jako aktywność dnia (streak+zamrożenie),
    // poprawna dokłada XP i postęp celu dziennego. Zapis pod własnym kluczem.
    setHabit(h => {
      const today = dayIndex();
      let nh = registerActivity(h, today);
      if (ok) nh = awardCorrect(nh, today);
      saveHabit(rawStore, nh);
      return nh;
    });
  }
  function nextQuestion() {
    const ni = qi + 1;
    if (ni >= queue.length) {
      setScreen("done");
      return;
    }
    setQi(ni);
    loadQuestion(queue, ni);
  }

  /* ═══════════ ROUTING ═══════════ */
  if (screen === "modules") {
    if (window.__ADR_ONLY__) {
      return /*#__PURE__*/React.createElement(Home, {
        states: states,
        onBack: null,
        onBlock: b => {
          setActiveBlock(b);
          setScreen("block");
        },
        licensed: licensed,
        onMixed: () => startMixed(false),
        onExam: () => startExam(),
        onProgress: () => setScreen("progress")
      });
    }
    return /*#__PURE__*/React.createElement(Modules, {
      states: states,
      onExit: onExit,
      fOf: fOf,
      onModule: m => {
        if (m.id === "adr") setScreen("home");else startSessionFromIds(PACKS.find(p => p.id === m.id).facts.map(f => f.id), m.title);
      },
      onMixed: () => startMixed(false),
      onProgress: () => setScreen("progress")
    });
  }
  if (screen === "home") return /*#__PURE__*/React.createElement(Home, {
    states: states,
    licensed: licensed,
    onBack: null,
    onBlock: b => {
      setActiveBlock(b);
      setScreen("block");
    },
    onLockedBlock: () => setScreen("paywall"),
    onHowTo: () => setScreen("howto"),
    onMixed: () => startMixed(false),
    onExam: () => startExam(),
    onProgress: () => setScreen("progress")
  });
  if (screen === "block") return /*#__PURE__*/React.createElement(BlockView, {
    blockId: activeBlock,
    states: states,
    licensed: licensed,
    onTopic: startTopic,
    onWholeBlock: startBlock,
    onBack: () => setScreen("home")
  });
  if (screen === "paywall") return /*#__PURE__*/React.createElement(Paywall, {
    onBack: () => setScreen("home"),
    onActivated: () => {
      refreshLicense();
      setScreen("home");
    }
  });
  if (screen === "howto") return /*#__PURE__*/React.createElement(HowToGet, {
    onBack: () => setScreen("home")
  });
  if (screen === "exam") return /*#__PURE__*/React.createElement(ExamMode, {
    facts: ADR_FACTS,
    onExit: () => setScreen("home")
  });
  if (screen === "rest") return /*#__PURE__*/React.createElement(Rest, {
    info: restInfo,
    onHome: () => setScreen("modules"),
    onForce: () => startSessionFromIds(restInfo.ids, restInfo.label, true)
  });
  if (screen === "done") return /*#__PURE__*/React.createElement(Done, {
    stats: sessionStats,
    bestStreak: bestStreak,
    states: states,
    label: sessionLabel,
    onHome: () => setScreen("modules"),
    onProgress: () => setScreen("progress")
  });
  if (screen === "progress") return /*#__PURE__*/React.createElement(Progress, {
    states: states,
    onHome: () => setScreen("modules"),
    onLogin: () => setScreen("login"),
    onReset: () => {
      storage.clear();
      setStates(ALL.map(f => newFact(f.id)));
    }
  });
  if (screen === "login") return /*#__PURE__*/React.createElement(Login, {
    onBack: () => setScreen("progress"),
    onDone: () => setScreen("progress")
  });

  /* ═══════════ SESJA ═══════════ */
  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: sessionLabel,
    right: /*#__PURE__*/React.createElement(StreakPill, {
      streak: streak
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 20px",
      display: "flex",
      gap: 4
    }
  }, queue.map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      background: i < qi ? C.green : i === qi ? C.red : C.line
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      fontFamily: C.mono
    }
  }, qi + 1, "/", queue.length, " · ", question.topic), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(KindBadge, {
    kind: question.kind
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono,
      border: `1px solid ${C.line}`,
      borderRadius: 6,
      padding: "3px 8px"
    }
  }, FMT_LABEL[question.format]))), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 20,
      fontWeight: 800,
      margin: 0,
      letterSpacing: "-0.02em",
      lineHeight: 1.35
    }
  }, question.prompt), /*#__PURE__*/React.createElement(QuestionBody, {
    question: question,
    phase: phase,
    onSubmit: submit
  }), phase === "feedback" && /*#__PURE__*/React.createElement(Feedback, {
    ok: lastCorrect,
    question: question,
    boxJump: boxJump
  }), phase === "feedback" && /*#__PURE__*/React.createElement(FrankWidget, {
    question: question
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      borderTop: `1px solid ${C.card}`
    }
  }, phase === "feedback" && /*#__PURE__*/React.createElement("button", {
    style: btn(C.text, C.bg),
    onClick: nextQuestion
  }, qi + 1 >= queue.length ? "Podsumowanie" : "Następne")), /*#__PURE__*/React.createElement(TrFoot, null));
}

/* ═══════════ WIDŻET FRANKA — zgłaszanie uwag do pytania ═══════════ */
function FrankWidget({ question }) {
  const [cat, setCat] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return /*#__PURE__*/React.createElement("div", {
    style: { padding: "12px 20px", color: C.green, fontSize: 13, fontWeight: 700 }
  }, "Dzięki — uwaga zapisana.");
  const cats = [["blad", "Błąd"], ["literowka", "Literówka"], ["niejasne", "Niejasne"], ["trudne", "Za trudne"]];
  const canSend = !!(cat || msg.trim());
  return /*#__PURE__*/React.createElement("div", {
    style: { padding: "12px 20px", borderTop: `1px solid ${C.card}`, display: "flex", flexDirection: "column", gap: 8 }
  },
    /*#__PURE__*/React.createElement("div", { style: { fontSize: 12, color: C.dim, fontWeight: 700 } }, "Zgłoś uwagę do tego pytania:"),
    /*#__PURE__*/React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
      cats.map(function (pair) {
        const k = pair[0], l = pair[1], on = cat === k;
        return /*#__PURE__*/React.createElement("button", {
          key: k,
          onClick: function () { setCat(on ? "" : k); },
          style: { cursor: "pointer", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, border: `1px solid ${on ? C.red : C.card}`, background: on ? C.red : "transparent", color: on ? "#fff" : C.text }
        }, l);
      })
    ),
    /*#__PURE__*/React.createElement("textarea", {
      value: msg,
      onChange: function (e) { setMsg(e.target.value); },
      placeholder: "Napisz, co poprawić (opcjonalnie)…",
      rows: 2,
      style: { width: "100%", boxSizing: "border-box", resize: "vertical", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.card}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: "inherit" }
    }),
    /*#__PURE__*/React.createElement("button", {
      disabled: !canSend,
      onClick: function () {
        try { window.__franek && window.__franek.add({ factId: question.id, topic: question.topic, cat: cat || "ogolne", msg: msg.trim(), ts: Date.now() }); } catch (e) {}
        setSent(true);
      },
      style: { alignSelf: "flex-start", padding: "7px 14px", borderRadius: 8, border: "none", cursor: canSend ? "pointer" : "not-allowed", background: canSend ? C.green : C.card, color: "#fff", fontSize: 13, fontWeight: 800, opacity: canSend ? 1 : 0.5 }
    }, "Wyślij uwagę")
  );
}

/* ═══════════ EKRAN GŁÓWNY — MODUŁY TRENINGU ═══════════ */
function Modules({
  states,
  fOf,
  onExit,
  onModule,
  onMixed,
  onProgress
}) {
  const due = states.filter(s => s.dueAt === null || s.dueAt <= Date.now()).length;
  const modInfo = MODULES.map(m => {
    const st = states.filter(s => fOf(s.id)?.module === m.id);
    return {
      ...m,
      started: st.filter(s => s.box >= 2).length,
      due: st.filter(s => s.dueAt === null || s.dueAt <= Date.now()).length
    };
  });
  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: "Trening",
    left: onExit ? /*#__PURE__*/React.createElement(BackBtn, {
      onBack: onExit
    }) : null
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.dim,
      fontFamily: C.mono
    }
  }, ALL.length, " pozycji · ", MODULES.length, " modułów"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      margin: "6px 0 0",
      letterSpacing: "-0.02em"
    }
  }, t("home.ready", "Gotów na dziś?"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderRadius: 10,
      background: C.card,
      border: `1px solid ${C.line}`,
      fontSize: 12,
      color: C.dim,
      lineHeight: 1.5
    }
  }, "Pomaga uczyć się do egzaminu ADR — weryfikować i utrwalać wiedzę. Nie zastępuje kursu ani nie wydaje uprawnień."), /*#__PURE__*/React.createElement("button", {
    style: {
      ...btn(C.red, "#fff"),
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      padding: "15px 18px"
    },
    onClick: onMixed
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, due > 0 ? "Powtórka dnia" : "Powtórka mieszana"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.9
    }
  }, due > 0 ? `${due} do przypomnienia ze wszystkich modułów` : "wszystko na dziś utrwalone")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      fontFamily: C.mono,
      marginTop: 2
    }
  }, "MODUŁY"), modInfo.map(m => {
    const pct = m.count ? Math.round(m.started / m.count * 100) : 0;
    return /*#__PURE__*/React.createElement("button", {
      key: m.id,
      onClick: () => onModule(m),
      style: {
        textAlign: "left",
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.card,
        color: C.text,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 700
      }
    }, m.icon, " ", m.title), m.due > 0 ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: C.danger,
        fontFamily: C.mono
      }
    }, m.due, " do powtórki") : /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: C.dim,
        fontFamily: C.mono
      }
    }, "›")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        borderRadius: 3,
        background: C.line,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: pct >= 80 ? C.green : pct >= 40 ? C.amber : C.red,
        transition: "width .4s"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: C.dim,
        fontFamily: C.mono
      }
    }, m.count, " zadań · ", m.started, " rozpoczęte", m.structured ? " · bloki i tematy" : ""));
  })), /*#__PURE__*/React.createElement(TrFoot, null));
}

/* ═══════════ EKRAN GŁÓWNY ═══════════ */
function Home({
  states,
  licensed,
  onBack,
  onBlock,
  onLockedBlock,
  onHowTo,
  onMixed,
  onExam,
  onProgress
}) {
  const adrIds = new Set(FACTS.map(f => f.id));
  states = states.filter(s => adrIds.has(s.id));
  const sOf = id => states.find(s => s.id === id);
  const due = states.filter(s => s.dueAt === null || s.dueAt <= Date.now()).length;
  const started = states.filter(s => s.box >= 2).length;
  const learned = states.filter(s => s.box >= 4).length;
  const blockInfo = BLOCKS.map(b => {
    const ids = FACTS.filter(f => f.block === b.id).map(f => f.id);
    const st = ids.map(sOf);
    return {
      ...b,
      total: ids.length,
      started: st.filter(s => s.box >= 2).length,
      due: st.filter(s => s.dueAt === null || s.dueAt <= Date.now()).length
    };
  });
  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: "ADR",
    left: onBack ? /*#__PURE__*/React.createElement(BackBtn, {
      onBack: onBack
    }) : null
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.dim,
      fontFamily: C.mono
    }
  }, "Kurs podstawowy · ", FACTS.length, " pozycji"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 26,
      fontWeight: 800,
      margin: "6px 0 0",
      letterSpacing: "-0.02em"
    }
  }, t("home.ready", "Gotów na dziś?"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderRadius: 10,
      background: C.card,
      border: `1px solid ${C.line}`,
      fontSize: 12,
      color: C.dim,
      lineHeight: 1.5
    }
  }, t("home.intro", "Poprowadzę Cię przez cały materiał ADR — krok po kroku, w Twoim tempie. Podsuwam pytania dokładnie wtedy, gdy zaczynasz zapominać, żeby wiedza została na egzamin i na trasę.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Do powtórki",
    value: due,
    color: C.red
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Rozpoczęte",
    value: `${started}/${FACTS.length}`,
    color: C.text
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Utrwalone",
    value: learned,
    color: C.greenLite
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      ...btn(C.red, "#fff"),
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      padding: "15px 18px"
    },
    onClick: onMixed
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 800
    }
  }, due > 0 ? "Powtórka dnia" : "Powtórka mieszana"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 600,
      opacity: 0.9
    }
  }, due > 0 ? `${due} do przypomnienia ze wszystkich bloków` : "wszystko na dziś utrwalone")), /*#__PURE__*/React.createElement("button", {
    style: {
      ...btn(C.card, C.text, false, C.line),
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      gap: 4,
      padding: "15px 18px",
      marginTop: 10
    },
    onClick: onExam
  }, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }
  }, "📝 Symulacja egzaminu", !licensed && /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 10, fontWeight: 800, background: C.red, color: "#fff", borderRadius: 5, padding: "2px 6px" }
  }, "PRO")), /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 12, fontWeight: 600, opacity: 0.75 }
  }, "30 pytań · 60 min · próg ⅔ (20/30) — format prawdziwego egzaminu")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      fontFamily: C.mono,
      marginTop: 4
    }
  }, "BLOKI — WEJDŹ, BY ĆWICZYĆ"), blockInfo.map(b => {
    const pct = b.total ? Math.round(b.started / b.total * 100) : 0;
    const locked = !licensed && !FREE_BLOCKS.includes(b.id);
    return /*#__PURE__*/React.createElement("button", {
      key: b.id,
      onClick: () => locked ? onLockedBlock() : onBlock(b.id),
      style: {
        textAlign: "left",
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.card,
        color: C.text,
        cursor: "pointer",
        opacity: locked ? 0.72 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 700
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.red,
        fontFamily: C.mono,
        marginRight: 8
      }
    }, b.id), b.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: locked ? C.amber : C.dim,
        fontFamily: C.mono
      }
    }, locked ? "🔒" : "›")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        borderRadius: 3,
        background: C.line,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: pct >= 80 ? C.green : pct >= 40 ? C.amber : C.red,
        transition: "width .4s"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: C.dim,
        fontFamily: C.mono
      }
    }, b.total, " zadań · ", b.started, " rozpoczęte", b.due > 0 ? ` · ${b.due} do powtórki` : ""));
  }), /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.text, false, C.line),
    onClick: onHowTo
  }, "Jak zdobyć uprawnienia ADR")), /*#__PURE__*/React.createElement(TrFoot, null));
}

/* ═══════════ WIDOK BLOKU — tematy z zadaniami ═══════════ */
function BlockView({
  blockId,
  states,
  onTopic,
  onWholeBlock,
  onBack
}) {
  const sOf = id => states.find(s => s.id === id);
  const block = BLOCKS.find(b => b.id === blockId);
  const topics = topicsOfBlock(blockId);
  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: `Blok ${blockId}`,
    left: /*#__PURE__*/React.createElement(BackBtn, {
      onBack: onBack
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      margin: "4px 0 0",
      letterSpacing: "-0.02em"
    }
  }, block.name), /*#__PURE__*/React.createElement("button", {
    style: {
      ...btn(C.red, "#fff")
    },
    onClick: () => onWholeBlock(blockId)
  }, "Ćwicz cały blok (", FACTS.filter(f => f.block === blockId).length, " zadań)"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      fontFamily: C.mono,
      marginTop: 2
    }
  }, "TEMATY"), topics.map(t => {
    const st = t.items.map(i => sOf(i.id));
    const started = st.filter(s => s.box >= 2).length;
    const skills = t.items.filter(i => i.kind === "skill").length;
    const pct = t.total ? Math.round(started / t.total * 100) : 0;
    return /*#__PURE__*/React.createElement("button", {
      key: t.name,
      onClick: () => onTopic(blockId, t.name),
      style: {
        textAlign: "left",
        padding: "13px 15px",
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.card,
        color: C.text,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700
      }
    }, t.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: C.dim,
        fontFamily: C.mono
      }
    }, "›")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 4,
        borderRadius: 3,
        background: C.line,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${pct}%`,
        background: pct >= 80 ? C.green : pct >= 40 ? C.amber : C.red,
        transition: "width .4s"
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: C.dim,
        fontFamily: C.mono
      }
    }, t.total, " zadań · ", skills, " ćwiczeń · ", started, " rozpoczęte"));
  })), /*#__PURE__*/React.createElement(TrFoot, null));
}

/* ═══════════ CIAŁO PYTANIA ═══════════ */
function QuestionBody({
  question,
  phase,
  onSubmit
}) {
  const locked = phase === "feedback";
  const [sel, setSel] = useState(null);
  const [fillVal, setFillVal] = useState("");
  const [matchSel, setMatchSel] = useState({});
  const [orderSel, setOrderSel] = useState([]);
  useEffect(() => {
    setSel(null);
    setFillVal("");
    setMatchSel({});
    setOrderSel([]);
  }, [question]);
  if (question.format === "mcq" || question.format === "scenario") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, question.options.map(o => {
      const chosen = sel === o,
        isCorrect = norm(o) === norm(question.correct);
      let bg = C.card,
        bd = C.line,
        col = C.text;
      if (locked) {
        if (isCorrect) {
          bg = C.green + "22";
          bd = C.green;
          col = C.greenLite;
        } else if (chosen) {
          bg = C.red + "22";
          bd = C.red;
          col = C.danger;
        }
      } else if (chosen) {
        bg = C.red + "1F";
        bd = C.red;
      }
      return /*#__PURE__*/React.createElement("button", {
        key: o,
        disabled: locked,
        onClick: () => {
          setSel(o);
          onSubmit(o);
        },
        style: {
          textAlign: "left",
          padding: "14px 16px",
          borderRadius: 12,
          border: `1px solid ${bd}`,
          background: bg,
          color: col,
          fontSize: 15,
          lineHeight: 1.4,
          cursor: locked ? "default" : "pointer"
        }
      }, o);
    }));
  }
  if (question.format === "fill") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: fillVal,
      disabled: locked,
      onChange: e => setFillVal(e.target.value),
      placeholder: "Wpisz odpowiedź…",
      onKeyDown: e => e.key === "Enter" && fillVal.trim() && onSubmit(fillVal),
      style: {
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${locked ? norm(fillVal) === norm(question.correct) ? C.green : C.red : C.edge}`,
        background: C.card,
        color: C.text,
        fontSize: 16,
        fontFamily: C.mono,
        outline: "none"
      }
    }), question.hint && !locked && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: C.dim,
        fontFamily: C.mono
      }
    }, "💡 ", question.hint), !locked && /*#__PURE__*/React.createElement("button", {
      disabled: !fillVal.trim(),
      onClick: () => onSubmit(fillVal),
      style: btn(C.red, "#fff", !fillVal.trim())
    }, "Sprawdź"));
  }
  if (question.format === "match") {
    const left = Object.keys(question.pairs);
    const allChosen = left.every(l => matchSel[l]);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 10
      }
    }, left.map(l => {
      const val = matchSel[l];
      const correct = locked && norm(question.pairs[l]) === norm(val);
      return /*#__PURE__*/React.createElement("div", {
        key: l,
        style: {
          display: "flex",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          flex: "0 0 38%",
          padding: "12px 12px",
          borderRadius: 10,
          background: C.card,
          border: `1px solid ${C.line}`,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: C.mono,
          display: "flex",
          alignItems: "center"
        }
      }, l), /*#__PURE__*/React.createElement("select", {
        disabled: locked,
        value: val || "",
        onChange: e => setMatchSel(m => ({
          ...m,
          [l]: e.target.value
        })),
        style: {
          flex: 1,
          padding: "12px 12px",
          borderRadius: 10,
          background: C.card,
          color: locked ? correct ? C.greenLite : C.danger : C.text,
          border: `1px solid ${locked ? correct ? C.green : C.red : C.edge}`,
          fontSize: 13,
          outline: "none"
        }
      }, /*#__PURE__*/React.createElement("option", {
        value: ""
      }, "— wybierz —"), question.right.map(r => /*#__PURE__*/React.createElement("option", {
        key: r,
        value: r
      }, r))));
    }), !locked && /*#__PURE__*/React.createElement("button", {
      disabled: !allChosen,
      onClick: () => onSubmit(matchSel),
      style: btn(C.red, "#fff", !allChosen)
    }, "Sprawdź"));
  }
  if (question.format === "order") {
    const remaining = question.scrambled.filter(x => !orderSel.includes(x));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, orderSel.map((x, i) => {
      const correct = locked && norm(question.correct[i]) === norm(x);
      return /*#__PURE__*/React.createElement("div", {
        key: x,
        style: {
          display: "flex",
          gap: 10,
          alignItems: "center",
          padding: "12px 14px",
          borderRadius: 10,
          background: C.card,
          border: `1px solid ${locked ? correct ? C.green : C.red : C.edge}`
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          color: locked ? correct ? C.greenLite : C.danger : C.red,
          fontWeight: 800,
          fontFamily: C.mono
        }
      }, i + 1), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 14,
          flex: 1
        }
      }, x), !locked && /*#__PURE__*/React.createElement("button", {
        onClick: () => setOrderSel(o => o.filter(y => y !== x)),
        style: {
          background: "none",
          border: "none",
          color: C.dim,
          cursor: "pointer",
          fontSize: 18
        }
      }, "×"));
    })), !locked && remaining.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: C.dim,
        fontFamily: C.mono
      }
    }, "Dotknij w kolejności:"), remaining.map(x => /*#__PURE__*/React.createElement("button", {
      key: x,
      onClick: () => setOrderSel(o => [...o, x]),
      style: {
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 10,
        background: C.card,
        border: `1px dashed ${C.edge}`,
        color: C.text,
        fontSize: 14,
        cursor: "pointer"
      }
    }, "+ ", x))), !locked && remaining.length === 0 && /*#__PURE__*/React.createElement("button", {
      onClick: () => onSubmit(orderSel),
      style: btn(C.red, "#fff")
    }, "Sprawdź"));
  }
  return null;
}

/* ═══════════ FEEDBACK ═══════════ */
function Feedback({
  ok,
  question,
  boxJump
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle,
      background: ok ? "#12180F" : "#1A1310",
      borderColor: (ok ? C.green : C.red) + "55"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 22,
      color: ok ? C.greenLite : C.danger,
      fontWeight: 800
    }
  }, ok ? "✓" : "✕"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: ok ? C.greenLite : C.danger
    }
  }, ok ? "Dobrze" : "Nie tym razem")), !ok && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 14,
      color: C.text,
      lineHeight: 1.5
    }
  }, "Poprawnie: ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.greenLite,
      fontWeight: 600
    }
  }, fmtCorrect(question))), (ok ? (question.okMsg || question.why) : (question.badMsg || question.why)) && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 13,
      color: "#9AA0AA",
      lineHeight: 1.5
    }
  }, ok ? (question.okMsg || question.why) : (question.badMsg || question.why)), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono
    }
  }, question.adrRef)), /*#__PURE__*/React.createElement(LeitnerBoxes, {
    jump: boxJump,
    ok: ok
  }));
}
function LeitnerBoxes({
  jump,
  ok
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono,
      marginBottom: 8
    }
  }, ok ? `awans do pudełka ${jump.to}` : "powrót do pudełka 1", " · powtórka za ", intervalLabel(jump.to)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, [1, 2, 3, 4, 5].map(b => {
    const active = b === jump.to;
    return /*#__PURE__*/React.createElement("div", {
      key: b,
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: 40,
        borderRadius: 8,
        border: `1px solid ${active ? ok ? C.green : C.red : C.line}`,
        background: active ? ok ? C.green + "22" : C.red + "22" : C.card,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .3s",
        transform: active ? "translateY(-4px)" : "none"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        fontFamily: C.mono,
        color: active ? ok ? C.greenLite : C.danger : C.faint
      }
    }, b)), active && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        fontSize: 15
      }
    }, ok ? "▲" : "▼"));
  })));
}

/* ═══════════ PODSUMOWANIE SESJI ═══════════ */
function Done({
  stats,
  bestStreak,
  states,
  label,
  onHome,
  onProgress
}) {
  const pct = stats.total ? Math.round(stats.correct / stats.total * 100) : 0;
  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: "Koniec sesji"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 46,
      textAlign: "center"
    }
  }, pct >= 80 ? "🎯" : pct >= 50 ? "✓" : "↻"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 23,
      fontWeight: 800,
      textAlign: "center",
      margin: 0
    }
  }, label, " — zaliczone"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Stat, {
    label: "Trafność",
    value: `${pct}%`,
    color: pct >= 50 ? C.greenLite : C.danger
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Odpowiedzi",
    value: `${stats.correct}/${stats.total}`,
    color: C.text
  }), /*#__PURE__*/React.createElement(Stat, {
    label: "Streak",
    value: bestStreak,
    color: C.red
  })), /*#__PURE__*/React.createElement("button", {
    style: btn(C.red, "#fff"),
    onClick: onHome
  }, "Wróć na start"), /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.text, false, C.line),
    onClick: onProgress
  }, "Zobacz postęp")), /*#__PURE__*/React.createElement(TrFoot, null));
}

/* ═══════════ EKRAN SPOCZYNKU ═══════════ */
/* ═══════════ JAK ZDOBYĆ UPRAWNIENIA ADR (skill informacyjny) ═══════════
   Realna ścieżka do zaświadczenia ADR w Polsce. Źródło: powszechna praktyka
   ośrodków + procedura Urzędu Marszałkowskiego (stan 2026). Treść informacyjna —
   przejmuje też funkcję prawną: pokazuje, że uprawnienia zdobywa się kursem +
   egzaminem państwowym, a apka jest tylko pomocą w nauce.
   Przed publikacją: potwierdzić u uprawnionego (DGSA) i sprawdzić aktualność. */
function HowToGet({
  onBack
}) {
  const step = (n, title, body) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flexShrink: 0,
      width: 26,
      height: 26,
      borderRadius: 13,
      background: C.red,
      color: "#fff",
      fontSize: 13,
      fontWeight: 800,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 3
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.dim,
      lineHeight: 1.6
    }
  }, body)));

  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: "",
    left: /*#__PURE__*/React.createElement(BackBtn, {
      onBack: onBack
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 20,
      overflowY: "auto"
    }
  },
  /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      margin: "4px 0 0",
      lineHeight: 1.25
    }
  }, "Jak zdobyć uprawnienia ADR"),
  /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: C.dim,
      lineHeight: 1.6,
      margin: 0
    }
  }, "Uprawnienia zdobywa się kursem w akredytowanym ośrodku i egzaminem państwowym — nie z aplikacji. Ta apka pomaga Ci się do tego egzaminu przygotować. Oto cała droga:"),
  step(1, "Kurs w akredytowanym ośrodku", "Zapisujesz się na kurs ADR podstawowy. Jeśli chcesz wozić w cysternach albo materiały klasy 1 (wybuchowe) lub 7 (promieniotwórcze) — dokładasz kurs specjalistyczny. Ośrodek musi mieć akredytację marszałka województwa."),
  step(2, "Egzamin państwowy", "Po kursie zdajesz egzamin nadzorowany przez Urząd Marszałkowski — test jednokrotnego wyboru. Trzeba poprawnie odpowiedzieć na co najmniej ⅔ pytań (podstawowy: 30 pytań, cysterny: 18)."),
  step(3, "Zaświadczenie ADR", "Marszałek wydaje zaświadczenie w ciągu 14 dni od egzaminu — plastikowa karta z Twoimi danymi i zakresem uprawnień. W praktyce dociera pocztą w 1-3 tygodnie."),
  step(4, "Ważność 5 lat", "Zaświadczenie jest ważne 5 lat. Żeby przedłużyć — w ostatnim roku ważności robisz kurs doskonalący i ponownie zdajesz egzamin, zanim dokument wygaśnie."),
  /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      borderRadius: 10,
      background: C.card,
      border: `1px solid ${C.line}`,
      fontSize: 12,
      color: C.dim,
      lineHeight: 1.6
    }
  }, "MasterADR to pomoc w nauce do egzaminu — weryfikacja i utrwalanie wiedzy. Nie jest kursem akredytowanym ani nie wydaje uprawnień. Szczegóły i terminy potwierdź w wybranym ośrodku i urzędzie marszałkowskim.")
  ), /*#__PURE__*/React.createElement(TrFoot, null));
}

/* ═══════════ PAYWALL — ściana freemium (bloki 3-5) ═══════════ */
function Paywall({
  onBack,
  onActivated
}) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgOk, setMsgOk] = useState(false);

  async function activate() {
    setBusy(true);
    setMsg(null);
    const r = await activateLicense(key);
    setBusy(false);
    setMsg(r.msg);
    setMsgOk(r.ok);
    if (r.ok) setTimeout(onActivated, 700);
  }

  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: "",
    left: /*#__PURE__*/React.createElement(BackBtn, {
      onBack: onBack
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 24,
      display: "flex",
      flexDirection: "column",
      gap: 18,
      overflowY: "auto"
    }
  },
  /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40,
      marginTop: 8
    }
  }, "🔒"),
  /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      margin: 0,
      lineHeight: 1.25
    }
  }, "Odblokuj pełny kurs ADR"),
  /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: C.dim,
      lineHeight: 1.6,
      margin: 0
    }
  }, "Bloki 1 i 2 masz za darmo — poznałeś już metodę powtórek. Pełny kurs to wszystkie 5 bloków (", FACTS.length, " pozycji) z silnikiem Leitnera, który podsuwa pytania tuż przed zapomnieniem."),
  /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 18,
      fontSize: 14,
      color: C.text,
      lineHeight: 1.8
    }
  },
    /*#__PURE__*/React.createElement("li", null, "Wszystkie 5 bloków + tematy"),
    /*#__PURE__*/React.createElement("li", null, "Powtórki rozłożone w czasie (10 min → 16 dni)"),
    /*#__PURE__*/React.createElement("li", null, "Pełna baza ", FACTS.length, " pozycji z Kompendium ADR"),
    /*#__PURE__*/React.createElement("li", null, "Działa offline — w trasie bez zasięgu")
  ),
  /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px",
      borderRadius: 12,
      background: C.card,
      border: `1px solid ${C.line}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    }
  },
    /*#__PURE__*/React.createElement("span", {
      style: { fontSize: 13, color: C.dim }
    }, "Dostęp"),
    /*#__PURE__*/React.createElement("span", {
      style: { fontSize: 18, fontWeight: 800 }
    }, PRICE_LABEL)
  ),
  /*#__PURE__*/React.createElement("button", {
    style: btn(C.red, "#fff"),
    onClick: () => {
      try { window.open(BUY_URL, "_blank", "noopener"); } catch (e) {}
    }
  }, "Kup dostęp"),
  /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      textAlign: "center",
      lineHeight: 1.5
    }
  }, "Po zakupie dostaniesz klucz na e-mail. Wpisz go poniżej:"),
  /*#__PURE__*/React.createElement("input", {
    value: key,
    onChange: e => setKey(e.target.value),
    placeholder: "Wklej klucz licencyjny",
    autoCapitalize: "none",
    autoCorrect: "off",
    spellCheck: false,
    style: {
      width: "100%",
      padding: "13px 15px",
      borderRadius: 12,
      border: `1px solid ${C.line}`,
      background: C.bg,
      color: C.text,
      fontSize: 14,
      fontFamily: C.mono,
      outline: "none"
    }
  }),
  /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.text, busy, C.line),
    disabled: busy,
    onClick: activate
  }, busy ? "Sprawdzam…" : "Aktywuj klucz"),
  msg && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      textAlign: "center",
      color: msgOk ? C.greenLite : C.danger,
      lineHeight: 1.5
    }
  }, msg),
  /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.faint,
      textAlign: "center",
      lineHeight: 1.5,
      marginTop: 4
    }
  }, "Pomaga uczyć się do egzaminu ADR. Nie zastępuje kursu ani nie wydaje uprawnień.")
  ), /*#__PURE__*/React.createElement(TrFoot, null));
}

function Rest({
  info,
  onHome,
  onForce
}) {
  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: "Trener ADR"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 18,
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 50
    }
  }, "✓"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      margin: "10px 0 0",
      color: C.greenLite
    }
  }, "Wszystko utrwalone"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "#9AA0AA",
      fontSize: 15,
      margin: "12px 0 0",
      lineHeight: 1.5
    }
  }, "Nic z „", info?.label, "\" nie czeka teraz na powtórkę. Nie musisz przerabiać materiału od nowa — wróć, gdy fakt zacznie się zacierać.")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono,
      marginBottom: 6
    }
  }, "NAJBLIŻSZA POWTÓRKA"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 800
    }
  }, info?.nextDue ? whenLabel(info.nextDue) : "gdy nauczysz się nowych")), /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.text, false, C.line),
    onClick: onForce
  }, "Ucz się mimo to"), /*#__PURE__*/React.createElement("button", {
    style: btn(C.red, "#fff"),
    onClick: onHome
  }, "Wróć na start")), /*#__PURE__*/React.createElement(TrFoot, null));
}

/* ═══════════ POSTĘP ═══════════ */
function Progress({
  states,
  onHome,
  onReset,
  onLogin
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [ident, setIdent] = useState(() => {
    try { return JSON.parse(localStorage.getItem("guardian.identity.v1") || "null"); } catch (e) { return null; }
  });
  const [loginOpen, setLoginOpen] = useState(false);
  const [lname, setLname] = useState("");
  const [lemail, setLemail] = useState("");
  const ha = loadHabit(rawStore);
  const total = states.length;
  const learned = states.filter(s => s.box >= 4).length;
  const due = states.filter(s => s.dueAt && s.dueAt <= Date.now()).length;
  const pct = total ? Math.round(learned / total * 100) : 0;
  const days = (() => {
    try { const c0 = ident && ident.createdAt; if (!c0) return 1; return Math.max(1, Math.floor((Date.now() - c0) / 864e5) + 1); } catch (e) { return 1; }
  })();
  const xp = ha.xp || 0;
  const blockStats = BLOCKS.map(b => {
    const st = states.filter(s => FACTS.find(f => f.id === s.id)?.block === b.id);
    return { ...b, total: st.length, started: st.filter(s => s.box >= 2).length, learned: st.filter(s => s.box >= 4).length };
  });
  const stat = (val, lab, col) => React.createElement("div", {
    style: { flex: "1 1 28%", minWidth: 92, ...cardStyle, padding: "14px 12px" }
  }, React.createElement("div", { style: { fontSize: 26, fontWeight: 800, fontFamily: C.mono, color: col || C.text, lineHeight: 1 } }, val),
    React.createElement("div", { style: { fontSize: 11, color: C.dim, lineHeight: 1.3, marginTop: 4 } }, lab));
  function saveIdent() {
    const o = { name: lname.trim() || "Uczeń", email: lemail.trim(), createdAt: (ident && ident.createdAt) || Date.now() };
    try { localStorage.setItem("guardian.identity.v1", JSON.stringify(o)); } catch (e) {}
    setIdent(o); setLoginOpen(false);
  }
  const inp = { width: "100%", boxSizing: "border-box", padding: "9px 11px", borderRadius: 8, border: `1px solid ${C.card}`, background: C.bg, color: C.text, fontSize: 14, fontFamily: "inherit", marginBottom: 8 };
  return React.createElement(TrShell, null,
    React.createElement(TrHeader, { title: "Postęp", left: React.createElement(BackBtn, { onBack: onHome }) }),
    React.createElement("div", { style: { flex: 1, padding: 20, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" } },
      React.createElement("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 } },
        stat(ha.streak || 0, (ha.streak === 1 ? "dzień z rzędu" : "dni z rzędu"), (ha.streak > 0 ? C.amber : C.text)),
        stat(learned, "opanowanych faktów", C.green),
        stat(due, "do powtórki dziś", due > 0 ? C.amber : C.dim),
        stat(pct + "%", "ukończenia kursu"),
        stat(days, days === 1 ? "dzień nauki" : "dni nauki"),
        stat(xp, "XP")
      ),
      React.createElement("div", { style: { ...cardStyle } },
        React.createElement("div", { style: { fontSize: 12, color: C.dim, marginBottom: 8, fontFamily: C.mono } }, "SERIA DZIENNA"),
        React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline" } },
          React.createElement("span", { style: { fontSize: 14, color: C.text } }, "Rekord: ", React.createElement("b", null, (ha.bestStreak || 0), " dni")),
          React.createElement("span", { style: { fontSize: 13, color: C.dim } }, "dziś ", React.createElement("b", { style: { color: C.text } }, (ha.progressDay === dayIndex() ? (ha.progressToday || 0) : 0), "/", (ha.dailyGoal || 15)))
        )
      ),
      React.createElement("div", { style: { ...cardStyle } },
        React.createElement("div", { style: { fontSize: 12, color: C.dim, marginBottom: 12, fontFamily: C.mono } }, "POSTĘP PER BLOK"),
        React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
          blockStats.map(bs => {
            const p = bs.total ? Math.round(bs.started / bs.total * 100) : 0;
            return React.createElement("div", { key: bs.id },
              React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 } },
                React.createElement("span", { style: { color: C.text } }, bs.name),
                React.createElement("span", { style: { color: C.dim, fontFamily: C.mono } }, bs.started, "/", bs.total, " · ", bs.learned, "★")),
              React.createElement("div", { style: { height: 5, borderRadius: 3, background: C.line, overflow: "hidden" } },
                React.createElement("div", { style: { height: "100%", width: `${p}%`, background: p >= 80 ? C.green : p >= 40 ? C.amber : C.red, transition: "width .4s" } })));
          })
        )
      ),
      React.createElement("div", { style: { ...cardStyle } },
        React.createElement("div", { style: { fontSize: 12, color: C.dim, marginBottom: 8, fontFamily: C.mono } }, t("profile.title", "PROFIL")),
        (ident && ident.name)
          ? React.createElement("div", null,
              React.createElement("div", { style: { fontSize: 14, color: C.text, marginBottom: 10 } }, "Zalogowany jako ", React.createElement("b", null, ident.name)),
              React.createElement("button", { style: btn(C.card, C.dim, false, C.line), onClick: function () { try { localStorage.removeItem("guardian.identity.v1"); } catch (e) {} setIdent(null); } }, "Wyloguj"))
          : React.createElement("button", { style: btn(C.green, "#fff"), onClick: onLogin }, t("profile.login", "Zaloguj się")),
        React.createElement("div", { style: { fontSize: 12, color: C.dim, margin: "14px 0 8px", fontFamily: C.mono } }, t("profile.lang", "Język")),
        React.createElement("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" } },
          LANGS.map(function (pair) {
            const code = pair[0], name = pair[1], on = getLang() === code;
            return React.createElement("button", { key: code, onClick: function () { setLang(code); try { location.reload(); } catch (e) {} }, style: { cursor: "pointer", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, border: `1px solid ${on ? C.green : C.card}`, background: on ? C.green : "transparent", color: on ? "#fff" : C.text } }, name);
          })
        )
      ),
      !confirmReset
        ? React.createElement("button", { style: btn(C.card, C.dim, false, C.line), onClick: () => setConfirmReset(true) }, "Wyczyść mój postęp")
        : React.createElement("div", { style: { ...cardStyle, borderColor: C.red + "55" } },
            React.createElement("div", { style: { fontSize: 13, color: C.text, marginBottom: 12, lineHeight: 1.5 } }, "Na pewno? Cały postęp nauki zostanie trwale usunięty."),
            React.createElement("div", { style: { display: "flex", gap: 10 } },
              React.createElement("button", { style: btn(C.card, C.text, false, C.line), onClick: () => setConfirmReset(false) }, "Anuluj"),
              React.createElement("button", { style: btn(C.red, "#fff"), onClick: () => { onReset(); setConfirmReset(false); onHome(); } }, "Usuń")))
    ),
    React.createElement(TrFoot, null));
}

/* ═══════════ EKRAN KONTA — rejestracja / logowanie (konto lokalne) ═══════════ */
function encPass(p) { try { return btoa(unescape(encodeURIComponent(p))); } catch (e) { return p; } }
function Login({ onBack, onDone }) {
  const [mode, setMode] = useState("register");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState("");
  const lbl = { fontSize: 12, color: C.dim, fontFamily: C.mono, display: "block", marginBottom: 4 };
  const fld = { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.card}`, background: C.bg, color: C.text, fontSize: 15, fontFamily: "inherit" };
  function readAcct() { try { return JSON.parse(localStorage.getItem("masteradr.account.v1") || "null"); } catch (e) { return null; } }
  function finish(a) {
    try { localStorage.setItem("guardian.identity.v1", JSON.stringify({ name: a.name, email: a.email, createdAt: a.createdAt })); } catch (e) {}
    onDone && onDone();
  }
  function submit() {
    const em = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { setErr("Podaj poprawny e-mail."); return; }
    if (pass.length < 8) { setErr("Hasło musi mieć min. 8 znaków."); return; }
    if (mode === "register") {
      if (!consent) { setErr("Zaznacz zgodę na zasady prywatności."); return; }
      const a = { email: em, p: encPass(pass), name: em.split("@")[0], createdAt: Date.now() };
      try { localStorage.setItem("masteradr.account.v1", JSON.stringify(a)); } catch (e) {}
      finish(a);
    } else {
      const a = readAcct();
      if (!a || a.email !== em || a.p !== encPass(pass)) { setErr("Nie znaleziono konta albo złe hasło."); return; }
      finish(a);
    }
  }
  function tab(active, label, on) {
    return React.createElement("button", { onClick: on, style: { flex: 1, padding: "8px 10px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: active ? C.card : "transparent", color: active ? C.text : C.dim } }, label);
  }
  return React.createElement(TrShell, null,
    React.createElement(TrHeader, { title: "Konto", left: React.createElement(BackBtn, { onBack: onBack }) }),
    React.createElement("div", { style: { flex: 1, padding: 20, display: "flex", flexDirection: "column", overflowY: "auto" } },
      React.createElement("div", { style: { ...cardStyle } },
        React.createElement("h2", { style: { fontSize: 17, color: C.text, margin: "0 0 6px", lineHeight: 1.35 } }, mode === "register" ? "Zrób konto, a zapamiętam Twój postęp." : "Zaloguj się, a wrócę tam, gdzie skończyliśmy."),
        React.createElement("p", { style: { fontSize: 13, color: C.dim, margin: "0 0 14px", lineHeight: 1.5 } }, mode === "register" ? "Wszystko, czego się nauczysz, wróci na każdym urządzeniu — nawet gdy zmienisz telefon." : "Twój postęp nauki i seria dzienna czekają."),
        React.createElement("div", { style: { display: "flex", gap: 6, background: C.bg, borderRadius: 12, padding: 4, marginBottom: 14 } },
          tab(mode === "register", "Nowe konto", () => { setMode("register"); setErr(""); }),
          tab(mode === "login", "Mam już konto", () => { setMode("login"); setErr(""); })
        ),
        React.createElement("label", { style: lbl }, "E-mail"),
        React.createElement("input", { value: email, onChange: e => { setEmail(e.target.value); setErr(""); }, type: "email", inputMode: "email", placeholder: "ty@przyklad.pl", style: fld }),
        React.createElement("label", { style: { ...lbl, marginTop: 10 } }, "Hasło"),
        React.createElement("input", { value: pass, onChange: e => { setPass(e.target.value); setErr(""); }, type: "password", placeholder: "min. 8 znaków", style: fld }),
        mode === "register" ? React.createElement("label", { style: { display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12, color: C.dim, margin: "12px 0 4px", lineHeight: 1.5, cursor: "pointer" } },
          React.createElement("input", { type: "checkbox", checked: consent, onChange: e => { setConsent(e.target.checked); setErr(""); }, style: { marginTop: 2, flexShrink: 0 } }),
          React.createElement("span", null, "Akceptuję zasady prywatności. Moje dane są moje — mogę je pobrać lub usunąć w każdej chwili.")
        ) : null,
        err ? React.createElement("div", { style: { fontSize: 12, color: C.red, margin: "8px 0 2px" } }, err) : null,
        React.createElement("button", { style: { ...btn(C.green, "#fff"), marginTop: 12 }, onClick: submit }, mode === "register" ? "Załóż konto" : "Zaloguj się"),
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: C.dim, fontSize: 12 } },
          React.createElement("div", { style: { flex: 1, height: 1, background: C.line } }), "albo", React.createElement("div", { style: { flex: 1, height: 1, background: C.line } })
        ),
        React.createElement("button", { style: { ...btn(C.card, C.text, false, C.line), marginBottom: 8 }, onClick: () => setErr("Logowanie Google/Apple dodamy razem z backendem kont.") }, "Kontynuuj z Google"),
        React.createElement("button", { style: btn(C.card, C.text, false, C.line), onClick: () => setErr("Logowanie Google/Apple dodamy razem z backendem kont.") }, "Kontynuuj z Apple")
      )
    ),
    React.createElement(TrFoot, null));
}

/* ═══════════ WSPÓLNE ═══════════ */
function TrShell({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      background: "#000",
      display: "flex",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: 440,
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      display: "flex",
      flexDirection: "column",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }
  }, children));
}
function TrHeader({
  title,
  right,
  left
}) {
  // Widżet dziennego nawyku pojawia się na KAŻDYM ekranie — czytany z rawStore,
  // żeby nie trzeba było przekazywać `habit` do wszystkich wywołań TrHeader.
  const habitPill = /*#__PURE__*/React.createElement(DailyHabitPill, {
    habit: loadHabit(rawStore)
  });
  const rightCombined = /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function () { try { window.__go && window.__go("progress"); } catch (e) {} },
    title: "Mój postęp",
    "aria-label": "Mój postęp",
    style: {
      cursor: "pointer",
      border: `1px solid ${C.line}`,
      background: C.card,
      color: C.text,
      borderRadius: 20,
      padding: "7px 11px",
      fontSize: 13,
      fontWeight: 700,
      lineHeight: 1,
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    style: { display: "block" }
  }, /*#__PURE__*/React.createElement("rect", {
    x: 3, y: 12, width: 4.5, height: 9, rx: 1.3, fill: C.dim
  }), /*#__PURE__*/React.createElement("rect", {
    x: 9.75, y: 7, width: 4.5, height: 14, rx: 1.3, fill: C.text
  }), /*#__PURE__*/React.createElement("rect", {
    x: 16.5, y: 3, width: 4.5, height: 18, rx: 1.3, fill: C.skill
  }))), habitPill, right || null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 20px",
      borderBottom: `1px solid ${C.card}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, left, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
      fontSize: 17
    }
  }, "Master", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.red
    }
  }, "ADR"))), rightCombined);
}
function BackBtn({
  onBack
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    style: {
      background: "none",
      border: "none",
      color: C.text,
      fontSize: 20,
      cursor: "pointer",
      padding: 0,
      lineHeight: 1
    }
  }, "‹");
}
function StreakPill({
  streak
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      border: `1px solid ${streak > 0 ? C.red : C.line}`,
      borderRadius: 20,
      padding: "6px 12px",
      fontSize: 13,
      fontWeight: 700,
      color: streak > 0 ? C.danger : C.dim
    }
  }, "🔥", streak);
}
function DailyHabitPill({
  habit
}) {
  if (!habit) return null;
  const met = habit.progressDay === dayIndex() && habit.progressToday >= habit.dailyGoal;
  const prog = habit.progressDay === dayIndex() ? habit.progressToday : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      border: `1px solid ${habit.streak > 0 ? C.skill : C.line}`,
      borderRadius: 20,
      padding: "6px 12px",
      fontSize: 13,
      fontWeight: 700,
      color: habit.streak > 0 ? C.skill : C.dim
    },
    title: `Seria dzienna: ${habit.streak} (rekord ${habit.bestStreak}) · zamrożenia: ${habit.freezes} · cel dziś: ${prog}/${habit.dailyGoal}`
  }, "📅", habit.streak, habit.freezes > 0 ? /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 11, opacity: 0.8 }
  }, " ❄", habit.freezes) : null, /*#__PURE__*/React.createElement("span", {
    style: { fontSize: 11, opacity: 0.85, marginLeft: 4, color: met ? C.skill : C.dim }
  }, ` ${Math.min(prog, habit.dailyGoal)}/${habit.dailyGoal}`));
}
function KindBadge({
  kind
}) {
  const col = kind === "skill" ? C.skill : kind === "fact" ? C.fact : C.ref;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: col,
      fontFamily: C.mono,
      border: `1px solid ${col}55`,
      borderRadius: 6,
      padding: "3px 8px",
      fontWeight: 700
    }
  }, KIND_LABEL[kind]);
}
function Stat({
  label,
  value,
  color
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      ...cardStyle,
      padding: "13px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      color,
      letterSpacing: "-0.02em"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.dim,
      marginTop: 2,
      fontFamily: C.mono
    }
  }, label));
}
function TrFoot() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 20px 16px",
      textAlign: "center",
      fontSize: 10,
      color: C.faint,
      fontFamily: C.mono,
      lineHeight: 1.5
    }
  }, "Materiał pomocniczy do samodzielnej nauki. Nie zastępuje szkolenia u akredytowanego doradcy DGSA ani egzaminu państwowego.", /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, ALL.length, " pozycji · silnik Leitnera", storage.mode === "memory" ? " · dane w pamięci" : ""));
}
const cardStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 14,
  padding: 16
};
function btn(bg, col, disabled = false, border) {
  return {
    width: "100%",
    padding: "15px 20px",
    borderRadius: 14,
    border: border ? `1px solid ${border}` : "none",
    background: disabled ? C.line : bg,
    color: disabled ? C.faint : col,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "-0.01em",
    cursor: disabled ? "not-allowed" : "pointer"
  };
}
function intervalLabel(box) {
  return {
    1: "10 min",
    2: "1 dzień",
    3: "3 dni",
    4: "7 dni",
    5: "16 dni"
  }[box] || "—";
}
function whenLabel(ts) {
  const ms = ts - Date.now();
  if (ms <= 0) return "teraz";
  const min = Math.round(ms / 60000);
  if (min < 60) return `za ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `za ${h} godz.`;
  const d = Math.round(h / 24);
  return `za ${d} dni`;
}
function fmtCorrect(q) {
  if (q.format === "order") return q.correct.join(" → ");
  if (q.format === "match") return Object.entries(q.correct).map(([k, v]) => `${k}=${v}`).join(" · ");
  return q.correct;
}

// Dashboard.jsx — EKRAN GŁÓWNY DriverOS jako system operacyjny kierowcy.
// To NIE jest ekran nauki. To launcher: "Dzisiaj" + siatka apek + pasek AI.
// Nauka (ADR Trainer) to JEDNA z apek, nie korzeń — jak Kalkulator w telefonie.
//
// Czas jazdy = ATRAPA, jawnie oznaczona DEMO. Bez realnego źródła (tacho/ręczne)
// nie wolno jej ufać — dlatego badge "DEMO" i brak alarmów opartych na tej liczbie.

/* ---------- ATRAPA DANYCH DNIA (jawnie demo) ----------
   W produkcji: z Profile Engine + tacho/ręczne wprowadzanie. Tu tylko kształt UI. */
const DEMO_DAY = {
  driveMinutes: 252,
  // 4h 12min z 9h
  driveLimit: 540,
  // 9h dzienny limit
  nextBreakIn: 18,
  // min do obowiązkowej przerwy (po 4,5h)
  tasksToday: 2,
  adrDaysLeft: 47,
  // do końca ważności ADR
  dueReviews: null // wstrzykiwane z realnego stanu nauki
};
const fmtHM = min => `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}min`;
function Dashboard({
  C,
  dueReviews,
  onOpenApp,
  onOpenAssist
}) {
  const d = {
    ...DEMO_DAY,
    dueReviews
  };
  const drivePct = Math.min(100, Math.round(d.driveMinutes / d.driveLimit * 100));

  // Pasek AI — proaktywne podpowiedzi. Czas jazdy oznaczony jako DEMO,
  // podpowiedzi z realnych danych (powtórki, ADR) bez tego zastrzeżenia.
  const aiTips = [{
    demo: true,
    text: `Masz ${d.nextBreakIn} min do obowiązkowej przerwy`,
    icon: "⏸️"
  }, d.dueReviews > 0 && {
    demo: false,
    text: `${d.dueReviews} ${dashPlural(d.dueReviews, "powtórka", "powtórki", "powtórek")} czeka w nauce`,
    icon: "📚",
    app: "trainer"
  }, {
    demo: true,
    text: `ADR ważny jeszcze ${d.adrDaysLeft} dni`,
    icon: "⚠️"
  }].filter(Boolean);
  return /*#__PURE__*/React.createElement("div", {
    style: dashWrap(C)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 20px 8px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 20,
      letterSpacing: "-0.02em"
    }
  }, "Driver", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.red
    }
  }, "OS")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      fontFamily: C.mono
    }
  }, "kierowca zawodowy")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "8px 20px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...dashCard(C)
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.dim,
      fontFamily: C.mono,
      letterSpacing: "0.03em"
    }
  }, "DZIŚ"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10,
      fontWeight: 800,
      color: C.amber,
      border: `1px solid ${C.amber}66`,
      borderRadius: 6,
      padding: "2px 7px",
      fontFamily: C.mono
    }
  }, "DEMO — dane przykładowe")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 34,
      fontWeight: 800,
      letterSpacing: "-0.03em"
    }
  }, fmtHM(d.driveMinutes)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: C.dim
    }
  }, "/ ", fmtHM(d.driveLimit), " jazdy")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 8,
      borderRadius: 4,
      background: C.line,
      overflow: "hidden",
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${drivePct}%`,
      background: drivePct >= 90 ? C.red : drivePct >= 70 ? C.amber : C.green,
      transition: "width .4s"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(MiniStat, {
    C: C,
    label: "Do przerwy",
    value: `${d.nextBreakIn} min`,
    color: C.amber
  }), /*#__PURE__*/React.createElement(MiniStat, {
    C: C,
    label: "Zadania",
    value: d.tasksToday,
    color: C.text
  }), /*#__PURE__*/React.createElement(MiniStat, {
    C: C,
    label: "ADR ważny",
    value: `${d.adrDaysLeft} dni`,
    color: C.greenLite
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...dashCard(C),
      background: "#12161D",
      borderColor: C.line
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono,
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", null, "✦"), " ASYSTENT"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, aiTips.map((t, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => t.app && onOpenApp(t.app),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: "none",
      border: "none",
      padding: 0,
      textAlign: "left",
      cursor: t.app ? "pointer" : "default",
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16
    }
  }, t.icon), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: C.text,
      flex: 1,
      lineHeight: 1.4
    }
  }, t.text), t.demo && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      color: C.amber,
      fontFamily: C.mono,
      opacity: 0.8
    }
  }, "DEMO"), t.app && /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.dim,
      fontSize: 14
    }
  }, "›"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(AppColumn, {
    C: C,
    title: "KIEROWCA",
    apps: DRIVER_APPS,
    onOpenApp: onOpenApp
  }), /*#__PURE__*/React.createElement(AppColumn, {
    C: C,
    title: "NAUKA",
    apps: LEARN_APPS,
    onOpenApp: onOpenApp,
    dueReviews: d.dueReviews
  })), /*#__PURE__*/React.createElement("button", {
    onClick: onOpenAssist,
    style: {
      ...dashBigBtn,
      background: C.red,
      color: "#fff",
      marginTop: 2
    }
  }, "🚨 Zdarzenie w trasie — kontrola / wypadek")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 20px 16px",
      textAlign: "center",
      fontSize: 10,
      color: C.faint,
      fontFamily: C.mono
    }
  }, "DriverOS · prototyp · dane czasu jazdy są przykładowe (DEMO)"));
}

/* ---------- APKI (rejestr) ---------- */
const DRIVER_APPS = [{
  id: "tachograf-app",
  icon: "🕐",
  label: "Tachograf",
  soon: true
}, {
  id: "czas-pracy-app",
  icon: "⏱️",
  label: "Czas pracy",
  soon: true
}, {
  id: "karty-app",
  icon: "💳",
  label: "Karty",
  soon: true
}, {
  id: "kontrole-app",
  icon: "🛃",
  label: "Kontrole",
  soon: true
}, {
  id: "checklisty-app",
  icon: "✓",
  label: "Checklisty",
  soon: true
}];
const LEARN_APPS = [{
  id: "trainer",
  icon: "🎓",
  label: "Nauka",
  badge: "dueReviews"
}, {
  id: "qa",
  icon: "💬",
  label: "Zapytaj"
}];
function AppColumn({
  C,
  title,
  apps,
  onOpenApp,
  dueReviews
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono,
      padding: "0 2px"
    }
  }, title), apps.map(a => {
    const badge = a.badge === "dueReviews" && dueReviews > 0 ? dueReviews : null;
    return /*#__PURE__*/React.createElement("button", {
      key: a.id,
      onClick: () => !a.soon && onOpenApp(a.id),
      disabled: a.soon,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "13px 14px",
        borderRadius: 12,
        border: `1px solid ${C.line}`,
        background: C.card,
        color: a.soon ? C.faint : C.text,
        cursor: a.soon ? "default" : "pointer",
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 18,
        opacity: a.soon ? 0.5 : 1
      }
    }, a.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 600,
        flex: 1
      }
    }, a.label), a.soon && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9,
        color: C.faint,
        fontFamily: C.mono
      }
    }, "wkrótce"), badge && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: 800,
        color: "#fff",
        background: C.red,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 5px"
      }
    }, badge));
  }));
}
function MiniStat({
  C,
  label,
  value,
  color
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 17,
      fontWeight: 800,
      color,
      letterSpacing: "-0.02em"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10,
      color: C.dim,
      fontFamily: C.mono,
      marginTop: 2
    }
  }, label));
}
function dashPlural(n, one, few, many) {
  if (n === 1) return one;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
  return many;
}
const dashWrap = C => ({
  maxWidth: 480,
  margin: "0 auto",
  minHeight: "100dvh",
  background: C.bg,
  color: C.text,
  fontFamily: "system-ui, -apple-system, sans-serif",
  display: "flex",
  flexDirection: "column"
});
const dashCard = C => ({
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  padding: 18
});
const dashBigBtn = {
  width: "100%",
  padding: "18px 24px",
  fontSize: 16,
  fontWeight: 800,
  border: "none",
  borderRadius: 14,
  cursor: "pointer",
  letterSpacing: "-0.01em"
};

/* ============================================================
   Guardian Engine — DriverOS (prototyp klikalny)
   Silniki in-memory, wierne Domain Model.
   UI: polski. Treść/zwroty: niemiecki (kraj) + podpis PL.
   Czat AI: symulacja NA BAZIE wiedzy (T3, z źródłem), nie "wie wszystko".
   ============================================================ */

const Trust = {
  T1: {
    id: "T1",
    label: "Zweryfikowane",
    color: "#1B7F4B",
    bar: 4
  },
  T2: {
    id: "T2",
    label: "Wymaga aktualizacji",
    color: "#B58A00",
    bar: 3
  },
  T3: {
    id: "T3",
    label: "Odpowiedź AI",
    color: "#2563C9",
    bar: 2
  },
  T4: {
    id: "T4",
    label: "Tryb awaryjny",
    color: "#8A8F98",
    bar: 1
  }
};
const KNOWLEDGE = {
  "rights-de": {
    versionId: "v1.2",
    trust: "T1",
    ref: "StVO §36",
    actions: ["Zachowaj spokój i zostań w pojeździe.", "Pokaż prawo jazdy i dokumenty pojazdu.", "Musisz podać tylko dane osobowe."],
    rights: ["Prawo do milczenia (poza danymi osobowymi)", "Prawo do adwokata"],
    warnings: ["Nie odjeżdżaj.", "Nie fałszuj dokumentów."]
  }
};
const CONDUCT_DE = {
  trust: "T1",
  rules: ["Zatrzymaj się w bezpiecznym miejscu.", "Zgaś silnik, opuść szybę.", "Ręce widoczne na kierownicy.", "Bądź uprzejmy i rzeczowy."]
};

// Dokumenty TIR (T1). "hold" = zostaje u ciebie / okazujesz do wglądu.
const TIR_DOCS = {
  versionId: "v1.0",
  ref: "BALM · rozp. 165/2014",
  items: [{
    t: "Prawo jazdy CE + kod 95",
    d: "Kategoria CE i kwalifikacja zawodowa (kod 95)."
  }, {
    t: "Karta kierowcy",
    d: "Do tachografu. Wkładasz do urządzenia."
  }, {
    t: "Dowód rejestracyjny + badania techniczne",
    d: "Ważne badania pojazdu."
  }, {
    t: "Licencja wspólnotowa UE",
    d: "Uprawnienie przewoźnika."
  }, {
    t: "CMR — list przewozowy",
    d: "Okazujesz do wglądu. Masz 3 egzemplarze — twój zostaje u ciebie."
  }, {
    t: "Ubezpieczenie (OC + CMR)",
    d: "Polisa pojazdu i przewoźnika."
  }, {
    t: "ADR",
    d: "Tylko jeśli wieziesz towar niebezpieczny."
  }, {
    t: "Potwierdzenie Maut",
    d: "Opłata drogowa za ciężarówkę."
  }]
};
const PHRASES = [{
  group: "Język / pierwszy kontakt",
  color: "#2563C9",
  items: [{
    de: "Guten Tag. Ich bin Berufskraftfahrer aus Polen.",
    pl: "Dzień dobry. Jestem kierowcą zawodowym z Polski."
  }, {
    de: "Ich spreche leider nur wenig Deutsch.",
    pl: "Niestety mówię tylko trochę po niemiecku."
  }, {
    de: "Sprechen Sie Englisch oder Polnisch?",
    pl: "Czy mówi Pan po angielsku lub polsku?"
  }]
}, {
  group: "Dokumenty",
  color: "#1B7F4B",
  items: [{
    de: "Hier sind mein Führerschein und die Fahrzeugpapiere.",
    pl: "Oto moje prawo jazdy i dokumenty pojazdu."
  }, {
    de: "Hier sind die Fahrerkarte und der CMR-Frachtbrief.",
    pl: "Oto karta kierowcy i list przewozowy CMR."
  }, {
    de: "Einen Moment bitte, ich hole meine Papiere.",
    pl: "Chwileczkę, wyjmuję dokumenty."
  }]
}, {
  group: "Pytania / sytuacja",
  color: "#B58A00",
  items: [{
    de: "Gibt es ein Problem? Können Sie es mir erklären?",
    pl: "Czy jest jakiś problem? Może mi Pan wyjaśnić?"
  }, {
    de: "Warum wurde ich angehalten?",
    pl: "Dlaczego zostałem zatrzymany?"
  }, {
    de: "Wie hoch ist das Bußgeld und wie kann ich zahlen?",
    pl: "Jak wysoki jest mandat i jak mogę zapłacić?"
  }]
}, {
  group: "Prawa (spokojnie, asertywnie)",
  color: "#D98880",
  items: [{
    de: "Ich möchte bitte einen Dolmetscher.",
    pl: "Poproszę o tłumacza."
  }, {
    de: "Ich möchte zu diesem Vorwurf nichts sagen.",
    pl: "Nie chcę się wypowiadać w tej sprawie."
  }, {
    de: "Kann ich bitte einen schriftlichen Nachweis bekommen?",
    pl: "Czy mogę dostać pisemne potwierdzenie?"
  }]
}];

// Kierunek DE->PL: typowe zwroty policjanta. Kierowca wpisuje/dyktuje co usłyszał.
const SIM_DICT_DE = [{
  k: ["führerschein", "papiere", "dokumente", "fahrzeugpapiere"],
  pl: "Poproszę prawo jazdy i dokumenty pojazdu."
}, {
  k: ["fahrerkarte"],
  pl: "Poproszę kartę kierowcy."
}, {
  k: ["frachtbrief", "cmr", "ladung", "fracht"],
  pl: "Poproszę list przewozowy / dokumenty ładunku."
}, {
  k: ["alkohol", "pusten", "atemtest"],
  pl: "Proszę dmuchnąć — test na alkohol."
}, {
  k: ["zu schnell", "geschwindigkeit", "tempo"],
  pl: "Jechał Pan za szybko (prędkość)."
}, {
  k: ["aussteigen", "steigen sie aus"],
  pl: "Proszę wysiąść z pojazdu."
}, {
  k: ["bußgeld", "strafe", "zahlen", "kaution"],
  pl: "Musi Pan zapłacić mandat / kaucję."
}, {
  k: ["warten", "moment", "einen moment"],
  pl: "Proszę czekać."
}, {
  k: ["weiterfahren", "können fahren", "alles in ordnung"],
  pl: "Wszystko w porządku, może Pan jechać."
}, {
  k: ["motor", "ausschalten", "abstellen"],
  pl: "Proszę zgasić silnik."
}];
function simulateTranslateDE(de) {
  const t = de.toLowerCase();
  const hit = SIM_DICT_DE.find(e => e.k.some(w => t.includes(w)));
  return hit ? hit.pl : "(demo) Tłumaczenie DE→PL pojawi się po wpięciu AI.";
}
const QUICK_DE = [{
  label: "Dokumente!",
  full: "Führerschein und Fahrzeugpapiere bitte."
}, {
  label: "Aussteigen",
  full: "Bitte steigen Sie aus."
}, {
  label: "Alkoholtest",
  full: "Bitte pusten — Atemtest."
}, {
  label: "Zu schnell",
  full: "Sie sind zu schnell gefahren."
}, {
  label: "Bußgeld",
  full: "Sie müssen ein Bußgeld zahlen."
}, {
  label: "Weiterfahren",
  full: "Alles in Ordnung, Sie können weiterfahren."
}];

// Szybkie zwroty do tłumacza — tapnięcie od razu pokazuje niemieckie zdanie.
const QUICK_TRANSLATE = [{
  label: "Oto dokumenty",
  de: "Hier sind meine Dokumente."
}, {
  label: "Oto CMR",
  de: "Hier ist der CMR-Frachtbrief."
}, {
  label: "Karta kierowcy",
  de: "Hier ist meine Fahrerkarte."
}, {
  label: "Chwila, proszę",
  de: "Einen Moment bitte."
}, {
  label: "Nie rozumiem",
  de: "Entschuldigung, ich verstehe nicht."
}, {
  label: "Ile wynosi mandat?",
  de: "Wie hoch ist das Bußgeld?"
}, {
  label: "Proszę o tłumacza",
  de: "Ich möchte einen Dolmetscher."
}, {
  label: "Dziękuję",
  de: "Vielen Dank."
}];
const SIM_DICT = [{
  k: ["dokument", "papier", "prawo jazdy"],
  de: "Hier sind meine Dokumente."
}, {
  k: ["cmr", "list przewozowy", "fracht"],
  de: "Hier ist der CMR-Frachtbrief."
}, {
  k: ["karta kierowcy", "tacho"],
  de: "Hier ist meine Fahrerkarte."
}, {
  k: ["ubezpieczenie", "oc"],
  de: "Hier ist meine Versicherung."
}, {
  k: ["nie rozumiem", "nie wiem"],
  de: "Entschuldigung, ich verstehe nicht."
}, {
  k: ["chwila", "moment", "czekać"],
  de: "Einen Moment bitte."
}, {
  k: ["mandat", "ile", "zapłacić"],
  de: "Wie hoch ist das Bußgeld?"
}, {
  k: ["tłumacz"],
  de: "Ich möchte einen Dolmetscher."
}, {
  k: ["dziękuję", "dzięki"],
  de: "Vielen Dank."
}];
function simulateTranslate(pl) {
  const t = pl.toLowerCase();
  const hit = SIM_DICT.find(e => e.k.some(w => t.includes(w)));
  return hit ? hit.de : "(demo) Tłumaczenie pojawi się tu po wpięciu AI.";
}

// Czat Q&A — odpowiada TYLKO z tej bazy. Każda odpowiedź ma źródło. Brak -> T4.
const QA_INSPECTION = [{
  k: ["oddać cmr", "zabrać cmr", "cmr zostaje", "muszę dać cmr", "dać cmr"],
  a: "Nie oddajesz. CMR okazujesz do wglądu. Masz 3 egzemplarze (nadawca / odbiorca / przewoźnik) — twój zostaje u ciebie.",
  src: "Konwencja CMR"
}, {
  k: ["ile dni tacho", "ile dni tachograf", "56 dni", "28 dni", "ile tacho"],
  a: "Od 31.12.2024 musisz wykazać bieżący dzień + poprzednie 56 dni (wcześniej było 28).",
  src: "rozp. 165/2014 art. 36 · pakiet mobilności"
}, {
  k: ["kiedy wydruk", "wydruk tacho", "wydruk z tacho"],
  a: "Wydruk robisz na żądanie inspektora. Miej też wydruki do wyjaśnień, jeśli była jazda bez karty lub usterka tachografu.",
  src: "rozp. 165/2014"
}, {
  k: ["kto kontroluje", "kto może", "jakie służby", "kto sprawdza"],
  a: "Trzy służby: BALM (transport, Maut, czas pracy), Autobahnpolizei (autostrady) i Landespolizei.",
  src: "BALM"
}, {
  k: ["co mogą sprawdzić", "co sprawdzają", "co kontrolują", "zakres kontroli"],
  a: "Tożsamość, dokumenty, tachograf (56 dni), stan techniczny oraz zabezpieczenie i masę ładunku (możliwe ważenie).",
  src: "BALM"
}, {
  k: ["mandat", "kaucja", "ile zapłacę", "grzywna"],
  a: "Od zagranicznych kierowców inspektor pobiera kaucję na miejscu. Wysokość zależy od naruszenia.",
  src: "BALM"
}, {
  k: ["kabotaż", "kabotaz"],
  a: "Kabotaż to przewóz wewnątrz Niemiec pojazdem z innego kraju — jest ściśle limitowany.",
  src: "przepisy kabotażowe UE"
}];
const QA_ACCIDENT = [{
  k: ["oświadczenie", "oswiadczenie", "druk", "formularz"],
  a: "Europejskie oświadczenie o wypadku spisujecie, gdy policja nie przyjeżdża. Podpis NIE oznacza przyznania winy — to tylko opis zdarzenia.",
  src: "Europejskie oświadczenie o wypadku"
}, {
  k: ["wina", "winny", "przyznać", "przyznac"],
  a: "Nie przyznawaj się do winy na miejscu. Winę rozstrzygają policja i ubezpieczyciele na podstawie faktów.",
  src: "MOTOEXPERT / praktyka DE"
}, {
  k: ["ucieczka", "odjechać", "odjechac", "unfallflucht", "oddalić"],
  a: "Oddalenie się z miejsca (Unfallflucht, §142 StGB) to przestępstwo — grzywna, do 3 lat więzienia lub utrata prawa jazdy.",
  src: "§142 StGB"
}, {
  k: ["ubezpieczyciel", "ubezpieczenie", "szkoda", "zgłosić", "zglosic"],
  a: "Zgłoś szkodę swojemu ubezpieczycielowi. Dla kierowców z UE szkodę prowadzi niemiecki pełnomocnik ich ubezpieczyciela.",
  src: "System Zielonej Karty UE"
}, {
  k: ["holowanie", "laweta", "odholować", "pojazd niejezdny"],
  a: "Przy poważnym uszkodzeniu nie usuwaj pojazdu bez zgody policji, jeśli ją wezwano. Holowanie zamów po zabezpieczeniu miejsca.",
  src: "StVO / praktyka DE"
}, {
  k: ["świadk", "swiadk"],
  a: "Spisz dane świadków (za ich zgodą) lub nagraj relację. Ich zeznania pomagają ustalić przebieg zdarzenia.",
  src: "praktyka ubezpieczeniowa"
}, {
  k: ["policja", "wzywać", "wzywac", "kiedy policj"],
  a: "Policję wzywasz obowiązkowo, gdy: są ranni, poważna szkoda, spór o przebieg, podejrzenie nietrzeźwości lub ucieczka drugiego kierowcy.",
  src: "praktyka DE"
}];
function answerQuestion(q, base) {
  const t = q.toLowerCase();
  const hit = (base || QA_INSPECTION).find(e => e.k.some(w => t.includes(w)));
  if (hit) return {
    trust: "T3",
    text: hit.a,
    src: hit.src
  };
  return {
    trust: "T4",
    text: "Brak zweryfikowanej wiedzy na to pytanie. Trzymaj się pokazanych kroków. To nie jest porada prawna.",
    src: null
  };
}

// Wyniki zdarzenia — zamknięta lista per typ (bez "wpisz sam", żeby dane były czyste).
// Każdy mapuje się na niemiecki termin — ważne dla raportu dowodowego.
// Wynik zależy od typu zdarzenia: kontrola kończy się inaczej niż wypadek.
const OUTCOMES_BY_EVENT = {
  ROAD_INSPECTION: [{
    id: "OK",
    label: "Puszczono wolno / bez uwag",
    de: "Weiterfahrt gestattet",
    color: "#1B7F4B"
  }, {
    id: "ERMAHNUNG",
    label: "Pouczenie (bez opłaty)",
    de: "Ermahnung / Verwarnung",
    color: "#1B7F4B"
  }, {
    id: "VERWARNUNGSGELD",
    label: "Mandat drobny (do ~55 EUR)",
    de: "Verwarnungsgeld",
    color: "#B58A00"
  }, {
    id: "BUSSGELD",
    label: "Mandat / grzywna (od ~60 EUR)",
    de: "Bußgeld",
    color: "#B58A00"
  }, {
    id: "KAUTION",
    label: "Kaucja pobrana na miejscu",
    de: "Sicherheitsleistung",
    color: "#B58A00"
  }, {
    id: "UNTERSAGT",
    label: "Zakaz dalszej jazdy / unieruchomienie",
    de: "Weiterfahrt untersagt",
    color: "#C1121F"
  }],
  ACCIDENT: [{
    id: "POLICE_REPORT",
    label: "Policja spisała protokół (jest nr akt)",
    de: "Polizeilicher Unfallbericht",
    color: "#1B7F4B"
  }, {
    id: "STATEMENT",
    label: "Europejskie oświadczenie (bez policji)",
    de: "Einvernehmliche Unfallmeldung",
    color: "#1B7F4B"
  }, {
    id: "DISPUTE",
    label: "Spór — brak zgody stron",
    de: "Uneinigkeit / Streitfall",
    color: "#B58A00"
  }, {
    id: "TOWED",
    label: "Pojazd niejezdny — holowanie",
    de: "Fahrzeug abgeschleppt",
    color: "#B58A00"
  }, {
    id: "INJURY",
    label: "Są ranni — sprawa z obrażeniami",
    de: "Personenschaden",
    color: "#C1121F"
  }]
};
function outcomesFor(evt) {
  return OUTCOMES_BY_EVENT[evt] || OUTCOMES_BY_EVENT.ROAD_INSPECTION;
}
function findOutcome(evt, id) {
  return outcomesFor(evt).find(o => o.id === id) || null;
}

// ===================== WYPADEK (Accident_DE) — wiedza zweryfikowana =====================
const ACC_SAFETY = {
  trust: "T1",
  ref: "StVO §34",
  rules: ["Włącz światła awaryjne.", "Załóż kamizelkę odblaskową PRZED wyjściem.", "Ustaw trójkąt (autostrada: ~150–200 m za pojazdem).", "Zejdź za barierę, z dala od jezdni."]
};
const ACC_INJURED = {
  trust: "T1",
  ref: "§323c StGB",
  contacts: [{
    label: "Ratunkowy",
    number: "112"
  }, {
    label: "Policja",
    number: "110"
  }],
  steps: ["Sprawdź przytomność i oddech poszkodowanego.", "Dzwoń 112 — dyspozytor poprowadzi cię przez telefon.", "Nie przenoś ciężko rannych bez potrzeby (chyba że zagrożenie, np. pożar).", "Zostań przy poszkodowanym do przyjazdu służb."],
  cpr: ["Brak oddechu → ułóż na plecach, odsłoń klatkę.", "Uciskaj środek klatki: 30 uciśnięć, głębokość ~5–6 cm.", "Tempo ~100–120/min (rytm piosenki „Stayin' Alive”).", "2 oddechy ratownicze, potem znów 30 uciśnięć.", "Nie przerywaj do przyjazdu służb lub odzyskania oddechu."],
  legal: ["W Niemczech nieudzielenie pomocy (unterlassene Hilfeleistung, §323c StGB) to przestępstwo.", "Karane jest zaniechanie, NIE nieudany skutek — nie musisz być ratownikiem.", "Obowiązek zdejmuje tylko realne zagrożenie dla ciebie lub przyjazd służb."]
};
const POLICE_TRIGGERS = [{
  id: "injured",
  q: "Czy ktoś jest ranny?"
}, {
  id: "serious",
  q: "Poważne uszkodzenia lub duża szkoda?"
}, {
  id: "dispute",
  q: "Brak zgody co do przebiegu lub winy?"
}, {
  id: "suspect",
  q: "Drugi kierowca pod wpływem, ucieka lub odmawia dokumentów?"
}];
const ACC_EXCHANGE = {
  trust: "T1",
  ref: "Europejskie oświadczenie o wypadku",
  fields: ["Imię, nazwisko i adres drugiego kierowcy", "Ubezpieczyciel + numer polisy", "Numer rejestracyjny pojazdu", "Dane świadków (za ich zgodą)"],
  warnings: ["NIE przyznawaj się do winy — rozstrzygną policja i ubezpieczyciele.", "NIE podpisuj dokumentów, których nie rozumiesz.", "Ucieczka z miejsca (Unfallflucht) to przestępstwo — do 3 lat lub utrata prawa jazdy."]
};
const ACCIDENT_DE = {
  id: "Accident_DE",
  version: "1.0.0",
  steps: [{
    id: "safety",
    kind: "SAFETY_CARD",
    title: "Zabezpiecz miejsce — najpierw",
    tag: "prawo"
  }, {
    id: "injured",
    kind: "INJURED_CARD",
    title: "Sprawdź rannych",
    tag: "prawo"
  }, {
    id: "decide",
    kind: "DECISION_POINT",
    title: "Czy wzywać policję?"
  }, {
    id: "exchange",
    kind: "EXCHANGE_DATA",
    title: "Wymiana danych",
    tag: "prawo"
  }, {
    id: "ask",
    kind: "AI_CHAT",
    title: "Zapytaj o wypadek"
  }, {
    id: "photo",
    kind: "CAPTURE_PHOTO",
    title: "Zabezpiecz dowód"
  }, {
    id: "report",
    kind: "GENERATE_REPORT",
    title: "Utwórz raport"
  }]
};
const RULES = [{
  priority: 100,
  when: {
    country: "DE",
    event: "ROAD_INSPECTION",
    vehicle: "TRUCK"
  },
  workflow: "Inspection_DE"
}, {
  priority: 90,
  when: {
    country: "DE",
    event: "ROAD_INSPECTION"
  },
  workflow: "Inspection_DE"
}, {
  priority: 100,
  when: {
    country: "DE",
    event: "ACCIDENT",
    vehicle: "TRUCK"
  },
  workflow: "Accident_DE"
}, {
  priority: 90,
  when: {
    country: "DE",
    event: "ACCIDENT"
  },
  workflow: "Accident_DE"
}];
function matchRule(ctx) {
  return RULES.filter(r => Object.entries(r.when).every(([k, v]) => ctx[k] === v)).sort((a, b) => b.priority - a.priority)[0]?.workflow ?? null;
}
const INSPECTION_DE = {
  id: "Inspection_DE",
  version: "1.1.0",
  steps: [{
    id: "conduct",
    kind: "CONDUCT_CARD",
    title: "Jak się zachować — od razu",
    tag: "postępowanie"
  }, {
    id: "knowledge",
    kind: "SHOW_KNOWLEDGE",
    title: "Co teraz zrobić",
    knowledgeId: "rights-de",
    tag: "prawo"
  }, {
    id: "docs",
    kind: "TIR_DOCS",
    title: "Dokumenty do kontroli",
    tag: "prawo"
  }, {
    id: "ask",
    kind: "AI_CHAT",
    title: "Zapytaj o kontrolę"
  }, {
    id: "translate",
    kind: "TRANSLATE",
    title: "Powiedz to policjantowi",
    requiresNetwork: true
  }, {
    id: "photo",
    kind: "CAPTURE_PHOTO",
    title: "Zabezpiecz dowód"
  }, {
    id: "report",
    kind: "GENERATE_REPORT",
    title: "Utwórz raport"
  }]
};
const WORKFLOWS = {
  Inspection_DE: INSPECTION_DE,
  Accident_DE: ACCIDENT_DE
};
function TrustBadge({
  level,
  tag,
  labelOverride
}) {
  const t = Trust[level];
  if (!t) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 3,
      alignItems: "flex-end",
      height: 22
    }
  }, [1, 2, 3, 4].map(n => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      width: 6,
      height: 6 + n * 4,
      borderRadius: 1,
      background: n <= t.bar ? t.color : "#2A2E37"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      lineHeight: 1.15
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      color: t.color,
      fontWeight: 700,
      fontSize: 15,
      letterSpacing: "-0.01em"
    }
  }, labelOverride || t.label), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "#6B7280",
      fontSize: 11,
      fontFamily: "ui-monospace, monospace"
    }
  }, t.id, tag ? ` · ${tag}` : "")));
}
const wrap = {
  maxWidth: 480,
  margin: "0 auto",
  minHeight: "100dvh",
  background: "#0E1117",
  color: "#E8EAED",
  fontFamily: "system-ui, -apple-system, sans-serif",
  display: "flex",
  flexDirection: "column"
};
const card = {
  background: "#171B22",
  border: "1px solid #232833",
  borderRadius: 16,
  padding: 20
};
const bigBtn = {
  width: "100%",
  padding: "20px 24px",
  fontSize: 18,
  fontWeight: 700,
  border: "none",
  borderRadius: 14,
  cursor: "pointer",
  letterSpacing: "-0.01em"
};

// Dyktowanie (Web Speech API). Graceful jak brak wsparcia.
function useDictation(onText) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const supported = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  function toggle() {
    if (!supported) return;
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "pl-PL";
    rec.interimResults = false;
    rec.onresult = e => onText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }
  return {
    supported,
    listening,
    toggle
  };
}
function MicButton({
  onText
}) {
  const {
    supported,
    listening,
    toggle
  } = useDictation(onText);
  const [hint, setHint] = useState(false);
  function handle() {
    if (supported) {
      toggle();
    } else {
      setHint(true);
      setTimeout(() => setHint(false), 2600);
    }
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handle,
    "aria-label": "Dyktuj",
    style: {
      width: 52,
      height: 52,
      borderRadius: 12,
      cursor: "pointer",
      border: "1px solid #232833",
      background: listening ? "#C1121F" : "#0E1117",
      color: listening ? "#fff" : "#9AA0AA",
      fontSize: 20
    }
  }, listening ? "●" : "🎙"), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 58,
      right: 0,
      width: 200,
      background: "#232833",
      color: "#E8EAED",
      fontSize: 12,
      padding: "8px 10px",
      borderRadius: 8,
      zIndex: 5,
      lineHeight: 1.4
    }
  }, "Dyktowanie działa w pełnej aplikacji. W tym podglądzie mikrofon może być zablokowany."));
}

// ===================== EVIDENCE ENGINE =====================
// Zdjęcie dowodowe = metadane (czas, GPS, numer, sekwencja) + hash SHA-256.
// Hash pęka przy każdej zmianie -> dowód nie do podmiany po fakcie.
async function computeEvidenceHash(meta) {
  const data = JSON.stringify(meta);
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    // Fallback (środowisko bez crypto.subtle) — prosty niekryptograficzny skrót
    let h = 0;
    for (let i = 0; i < data.length; i++) {
      h = h * 31 + data.charCodeAt(i) | 0;
    }
    return "fallback-" + (h >>> 0).toString(16);
  }
}
function DriverOS({
  onExit
}) {
  const [screen, setScreen] = useState("home");
  const [online, setOnline] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [knowledgeUsed, setKnowledgeUsed] = useState([]);
  const [trustSeen, setTrustSeen] = useState([]);
  const [transInput, setTransInput] = useState("");
  const [transLog, setTransLog] = useState([]);
  const [transDir, setTransDir] = useState("PL_DE"); // PL_DE | DE_PL
  const [chatQ, setChatQ] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [engineLog, setEngineLog] = useState([]);
  const [gps, setGps] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle|loading|ok|denied|unavailable
  const [photos, setPhotos] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [activeEvent, setActiveEvent] = useState("ROAD_INSPECTION");
  const [decision, setDecision] = useState({});
  const ctx = useMemo(() => ({
    country: "DE",
    event: activeEvent,
    vehicle: "TRUCK",
    connectivity: online ? "ONLINE" : "OFFLINE",
    language: "pl"
  }), [online, activeEvent]);
  const workflow = WORKFLOWS[matchRule(ctx)] || INSPECTION_DE;
  const step = workflow.steps[stepIdx];
  function logEngine(kind, detail, trust) {
    setEngineLog(log => [...log, {
      ts: new Date().toISOString(),
      kind,
      detail,
      trust: trust ?? null
    }]);
  }
  function requestGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("unavailable");
      logEngine("GPS", "Brak dostępu do lokalizacji w tym środowisku", "T4");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(pos => {
      const g = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        acc: Math.round(pos.coords.accuracy)
      };
      setGps(g);
      setGpsStatus("ok");
      logEngine("GPS", `Pozycja ustalona (±${g.acc} m)`, "T1");
    }, () => {
      setGpsStatus("denied");
      logEngine("GPS", "Użytkownik nie udostępnił lokalizacji", "T4");
    }, {
      enableHighAccuracy: true,
      timeout: 8000
    });
  }
  function startWorkflow(evt) {
    const c = {
      country: "DE",
      event: evt,
      vehicle: "TRUCK",
      connectivity: online ? "ONLINE" : "OFFLINE",
      language: "pl"
    };
    const wf = matchRule(c);
    if (!wf) return;
    setActiveEvent(evt);
    setStepIdx(0);
    setKnowledgeUsed([]);
    setTrustSeen([]);
    setTransInput("");
    setTransLog([]);
    setChatQ("");
    setChatLog([]);
    setOutcome(null);
    setPhotos([]);
    setGps(null);
    setGpsStatus("idle");
    setDecision({});
    const t0 = new Date().toISOString();
    setStartedAt(t0);
    setEngineLog([{
      ts: t0,
      kind: "CONTEXT",
      detail: `Kontekst: ${c.country} · ${evt} · ${c.vehicle} · ${c.connectivity}`,
      trust: "T1"
    }, {
      ts: t0,
      kind: "DECISION",
      detail: `Reguła (deterministyczna) → ${wf}`,
      trust: "T1"
    }]);
    requestGps();
    setScreen("workflow");
  }
  function resolveStep(s) {
    if (s.kind === "CONDUCT_CARD") return {
      trust: "T1",
      tag: s.tag
    };
    if (s.kind === "SAFETY_CARD") return {
      trust: "T1",
      tag: s.tag
    };
    if (s.kind === "INJURED_CARD") return {
      trust: "T1",
      tag: s.tag
    };
    if (s.kind === "DECISION_POINT") return {
      trust: "T1",
      tag: "decyzja"
    };
    if (s.kind === "EXCHANGE_DATA") return {
      trust: "T1",
      tag: s.tag
    };
    if (s.kind === "SHOW_KNOWLEDGE") return {
      trust: KNOWLEDGE[s.knowledgeId].trust,
      knowledge: KNOWLEDGE[s.knowledgeId],
      tag: s.tag
    };
    if (s.kind === "TIR_DOCS") return {
      trust: "T1",
      tag: s.tag
    };
    if (s.kind === "AI_CHAT") return {
      trust: "T3",
      label: "Wiedza AI"
    };
    if (s.kind === "TRANSLATE") return s.requiresNetwork && !online ? {
      trust: "T4",
      fellBack: true,
      label: "Tłumacz AI"
    } : {
      trust: "T3",
      label: "Tłumacz AI"
    };
    return {
      trust: null
    };
  }
  function pushTranslate(input) {
    const t = input.trim();
    if (!t) return;
    if (transDir === "PL_DE") {
      const de = simulateTranslate(t);
      setTransLog(log => [...log, {
        dir: "PL_DE",
        src: t,
        out: de
      }]);
      logEngine("TRANSLATE", `PL→DE: "${t}" → "${de}"`, "T3");
    } else {
      const pl = simulateTranslateDE(t);
      setTransLog(log => [...log, {
        dir: "DE_PL",
        src: t,
        out: pl
      }]);
      logEngine("TRANSLATE", `DE→PL: "${t}" → "${pl}"`, "T3");
    }
    setTrustSeen(tr => [...new Set([...tr, "T3"])]);
    setTransInput("");
  }
  function askChat() {
    const q = chatQ.trim();
    if (!q) return;
    const base = activeEvent === "ACCIDENT" ? QA_ACCIDENT : QA_INSPECTION;
    const r = answerQuestion(q, base);
    setChatLog(log => [...log, {
      q,
      ...r
    }]);
    setTrustSeen(t => [...new Set([...t, r.trust])]);
    logEngine("AI_CHAT", `Pytanie: "${q}" → ${r.trust}${r.src ? " · źródło: " + r.src : ""}`, r.trust);
    setChatQ("");
  }
  function recordAndAdvance(dir) {
    if (dir === "next") {
      const r = resolveStep(step);
      if (r.knowledge) {
        setKnowledgeUsed(k => [...new Set([...k, r.knowledge.versionId])]);
        logEngine("KNOWLEDGE", `Pokazano wiedzę ${r.knowledge.ref} (${r.knowledge.versionId})`, r.trust);
      }
      if (step.kind === "TIR_DOCS") {
        setKnowledgeUsed(k => [...new Set([...k, TIR_DOCS.versionId])]);
        logEngine("KNOWLEDGE", `Pokazano listę dokumentów (${TIR_DOCS.versionId})`, "T1");
      }
      if (step.kind === "TRANSLATE") {
        logEngine("STEP", r.fellBack ? "Tłumacz: OFFLINE → karta zwrotów" : "Tłumacz: ONLINE → tłumaczenie na żywo", r.trust);
      }
      if (step.kind === "DECISION_POINT") {
        const mustCall = POLICE_TRIGGERS.some(t => decision[t.id] === true);
        const yes = POLICE_TRIGGERS.filter(t => decision[t.id] === true).map(t => t.id);
        logEngine("DECISION", mustCall ? `Policja WYMAGANA (przesłanki: ${yes.join(", ")})` : "Policja niewymagana → Europejskie oświadczenie", "T1");
      }
      if (r.trust && step.kind !== "AI_CHAT") setTrustSeen(t => [...new Set([...t, r.trust])]);
      if (stepIdx + 1 >= workflow.steps.length) setScreen("report");else {
        setStepIdx(stepIdx + 1);
        setTransLog([]);
        setTransInput("");
      }
    } else {
      if (stepIdx === 0) setScreen("home");else {
        setStepIdx(stepIdx - 1);
        setTransLog([]);
        setTransInput("");
      }
    }
  }

  /* ---------- EKRAN STARTOWY ---------- */
  if (screen === "home") {
    return /*#__PURE__*/React.createElement("div", {
      style: wrap
    }, /*#__PURE__*/React.createElement(Header, {
      online: online,
      setOnline: setOnline,
      title: "Zdarzenie",
      onExit: onExit
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#6B7280",
        fontFamily: "ui-monospace, monospace",
        letterSpacing: "0.02em"
      }
    }, "Niemcy · ciężarówka · kierowca zawodowy"), /*#__PURE__*/React.createElement("h1", {
      style: {
        fontSize: 26,
        fontWeight: 800,
        margin: "6px 0 0",
        letterSpacing: "-0.02em"
      }
    }, "Co się stało?"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: "#9AA0AA",
        fontSize: 14,
        margin: "8px 0 0"
      }
    }, "Powiedz, co się dzieje — pokażę ci, co zrobić krok po kroku.")), /*#__PURE__*/React.createElement("button", {
      style: {
        ...bigBtn,
        background: "#C1121F",
        color: "#fff",
        marginTop: 8
      },
      onClick: () => startWorkflow("ROAD_INSPECTION")
    }, "🚨 Kontrola drogowa"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...bigBtn,
        background: "#C1121F",
        color: "#fff"
      },
      onClick: () => startWorkflow("ACCIDENT")
    }, "💥 Wypadek / kolizja"), /*#__PURE__*/React.createElement("button", {
      style: {
        ...bigBtn,
        background: "#171B22",
        color: "#5A6270",
        border: "1px solid #232833",
        cursor: "not-allowed"
      },
      disabled: true
    }, "Awaria · wkrótce")), /*#__PURE__*/React.createElement(Foot, null));
  }

  /* ---------- WORKFLOW ---------- */
  if (screen === "workflow") {
    const r = resolveStep(step);
    const k = r.knowledge;
    const isLast = stepIdx + 1 >= workflow.steps.length;
    return /*#__PURE__*/React.createElement("div", {
      style: wrap
    }, /*#__PURE__*/React.createElement(Header, {
      online: online,
      setOnline: setOnline,
      title: "DriverOS"
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "10px 20px",
        display: "flex",
        gap: 4
      }
    }, workflow.steps.map((s, i) => /*#__PURE__*/React.createElement("div", {
      key: s.id,
      style: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        background: i <= stepIdx ? "#C1121F" : "#232833"
      }
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6B7280",
        fontFamily: "ui-monospace, monospace"
      }
    }, "Krok ", stepIdx + 1, "/", workflow.steps.length), r.trust && /*#__PURE__*/React.createElement(TrustBadge, {
      level: r.trust,
      tag: r.tag,
      labelOverride: r.label
    })), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontSize: 23,
        fontWeight: 800,
        margin: 0,
        letterSpacing: "-0.02em"
      }
    }, step.title), step.kind === "CONDUCT_CARD" && /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        borderColor: "#1B7F4B33"
      }
    }, CONDUCT_DE.rules.map((u, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 12,
        padding: "10px 0",
        fontSize: 16,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#1B7F4B",
        fontWeight: 800
      }
    }, "✓"), u))), step.kind === "SAFETY_CARD" && /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        borderColor: "#C1121F44"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 10,
        fontFamily: "ui-monospace, monospace"
      }
    }, ACC_SAFETY.ref), ACC_SAFETY.rules.map((u, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 12,
        padding: "10px 0",
        fontSize: 16,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C1121F",
        fontWeight: 800,
        fontFamily: "ui-monospace, monospace"
      }
    }, i + 1), u))), step.kind === "INJURED_CARD" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        borderColor: "#C1121F44"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 10,
        marginBottom: 14
      }
    }, ACC_INJURED.contacts.map(c => /*#__PURE__*/React.createElement("a", {
      key: c.number,
      href: `tel:${c.number}`,
      style: {
        flex: 1,
        textAlign: "center",
        padding: "14px 0",
        background: "#C1121F",
        color: "#fff",
        borderRadius: 12,
        textDecoration: "none",
        fontWeight: 700
      }
    }, c.label, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 24
      }
    }, c.number)))), ACC_INJURED.steps.map((u, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 12,
        padding: "8px 0",
        fontSize: 15,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C1121F",
        fontWeight: 800
      }
    }, "•"), u))), /*#__PURE__*/React.createElement("details", {
      style: {
        ...card,
        padding: 0,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("summary", {
      style: {
        cursor: "pointer",
        padding: 16,
        fontSize: 15,
        fontWeight: 700,
        color: "#C1121F",
        listStyle: "none"
      }
    }, "❤️ Jak wykonać resuscytację (RKO)"), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 16px 16px"
      }
    }, ACC_INJURED.cpr.map((u, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 12,
        padding: "7px 0",
        fontSize: 15,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C1121F",
        fontWeight: 800,
        fontFamily: "ui-monospace, monospace"
      }
    }, i + 1), u)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#9AA0AA",
        marginTop: 8,
        fontStyle: "italic"
      }
    }, "Trzymaj telefon na głośniku — dyspozytor 112 poprowadzi cię krok po kroku."))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        background: "#1A1310",
        borderColor: "#C1121F33"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#D98880",
        marginBottom: 8,
        fontWeight: 700
      }
    }, "OBOWIĄZEK PRAWNY · ", ACC_INJURED.ref), ACC_INJURED.legal.map((x, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 14,
        padding: "5px 0",
        lineHeight: 1.4
      }
    }, x)))), step.kind === "DECISION_POINT" && (() => {
      const answered = POLICE_TRIGGERS.every(t => decision[t.id] !== undefined);
      const mustCall = POLICE_TRIGGERS.some(t => decision[t.id] === true);
      return /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 12
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: "#6B7280"
        }
      }, "Odpowiedz — silnik zdecyduje, czy policja jest obowiązkowa."), POLICE_TRIGGERS.map(t => /*#__PURE__*/React.createElement("div", {
        key: t.id,
        style: {
          ...card,
          padding: 14
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 15,
          marginBottom: 10
        }
      }, t.q), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8
        }
      }, [["Tak", true], ["Nie", false]].map(([lbl, val]) => {
        const sel = decision[t.id] === val;
        return /*#__PURE__*/React.createElement("button", {
          key: lbl,
          onClick: () => setDecision(d => ({
            ...d,
            [t.id]: val
          })),
          style: {
            flex: 1,
            padding: "10px 0",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 15,
            fontWeight: 700,
            border: sel ? `1px solid ${val ? "#C1121F" : "#1B7F4B"}` : "1px solid #232833",
            background: sel ? (val ? "#C1121F" : "#1B7F4B") + "22" : "#0E1117",
            color: sel ? val ? "#C1121F" : "#5FA777" : "#9AA0AA"
          }
        }, lbl);
      })))), answered && /*#__PURE__*/React.createElement("div", {
        style: {
          ...card,
          borderColor: mustCall ? "#C1121F" : "#1B7F4B",
          background: (mustCall ? "#C1121F" : "#1B7F4B") + "14"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8
        }
      }, /*#__PURE__*/React.createElement(TrustBadge, {
        level: "T1",
        labelOverride: "Decyzja silnika"
      })), mustCall ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 18,
          fontWeight: 800,
          color: "#C1121F"
        }
      }, "Wezwij policję — 110"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 14,
          color: "#9AA0AA",
          marginTop: 6
        }
      }, "Co najmniej jedna przesłanka spełniona. Zadzwoń i zaczekaj na przyjazd."), /*#__PURE__*/React.createElement("a", {
        href: "tel:110",
        style: {
          display: "block",
          textAlign: "center",
          marginTop: 12,
          padding: "14px 0",
          background: "#C1121F",
          color: "#fff",
          borderRadius: 12,
          textDecoration: "none",
          fontWeight: 700,
          fontSize: 18
        }
      }, "Zadzwoń 110")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 18,
          fontWeight: 800,
          color: "#5FA777"
        }
      }, "Policja nie jest wymagana"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 14,
          color: "#9AA0AA",
          marginTop: 6
        }
      }, "Wystarczy Europejskie oświadczenie o wypadku. Możecie je spisać, jeśli obie strony się zgadzają."))));
    })(), step.kind === "EXCHANGE_DATA" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...card
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 10,
        fontFamily: "ui-monospace, monospace"
      }
    }, ACC_EXCHANGE.ref), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#5FA777",
        marginBottom: 8,
        fontWeight: 700
      }
    }, "SPISZ OD DRUGIEGO KIEROWCY"), ACC_EXCHANGE.fields.map((x, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 10,
        padding: "6px 0",
        fontSize: 15,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#1B7F4B"
      }
    }, "✓"), x))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        background: "#1A1310",
        borderColor: "#C1121F33"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#D98880",
        marginBottom: 8,
        fontWeight: 700
      }
    }, "UWAGA — WAŻNE PRAWNIE"), ACC_EXCHANGE.warnings.map((x, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 14,
        padding: "5px 0",
        lineHeight: 1.4
      }
    }, x)))), step.kind === "SHOW_KNOWLEDGE" && k && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...card
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 10,
        fontFamily: "ui-monospace, monospace"
      }
    }, k.ref, " · ", k.versionId), k.actions.map((a, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 12,
        padding: "8px 0",
        fontSize: 16,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#C1121F",
        fontWeight: 800,
        fontFamily: "ui-monospace, monospace"
      }
    }, i + 1), a))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        background: "#12180F",
        borderColor: "#1B7F4B33"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#5FA777",
        marginBottom: 8,
        fontWeight: 700
      }
    }, "TWOJE PRAWA"), k.rights.map((x, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 15,
        padding: "4px 0"
      }
    }, x))), /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        background: "#1A1310",
        borderColor: "#C1121F33"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#D98880",
        marginBottom: 8,
        fontWeight: 700
      }
    }, "CZEGO NIE ROBIĆ"), k.warnings.map((x, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        fontSize: 15,
        padding: "4px 0"
      }
    }, x)))), step.kind === "TIR_DOCS" && /*#__PURE__*/React.createElement("div", {
      style: {
        ...card
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 12,
        fontFamily: "ui-monospace, monospace"
      }
    }, TIR_DOCS.ref, " · ", TIR_DOCS.versionId), TIR_DOCS.items.map((it, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: "10px 0",
        borderTop: i === 0 ? "none" : "1px solid #232833"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 16,
        fontWeight: 600,
        display: "flex",
        gap: 10,
        alignItems: "baseline"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#1B7F4B"
      }
    }, "✓"), it.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
        marginLeft: 26
      }
    }, it.d)))), step.kind === "AI_CHAT" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#2563C9",
        fontFamily: "ui-monospace, monospace"
      }
    }, activeEvent === "ACCIDENT" ? "Pytaj o wypadek" : "Pytaj o kontrolę", " · odpowiedzi z bazy wiedzy"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
      }
    }, (activeEvent === "ACCIDENT" ? ["muszę wzywać policję?", "kto jest winny?", "co z oświadczeniem?", "mogę odjechać?"] : ["ile dni tacho?", "muszę oddać CMR?", "kto może kontrolować?", "co mogą sprawdzić?"]).map(s => /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => setChatQ(s),
      style: {
        padding: "8px 12px",
        borderRadius: 20,
        background: "#171B22",
        border: "1px solid #232833",
        color: "#9AA0AA",
        fontSize: 13,
        cursor: "pointer"
      }
    }, s))), chatLog.map((m, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        alignSelf: "flex-end",
        background: "#2563C9",
        color: "#fff",
        padding: "10px 14px",
        borderRadius: "14px 14px 4px 14px",
        fontSize: 15,
        maxWidth: "85%"
      }
    }, m.q), /*#__PURE__*/React.createElement("div", {
      style: {
        alignSelf: "flex-start",
        background: "#171B22",
        border: "1px solid #232833",
        padding: "12px 14px",
        borderRadius: "14px 14px 14px 4px",
        fontSize: 15,
        maxWidth: "90%"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6
      }
    }, /*#__PURE__*/React.createElement(TrustBadge, {
      level: m.trust
    })), m.text, m.src && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 8,
        fontFamily: "ui-monospace, monospace"
      }
    }, "źródło: ", m.src)))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("input", {
      value: chatQ,
      onChange: e => setChatQ(e.target.value),
      onKeyDown: e => e.key === "Enter" && askChat(),
      placeholder: "Zadaj własne pytanie...",
      style: {
        width: "100%",
        boxSizing: "border-box",
        height: 52,
        background: "#0E1117",
        color: "#E8EAED",
        border: "1px solid #232833",
        borderRadius: 12,
        padding: "0 14px",
        fontSize: 16
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(MicButton, {
      onText: t => setChatQ(t)
    }), /*#__PURE__*/React.createElement("button", {
      onClick: askChat,
      disabled: !chatQ.trim(),
      style: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        border: "none",
        background: chatQ.trim() ? "#2563C9" : "#1B2230",
        color: chatQ.trim() ? "#fff" : "#5A6270",
        fontWeight: 700,
        fontSize: 16,
        cursor: chatQ.trim() ? "pointer" : "not-allowed"
      }
    }, "Zapytaj"))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "#6B7280",
        textAlign: "center"
      }
    }, "Demo — odpowiedzi z bazy wiedzy. Prawdziwe AI po wpięciu silnika.")), step.kind === "TRANSLATE" && !r.fellBack && (() => {
      const plMode = transDir === "PL_DE";
      const chips = plMode ? QUICK_TRANSLATE.map(q => ({
        tap: q.label,
        show: q.label
      })) : QUICK_DE.map(q => ({
        tap: q.full,
        show: q.label
      }));
      return /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 12
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          background: "#171B22",
          borderRadius: 12,
          padding: 4,
          border: "1px solid #232833"
        }
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => setTransDir("PL_DE"),
        style: {
          flex: 1,
          padding: "10px 0",
          borderRadius: 9,
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          background: plMode ? "#2563C9" : "transparent",
          color: plMode ? "#fff" : "#9AA0AA"
        }
      }, "Ja → policjant", /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          fontWeight: 400,
          fontFamily: "ui-monospace, monospace"
        }
      }, "PL → DE")), /*#__PURE__*/React.createElement("button", {
        onClick: () => setTransDir("DE_PL"),
        style: {
          flex: 1,
          padding: "10px 0",
          borderRadius: 9,
          border: "none",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 700,
          background: !plMode ? "#2563C9" : "transparent",
          color: !plMode ? "#fff" : "#9AA0AA"
        }
      }, "Policjant → ja", /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          fontWeight: 400,
          fontFamily: "ui-monospace, monospace"
        }
      }, "DE → PL"))), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "#6B7280"
        }
      }, plMode ? "Wpisz po polsku — pokażę zdanie do odczytania policjantowi." : "Wpisz lub podyktuj, co powiedział policjant — przetłumaczę na polski."), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8,
          flexWrap: "wrap"
        }
      }, chips.map(q => /*#__PURE__*/React.createElement("button", {
        key: q.show,
        onClick: () => pushTranslate(q.tap),
        style: {
          padding: "8px 12px",
          borderRadius: 20,
          background: "#171B22",
          border: "1px solid #232833",
          color: "#9AA0AA",
          fontSize: 13,
          cursor: "pointer"
        }
      }, q.show))), transLog.map((m, i) => /*#__PURE__*/React.createElement("div", {
        key: i,
        style: {
          ...card,
          padding: 16,
          borderColor: "#2563C933"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13,
          color: "#6B7280",
          marginBottom: 6
        }
      }, m.src), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 11,
          color: "#2563C9",
          marginBottom: 4,
          fontFamily: "ui-monospace, monospace"
        }
      }, m.dir === "PL_DE" ? "POKAŻ / ODCZYTAJ POLICJANTOWI" : "CO POWIEDZIAŁ POLICJANT"), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 20,
          fontWeight: 600,
          lineHeight: 1.3
        }
      }, "„", m.out, "\""))), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement("input", {
        value: transInput,
        onChange: e => setTransInput(e.target.value),
        onKeyDown: e => e.key === "Enter" && pushTranslate(transInput),
        placeholder: plMode ? "Wpisz własne zdanie po polsku..." : "Wpisz/podyktuj, co powiedział policjant...",
        style: {
          width: "100%",
          boxSizing: "border-box",
          height: 52,
          background: "#0E1117",
          color: "#E8EAED",
          border: "1px solid #232833",
          borderRadius: 12,
          padding: "0 14px",
          fontSize: 16
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          gap: 8
        }
      }, /*#__PURE__*/React.createElement(MicButton, {
        onText: t => setTransInput(t)
      }), /*#__PURE__*/React.createElement("button", {
        onClick: () => pushTranslate(transInput),
        disabled: !transInput.trim(),
        style: {
          flex: 1,
          height: 52,
          borderRadius: 12,
          border: "none",
          background: transInput.trim() ? "#2563C9" : "#1B2230",
          color: transInput.trim() ? "#fff" : "#5A6270",
          fontWeight: 700,
          fontSize: 16,
          cursor: transInput.trim() ? "pointer" : "not-allowed"
        }
      }, "Przetłumacz"))), /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 12,
          color: "#6B7280",
          textAlign: "center"
        }
      }, "Demo — słownik zaślepkowy. Prawdziwy tłumacz AI po wpięciu silnika."));
    })(), step.kind === "TRANSLATE" && r.fellBack && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#8A8F98",
        fontFamily: "ui-monospace, monospace"
      }
    }, "OFFLINE — karta zwrotów (działa bez sieci)"), PHRASES.map(grp => /*#__PURE__*/React.createElement("div", {
      key: grp.group,
      style: {
        ...card,
        padding: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: grp.color,
        fontWeight: 700,
        marginBottom: 10,
        letterSpacing: "0.02em",
        textTransform: "uppercase"
      }
    }, grp.group), grp.items.map((it, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        padding: "9px 0",
        borderTop: i === 0 ? "none" : "1px solid #232833"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 17,
        fontWeight: 600,
        lineHeight: 1.3
      }
    }, "„", it.de, "\""), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 3
      }
    }, it.pl)))))), step.kind === "CAPTURE_PHOTO" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        ...card,
        textAlign: "center",
        padding: 28
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 40
      }
    }, "📷"), /*#__PURE__*/React.createElement("p", {
      style: {
        color: "#9AA0AA",
        fontSize: 15,
        margin: "8px 0 12px"
      }
    }, "Zdjęcia dokumentów lub mandatu trafiają do raportu."), /*#__PURE__*/React.createElement("button", {
      onClick: async () => {
        const n = photos.length + 1;
        const evId = `EV-${String(n).padStart(3, "0")}`;
        const ts = new Date().toISOString();
        const geo = gps ? {
          lat: gps.lat,
          lon: gps.lon,
          acc: gps.acc
        } : {
          status: gpsStatus
        };
        const meta = {
          evId,
          seq: n,
          ts,
          gps: geo,
          workflow: workflow.id
        };
        const hash = await computeEvidenceHash(meta);
        const photo = {
          ...meta,
          hash
        };
        setPhotos(p => [...p, photo]);
        logEngine("EVIDENCE", `Dowód ${evId} · hash ${hash.slice(0, 12)}…`, "T1");
      },
      style: {
        padding: "12px 20px",
        borderRadius: 12,
        border: "1px solid #232833",
        background: "#0E1117",
        color: "#E8EAED",
        fontSize: 15,
        fontWeight: 600,
        cursor: "pointer"
      }
    }, "+ Dodaj dowód (zdjęcie)"), photos.length > 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginTop: 14,
        textAlign: "left"
      }
    }, photos.map(p => /*#__PURE__*/React.createElement("div", {
      key: p.evId,
      style: {
        background: "#0E1117",
        border: "1px solid #232833",
        borderRadius: 10,
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        fontFamily: "ui-monospace, monospace",
        fontSize: 13
      }
    }, "📷 ", p.evId), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: "#5FA777",
        fontFamily: "ui-monospace, monospace"
      }
    }, "zabezpieczony ✓")), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: "#6B7280",
        fontFamily: "ui-monospace, monospace",
        lineHeight: 1.5
      }
    }, new Date(p.ts).toLocaleString("pl-PL"), /*#__PURE__*/React.createElement("br", null), "GPS: ", p.gps.lat ? `${p.gps.lat.toFixed(5)}, ${p.gps.lon.toFixed(5)}` : "niedostępny", /*#__PURE__*/React.createElement("br", null), "SHA-256: ", p.hash.slice(0, 24), "…"))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "#9AA0AA",
        marginBottom: 10,
        fontWeight: 600
      }
    }, activeEvent === "ACCIDENT" ? "Jak zakończyło się zdarzenie?" : "Jak zakończyła się kontrola?"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8
      }
    }, outcomesFor(activeEvent).map(o => {
      const sel = outcome === o.id;
      return /*#__PURE__*/React.createElement("button", {
        key: o.id,
        onClick: () => {
          setOutcome(o.id);
          logEngine("OUTCOME", `Wynik kontroli: ${o.label} (${o.de})`, "T1");
        },
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          textAlign: "left",
          padding: "14px 16px",
          borderRadius: 12,
          cursor: "pointer",
          fontSize: 15,
          fontWeight: 600,
          border: sel ? `1px solid ${o.color}` : "1px solid #232833",
          background: sel ? o.color + "1F" : "#171B22",
          color: sel ? o.color : "#E8EAED"
        }
      }, /*#__PURE__*/React.createElement("span", null, o.label), /*#__PURE__*/React.createElement("span", {
        style: {
          fontSize: 11,
          color: "#6B7280",
          fontFamily: "ui-monospace, monospace",
          marginLeft: 10
        }
      }, o.de));
    }))))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 20,
        borderTop: "1px solid #171B22",
        display: "flex",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("button", {
      style: {
        ...bigBtn,
        flex: "0 0 auto",
        width: 64,
        background: "#171B22",
        color: "#E8EAED",
        border: "1px solid #232833",
        padding: "20px 0",
        fontSize: 22
      },
      onClick: () => recordAndAdvance("back"),
      "aria-label": "Wstecz"
    }, "‹"), (() => {
      const blocked = step.kind === "DECISION_POINT" && !POLICE_TRIGGERS.every(t => decision[t.id] !== undefined);
      return /*#__PURE__*/React.createElement("button", {
        disabled: blocked,
        style: {
          ...bigBtn,
          background: blocked ? "#2A2E37" : "#E8EAED",
          color: blocked ? "#5A6270" : "#0E1117",
          cursor: blocked ? "not-allowed" : "pointer"
        },
        onClick: () => recordAndAdvance("next")
      }, blocked ? "Odpowiedz na pytania" : isLast ? "Utwórz raport" : "Dalej");
    })()));
  }
  function buildIncident() {
    const o = outcome ? findOutcome(activeEvent, outcome) : null;
    return {
      incidentId: `INC-${(startedAt || new Date().toISOString()).replace(/[:.TZ-]/g, "").slice(0, 14)}`,
      generatedAt: new Date().toISOString(),
      startedAt,
      workflow: {
        id: workflow.id,
        version: workflow.version
      },
      context: {
        country: ctx.country,
        event: ctx.event,
        vehicle: ctx.vehicle,
        connectivity: ctx.connectivity,
        language: ctx.language
      },
      gps: gps ? {
        ...gps
      } : {
        status: gpsStatus
      },
      knowledgeVersions: knowledgeUsed,
      trustLevelsSeen: trustSeen,
      outcome: o ? {
        id: o.id,
        label: o.label,
        de: o.de
      } : null,
      policeDecision: activeEvent === "ACCIDENT" ? POLICE_TRIGGERS.some(t => decision[t.id] === true) ? "WYMAGANA" : "niewymagana" : null,
      photos,
      aiQuestions: chatLog.map(m => ({
        q: m.q,
        trust: m.trust,
        source: m.src || null
      })),
      translations: transLog.map(m => ({
        dir: m.dir,
        src: m.src,
        out: m.out
      })),
      engineLog,
      disclaimer: "Prototyp. Dane w pamięci. Nie stanowi porady prawnej."
    };
  }
  function download(name, content, type) {
    try {
      const blob = new Blob([content], {
        type
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {/* sandbox może blokować pobieranie */}
  }
  function exportPdf() {
    const inc = buildIncident();
    const esc = x => String(x == null ? "" : x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const row = (l, v) => `<tr><td class="l">${esc(l)}</td><td class="v">${esc(v)}</td></tr>`;
    const gpsStr = inc.gps.lat ? `${inc.gps.lat.toFixed(5)}, ${inc.gps.lon.toFixed(5)} (±${inc.gps.acc} m)` : `niedostępny (${inc.gps.status || "-"})`;
    const ai = inc.aiQuestions.length ? inc.aiQuestions.map(a => `<li><b>[${esc(a.trust)}]</b> „${esc(a.q)}"${a.source ? " — źródło: " + esc(a.source) : ""}</li>`).join("") : "<li>brak</li>";
    const tr = inc.translations.length ? inc.translations.map(t => `<li><span class="mono">${esc(t.dir)}</span> „${esc(t.src)}" → „${esc(t.out)}"</li>`).join("") : "<li>brak</li>";
    const log = inc.engineLog.map(e => `<div class="log">${esc(e.ts)} <b>[${esc(e.kind)}${e.trust ? "/" + esc(e.trust) : ""}]</b> ${esc(e.detail)}</div>`).join("");
    const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${esc(inc.incidentId)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, Arial, sans-serif; color: #111; margin: 32px; font-size: 13px; line-height: 1.5; }
        h1 { font-size: 20px; margin: 0 0 2px; }
        .id { font-family: ui-monospace, monospace; color: #555; font-size: 12px; margin-bottom: 18px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #2563C9; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin: 22px 0 8px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 4px 0; vertical-align: top; }
        td.l { color: #666; width: 170px; }
        td.v { font-weight: 600; }
        ul { margin: 4px 0; padding-left: 18px; }
        .mono { font-family: ui-monospace, monospace; color: #888; font-size: 11px; }
        .log { font-family: ui-monospace, monospace; font-size: 11px; color: #444; padding: 2px 0; }
        .foot { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; color: #888; font-size: 11px; }
      </style></head><body>
      <h1>Guardian · DriverOS — Raport zdarzenia</h1>
      <div class="id">${esc(inc.incidentId)}</div>
      <table>
        ${row("Rozpoczęto", inc.startedAt)}
        ${row("Wygenerowano", inc.generatedAt)}
        ${row("Workflow", inc.workflow.id + " · " + inc.workflow.version)}
        ${row("Kontekst", inc.context.country + " · " + inc.context.event + " · " + inc.context.vehicle + " · " + inc.context.connectivity)}
        ${row("GPS", gpsStr)}
        ${row("Wersje wiedzy", inc.knowledgeVersions.join(", ") || "—")}
        ${row("Poziomy zaufania", inc.trustLevelsSeen.join(", ") || "—")}
        ${row("Wynik kontroli", inc.outcome ? inc.outcome.label + " (" + inc.outcome.de + ")" : "—")}
        ${row("Zdjęcia", inc.photos.map(p => p.id).join(", ") || "brak")}
      </table>
      <h2>Pytania AI</h2><ul>${ai}</ul>
      <h2>Tłumaczenia</h2><ul>${tr}</ul>
      <h2>Dowody (Evidence Engine)</h2>${inc.photos.length ? inc.photos.map(p => `<div class="log"><b>${esc(p.evId)}</b> · ${esc(p.ts)} · GPS: ${p.gps.lat ? esc(p.gps.lat.toFixed(5) + ", " + p.gps.lon.toFixed(5)) : "n/d"} · SHA-256: ${esc(p.hash)}</div>`).join("") : "<div class=\"log\">brak</div>"}
      <h2>Log decyzji silnika</h2>${log}
      <div class="foot">${esc(inc.disclaimer)}</div>
      </body></html>`;
    try {
      const w = window.open("", "_blank");
      if (!w) {
        alert("Nie udało się otworzyć okna wydruku. Sprawdź blokadę wyskakujących okien.");
        return;
      }
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400); // po załadowaniu -> okno druku -> Zapisz jako PDF
    } catch (e) {/* sandbox może blokować */}
  }
  function exportJson() {
    const inc = buildIncident();
    download(`${inc.incidentId}.json`, JSON.stringify(inc, null, 2), "application/json");
  }

  /* ---------- RAPORT ---------- */
  return /*#__PURE__*/React.createElement("div", {
    style: wrap
  }, /*#__PURE__*/React.createElement(Header, {
    online: online,
    setOnline: setOnline,
    title: "DriverOS"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 40
    }
  }, "✓"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 800,
      margin: "6px 0 2px"
    }
  }, "Raport zdarzenia"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#6B7280",
      fontFamily: "ui-monospace, monospace"
    }
  }, `INC-${(startedAt || "").replace(/[:.TZ-]/g, "").slice(0, 14)}`)), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement(ReportRow, {
    label: "Rozpoczęto",
    value: startedAt ? new Date(startedAt).toLocaleString("pl-PL") : "—"
  }), /*#__PURE__*/React.createElement(ReportRow, {
    label: "Workflow",
    value: `${workflow.id} · ${workflow.version}`
  }), /*#__PURE__*/React.createElement(ReportRow, {
    label: "Kontekst",
    value: `${ctx.country} · ${ctx.vehicle} · ${ctx.connectivity === "ONLINE" ? "online" : "offline"}`
  }), /*#__PURE__*/React.createElement(ReportRow, {
    label: "GPS",
    value: gps ? `${gps.lat.toFixed(5)}, ${gps.lon.toFixed(5)} (±${gps.acc} m)` : `niedostępny (${gpsStatus})`
  }), /*#__PURE__*/React.createElement(ReportRow, {
    label: "Wersje wiedzy",
    value: knowledgeUsed.join(", ") || "—"
  }), /*#__PURE__*/React.createElement(ReportRow, {
    label: "Dowody (zdjęcia)",
    value: photos.length ? `${photos.length} szt. — zabezpieczone hashem` : "brak"
  }), outcome && (() => {
    const o = findOutcome(activeEvent, outcome);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        padding: "7px 0",
        fontSize: 14,
        gap: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#6B7280",
        flexShrink: 0
      }
    }, "Wynik"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 700,
        color: o.color,
        textAlign: "right"
      }
    }, o.label, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        fontSize: 11,
        color: "#6B7280",
        fontFamily: "ui-monospace, monospace",
        fontWeight: 400
      }
    }, o.de)));
  })(), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      paddingTop: 12,
      borderTop: "1px solid #232833"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#6B7280",
      marginBottom: 8
    }
  }, "Poziomy zaufania"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, trustSeen.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      padding: "5px 10px",
      borderRadius: 8,
      background: Trust[t].color + "22",
      color: Trust[t].color,
      fontSize: 12,
      fontWeight: 700,
      fontFamily: "ui-monospace, monospace"
    }
  }, t)), !trustSeen.length && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#6B7280",
      fontSize: 13
    }
  }, "—")))), chatLog.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#2563C9",
      fontWeight: 700,
      marginBottom: 8
    }
  }, "PYTANIA AI (", chatLog.length, ")"), chatLog.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "6px 0",
      borderTop: i === 0 ? "none" : "1px solid #232833",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: Trust[m.trust].color,
      fontFamily: "ui-monospace, monospace",
      fontSize: 12
    }
  }, "[", m.trust, "]"), " ", m.q, m.src && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#6B7280",
      fontSize: 12
    }
  }, " — ", m.src)))), transLog.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#2563C9",
      fontWeight: 700,
      marginBottom: 8
    }
  }, "TŁUMACZENIA (", transLog.length, ")"), transLog.map((m, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "6px 0",
      borderTop: i === 0 ? "none" : "1px solid #232833",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4B515C",
      fontFamily: "ui-monospace, monospace",
      fontSize: 11
    }
  }, m.dir === "PL_DE" ? "PL→DE" : "DE→PL"), " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#6B7280"
    }
  }, m.src), " → „", m.out, "\""))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "#9AA0AA",
      fontWeight: 700,
      marginBottom: 10
    }
  }, "LOG DECYZJI SILNIKA"), engineLog.filter(e => ["CONTEXT", "DECISION", "KNOWLEDGE", "OUTCOME"].includes(e.kind)).map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 10,
      padding: "6px 0",
      fontSize: 13,
      alignItems: "baseline"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#4B515C",
      fontFamily: "ui-monospace, monospace",
      fontSize: 11,
      flexShrink: 0
    }
  }, new Date(e.ts).toLocaleTimeString("pl-PL")), e.trust && /*#__PURE__*/React.createElement("span", {
    style: {
      color: Trust[e.trust].color,
      fontFamily: "ui-monospace, monospace",
      fontSize: 11
    }
  }, e.trust), /*#__PURE__*/React.createElement("span", null, e.detail))), /*#__PURE__*/React.createElement("details", {
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("summary", {
    style: {
      cursor: "pointer",
      fontSize: 12,
      color: "#6B7280",
      fontFamily: "ui-monospace, monospace"
    }
  }, "Pełny log techniczny (", engineLog.length, " zdarzeń)"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, engineLog.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "3px 0",
      fontSize: 11,
      fontFamily: "ui-monospace, monospace",
      color: "#8A8F98",
      wordBreak: "break-word"
    }
  }, e.ts, " [", e.kind, e.trust ? "/" + e.trust : "", "] ", e.detail))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: exportPdf,
    style: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      border: "none",
      background: "#2563C9",
      color: "#fff",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer"
    }
  }, "Eksport PDF"), /*#__PURE__*/React.createElement("button", {
    onClick: exportJson,
    style: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      border: "1px solid #232833",
      background: "#171B22",
      color: "#E8EAED",
      fontWeight: 700,
      fontSize: 15,
      cursor: "pointer"
    }
  }, "Eksport JSON")), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "#6B7280",
      textAlign: "center",
      lineHeight: 1.5
    }
  }, "Raport zawiera pełny ślad: kontekst, decyzje silnika, wersje wiedzy, pytania AI i tłumaczenia — materiał do odwołania."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      ...bigBtn,
      flex: "0 0 auto",
      width: 64,
      background: "#171B22",
      color: "#E8EAED",
      border: "1px solid #232833",
      padding: "18px 0",
      fontSize: 22
    },
    onClick: () => {
      setStepIdx(workflow.steps.length - 1);
      setScreen("workflow");
    },
    "aria-label": "Wstecz"
  }, "‹"), /*#__PURE__*/React.createElement("button", {
    style: {
      ...bigBtn,
      background: "#171B22",
      color: "#E8EAED",
      border: "1px solid #232833"
    },
    onClick: () => setScreen("home")
  }, "Powrót do startu"))), /*#__PURE__*/React.createElement(Foot, null));
}
function Header({
  online,
  setOnline,
  title,
  onExit
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 20px",
      borderBottom: "1px solid #171B22"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, onExit && /*#__PURE__*/React.createElement("button", {
    onClick: onExit,
    style: {
      background: "none",
      border: "none",
      color: "#E8EAED",
      fontSize: 20,
      cursor: "pointer",
      padding: 0
    }
  }, "‹"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
      fontSize: 17
    }
  }, "Driver", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#C1121F"
    }
  }, "OS"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setOnline(o => !o),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      background: "none",
      border: "1px solid #232833",
      borderRadius: 20,
      padding: "6px 12px",
      cursor: "pointer",
      color: online ? "#5FA777" : "#8A8F98",
      fontSize: 13,
      fontWeight: 600
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 4,
      background: online ? "#1B7F4B" : "#8A8F98"
    }
  }), online ? "Online" : "Offline"));
}
function Row({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "7px 0",
      fontSize: 14,
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#6B7280",
      flexShrink: 0
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontFamily: "ui-monospace, monospace",
      fontSize: 13,
      textAlign: "right"
    }
  }, value));
}
function ReportRow({
  label,
  value
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      padding: "7px 0",
      fontSize: 14,
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#6B7280",
      flexShrink: 0
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600,
      fontFamily: "ui-monospace, monospace",
      fontSize: 12.5,
      textAlign: "right",
      wordBreak: "break-word"
    }
  }, value));
}
function Foot() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 20px",
      textAlign: "center",
      fontSize: 11,
      color: "#4B515C",
      fontFamily: "ui-monospace, monospace"
    }
  }, "Prototyp · dane w pamięci · nie do rzeczywistego użytku");
}

// KnowledgeQA.jsx — kafelek "Zapytaj", zakotwiczony w Knowledge Engine.
// Zasada (konstytucja Guardian + Artefakt #0004): AI nigdy nie dostaje surowego
// pytania. Odpowiedź WYWODZI SIĘ z treści (246 pozycji), Trust Badge mówi userowi
// na czym stoi, brak trafienia => T4 "nie wiem, sprawdź moduł".
//
// KROK 1 (ten plik): retrieval deterministyczny, offline, na Twojej treści.
// KROK 2 (później): ta sama funkcja retrieveGrounding() karmi AI przez backend —
//   AI tylko PRZEFORMUŁOWUJE znaleziony fakt, nie wymyśla. UI się nie zmienia.

/* ---------- RETRIEVAL: pytanie -> najlepszy fakt z Twojej treści ---------- */
const STOP = new Set(["czy", "jak", "co", "ile", "gdzie", "kiedy", "moge", "mogę", "jest", "the", "na", "do", "w", "z", "za", "po", "i", "a", "o", "u", "to", "mi", "mnie", "sie", "się"]);
function tokenize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
  // zachowaj słowa >2 znaki ORAZ krótkie kody (lc, un, 112, dmc) — bez stopwords
  .filter(w => w.length > 0 && !STOP.has(w) && (w.length > 2 || /[0-9]/.test(w) || /^(lc|un|pp|hp)$/.test(w)));
}

/** Buduje tekst przeszukiwalny faktu z jego treści (pytania, uzasadnienie, odpowiedzi). */
function factText(f) {
  const parts = [f.why || "", f.topic || "", f.block || ""];
  const q = f.q || {};
  for (const fmt of Object.keys(q)) {
    const item = q[fmt];
    if (!item) continue;
    if (item.prompt) parts.push(item.prompt);
    if (item.correct) parts.push(Array.isArray(item.correct) ? item.correct.join(" ") : String(item.correct));
    if (item.options) parts.push(item.options.join(" "));
    if (item.pairs) parts.push(Object.entries(item.pairs).flat().join(" "));
  }
  return parts.join(" ");
}

/**
 * retrieveGrounding — serce kafelka. Zwraca najlepiej pasujący fakt + score.
 * To jest funkcja, którą w KROKU 2 wywoła backend, by zbudować kontekst dla AI.
 */
function retrieveGrounding(question, ALL) {
  const qTokens = tokenize(question);
  if (qTokens.length === 0) return null;
  const qSet = new Set(qTokens);
  let best = null,
    bestScore = 0,
    bestOverlap = 0;
  for (const f of ALL) {
    const ft = tokenize(factText(f));
    if (ft.length === 0) continue;
    const ftSet = new Set(ft);
    let overlap = 0;
    for (const w of qSet) if (ftSet.has(w)) overlap++;
    const coverage = overlap / qSet.size;
    const score = coverage + overlap * 0.05;
    if (score > bestScore) {
      bestScore = score;
      best = f;
      bestOverlap = overlap;
    }
  }
  // Próg: potrzeba realnego pokrycia. Pojedyncze przypadkowe słowo nie wystarcza —
  // wymagamy albo ≥2 trafień, albo bardzo wysokiego pokrycia krótkiego pytania.
  if (!best) return null;
  const strong = bestOverlap >= 2 || bestScore >= 0.6 && bestOverlap >= 1;
  if (!strong) return null;
  return {
    fact: best,
    score: bestScore
  };
}

/** Buduje odpowiedź dla usera z trafionego faktu — z treści, nie z AI. */
function answerFrom(grounding) {
  if (!grounding) {
    return {
      trust: "T4",
      text: "Nie mam na to zweryfikowanej odpowiedzi. Wejdź w odpowiedni moduł treningu albo trzymaj się oficjalnych źródeł. To nie jest porada prawna.",
      fact: null
    };
  }
  const f = grounding.fact;
  return {
    trust: "T1",
    // treść pochodzi z Twojej zweryfikowanej bazy
    text: f.why || "Zobacz szczegóły w module.",
    fact: f
  };
}

/* ---------- EKRAN "ZAPYTAJ" ---------- */
function KnowledgeQA({
  ALL,
  MODULES,
  C,
  TrustBadge,
  onExit,
  onOpenModule
}) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState(null);
  const [history, setHistory] = useState([]);
  function ask(text) {
    const question = (text ?? q).trim();
    if (!question) return;
    const grounding = retrieveGrounding(question, ALL);
    const a = answerFrom(grounding);
    setAnswer({
      question,
      ...a
    });
    setHistory(h => [{
      question,
      trust: a.trust
    }, ...h].slice(0, 5));
    setQ("");
  }
  const moduleTitle = id => (MODULES.find(m => m.id === id) || {}).title || id;
  const suggestions = ["Ile dni tacho na kontroli?", "Po ilu godzinach jazdy przerwa?", "Co grozi za brak wyposażenia ADR?", "Jak zabezpieczyć ładunek?"];
  return /*#__PURE__*/React.createElement("div", {
    style: qaWrap(C)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 20px",
      borderBottom: `1px solid ${C.card}`
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onExit,
    style: {
      background: "none",
      border: "none",
      color: C.text,
      fontSize: 20,
      cursor: "pointer",
      padding: 0
    }
  }, "‹"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 800,
      fontSize: 17,
      letterSpacing: "-0.02em"
    }
  }, "Driver", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.red
    }
  }, "OS"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.dim,
      fontWeight: 600,
      fontSize: 13,
      marginLeft: 8
    }
  }, "Zapytaj")))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16,
      overflowY: "auto"
    }
  }, !answer && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 24,
      fontWeight: 800,
      margin: 0,
      letterSpacing: "-0.02em"
    }
  }, "O co chcesz zapytać?"), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "#9AA0AA",
      fontSize: 14,
      margin: "8px 0 0",
      lineHeight: 1.5
    }
  }, "Odpowiadam wyłącznie z ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: C.greenLite
    }
  }, "zweryfikowanej wiedzy"), " DriverOS. Jeśli czegoś nie wiem — powiem wprost.")), answer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.dim,
      fontFamily: C.mono
    }
  }, "Pytanie: ", answer.question), /*#__PURE__*/React.createElement("div", {
    style: {
      ...qaCard(C),
      borderColor: (answer.trust === "T4" ? C.amber : C.green) + "55"
    }
  }, /*#__PURE__*/React.createElement(TrustBadge, {
    level: answer.trust,
    tag: answer.fact ? moduleTitle(answer.fact.module) : "brak źródła"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      color: C.text,
      lineHeight: 1.55,
      margin: "14px 0 0"
    }
  }, answer.text), answer.fact && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12,
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono
    }
  }, answer.fact.adrRef || answer.fact.ref || ""), /*#__PURE__*/React.createElement("button", {
    onClick: () => onOpenModule(answer.fact.module),
    style: {
      ...smallBtn(C),
      marginTop: 14
    }
  }, "Ćwicz w module: ", moduleTitle(answer.fact.module), " →")))), !answer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      fontFamily: C.mono
    }
  }, "PRZYKŁADY"), suggestions.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => ask(s),
    style: {
      textAlign: "left",
      padding: "12px 14px",
      borderRadius: 10,
      background: C.card,
      border: `1px solid ${C.line}`,
      color: C.text,
      fontSize: 14,
      cursor: "pointer"
    }
  }, s))), history.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      color: C.dim,
      fontFamily: C.mono,
      marginBottom: 8
    }
  }, "OSTATNIE"), history.map((h, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => ask(h.question),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "8px 0",
      background: "none",
      border: "none",
      borderTop: `1px solid ${C.card}`,
      color: C.dim,
      fontSize: 13,
      cursor: "pointer"
    }
  }, h.question)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      borderTop: `1px solid ${C.card}`,
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    onKeyDown: e => e.key === "Enter" && ask(),
    placeholder: "Wpisz pytanie…",
    style: {
      flex: 1,
      padding: "14px 16px",
      borderRadius: 12,
      background: C.card,
      color: C.text,
      border: `1px solid ${C.edge}`,
      fontSize: 15,
      outline: "none"
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ask(),
    disabled: !q.trim(),
    style: {
      padding: "0 20px",
      borderRadius: 12,
      border: "none",
      background: q.trim() ? C.red : C.line,
      color: q.trim() ? "#fff" : C.faint,
      fontSize: 15,
      fontWeight: 800,
      cursor: q.trim() ? "pointer" : "not-allowed"
    }
  }, "Zapytaj")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 20px 16px",
      textAlign: "center",
      fontSize: 10,
      color: C.faint,
      fontFamily: C.mono,
      lineHeight: 1.5
    }
  }, "Odpowiedzi z wiedzy DriverOS. Pomoc do nauki — nie porada prawna. Brak odpowiedzi = trzymaj się oficjalnych źródeł."));
}
const qaWrap = C => ({
  maxWidth: 480,
  margin: "0 auto",
  minHeight: "100dvh",
  background: C.bg,
  color: C.text,
  fontFamily: "system-ui, -apple-system, sans-serif",
  display: "flex",
  flexDirection: "column"
});
const qaCard = C => ({
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: 16,
  padding: 20
});
const smallBtn = C => ({
  width: "100%",
  padding: "12px 16px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  background: "transparent",
  color: C.text,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer"
});

/* ══════════════════════════════════════════════════════════════
   ROOT — ADR Trainer (samodzielna aplikacja)
   Jeden silnik nauki (Leitner + lesson) skonsumowany dla modułu ADR.
   Boot prosto w moduł ADR (218 pozycji, 5 formatów). Bez pickera modułów.
   Postęp: localStorage. Guardian Engine: „training part", moduł = dane.
   ══════════════════════════════════════════════════════════════ */
function AdrApp() {
  // AdrTrainer z initialModule="adr" wchodzi od razu w ekran "home" (bloki ADR).
  // onExit przeładowuje do ekranu głównego modułu (reset widoku, postęp zostaje).
  const [k, setK] = React.useState(0);
  return /*#__PURE__*/React.createElement(AdrTrainer, {
    key: k,
    initialModule: "adr",
    onExit: () => setK(n => n + 1)
  });
}

export default AdrApp;
