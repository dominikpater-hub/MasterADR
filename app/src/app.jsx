// MasterADR — kod aplikacji przeniesiony 1:1 z prototypu (React.createElement, bez JSX).
// Źródło: masterADR/prototyp/MasterADR.html. Silnik Leitnera + 218 pozycji ADR.
// Jedyna zmiana vs prototyp: React z importu (bundle Vite) zamiast globalu z CDN + Babel.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { loadHabit, saveHabit, registerActivity, awardCorrect, dayIndex, goalMet } from "./daily-habit.js";

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
const FACTS = [{
  "id": "b1-def",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Umowa ADR powstala w 1957 r. w Genewie. Sklada sie z 2 zalacznikow A i B. Nowelizowana co 2 lata.",
  "q": {
    "mcq": {
      "prompt": "Co ile lat nowelizowana jest umowa ADR?",
      "options": ["Co roku", "Co 2 lata", "Co 5 lat"],
      "correct": "Co 2 lata"
    }
  }
}, {
  "id": "b1-wejscie-przepisow",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.6",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Nowe przepisy ADR wchodza zawsze 1 stycznia w roku nieparzystym. Do konca czerwca obowiazuje okres przejsciowy — mozna uzywac starej lub nowej wersji.",
  "q": {
    "mcq": {
      "prompt": "Kiedy wchodza w zycie nowe przepisy ADR?",
      "options": ["1 stycznia roku parzystego", "1 stycznia roku nieparzystego", "1 lipca kazdego roku"],
      "correct": "1 stycznia roku nieparzystego"
    },
    "fill": {
      "prompt": "Okres przejsciowy pozwalajacy uzywac starej wersji przepisow trwa do konca ___ (miesiac).",
      "correct": "czerwca",
      "hint": "miesiac, dopelniacz"
    }
  }
}, {
  "id": "b1-ustawa-pl",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "Dz.U. 2011 nr 227 poz. 1367",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "W Polsce obowiazuje Ustawa o przewozie towarow niebezpiecznych z 19.08.2011 (Dz.U. 2011 nr 227 poz. 1367).",
  "q": {
    "mcq": {
      "prompt": "Polska ustawa regulujaca przewoz towarow niebezpiecznych pochodzi z roku:",
      "options": ["2005", "2011", "2019"],
      "correct": "2011"
    }
  }
}, {
  "id": "b1-odstepstwa",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.5",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Strony umowy moga wprowadzac umowy specjalne dopuszczajace odstepstwa od przepisow. Odstepstwa nie moga byc dluzsze niz 5 lat.",
  "q": {
    "mcq": {
      "prompt": "Umowy specjalne (odstepstwa od ADR) moga obowiazywac maksymalnie:",
      "options": ["1 rok", "5 lat", "bezterminowo"],
      "correct": "5 lat"
    }
  }
}, {
  "id": "b1-inne-galezie",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "RID / ADN / IMDG / ICAO TI",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Poza ADR (drogowy) istnieja: RID — kolejowy, ADN — srodladowy, IMDG — morski, ICAO TI — lotniczy.",
  "q": {
    "match": {
      "prompt": "Dopasuj umowe do galezi transportu:",
      "pairs": {
        "RID": "kolejowy",
        "ADN": "srodladowy",
        "IMDG": "morski",
        "ICAO TI": "lotniczy"
      }
    }
  }
}, {
  "id": "b1-dgsa",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.8.3",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "DGSA to doradca ds. bezpieczenstwa. Powinna go wyznaczyc kazda firma pakujaca, ladujaca, transportujaca lub rozladowujaca towary niebezpieczne. Kara za niewyznaczenie: 5000 PLN.",
  "q": {
    "mcq": {
      "prompt": "Kara za niewyznaczenie doradcy DGSA w firmie wynosi:",
      "options": ["1000 PLN", "5000 PLN", "10000 PLN"],
      "correct": "5000 PLN"
    },
    "scenario": {
      "prompt": "Firma tylko zaladowuje towary niebezpieczne, nie przewozi. Czy musi wyznaczyc DGSA?",
      "options": ["Nie, tylko przewoznicy", "Tak, zaladowca rowniez", "Tylko przy klasie 1"],
      "correct": "Tak, zaladowca rowniez"
    }
  }
}, {
  "id": "b1-jtr",
  "block": 1,
  "topic": "Jednostka i sposoby przewozu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.2.1",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Jednostka transportowa to pojazd silnikowy z przyczepa lub bez, albo ciagnik z naczepa. Ciagnik + naczepa = JEDNA jednostka, choc to dwa pojazdy. Wazne przy liczeniu wyposazenia i wylaczen.",
  "q": {
    "mcq": {
      "prompt": "Ciagnik siodlowy z naczepa stanowi:",
      "options": ["Dwie jednostki transportowe", "Jedna jednostke transportowa", "Zalezy od ladunku"],
      "correct": "Jedna jednostke transportowa"
    },
    "scenario": {
      "prompt": "Zestaw 40 t. Wyposazenie ADR liczysz na:",
      "options": ["Kazdy pojazd osobno", "Cala jednostke transportowa", "Tylko ciagnik"],
      "correct": "Cala jednostke transportowa"
    }
  }
}, {
  "id": "b1-rodzaje-przewozu",
  "block": 1,
  "topic": "Jednostka i sposoby przewozu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.2.1",
  "source": "kompendium",
  "page": 6,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Trzy sposoby przewozu: w sztukach przesylki (opakowania), luzem (nieopakowane materialy stale), w cysternie.",
  "q": {
    "match": {
      "prompt": "Dopasuj sposob przewozu do przykladu:",
      "pairs": {
        "W sztukach": "kanistry, butle, DPPL",
        "Luzem": "zuzyte akumulatory nieopakowane",
        "W cysternie": "paliwo w zbiorniku"
      }
    }
  }
}, {
  "id": "b1-luzem-przepisy",
  "block": 1,
  "topic": "Jednostka i sposoby przewozu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR kol. 10/17 Tabeli A",
  "source": "kompendium",
  "page": 6,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Przewoz luzem jest dozwolony, jesli w kolumnie 10 lub 17 tabeli A wskazany jest przepis szczegolny BK1, BK2, BK3, VC1, VC2 lub VC3. Przepisy BK wskazuja specjalny rodzaj kontenera.",
  "q": {
    "mcq": {
      "prompt": "Przewoz luzem jest dozwolony, gdy w tabeli A wskazano przepis:",
      "options": ["P200 lub P900", "BK1, BK2, BK3, VC1, VC2 lub VC3", "S1 lub S2"],
      "correct": "BK1, BK2, BK3, VC1, VC2 lub VC3"
    }
  }
}, {
  "id": "b1-uczestnicy",
  "block": 1,
  "topic": "Uczestnicy przewozu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.4",
  "source": "kompendium",
  "page": 28,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Kompendium wymienia czterech kluczowych uczestnikow: nadawca (klasyfikuje i dopuszcza do przewozu), przewoznik (sprawdza pojazd i dokumenty), rozladowca (sprawdza co rozladowuje i czysci), odbiorca (nie opoznia przyjecia).",
  "q": {
    "match": {
      "prompt": "Dopasuj uczestnika do glownego obowiazku:",
      "pairs": {
        "Nadawca": "klasyfikacja i dopuszczenie do przewozu",
        "Przewoznik": "sprawny pojazd, dokumenty, wyposazenie",
        "Rozladowca": "sprawdzenie i oczyszczenie po rozladunku",
        "Odbiorca": "nie opozniac przyjecia towaru"
      }
    }
  }
}, {
  "id": "b1-nadawca",
  "block": 1,
  "topic": "Uczestnicy przewozu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.4.2.1",
  "source": "kompendium",
  "page": 28,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Nadawca: upewnia sie ze towary sa sklasyfikowane i dopuszczone do przewozu, zaopatruje przewoznika w dokumenty przewozowe, uzywa wylacznie dopuszczonych opakowan/DPPL/cystern ze znakami ADR, odpowiada za oznakowanie kontenerow.",
  "q": {
    "mcq": {
      "prompt": "Kto odpowiada za oznakowanie kontenerow?",
      "options": ["Kierowca", "Nadawca", "Odbiorca"],
      "correct": "Nadawca"
    }
  }
}, {
  "id": "b1-przewoznik",
  "block": 1,
  "topic": "Uczestnicy przewozu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.4.2.2",
  "source": "kompendium",
  "page": 28,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Przewoznik: upewnia sie WZROKOWO czy pojazd i ladunek nie maja oczywistych wad, wyciekow, nieszczelnosci, brakow w wyposazeniu; sprawdza czy pojazd nie jest nadmiernie zaladowany; sprawdza nalepki, znaki i tablice; sprawdza wyposazenie.",
  "q": {
    "mcq": {
      "prompt": "Kontrola wzrokowa pojazdu i ladunku przed jazda to obowiazek:",
      "options": ["Nadawcy", "Przewoznika", "Rozladowcy"],
      "correct": "Przewoznika"
    },
    "scenario": {
      "prompt": "Zauwazyles wyciek z DPPL przed wyjazdem. Czyj to obowiazek reagowac?",
      "options": ["Odbiorcy", "Przewoznika (kontrola wzrokowa)", "Nikogo, to problem nadawcy"],
      "correct": "Przewoznika (kontrola wzrokowa)"
    }
  }
}, {
  "id": "b1-rozladowca",
  "block": 1,
  "topic": "Uczestnicy przewozu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.4.3.7",
  "source": "kompendium",
  "page": 28,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Rozladowca: sprawdza czy rozladowano wlasciwe towary (porownanie dokumentu ze sztuka przesylki), sprawdza uszkodzenia, po rozladunku usuwa pozostalosci z zewnetrznej powierzchni, zamyka zawory, zapewnia oczyszczenie i odkazenie. Z calkowicie oczyszczonego kontenera ZDEJMUJE nalepki i tablice.",
  "q": {
    "mcq": {
      "prompt": "Kto zdejmuje nalepki i tablice z calkowicie oczyszczonego kontenera?",
      "options": ["Nadawca", "Rozladowca", "Przewoznik"],
      "correct": "Rozladowca"
    },
    "scenario": {
      "prompt": "Kontener zostal rozladowany, oczyszczony i odkazony. Co z nalepkami?",
      "options": ["Zostaja na kontenerze", "Nalezy je usunac", "Zaklejamy tasma"],
      "correct": "Nalezy je usunac"
    }
  }
}, {
  "id": "b1-odbiorca",
  "block": 1,
  "topic": "Uczestnicy przewozu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.4.2.3",
  "source": "kompendium",
  "page": 28,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Odbiorca: nie opoznia przyjecia towarow bez koniecznosci, sprawdza po rozladunku spelnienie wymagan ADR. Kontener moze zwrocic przewoznikowi dopiero po usunieciu naruszenia.",
  "q": {
    "mcq": {
      "prompt": "Odbiorca stwierdzil naruszenie przepisow ADR w kontenerze. Moze go zwrocic przewoznikowi:",
      "options": ["Natychmiast", "Dopiero po usunieciu naruszenia", "Nigdy"],
      "correct": "Dopiero po usunieciu naruszenia"
    }
  }
}, {
  "id": "b1-szkolenie",
  "block": 1,
  "topic": "Zakres uprawnien",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.3 / 8.2",
  "source": "kompendium",
  "page": 8,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Korzystajac ze wszystkich wylaczen kierowca NIE musi posiadac zaswiadczenia ADR. Powinien przejsc na koszt pracodawcy szkolenie stanowiskowe (wg 1.3), inne niz kurs ADR.",
  "q": {
    "mcq": {
      "prompt": "Kierowca przewozacy towary na wylaczeniu:",
      "options": ["Musi miec zaswiadczenie ADR", "Wystarczy szkolenie stanowiskowe na koszt pracodawcy", "Nie potrzebuje zadnego szkolenia"],
      "correct": "Wystarczy szkolenie stanowiskowe na koszt pracodawcy"
    },
    "scenario": {
      "prompt": "Wieziesz towar w ilosciach wylaczonych (EQ). Czy potrzebujesz kursu ADR?",
      "options": ["Tak, pelnego kursu", "Nie, wystarczy szkolenie stanowiskowe", "Tylko przy klasie 3"],
      "correct": "Nie, wystarczy szkolenie stanowiskowe"
    }
  }
}, {
  "id": "b1-waznosc",
  "block": 1,
  "topic": "Zakres uprawnien",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.2.2.8",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Zaswiadczenie o przeszkoleniu kierowcy wydaje sie na okres 5 lat. W ostatnim roku waznosci mozna je przedluzyc na kolejny okres.",
  "q": {
    "mcq": {
      "prompt": "Zaswiadczenie ADR wydaje sie na okres:",
      "options": ["3 lata", "5 lat", "10 lat"],
      "correct": "5 lat"
    },
    "fill": {
      "prompt": "Zaswiadczenie ADR mozna przedluzyc w ___ roku jego waznosci.",
      "correct": "ostatnim",
      "hint": "ktorym"
    }
  }
}, {
  "id": "b1-zakres-podstawowy",
  "block": 1,
  "topic": "Zakres uprawnien",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.2.1",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "ADR podstawowy pozwala przewozic wszystkie klasy poza 1 i 7 w sztukach przesylki oraz luzem, a takze w cysternach stalych i odejmowalnych do 1000 l i kontenerach-cysternach do 3000 l. Taki przewoz NIE wymaga swiadectwa dopuszczenia pojazdu (\"czerwonego paska\").",
  "q": {
    "mcq": {
      "prompt": "ADR podstawowy pozwala przewozic w cysternach stalych o pojemnosci do:",
      "options": ["500 l", "1000 l", "3000 l"],
      "correct": "1000 l"
    },
    "scenario": {
      "prompt": "Masz ADR podstawowy. Kontener-cysterna 2500 l z olejem napedowym — mozesz?",
      "options": ["Nie, potrzeba kursu cysterny", "Tak, kontenery-cysterny do 3000 l sa w zakresie podstawowym", "Tylko z eskorta"],
      "correct": "Tak, kontenery-cysterny do 3000 l sa w zakresie podstawowym"
    }
  }
}, {
  "id": "b1-kurs-cysterny-prog",
  "block": 1,
  "topic": "Zakres uprawnien",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.2.1",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Kurs specjalistyczny ADR cysterny jest wymagany dla cystern powyzej 1 m3 (1000 l). Pozwala przewozic wszystkie klasy poza 1 i 7 w cysternach.",
  "q": {
    "mcq": {
      "prompt": "Od jakiej pojemnosci cysterny wymagany jest kurs specjalistyczny?",
      "options": ["Powyzej 500 l", "Powyzej 1 m3 (1000 l)", "Powyzej 3 m3"],
      "correct": "Powyzej 1 m3 (1000 l)"
    }
  }
}, {
  "id": "b1-1131",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.1",
  "source": "kompendium",
  "page": 8,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Zwolnienia z charakteru operacji transportowych 1.1.3.1: osoby fizyczne przewozace w malych fabrycznych opakowaniach (np. paliwo do 240 l), przewoz o charakterze pomocniczym, przewoz nadzorowany przez sluzby ratunkowe, przewoz w celu ratowania zycia lub ochrony srodowiska, przewoz proznych zbiornikow transportowych.",
  "q": {
    "mcq": {
      "prompt": "Osoba fizyczna moze przewiezc w malych fabrycznych opakowaniach paliwo do:",
      "options": ["60 l", "240 l", "1000 l"],
      "correct": "240 l"
    },
    "scenario": {
      "prompt": "Przewoz w celu ratowania zycia. Czy podlega ADR?",
      "options": ["Tak, pelne ADR", "Nie, zwolnienie 1.1.3.1", "Tylko dokument przewozowy"],
      "correct": "Nie, zwolnienie 1.1.3.1"
    }
  }
}, {
  "id": "b1-1133-paliwo",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.3",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill", "match"],
  "why": "Zwolnienie 1.1.3.3 — paliwo w zbiornikach pojazdu sluzace do jego napedu lub pracy wyposazenia: do 1500 l na jednostke transportowa, nie wiecej niz 500 l na przyczepie. W zbiornikach dodatkowych (kanistrach) nie wiecej niz 60 l.",
  "q": {
    "mcq": {
      "prompt": "Limit paliwa w zbiornikach pojazdu na jednostke transportowa (1.1.3.3):",
      "options": ["500 l", "1000 l", "1500 l"],
      "correct": "1500 l"
    },
    "fill": {
      "prompt": "W zbiornikach dodatkowych (kanistrach) nie wiecej niz ___ litrow.",
      "correct": "60",
      "hint": "liczba"
    },
    "match": {
      "prompt": "Dopasuj limit paliwa wg 1.1.3.3:",
      "pairs": {
        "Jednostka transportowa": "1500 l",
        "Przyczepa": "500 l",
        "Kanistry": "60 l"
      }
    }
  }
}, {
  "id": "b1-1132-gazy",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.2",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Zwolnienia dla gazow 1.1.3.2: gazy w zbiornikach pojazdu do napedu; gazy w zbiornikach przewozonych pojazdow — wartosc energetyczna max 54 000 MJ. Laczna objetosc: 1080 kg dla LNG i CNG, 2250 l dla LPG. Takze gazy w wyposazeniu (gasnice, napompowane kola), w zywnosci, w sprzecie sportowym.",
  "q": {
    "mcq": {
      "prompt": "Maksymalna wartosc energetyczna paliwa w zbiornikach przewozonych pojazdow (1.1.3.2):",
      "options": ["24 000 MJ", "54 000 MJ", "108 000 MJ"],
      "correct": "54 000 MJ"
    },
    "match": {
      "prompt": "Dopasuj limit laczny dla gazow (1.1.3.2):",
      "pairs": {
        "LNG i CNG": "1080 kg",
        "LPG": "2250 l"
      }
    }
  }
}, {
  "id": "b1-wartosc-energetyczna",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.2 uwaga 1",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Wartosci energetyczne paliw: olej napedowy 36 MJ/l, benzyna silnikowa 32 MJ/l, gaz ziemny/biogaz 35 MJ/Nm3, LPG 24 MJ/l, etanol 21 MJ/l, olej napedowy bio 33 MJ/l, paliwo emulsyjne 32 MJ/l, wodor 11 MJ/Nm3.",
  "q": {
    "match": {
      "prompt": "Dopasuj paliwo do wartosci energetycznej:",
      "pairs": {
        "Olej napedowy": "36 MJ/l",
        "Benzyna silnikowa": "32 MJ/l",
        "LPG": "24 MJ/l",
        "Wodor": "11 MJ/Nm3"
      }
    }
  }
}, {
  "id": "b1-przepisy-szczegolne",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 3.3",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Zwolnienia z przepisow szczegolnych: 598 — akumulatory, 168 — przewoz azbestu, 188 — akumulatory litowe zawarte w urzadzeniach (nie podlega ADR).",
  "q": {
    "match": {
      "prompt": "Dopasuj przepis szczegolny do towaru:",
      "pairs": {
        "168": "azbest",
        "188": "akumulatory litowe w urzadzeniach",
        "598": "akumulatory"
      }
    },
    "mcq": {
      "prompt": "Akumulatory litowe zawarte w urzadzeniu obejmuje przepis szczegolny:",
      "options": ["168", "188", "598"],
      "correct": "188"
    }
  }
}, {
  "id": "b1-eq",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 3.5",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill", "scenario"],
  "why": "Ilosci wylaczone (EQ), przepis 3.5: materialy w opakowaniach wewnetrznych nie moga byc wieksze niz 1 kg (1000 g) lub 1 litr (1000 ml). Opakowanie NIE musi byc certyfikowane, brak nalepek ostrzegawczych. Wymaga szkolenia stanowiskowego, NIE kursu ADR. W dokumencie zapis \"Towary niebezpieczne w ilosciach wylaczonych\" oraz liczba sztuk przesylek.",
  "q": {
    "mcq": {
      "prompt": "Limit opakowania wewnetrznego przy ilosciach wylaczonych (EQ):",
      "options": ["1 kg lub 1 litr", "5 kg lub 5 litrow", "30 kg lub 30 litrow"],
      "correct": "1 kg lub 1 litr"
    },
    "fill": {
      "prompt": "Przy EQ opakowanie ___ musi byc certyfikowane (NIE / MUSI).",
      "correct": "nie",
      "hint": "nie albo musi"
    },
    "scenario": {
      "prompt": "Wieziesz towar w ilosciach wylaczonych. Czy potrzebujesz kursu ADR?",
      "options": ["Tak", "Nie, wystarczy szkolenie stanowiskowe", "Tylko przy klasie 8"],
      "correct": "Nie, wystarczy szkolenie stanowiskowe"
    }
  }
}, {
  "id": "b1-lq",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 3.4",
  "source": "kompendium",
  "page": 10,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Ilosci ograniczone (LQ), przepis 3.4: opakowania kombinowane max 5 kg/l wewnetrzne i 30 kg/l opakowanie. Mozna przewozic do ladownosci auta. Oznakowanie: kwadrat obrocony o 45 stopni z czarno-bialymi trojkatami.",
  "q": {
    "mcq": {
      "prompt": "Limity opakowan przy ilosciach ograniczonych (LQ):",
      "options": ["1 kg/l wewnetrzne", "max 5 kg/l wewnetrzne i 30 kg/l opakowanie", "10 kg/l i 50 kg/l"],
      "correct": "max 5 kg/l wewnetrzne i 30 kg/l opakowanie"
    },
    "match": {
      "prompt": "Dopasuj limit LQ:",
      "pairs": {
        "Opakowanie wewnetrzne": "5 kg/l",
        "Opakowanie zewnetrzne": "30 kg/l"
      }
    }
  }
}, {
  "id": "b1-lq-oznakowanie-pojazdu",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 3.4.13",
  "source": "kompendium",
  "page": 10,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Jednostki transportowe powyzej 12 t DMC przewozace powyzej 8 t brutto towarow LQ musza byc oznakowane znakiem LQ z przodu i tylu pojazdu (250 x 250 mm). Nadawca musi poinformowac przewoznika o calkowitej ilosci LQ. Oznakowanie zamienne z tablicami pomaranczowymi.",
  "q": {
    "mcq": {
      "prompt": "Kiedy pojazd z towarami LQ musi byc oznakowany z przodu i tylu?",
      "options": ["Zawsze", "Powyzej 12 t DMC i powyzej 8 t brutto ladunku LQ", "Nigdy"],
      "correct": "Powyzej 12 t DMC i powyzej 8 t brutto ladunku LQ"
    },
    "scenario": {
      "prompt": "Ciezarowka 24 t DMC, 10 t brutto towarow LQ. Oznakowanie?",
      "options": ["Bez oznakowania", "Znak LQ z przodu i tylu", "Tablice pomaranczowe z numerami"],
      "correct": "Znak LQ z przodu i tylu"
    }
  }
}, {
  "id": "b1-lq-tunel-e",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5 / 3.4",
  "source": "kompendium",
  "page": 10,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Jednostki transportowe oznakowane znakiem LQ (powyzej 8 t brutto) NIE MOGA wjezdzac do tunelu kategorii E.",
  "q": {
    "mcq": {
      "prompt": "Pojazd oznakowany znakiem LQ powyzej 8 t brutto nie moze wjechac do tunelu kategorii:",
      "options": ["B", "D", "E"],
      "correct": "E"
    }
  }
}, {
  "id": "b1-1136",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6",
  "source": "kompendium",
  "page": 10,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Zwolnienie 1.1.3.6 (tzw. 1000 pkt) — pod uwage bierze sie ilosc towaru na jednostce transportowej. WYMAGANE: opakowania certyfikowane i oznakowane, gasnica 2 kg ABC z data przegladu, prawidlowy dokument przewozowy, szkolenie stanowiskowe. NIE MUSISZ: oznakowywac pojazdu tablicami, miec zaswiadczenia ADR, instrukcji pisemnej, wyposazenia (skrzynki ADR), stosowac sie do znakow drogowych ADR, wyznaczac DGSA, przestrzegac zakazu przewozu pasazerow.",
  "q": {
    "mcq": {
      "prompt": "Przy zwolnieniu 1.1.3.6 kierowca NIE musi:",
      "options": ["Miec gasnicy", "Miec zaswiadczenia ADR i tablic pomaranczowych", "Prawidlowo zapakowac towaru"],
      "correct": "Miec zaswiadczenia ADR i tablic pomaranczowych"
    },
    "fill": {
      "prompt": "Suma punktow wg 1.1.3.6 nie moze przekroczyc ___ na jednostke transportowa.",
      "correct": "1000",
      "hint": "liczba"
    }
  }
}, {
  "id": "b1-1136-gasnica",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6 / 8.1.4",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "mcq"],
  "why": "Pojazd przewozacy towary niebezpieczne na zwolnieniu 1.1.3.6 musi byc wyposazony w 1 gasnice 2 kg typu ABC.",
  "q": {
    "scenario": {
      "prompt": "Przewoz na zwolnieniu 1.1.3.6. Ile gasnic i jakiej wielkosci?",
      "options": ["Zadnej", "1 gasnica 2 kg typu ABC", "2 gasnice po 6 kg"],
      "correct": "1 gasnica 2 kg typu ABC"
    },
    "mcq": {
      "prompt": "Gasnica przy zwolnieniu 1.1.3.6 musi byc typu:",
      "options": ["A", "ABC", "CO2"],
      "correct": "ABC"
    }
  }
}, {
  "id": "b1-kategorie-transportowe",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3 / kol. 15",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Jest 5 kategorii transportowych (0-1-2-3-4). Kategorie transportowe to NIE klasy ani grupy pakowania. Limity na jednostke transportowa: kat. 0 = 0 (zawsze pelny ADR), kat. 1 = 20 (mnoznik x50), kat. 2 = 333 (x3), kat. 3 = 1000 (x1), kat. 4 = bez ograniczen (mnoznik 0). Kategorie sprawdza sie w kolumnie 15 tabeli A.",
  "q": {
    "match": {
      "prompt": "Dopasuj kategorie transportowa do limitu ilosci:",
      "pairs": {
        "Kategoria 1": "20",
        "Kategoria 2": "333",
        "Kategoria 3": "1000",
        "Kategoria 4": "bez ograniczen"
      }
    },
    "mcq": {
      "prompt": "Kategorie transportowa dla danego numeru UN sprawdzisz w tabeli A w kolumnie:",
      "options": ["kolumnie 1", "kolumnie 15", "kolumnie 20"],
      "correct": "kolumnie 15"
    }
  }
}, {
  "id": "b1-mnozniki",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.4",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Mnozniki kategorii transportowych: kat. 1 = x50, kat. 2 = x3, kat. 3 = x1, kat. 4 = 0. Suma iloczynow nie moze przekroczyc 1000.",
  "q": {
    "match": {
      "prompt": "Dopasuj kategorie do mnoznika:",
      "pairs": {
        "Kategoria 1": "x50",
        "Kategoria 2": "x3",
        "Kategoria 3": "x1",
        "Kategoria 4": "0"
      }
    }
  }
}, {
  "id": "b1-kat1-wyjatek",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "W kategorii transportowej 1 wystepuje wyjatek: dla UN 0081, 0082, 0084, 0241, 0331, 0332, 0482, 1005 i 1017 maksymalna ilosc calkowita na jednostke transportowa wynosi 50 kg, a mnoznik to x20 (zamiast standardowych 20 i x50).",
  "q": {
    "mcq": {
      "prompt": "Dla UN 1005 i UN 1017 (kategoria 1) maksymalna ilosc na jednostke wynosi:",
      "options": ["20 kg", "50 kg", "333 kg"],
      "correct": "50 kg"
    },
    "scenario": {
      "prompt": "Przewozisz UN 1017 (chlor). Jaki mnoznik stosujesz przy liczeniu punktow?",
      "options": ["x50 (standard kat. 1)", "x20 (wyjatek)", "x3"],
      "correct": "x20 (wyjatek)"
    }
  }
}, {
  "id": "b1-kat0",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Dla towarow kategorii transportowej 0 KAZDA ilosc oznacza pelny ADR — limit wynosi 0, nie ma mnoznika. Dotyczy to takze proznych opakowan po towarach kategorii 0.",
  "q": {
    "mcq": {
      "prompt": "Towary kategorii transportowej 0 przewozi sie:",
      "options": ["Bez ograniczen", "Zawsze na pelnym ADR, kazda ilosc", "Do 20 kg na wylaczeniu"],
      "correct": "Zawsze na pelnym ADR, kazda ilosc"
    },
    "scenario": {
      "prompt": "Prozne, nieoczyszczone opakowanie po towarze kategorii 0. Jaki rezim?",
      "options": ["Wylaczenie 1.1.3.6", "Pelny ADR", "Kategoria 4, bez ograniczen"],
      "correct": "Pelny ADR"
    }
  }
}, {
  "id": "b1-kat4",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Kategoria transportowa 4 — kazda ilosc \"na wylaczeniu\", mnoznik 0, bez ograniczen. Naleza tu: prozne opakowania po towarach niebezpiecznych (z wylaczeniem tych z kategorii 0), materialy wybuchowe 1.4S oraz WSZYSTKIE butle po gazach. Butle po gazach moze przewozic kierowca bez zaswiadczenia ADR.",
  "q": {
    "mcq": {
      "prompt": "Wszystkie butle po gazach naleza do kategorii transportowej:",
      "options": ["1", "2", "4"],
      "correct": "4"
    },
    "scenario": {
      "prompt": "Wieziesz puste butle po gazach. Czy potrzebujesz zaswiadczenia ADR?",
      "options": ["Tak, zawsze", "Nie — kategoria 4, bez ograniczen", "Tylko powyzej 10 butli"],
      "correct": "Nie — kategoria 4, bez ograniczen"
    }
  }
}, {
  "id": "b1-prozne-oznakowanie",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.1.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Prozne, NIEOCZYSZCZONE opakowania pozostaja oznakowane tak jak w stanie ladownym. NIE usuwamy nalepek ostrzegawczych ani numerow UN.",
  "q": {
    "mcq": {
      "prompt": "Prozne, nieoczyszczone opakowanie po towarze niebezpiecznym:",
      "options": ["Zdejmujemy nalepki", "Pozostaje oznakowane jak w stanie ladownym", "Oznaczamy napisem PUSTE"],
      "correct": "Pozostaje oznakowane jak w stanie ladownym"
    },
    "scenario": {
      "prompt": "Rozladowales DPPL po farbie. Opakowanie nieoczyszczone. Co z nalepka klasy 3?",
      "options": ["Usuwam ja", "Zostaje — nieoczyszczone = jak ladowne", "Zamieniam na nalepke 9"],
      "correct": "Zostaje — nieoczyszczone = jak ladowne"
    }
  }
}, {
  "id": "b2-klasyfikacja-kto",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR czesc 2",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Za klasyfikacje odpowiada PRODUCENT, NADAWCA oraz Instytut Przemyslu Organicznego (IPO). Dla klasy 7 — Panstwowa Agencja Atomistyki (PAA).",
  "q": {
    "mcq": {
      "prompt": "Kto odpowiada za klasyfikacje materialow promieniotworczych (klasa 7)?",
      "options": ["IPO", "Panstwowa Agencja Atomistyki", "TDT"],
      "correct": "Panstwowa Agencja Atomistyki"
    },
    "match": {
      "prompt": "Dopasuj odpowiedzialnosc za klasyfikacje:",
      "pairs": {
        "Klasy 1-9 (poza 7)": "producent, nadawca, IPO",
        "Klasa 7": "Panstwowa Agencja Atomistyki"
      }
    }
  }
}, {
  "id": "b2-zagrozenie-dominujace",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.1.3.10",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Zagrozenie dominujace przypisuje towar do jednej z 13 klas (liczac podklasy osobno) — jest to PIERWSZA nalepka. Nazwe klasy mozna znalezc powyzej kazdej z nalepek w instrukcji pisemnej. Klasa 2 (gazy) ma kilka nalepek.",
  "q": {
    "mcq": {
      "prompt": "Zagrozenie dominujace okresla:",
      "options": ["Druga nalepke w dokumencie", "Pierwsza nalepke — przypisanie do klasy", "Grupe pakowania"],
      "correct": "Pierwsza nalepke — przypisanie do klasy"
    }
  }
}, {
  "id": "b2-zagrozenie-dodatkowe",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.1.1.2",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Zagrozenie dodatkowe okreslane jest kodem literowym, np. F — palne, T — trujace. Jest to DRUGA nalepka w dokumencie przewozowym (kod klasyfikacyjny).",
  "q": {
    "mcq": {
      "prompt": "Litera F w kodzie klasyfikacyjnym oznacza:",
      "options": ["Palne", "Trujace", "Zrace"],
      "correct": "Palne"
    },
    "match": {
      "prompt": "Dopasuj kod literowy do zagrozenia:",
      "pairs": {
        "F": "palne",
        "T": "trujace"
      }
    }
  }
}, {
  "id": "b2-grupy-pakowania",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.1.1.3",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Grupy pakowania okreslaja natezenie zagrozenia dominujacego: I — zagrozenie duze, II — srednie, III — male. Grup pakowania NIE MAJA klasy 1, 2, 5.2, 6.2, 7 oraz przedmioty.",
  "q": {
    "mcq": {
      "prompt": "Ktore klasy NIE maja grup pakowania?",
      "options": ["Tylko 2 i 7", "1, 2, 5.2, 6.2, 7 oraz przedmioty", "Tylko 1 i 7"],
      "correct": "1, 2, 5.2, 6.2, 7 oraz przedmioty"
    },
    "match": {
      "prompt": "Dopasuj grupe pakowania do natezenia zagrozenia:",
      "pairs": {
        "I": "duze",
        "II": "srednie",
        "III": "male"
      }
    }
  }
}, {
  "id": "b2-un-pozycje",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 3.1.2",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match", "scenario"],
  "why": "Numer UN (nazywany tez numerem ONZ) to czterocyfrowy numer rozpoznawczy. Moze byc przypisany do JEDNEJ substancji, np. UN 1090 ACETON, albo do POZYCJI GRUPOWEJ — kilku towarow o podobnych wlasciwosciach, np. UN 1263 FARBA.",
  "q": {
    "mcq": {
      "prompt": "UN 1263 FARBA to przyklad:",
      "options": ["Jednej substancji", "Pozycji grupowej", "Numeru zagrozenia"],
      "correct": "Pozycji grupowej"
    },
    "match": {
      "prompt": "Dopasuj numer UN do typu pozycji:",
      "pairs": {
        "UN 1090 ACETON": "jedna substancja",
        "UN 1263 FARBA": "pozycja grupowa"
      }
    },
    "scenario": {
      "prompt": "Numer UN nazywany jest rowniez numerem:",
      "options": ["Kemlera", "ONZ", "rozpoznawczym zagrozenia"],
      "correct": "ONZ"
    }
  }
}, {
  "id": "b2-ino",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 3.1.2.8",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Litery I.N.O. po nazwie oznaczaja \"inaczej nie okreslony\". Wymaga sie wtedy uzupelnienia o nazwy techniczne, np. UN 1964 WEGLOWODORY GAZOWE, MIESZANINA SPREZONA I.N.O (zawiera wodor i argon) 2.1 (B/D).",
  "q": {
    "mcq": {
      "prompt": "Skrot I.N.O. po nazwie przewozowej oznacza:",
      "options": ["Inaczej nie okreslony", "Instrukcja nadawcy obowiazkowa", "Ilosc nieograniczona"],
      "correct": "Inaczej nie okreslony"
    },
    "scenario": {
      "prompt": "W dokumencie widzisz UN 1964 ... I.N.O. Czego wymaga taki zapis?",
      "options": ["Nic dodatkowego", "Uzupelnienia o nazwy techniczne skladnikow", "Zgody TDT"],
      "correct": "Uzupelnienia o nazwy techniczne skladnikow"
    }
  }
}, {
  "id": "b2-podklasy2",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.2",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Klasa 2 (gazy): 2.1 gazy palne, 2.2 gazy niepalne i nietrujace (moga byc duszace), 2.3 gazy trujace. Zagrozenie dominujace: wysokie cisnienie, emisja gazu, odmrozenia, wybuch przy ogrzaniu.",
  "q": {
    "match": {
      "prompt": "Dopasuj podklase gazu:",
      "pairs": {
        "2.1": "gazy palne",
        "2.2": "niepalne i nietrujace",
        "2.3": "gazy trujace"
      }
    }
  }
}, {
  "id": "b2-klasa3-temp",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.3",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Klasa 3 — materialy ciekle zapalne o temperaturze zaplonu nie wyzszej niz 60 stopni C, np. UN 1202, UN 1203. Uwaga: unikac zaglebien terenu.",
  "q": {
    "mcq": {
      "prompt": "Temperatura zaplonu materialow klasy 3 nie jest wyzsza niz:",
      "options": ["23 st. C", "60 st. C", "100 st. C"],
      "correct": "60 st. C"
    },
    "fill": {
      "prompt": "Klasa 3 to materialy ciekle zapalne o temperaturze zaplonu do ___ stopni C.",
      "correct": "60",
      "hint": "liczba"
    }
  }
}, {
  "id": "b2-podklasy4",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.41-43",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Klasa 4: 4.1 materialy zapalne stale, samoreaktywne, polimeryzujace i wybuchowe odczulone stale; 4.2 materialy podatne na samozapalenie (piroforyczne, tytan, rozdrobnione metale, fosfor bialy); 4.3 materialy wytwarzajace w zetknieciu z woda gazy palne — musza byc przewozone w pojazdach zamknietych.",
  "q": {
    "match": {
      "prompt": "Dopasuj podklase klasy 4:",
      "pairs": {
        "4.1": "zapalne stale, samoreaktywne",
        "4.2": "podatne na samozapalenie",
        "4.3": "wytwarzaja z woda gazy palne"
      }
    },
    "mcq": {
      "prompt": "Materialy klasy 4.3 musza byc przewozone:",
      "options": ["W pojazdach otwartych", "W pojazdach zamknietych", "Tylko w cysternach"],
      "correct": "W pojazdach zamknietych"
    }
  }
}, {
  "id": "b2-podklasy5",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.51-52",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Klasa 5: 5.1 materialy utleniajace — wzmagaja palenie, same nie musza sie palic, nie mieszac z materialami zapalnymi (np. trocinami); 5.2 nadtlenki organiczne typu A-F, niektore moga byc wybuchowe.",
  "q": {
    "match": {
      "prompt": "Dopasuj podklase klasy 5:",
      "pairs": {
        "5.1": "utleniajace (wzmagaja palenie)",
        "5.2": "nadtlenki organiczne"
      }
    },
    "mcq": {
      "prompt": "Z czym NIE wolno mieszac materialow utleniajacych (5.1)?",
      "options": ["Z woda", "Z materialami zapalnymi, np. trocinami", "Z piaskiem"],
      "correct": "Z materialami zapalnymi, np. trocinami"
    }
  }
}, {
  "id": "b2-temp-kontrolowana",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 7.1.7",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Klasy 4.1 i 5.2 moga wymagac temperatury kontrolowanej podczas przewozu (reakcja egzotermiczna). Wymagana jest mozliwosc sprawdzenia temperatury oraz procedura postepowania. Termometr z 2 czujnikami. Temperature sprawdza sie co 4-6 h i rejestruje. Nalezy okreslic procedury na wypadek utraty mozliwosci utrzymania temperatury.",
  "q": {
    "mcq": {
      "prompt": "Co ile godzin sprawdza sie temperature przy przewozie w temperaturze kontrolowanej?",
      "options": ["Co 1-2 h", "Co 4-6 h", "Co 12 h"],
      "correct": "Co 4-6 h"
    },
    "scenario": {
      "prompt": "Przewozisz nadtlenek organiczny w temperaturze kontrolowanej. Ile czujnikow ma termometr?",
      "options": ["1", "2", "4"],
      "correct": "2"
    }
  }
}, {
  "id": "b2-podklasy6",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.61-62",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Klasa 6: 6.1 materialy trujace — zagrozenie smiertelnym zatruciem przez polkniecie, wdychanie lub przez skore; 6.2 materialy zakazne — odpady medyczne, kliniczne, szpitalne, wirusy, bakterie, priony. UWAGA: NIE wystepuja jednoczesnie zakazne i trujace.",
  "q": {
    "match": {
      "prompt": "Dopasuj podklase klasy 6:",
      "pairs": {
        "6.1": "trujace",
        "6.2": "zakazne"
      }
    },
    "mcq": {
      "prompt": "Czy moze wystapic material jednoczesnie zakazny i trujacy?",
      "options": ["Tak, czesto", "Nie — takie polaczenie nie wystepuje", "Tylko w klasie 9"],
      "correct": "Nie — takie polaczenie nie wystepuje"
    }
  }
}, {
  "id": "b2-klasa9-temp",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.9",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Klasa 9 obejmuje m.in. azbest (wdychany w postaci drobnego pylu), materialy w podwyzszonej temperaturze — stale powyzej 240 st. C, ciekle powyzej 100 st. C, akumulatory litowe, przedmioty ratownicze, materialy zagrazajace srodowisku wodnemu.",
  "q": {
    "mcq": {
      "prompt": "Material ciekly klasy 9 w podwyzszonej temperaturze to powyzej:",
      "options": ["60 st. C", "100 st. C", "240 st. C"],
      "correct": "100 st. C"
    },
    "match": {
      "prompt": "Dopasuj stan skupienia do progu podwyzszonej temperatury:",
      "pairs": {
        "Staly": "powyzej 240 st. C",
        "Ciekly": "powyzej 100 st. C"
      }
    }
  }
}, {
  "id": "b2-nalepka-9a",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 5.2.2.2",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Nalepka 9A jest stosowana dla numerow UN 3090, UN 3091, UN 3480, UN 3481 — ogniwa i akumulatory litowe.",
  "q": {
    "mcq": {
      "prompt": "Nalepka 9A jest stosowana dla:",
      "options": ["Azbestu", "Ogniw i akumulatorow litowych (UN 3090, 3091, 3480, 3481)", "Suchego lodu"],
      "correct": "Ogniw i akumulatorow litowych (UN 3090, 3091, 3480, 3481)"
    }
  }
}, {
  "id": "b2-nie-podlega-adr",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 3.3 SP 188",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Nie podlegaja ADR: akumulatory i ogniwa litowe wg przepisu 188, pojazdy poddane fumigacji (zagrozenie uduszeniem), czynniki chlodzace np. UN 1845 suchy lod (zagrozenie uduszeniem).",
  "q": {
    "match": {
      "prompt": "Dopasuj towar do jego statusu:",
      "pairs": {
        "Akumulatory litowe wg przepisu 188": "nie podlega ADR",
        "Suchy lod UN 1845": "nie podlega ADR",
        "Jednostka poddana fumigacji": "nie podlega ADR"
      }
    },
    "scenario": {
      "prompt": "Wieziesz suchy lod (UN 1845) jako czynnik chlodzacy. Jakie zagrozenie glowne?",
      "options": ["Pozar", "Uduszenie", "Zatrucie"],
      "correct": "Uduszenie"
    }
  }
}, {
  "id": "b2-tablice-gladkie",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Tablice odblaskowe pomaranczowe maja wymiary 300 x 400 mm (+/- 10%) z czarna ramka o szerokosci 15 mm. Tablice powinny przetrwac w pozarze 15 minut. Dopuszcza sie tablice 300 x 120 mm (obramowanie 10 mm) w pojazdach bez miejsca na standardowa, np. osobowych. Tablic gladkich uzywa sie zwykle przy przewozie w sztukach przesylki.",
  "q": {
    "mcq": {
      "prompt": "Wymiary standardowej tablicy pomaranczowej to:",
      "options": ["250 x 250 mm", "300 x 400 mm", "400 x 400 mm"],
      "correct": "300 x 400 mm"
    },
    "fill": {
      "prompt": "Tablica pomaranczowa powinna przetrwac w pozarze ___ minut.",
      "correct": "15",
      "hint": "liczba"
    }
  }
}, {
  "id": "b2-tablice-ramka",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.2.1",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Tablica standardowa 300 x 400 mm ma czarna ramke o szerokosci 15 mm. Tablica mala 300 x 120 mm ma obramowanie 10 mm.",
  "q": {
    "match": {
      "prompt": "Dopasuj rozmiar tablicy do szerokosci ramki:",
      "pairs": {
        "300 x 400 mm": "ramka 15 mm",
        "300 x 120 mm": "ramka 10 mm"
      }
    }
  }
}, {
  "id": "b2-numer-cyfry",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 18,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Cyfry numeru rozpoznawczego zagrozenia: 2 — emisja gazu spowodowana cisnieniem lub reakcja chemiczna, 3 — zapalnosc materialow cieklych i gazow, 4 — zapalnosc materialow stalych, 5 — dzialanie utleniajace, 6 — dzialanie trujace lub ryzyko zakazenia, 7 — dzialanie promieniotworcze, 8 — dzialanie zrace, 9 — ryzyko samorzutnej i gwaltownej reakcji.",
  "q": {
    "match": {
      "prompt": "Dopasuj cyfre numeru zagrozenia do znaczenia:",
      "pairs": {
        "2": "emisja gazu",
        "3": "zapalnosc cieczy",
        "5": "dzialanie utleniajace",
        "8": "dzialanie zrace"
      }
    },
    "mcq": {
      "prompt": "Cyfra 9 w numerze rozpoznawczym zagrozenia oznacza:",
      "options": ["Dzialanie zrace", "Ryzyko samorzutnej i gwaltownej reakcji", "Emisje gazu"],
      "correct": "Ryzyko samorzutnej i gwaltownej reakcji"
    }
  }
}, {
  "id": "b2-numer-x",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Litera X przed numerem rozpoznawczym zagrozenia oznacza niebezpieczna reakcje z woda. Woda moze byc stosowana jedynie za zgoda specjalistow. UWAGA: nie mylic z X w kodzie opakowania, ktory okresla mocne opakowanie do I, II, III grupy pakowania.",
  "q": {
    "mcq": {
      "prompt": "Litera X przed numerem rozpoznawczym zagrozenia oznacza:",
      "options": ["Material wybuchowy", "Niebezpieczna reakcje z woda", "Mocne opakowanie"],
      "correct": "Niebezpieczna reakcje z woda"
    },
    "scenario": {
      "prompt": "Na tablicy widzisz X423. Czy mozna gasic woda?",
      "options": ["Tak, zawsze", "Tylko za zgoda specjalistow", "Woda jest zalecana"],
      "correct": "Tylko za zgoda specjalistow"
    }
  }
}, {
  "id": "b2-numer-podwojenie",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Powtorzenie cyfry wskazuje na nasilenie oznaczonego ta cyfra zagrozenia, np. 33 = material latwo zapalny ciekly (temperatura zaplonu nizsza niz 23 st. C).",
  "q": {
    "mcq": {
      "prompt": "Powtorzenie cyfry w numerze rozpoznawczym oznacza:",
      "options": ["Dwa rozne zagrozenia", "Nasilenie zagrozenia", "Brak zagrozenia dodatkowego"],
      "correct": "Nasilenie zagrozenia"
    },
    "scenario": {
      "prompt": "Tablica 33/1203. Co oznacza 33?",
      "options": ["Material zapalny o temp. zaplonu 23-60 st. C", "Material latwo zapalny ciekly, temp. zaplonu ponizej 23 st. C", "Gaz palny"],
      "correct": "Material latwo zapalny ciekly, temp. zaplonu ponizej 23 st. C"
    }
  }
}, {
  "id": "b2-numer-zero",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Jesli w numerze rozpoznawczym zagrozenia wystepuje 0 (zero), to zawsze na drugiej pozycji. Oznacza, ze NIE ma zwiekszenia zagrozenia ani zagrozenia dodatkowego, a towar zwykle nalezy do II lub III grupy pakowania. Nie dotyczy gazow.",
  "q": {
    "mcq": {
      "prompt": "Zero na drugim miejscu numeru rozpoznawczego oznacza:",
      "options": ["Nasilenie zagrozenia", "Brak zwiekszenia zagrozenia i zagrozenia dodatkowego", "Reakcje z woda"],
      "correct": "Brak zwiekszenia zagrozenia i zagrozenia dodatkowego"
    },
    "scenario": {
      "prompt": "Numer 30 na tablicy. Do ktorej grupy pakowania zwykle nalezy taki towar?",
      "options": ["I", "II lub III", "Nie ma grupy pakowania"],
      "correct": "II lub III"
    }
  }
}, {
  "id": "b2-numery-specjalne",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Nastepujace zestawienia cyfr maja znaczenie specjalne: 22, 323, 333, 362, 382, 423, 44, 446, 462, 482, 539, 606, 623, 642, 823, 842, 90 i 99. Przyklady: 90 = material zagrazajacy srodowisku, 99 = rozne materialy niebezpieczne przewozone w podwyzszonej temperaturze, 333 = material piroforyczny ciekly, 606 = material zakazny.",
  "q": {
    "match": {
      "prompt": "Dopasuj numer specjalny do znaczenia:",
      "pairs": {
        "90": "zagrazajacy srodowisku",
        "99": "podwyzszona temperatura",
        "333": "piroforyczny ciekly",
        "606": "material zakazny"
      }
    }
  }
}, {
  "id": "b2-numery-przyklady",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 18,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Przyklady odczytu: 20 = gaz duszacy lub niestwarzajacy zagrozenia dodatkowego, 23 = gaz palny, 26 = gaz trujacy, 30 = material zapalny ciekly (23-60 st. C), 33 = material latwo zapalny ciekly (ponizej 23 st. C), 80 = material zracy lub slabo zracy, 88 = material silnie zracy.",
  "q": {
    "match": {
      "prompt": "Dopasuj numer rozpoznawczy do znaczenia:",
      "pairs": {
        "20": "gaz duszacy",
        "23": "gaz palny",
        "80": "material zracy",
        "88": "material silnie zracy"
      }
    },
    "scenario": {
      "prompt": "Cysterna z tablica 33 / 1203 przewozi:",
      "options": ["Chlor", "Benzyne", "Azotan amonu"],
      "correct": "Benzyne"
    }
  }
}, {
  "id": "b2-nalepka-wymiary",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 5.2.2.2",
  "source": "kompendium",
  "page": 7,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Nalepka wskazujaca zagrozenie na sztuce przesylki ma rozmiar 100 mm x 100 mm. Moze byc wiecej niz jedna — zagrozenie dominujace i dodatkowe.",
  "q": {
    "mcq": {
      "prompt": "Rozmiar nalepki ostrzegawczej na sztuce przesylki:",
      "options": ["100 x 100 mm", "250 x 250 mm", "300 x 400 mm"],
      "correct": "100 x 100 mm"
    }
  }
}, {
  "id": "b2-oznakowanie-sztuki",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.2",
  "source": "kompendium",
  "page": 7,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Na kazdej sztuce przesylki musi znajdowac sie: numer UN przewozonego towaru, znak certyfikacji opakowania (symbol ONZ — litery \"un\" w kolku), nalepka wskazujaca zagrozenie (100x100 mm), prawidlowa nazwa przewozowa (dla klas 1, 2, 7), strzalki kierunkowe nr 11 dla opakowan z naczyniami wewnetrznymi z materialami cieklymi.",
  "q": {
    "mcq": {
      "prompt": "Prawidlowa nazwa przewozowa na sztuce przesylki jest wymagana dla klas:",
      "options": ["Wszystkich", "1, 2 i 7", "Tylko 3 i 8"],
      "correct": "1, 2 i 7"
    },
    "match": {
      "prompt": "Dopasuj element oznakowania sztuki przesylki:",
      "pairs": {
        "Numer UN": "identyfikacja towaru",
        "Symbol ONZ (un w kolku)": "certyfikacja opakowania",
        "Strzalki kierunkowe nr 11": "naczynia wewnetrzne z cieczami"
      }
    }
  }
}, {
  "id": "b2-overpack",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.1.2",
  "source": "kompendium",
  "page": 7,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Jesli uzywamy opakowania zbiorczego (skrzyni, klatki, palety) i nalepki lub numery UN nie sa widoczne na zewnatrz, nalezy je ponowic. Gdy w opakowaniu sa 2 rodzaje towaru (np. klasy 3 i 8), na zewnatrz musza byc wszystkie wzory nalepek (3 i 8). Jesli nalepka jest ta sama dla wszystkich opakowan, wystarczy na palecie 1 nalepka. Nalezy umiescic napis OPAKOWANIE ZBIORCZE — OVERPACK (jezyk kraju nadania i angielski lub niemiecki lub francuski).",
  "q": {
    "mcq": {
      "prompt": "Napis na opakowaniu zbiorczym to:",
      "options": ["ZBIORCZE", "OPAKOWANIE ZBIORCZE - OVERPACK", "PALETA ADR"],
      "correct": "OPAKOWANIE ZBIORCZE - OVERPACK"
    },
    "scenario": {
      "prompt": "Paleta z towarami klasy 3 i klasy 8, nalepki niewidoczne. Co na zewnatrz?",
      "options": ["Tylko nalepka 3", "Wszystkie wzory nalepek: 3 i 8", "Zadna"],
      "correct": "Wszystkie wzory nalepek: 3 i 8"
    }
  }
}, {
  "id": "b2-opakowania-waznosc",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 4.1.1.15",
  "source": "kompendium",
  "page": 7,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "W wiekszosci wypadkow (DPPL, kanistry, bebny) opakowania moga byc uzywane przez 5 lat od daty produkcji. Po 2,5 roku powinno byc przeprowadzone badanie. Data produkcji zapisana jako cyfry miesiaca i roku, np. 07 21 = lipiec 2021, uzywany do lipca 2026.",
  "q": {
    "mcq": {
      "prompt": "Przez ile lat od daty produkcji mozna uzywac DPPL?",
      "options": ["2,5 roku", "5 lat", "10 lat"],
      "correct": "5 lat"
    },
    "fill": {
      "prompt": "Po ___ roku (liczba) od produkcji opakowania powinno byc przeprowadzone badanie.",
      "correct": "2,5",
      "hint": "liczba z przecinkiem"
    }
  }
}, {
  "id": "b2-kod-opakowania-xyz",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 6.1.2",
  "source": "kompendium",
  "page": 8,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Litera na drugim miejscu kodu opakowania wskazuje, dla ktorej grupy pakowania moze byc uzyte: X — dla I, II, III GP; Y — dla II, III GP; Z — tylko dla III GP.",
  "q": {
    "match": {
      "prompt": "Dopasuj litere kodu opakowania do grup pakowania:",
      "pairs": {
        "X": "I, II, III GP",
        "Y": "II, III GP",
        "Z": "III GP"
      }
    },
    "mcq": {
      "prompt": "Opakowanie z litera Y moze byc uzyte dla grup pakowania:",
      "options": ["Tylko I", "II i III", "Wszystkich"],
      "correct": "II i III"
    }
  }
}, {
  "id": "b2-pietrowanie",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 6.5.2.2.2",
  "source": "kompendium",
  "page": 8,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Pietrowanie towarow niebezpiecznych jest dopuszczone, jesli odpowiednie oznakowanie na opakowaniu wskazuje na taka mozliwosc (rys. 6.5.2.2.2.1 — DPPL przeznaczony do spietrzania, z podanym max obciazeniem w kg; rys. 6.5.2.2.2.2 — DPPL NIE przeznaczony do spietrzania).",
  "q": {
    "mcq": {
      "prompt": "Czy mozna pietrowac DPPL?",
      "options": ["Zawsze", "Tylko jesli oznakowanie na opakowaniu na to wskazuje", "Nigdy"],
      "correct": "Tylko jesli oznakowanie na opakowaniu na to wskazuje"
    }
  }
}, {
  "id": "b3-znak-srodowisko",
  "block": 3,
  "topic": "Materialy zagrazajace srodowisku",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.2.1.8.1",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Znak wymagany dla materialow zagrazajacych srodowisku (ryba i drzewo). Umieszcza sie go na opakowaniach wiekszych niz 5 kg lub 5 litrow. Zagrozenie w przypadku przedostania sie do srodowiska wodnego lub kanalizacji.",
  "q": {
    "mcq": {
      "prompt": "Znak \"ryba i drzewo\" umieszcza sie na opakowaniach wiekszych niz:",
      "options": ["1 kg lub 1 litr", "5 kg lub 5 litrow", "30 kg lub 30 litrow"],
      "correct": "5 kg lub 5 litrow"
    },
    "fill": {
      "prompt": "Znak materialu zagrazajacego srodowisku przedstawia rybe i ___.",
      "correct": "drzewo",
      "hint": "roslina"
    }
  }
}, {
  "id": "b3-un-srodowisko",
  "block": 3,
  "topic": "Materialy zagrazajace srodowisku",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 3.2.1",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Material zagrazajacy srodowisku: stan staly UN 3077, stan ciekly UN 3082. Naleza do klasy 9.",
  "q": {
    "match": {
      "prompt": "Dopasuj stan skupienia do numeru UN:",
      "pairs": {
        "Staly": "UN 3077",
        "Ciekly": "UN 3082"
      }
    }
  }
}, {
  "id": "b3-znak-temperatura",
  "block": 3,
  "topic": "Materialy zagrazajace srodowisku",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.2.1.8.1",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Znak dla towarow w podwyzszonej temperaturze (czerwony trojkat z termometrem): materialy stale powyzej 240 st. C, ciekle powyzej 100 st. C. Zagrozenie poparzeniem. Wskazowka: unikac kontaktu z goracymi czesciami jednostki transportowej i z uwolnionym materialem.",
  "q": {
    "mcq": {
      "prompt": "Znak z termometrem w czerwonym trojkacie oznacza:",
      "options": ["Material zagrazajacy srodowisku", "Material w podwyzszonej temperaturze", "Material promieniotworczy"],
      "correct": "Material w podwyzszonej temperaturze"
    }
  }
}, {
  "id": "b3-odpady-dokument",
  "block": 3,
  "topic": "Odpady",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1.1.3",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Slowo ODPAD powinno sie znalezc po numerze UN, np. UN 1230 odpad metanol 3 (6.1) II, (D/E).",
  "q": {
    "mcq": {
      "prompt": "Gdzie w dokumencie przewozowym umieszcza sie slowo ODPAD?",
      "options": ["Na koncu zapisu", "Po numerze UN, przed nazwa", "W osobnej rubryce"],
      "correct": "Po numerze UN, przed nazwa"
    },
    "scenario": {
      "prompt": "Prawidlowy zapis odpadu w dokumencie to:",
      "options": ["UN 1230 metanol odpad", "UN 1230 odpad metanol 3 (6.1) II, (D/E)", "odpad UN 1230 metanol"],
      "correct": "UN 1230 odpad metanol 3 (6.1) II, (D/E)"
    }
  }
}, {
  "id": "b3-odpady-tablica",
  "block": 3,
  "topic": "Odpady",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "przepisy krajowe",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Oznakowanie pojazdow przewozacych ODPADY w Polsce zawiera tylko jedna tablice ODPADY 30 x 40 cm z przodu pojazdu. NIE jest wymagane przy przewozie odpadow sklasyfikowanych jako ADR. W transporcie miedzynarodowym odpadow sklasyfikowanych jako ADR uzywamy oznakowania ADR i \"A\" z przodu i z tylu jednostki (Niemcy, Austria, Czechy).",
  "q": {
    "mcq": {
      "prompt": "Tablica ODPADY w Polsce ma wymiary i umieszczenie:",
      "options": ["30 x 40 cm, z przodu pojazdu", "40 x 30 cm, z tylu", "30 x 40 cm, z obu stron"],
      "correct": "30 x 40 cm, z przodu pojazdu"
    },
    "match": {
      "prompt": "Dopasuj oznakowanie odpadow:",
      "pairs": {
        "Polska": "tablica ODPADY 30x40 z przodu",
        "Niemcy, Austria, Czechy": "znak \"A\" z przodu i tylu"
      }
    }
  }
}, {
  "id": "b3-wyciek-srodowisko",
  "block": 3,
  "topic": "Reakcja na wyciek",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Jezeli jest to wlasciwe i bezpieczne, zapobiec przedostaniu sie uwolnionych materialow do srodowiska wodnego lub kanalizacji oraz zebrac uwolnione materialy, uzywajac wyposazenia przewozonego w jednostce transportowej (osłona otworow kanalizacyjnych, lopata, pojemnik).",
  "q": {
    "scenario": {
      "prompt": "Wyciek plynu w poblizu studzienki kanalizacyjnej. Pierwsza reakcja:",
      "options": ["Splukac woda do kanalizacji", "Uzyc oslony otworow kanalizacyjnych i zebrac material", "Zostawic do wyschniecia"],
      "correct": "Uzyc oslony otworow kanalizacyjnych i zebrac material"
    }
  }
}, {
  "id": "b4-gasnice-liczba",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.4",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Minimalna liczba gasnic na jednostce transportowej wynosi 2 — niezaleznie od dopuszczalnej masy calkowitej. Jedna gasnica 12 kg NIE wystarczy: zawsze musza byc co najmniej dwie.",
  "q": {
    "mcq": {
      "prompt": "Minimalna liczba gasnic na jednostce transportowej z towarem ADR wynosi:",
      "options": ["1", "2", "3"],
      "correct": "2"
    },
    "scenario": {
      "prompt": "Masz jedna gasnice 12 kg na zestawie 40 t. Czy to spelnia wymog?",
      "options": ["Tak, pojemnosc sie zgadza", "Nie — musza byc minimum 2 gasnice", "Tak, jesli ma aktualny przeglad"],
      "correct": "Nie — musza byc minimum 2 gasnice"
    }
  }
}, {
  "id": "b4-gasnice-pojemnosc",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.4",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match", "scenario"],
  "why": "Minimalna calkowita pojemnosc gasnic wg dopuszczalnej masy calkowitej jednostki transportowej: do 3,5 t = 4 kg; powyzej 3,5 do 7,5 t = 8 kg; powyzej 7,5 t = 12 kg. Gasnice musza byc typu ABC.",
  "q": {
    "mcq": {
      "prompt": "Min. laczna pojemnosc gasnic dla jednostki powyzej 7,5 t:",
      "options": ["4 kg", "8 kg", "12 kg"],
      "correct": "12 kg"
    },
    "match": {
      "prompt": "Dopasuj mase jednostki do min. lacznej pojemnosci gasnic:",
      "pairs": {
        "do 3,5 t": "4 kg",
        "3,5-7,5 t": "8 kg",
        "powyzej 7,5 t": "12 kg"
      }
    },
    "scenario": {
      "prompt": "Zestaw 40 t z towarem ADR. Min. laczna pojemnosc gasnic:",
      "options": ["8 kg", "12 kg", "6 kg"],
      "correct": "12 kg"
    }
  }
}, {
  "id": "b4-gasnice-rozklad",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.4.1",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Rozklad gasnic: co najmniej jedna gasnica do gaszenia pozaru silnika lub kabiny o minimalnej pojemnosci 2 kg (dla kazdej kategorii masy). Wymagana gasnica dodatkowa: min. 2 kg dla jednostki do 3,5 t; min. 6 kg dla jednostki powyzej 3,5 t.",
  "q": {
    "match": {
      "prompt": "Dopasuj mase jednostki do min. pojemnosci gasnicy DODATKOWEJ:",
      "pairs": {
        "do 3,5 t": "2 kg",
        "powyzej 3,5 t": "6 kg"
      }
    },
    "mcq": {
      "prompt": "Gasnica do gaszenia pozaru silnika lub kabiny musi miec min. pojemnosc:",
      "options": ["2 kg", "6 kg", "12 kg"],
      "correct": "2 kg"
    }
  }
}, {
  "id": "b4-gasnice-s3",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR przepis S3",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Zgodnie z przepisem S3 dla towarow klasy 6.2 (zakazne) niezaleznie od DMC pojazdu wystarczy gasnica 2 kg typu ABC, a latarka moze byc o dowolnej konstrukcji.",
  "q": {
    "mcq": {
      "prompt": "Dla towarow klasy 6.2 (zakazne) wg przepisu S3 wystarczy gasnica:",
      "options": ["2 kg ABC niezaleznie od DMC", "12 kg", "6 kg"],
      "correct": "2 kg ABC niezaleznie od DMC"
    },
    "scenario": {
      "prompt": "Wieziesz odpady medyczne (6.2) zestawem 20 t. Ile gasnicy potrzebujesz wg S3?",
      "options": ["12 kg jak dla kazdego zestawu", "Wystarczy 2 kg ABC", "8 kg"],
      "correct": "Wystarczy 2 kg ABC"
    }
  }
}, {
  "id": "b4-wyposazenie-jednostka",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Wyposazenie na jednostke transportowa: klin pod kola dla KAZDEGO pojazdu (o rozmiarze odpowiednim do DMC i srednicy kol), dwa stojace znaki ostrzegawcze, plyn do plukania oczu.",
  "q": {
    "mcq": {
      "prompt": "Ile stojacych znakow ostrzegawczych wymaganych na jednostce transportowej?",
      "options": ["Jeden", "Dwa", "Cztery"],
      "correct": "Dwa"
    },
    "match": {
      "prompt": "Przypisz wyposazenie do zakresu:",
      "pairs": {
        "Klin pod kola": "dla kazdego pojazdu",
        "Dwa znaki ostrzegawcze": "na jednostke transportowa"
      }
    }
  }
}, {
  "id": "b4-plyn-do-oczu",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5.2",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Plyn do plukania oczu NIE jest wymagany przy nalepkach 1, 1.4, 1.5, 1.6, 2.1, 2.2 i 2.3. Plyn to tylko 1 sztuka w pojezdzie, niezaleznie od ilosci czlonkow zalogi.",
  "q": {
    "mcq": {
      "prompt": "Ile plynu do plukania oczu musi byc w pojezdzie?",
      "options": ["Jedna sztuka niezaleznie od liczby zalogi", "Po jednej na kazdego czlonka zalogi", "Dwie sztuki"],
      "correct": "Jedna sztuka niezaleznie od liczby zalogi"
    },
    "scenario": {
      "prompt": "Przewozisz gazy palne (2.1). Czy potrzebujesz plynu do plukania oczu?",
      "options": ["Tak, zawsze", "Nie — przy nalepkach 2.1 nie jest wymagany", "Tylko przy cysternie"],
      "correct": "Nie — przy nalepkach 2.1 nie jest wymagany"
    }
  }
}, {
  "id": "b4-wyposazenie-zaloga",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5.2",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Dla KAZDEGO czlonka zalogi pojazdu: kamizelka ostrzegawcza, przenosne urzadzenie oswietleniowe (latarka), para rekawic ochronnych, ochrona oczu (okulary).",
  "q": {
    "mcq": {
      "prompt": "Kamizelka ostrzegawcza, latarka, rekawice i okulary przypadaja:",
      "options": ["Jedna sztuka na pojazd", "Na kazdego czlonka zalogi", "Tylko dla kierowcy"],
      "correct": "Na kazdego czlonka zalogi"
    },
    "match": {
      "prompt": "Przypisz wyposazenie do zakresu:",
      "pairs": {
        "Kamizelka ostrzegawcza": "na kazdego czlonka zalogi",
        "Plyn do plukania oczu": "jedna sztuka na pojazd",
        "Klin pod kola": "dla kazdego pojazdu"
      }
    }
  }
}, {
  "id": "b4-maska-ucieczkowa",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5.3",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Maska ucieczkowa dla KAZDEGO czlonka zalogi pojazdu powinna byc przewozona w jednostce transportowej w przypadku nalepek ostrzegawczych 2.3 lub 6.1.",
  "q": {
    "mcq": {
      "prompt": "Maska ucieczkowa wymagana jest przy nalepkach:",
      "options": ["3 i 8", "2.3 lub 6.1", "4.1 i 9"],
      "correct": "2.3 lub 6.1"
    },
    "scenario": {
      "prompt": "Przewozisz gaz trujacy (2.3), zaloga 2 osoby. Ile masek ucieczkowych?",
      "options": ["Jedna", "Dwie — na kazdego czlonka zalogi", "Zadna"],
      "correct": "Dwie — na kazdego czlonka zalogi"
    }
  }
}, {
  "id": "b4-lopata-oslona",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5.3",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Lopata, oslona otworow kanalizacyjnych i pojemnik do zbierania pozostalosci sa wymagane TYLKO dla nalepek 3, 4.1, 4.3, 8 lub 9. Niezaleznie od ilosci czlonkow zalogi — tylko 1 sztuka w pojezdzie.",
  "q": {
    "mcq": {
      "prompt": "Lopata, oslona kanalizacji i pojemnik wymagane sa przy nalepkach:",
      "options": ["2.3 i 6.1", "3, 4.1, 4.3, 8 lub 9", "Wszystkich"],
      "correct": "3, 4.1, 4.3, 8 lub 9"
    },
    "scenario": {
      "prompt": "Zaloga 2 osoby, przewoz klasy 3. Ile lopat?",
      "options": ["Dwie", "Jedna — niezaleznie od liczby zalogi", "Zadna"],
      "correct": "Jedna — niezaleznie od liczby zalogi"
    }
  }
}, {
  "id": "b4-instrukcje-kto",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Za instrukcje pisemne odpowiedzialny jest PRZEWOZNIK. Instrukcje sa zgodne ze wzorem zawartym w umowie ADR i uniwersalne — dla kazdego produktu takie same. Nalezy sie z nimi zapoznac przed rozpoczeciem transportu.",
  "q": {
    "mcq": {
      "prompt": "Kto odpowiada za instrukcje pisemne?",
      "options": ["Nadawca", "Przewoznik", "Kierowca"],
      "correct": "Przewoznik"
    },
    "scenario": {
      "prompt": "Instrukcje pisemne dla przewozu benzyny i dla przewozu kwasu sa:",
      "options": ["Rozne", "Takie same — wzor uniwersalny", "Zalezne od nadawcy"],
      "correct": "Takie same — wzor uniwersalny"
    }
  }
}, {
  "id": "b4-instrukcje-forma",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Instrukcje pisemne zawieraja: sprzet ochrony ogolnej i indywidualnej, czynnosci w razie wypadku lub awarii, charakterystyke zagrozen, wzory nalepek. Musza byc dostepne w jezyku zrozumialym dla zalogi, przechowywane w kabinie kierowcy w latwo dostepnym miejscu, wydrukowane W KOLORZE. Po zakonczeniu transportu powinny pozostac w pojezdzie. Wymagane tylko na \"otwartych tablicach\".",
  "q": {
    "mcq": {
      "prompt": "Instrukcje pisemne musza byc wydrukowane:",
      "options": ["Czarno-bialo", "W kolorze", "Dowolnie"],
      "correct": "W kolorze"
    },
    "match": {
      "prompt": "Dopasuj zawartosc instrukcji pisemnej:",
      "pairs": {
        "Sprzet ochrony": "wyposazenie 8.1.5",
        "Czynnosci w razie wypadku": "procedura awaryjna",
        "Wzory nalepek": "charakterystyka zagrozen"
      }
    }
  }
}, {
  "id": "b4-dokument-kto",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Za dokument przewozowy odpowiedzialny jest NADAWCA. Dokument powinien byc sporzadzony w jezyku kraju nadania, a w transporcie miedzynarodowym rowniez w jezyku angielskim lub niemieckim lub francuskim. Nie musi byc sporzadzony pismem maszynowym ani wydrukowany.",
  "q": {
    "mcq": {
      "prompt": "Kto odpowiada za dokument przewozowy?",
      "options": ["Przewoznik", "Nadawca", "Kierowca"],
      "correct": "Nadawca"
    }
  }
}, {
  "id": "b4-dokument-jezyk",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1.4.1",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Dokument przewozowy sporzadza sie w jezyku kraju nadania, a w transporcie miedzynarodowym rowniez w jezyku angielskim lub niemieckim lub francuskim. Dokument przewozowy nalezy przechowywac 3 miesiace.",
  "q": {
    "mcq": {
      "prompt": "W transporcie miedzynarodowym dokument przewozowy sporzadza sie dodatkowo w jezyku:",
      "options": ["Tylko angielskim", "Angielskim lub niemieckim lub francuskim", "Dowolnym"],
      "correct": "Angielskim lub niemieckim lub francuskim"
    },
    "fill": {
      "prompt": "Dokument przewozowy nalezy przechowywac ___ miesiace.",
      "correct": "3",
      "hint": "liczba"
    }
  }
}, {
  "id": "b4-dokument-zawartosc",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1.1.1",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["order", "scenario"],
  "why": "Kolejnosc zapisu w dokumencie przewozowym: numer UN, prawidlowa nazwa przewozowa, numery nalepek, grupa pakowania (GP), kod tunelu. Przyklad: UN 1203 Benzyna Silnikowa zagrazajacy srodowisku, 3, II, (D/E).",
  "q": {
    "order": {
      "prompt": "Ulóz kolejnosc zapisu w dokumencie przewozowym:",
      "items": ["Numery nalepek", "Numer UN", "Prawidlowa nazwa przewozowa", "Grupa pakowania"],
      "correct": ["Numer UN", "Prawidlowa nazwa przewozowa", "Numery nalepek", "Grupa pakowania"]
    },
    "scenario": {
      "prompt": "W dokumencie: UN 1580 CHLOROPIKRYNA 6.1 GP I. Co to mowi kierowcy?",
      "options": ["Material zapalny, male zagrozenie", "Material trujacy, silnie (I grupa pakowania)", "Gaz duszacy"],
      "correct": "Material trujacy, silnie (I grupa pakowania)"
    }
  }
}, {
  "id": "b4-dokument-zapisy",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1.1",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Zapisy specjalne w dokumencie: \"Przewoz zgodny z 1.1.4.2.1\" — przewoz multimodalny; \"ODPAD\" po numerze UN; \"prozny DPPL, 8\" — prozne opakowania z numerem nalepki; \"GORACY\" gdy nazwa nie zawiera PODWYZSZONA TEMPERATURA lub STOPIONY; \"ZAGRAZAJACY SRODOWISKU\" gdy spelnia kryteria (nie stosuje sie do UN 3077 i UN 3082).",
  "q": {
    "match": {
      "prompt": "Dopasuj zapis w dokumencie do sytuacji:",
      "pairs": {
        "Przewoz zgodny z 1.1.4.2.1": "przewoz multimodalny",
        "prozny DPPL, 8": "prozne opakowanie",
        "GORACY": "material w podwyzszonej temperaturze"
      }
    }
  }
}, {
  "id": "b4-swiadectwo",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 9.1.3",
  "source": "kompendium",
  "page": 15,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Swiadectwo dopuszczenia (tzw. \"czerwony pasek\") wymagane jest przy przewozie towarow klasy 1 (pojazdy EX/II, EX/III) oraz w cysternach (pojazdy FL, AT) i MEMU. Potwierdza specjalna konstrukcje pojazdu. Wydawany w Polsce przez TDT na maksymalny okres JEDNEGO ROKU. Pojazdy przewozace sztuki przesylki (poza wybuchowymi) i luzem NIE musza miec swiadectwa — np. butle z gazem, DPPL, kanistry.",
  "q": {
    "mcq": {
      "prompt": "Swiadectwo dopuszczenia pojazdu wydawane jest na maksymalny okres:",
      "options": ["1 roku", "5 lat", "Bezterminowo"],
      "correct": "1 roku"
    },
    "scenario": {
      "prompt": "Przewozisz butle z gazem i kanistry (sztuki przesylki). Czy pojazd potrzebuje \"czerwonego paska\"?",
      "options": ["Tak, zawsze przy ADR", "Nie — sztuki przesylki poza klasa 1 nie wymagaja swiadectwa", "Tylko powyzej 3,5 t"],
      "correct": "Nie — sztuki przesylki poza klasa 1 nie wymagaja swiadectwa"
    }
  }
}, {
  "id": "b4-swiadectwo-typy",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 9.1.1.2",
  "source": "kompendium",
  "page": 15,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Oznaczenia pojazdow wymagajacych swiadectwa: EX/II i EX/III — przewoz klasy 1 (wybuchowe); FL i AT — cysterny; MEMU — mobilna jednostka do wytwarzania materialow wybuchowych.",
  "q": {
    "match": {
      "prompt": "Dopasuj oznaczenie pojazdu do zastosowania:",
      "pairs": {
        "EX/II, EX/III": "przewoz klasy 1 (wybuchowe)",
        "FL, AT": "cysterny",
        "MEMU": "mobilna jednostka wytwarzania wybuchowych"
      }
    }
  }
}, {
  "id": "b4-certyfikat-pakowania",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.2",
  "source": "kompendium",
  "page": 14,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Certyfikat pakowania kontenera/pojazdu wymagany jest przed zaladunkiem, ktory poprzedza przewoz MORSKI. Moze byc elementem dokumentu MULTIMODAL DANGEROUS GOODS FORM lub DGN.",
  "q": {
    "mcq": {
      "prompt": "Certyfikat pakowania kontenera wymagany jest przed przewozem:",
      "options": ["Drogowym", "Morskim", "Kolejowym"],
      "correct": "Morskim"
    }
  }
}, {
  "id": "b4-sprawozdanie-roczne",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 1.8.3.6",
  "source": "kompendium",
  "page": 15,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "fill"],
  "why": "Kazda firma ladujaca, przewozaca, rozladowujaca towary niebezpieczne musi wyznaczyc doradce DGSA. Sporzadza on sprawozdanie roczne do ITD, skladane do 28 lutego za poprzedni rok. Za niezlozenie sprawozdania kara wynosi 5000 PLN.",
  "q": {
    "mcq": {
      "prompt": "Do kiedy sklada sie sprawozdanie roczne do ITD?",
      "options": ["Do 31 stycznia", "Do 28 lutego", "Do 31 marca"],
      "correct": "Do 28 lutego"
    },
    "fill": {
      "prompt": "Kara za niezlozenie sprawozdania rocznego wynosi ___ PLN.",
      "correct": "5000",
      "hint": "liczba"
    }
  }
}, {
  "id": "b4-oznakowanie-sztuki-pojazd",
  "block": 4,
  "topic": "Oznakowanie pojazdu w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Jednostki przewozace towary niebezpieczne w SZTUKACH PRZESYLKI (np. butle gazowe, DPPL, kanistry, BIG-BAGi) powinny byc oznakowane WYLACZNIE tablicami BEZ numerow z przodu i tylu pojazdu. NIE stosujemy w takim przypadku nalepek.",
  "q": {
    "mcq": {
      "prompt": "Pojazd przewozacy towary w sztukach przesylki oznakowuje sie:",
      "options": ["Tablicami z numerami", "Tablicami bez numerow z przodu i tylu", "Nalepkami z trzech stron"],
      "correct": "Tablicami bez numerow z przodu i tylu"
    },
    "scenario": {
      "prompt": "Wieziesz kanistry z farba (sztuki przesylki). Czy umieszczasz nalepki na pojezdzie?",
      "options": ["Tak, z obu bokow", "Nie — przy sztukach przesylki nalepek nie stosujemy", "Tak, z tylu"],
      "correct": "Nie — przy sztukach przesylki nalepek nie stosujemy"
    }
  }
}, {
  "id": "b4-oznakowanie-luzem-cysterna",
  "block": 4,
  "topic": "Oznakowanie pojazdu w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.1 / 5.3.2",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Jednostki przewozace towary LUZEM lub W CYSTERNIE powinny byc oznakowane tablicami Z NUMERAMI z przodu i tylu jednostki transportowej oraz nalepkami z TRZECH stron — z obu bokow oraz z tylu.",
  "q": {
    "mcq": {
      "prompt": "Pojazd przewozacy towar luzem lub w cysternie oznakowuje sie nalepkami:",
      "options": ["Z dwoch stron", "Z trzech stron — oba boki i tyl", "Z czterech stron"],
      "correct": "Z trzech stron — oba boki i tyl"
    },
    "scenario": {
      "prompt": "Cysterna z olejem napedowym. Gdzie tablice z numerami?",
      "options": ["Tylko z przodu", "Z przodu i tylu jednostki", "Na bokach"],
      "correct": "Z przodu i tylu jednostki"
    }
  }
}, {
  "id": "b4-oznakowanie-wariant2",
  "block": 4,
  "topic": "Oznakowanie pojazdu w praktyce",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.1.2",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Drugi sposob oznakowania jednostki przewozacej jeden ladunek luzem lub w cysternie: tablice BEZ numerow z przodu i tylu pojazdu oraz tablice Z NUMERAMI na obu bokach. Nalepki ostrzegawcze musza byc umieszczone z obu bokow i z tylu pojazdu.",
  "q": {
    "mcq": {
      "prompt": "W wariancie drugim oznakowania cysterny tablice z numerami umieszcza sie:",
      "options": ["Z przodu i tylu", "Na obu bokach", "Tylko z tylu"],
      "correct": "Na obu bokach"
    }
  }
}, {
  "id": "b4-kontener-cysterna",
  "block": 4,
  "topic": "Oznakowanie pojazdu w praktyce",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.1.3",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Kontener-cysterna powinien byc oznakowany nalepkami ostrzegawczymi z 4 stron.",
  "q": {
    "mcq": {
      "prompt": "Kontener-cysterna oznakowany jest nalepkami z:",
      "options": ["2 stron", "3 stron", "4 stron"],
      "correct": "4 stron"
    }
  }
}, {
  "id": "b4-cysterna-wielokomorowa",
  "block": 4,
  "topic": "Oznakowanie pojazdu w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.1.3",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Dla numerow UN 1202, UN 1203, UN 1223, UN 1268, UN 1863 mozna oznakowac cysterne wielokomorowa tak, jakby wiozla jeden produkt — najniebezpieczniejszy z przewozonych.",
  "q": {
    "mcq": {
      "prompt": "Cysterne wielokomorowa z UN 1202 i UN 1203 mozna oznakowac:",
      "options": ["Osobno kazda komore", "Jak jeden produkt — najniebezpieczniejszy z przewozonych", "Bez tablic"],
      "correct": "Jak jeden produkt — najniebezpieczniejszy z przewozonych"
    },
    "scenario": {
      "prompt": "Cysterna wielokomorowa: olej napedowy (UN 1202) i benzyna (UN 1203). Jakie oznakowanie?",
      "options": ["Dwie rozne tablice", "Tablica dla benzyny — najniebezpieczniejszej", "Tablica dla oleju"],
      "correct": "Tablica dla benzyny — najniebezpieczniejszej"
    }
  }
}, {
  "id": "b4-segregacja-zakazy",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 7.5.2.1",
  "source": "kompendium",
  "page": 25,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Zakazy ladowania razem do jednego pojazdu lub kontenera zawarte sa w przepisie 7.5.2.1. W uproszczeniu dotycza towarow klasy 1 (wybuchowe), 4.1 + 1 (samoreaktywne) oraz 5.2 + 1 (nadtlenki organiczne) o wlasciwosciach wybuchowych.",
  "q": {
    "mcq": {
      "prompt": "Zakazy ladowania razem dotycza w uproszczeniu:",
      "options": ["Wszystkich klas", "Klasy 1, 4.1+1 i 5.2+1 o wlasciwosciach wybuchowych", "Tylko klas 6 i 8"],
      "correct": "Klasy 1, 4.1+1 i 5.2+1 o wlasciwosciach wybuchowych"
    },
    "scenario": {
      "prompt": "Chcesz zaladowac razem klase 3 i klase 8. Czy wolno?",
      "options": ["Nie, zawsze zabronione", "Tak — ladowanie razem tych klas jest dozwolone", "Tylko w cysternie"],
      "correct": "Tak — ladowanie razem tych klas jest dozwolone"
    }
  }
}, {
  "id": "b4-cv28-zywnosc",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 7.5.4 / CV28",
  "source": "kompendium",
  "page": 24,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match", "scenario"],
  "why": "Jezeli w kolumnie 18 tabeli wskazany jest przepis szczegolny CV28, towar nalezy oddzielic od zywnosci lub karmy dla zwierzat: (a) ciaglymi przegrodami o wysokosci nie mniejszej niz sztuki przesylek oznaczone nalepkami 6.1, 6.2, 9; (b) sztukami przesylek, ktore NIE sa zaopatrzone w nalepki 6.1, 6.2, 9; (c) wolna przestrzenia o szerokosci nie mniej niz 0,8 m lub przez calkowite przykrycie (plandeka, pokrywa z tektury). Dotyczy UN 2212, 2315, 2590, 3151, 3152, 3245.",
  "q": {
    "mcq": {
      "prompt": "Minimalna szerokosc wolnej przestrzeni oddzielajacej towar od zywnosci (CV28):",
      "options": ["0,5 m", "0,8 m", "1,2 m"],
      "correct": "0,8 m"
    },
    "match": {
      "prompt": "Dopasuj sposob oddzielenia od zywnosci wg CV28:",
      "pairs": {
        "Ciagle przegrody": "wysokosc nie mniejsza niz sztuki przesylek",
        "Wolna przestrzen": "min. 0,8 m",
        "Calkowite przykrycie": "plandeka lub pokrywa"
      }
    },
    "scenario": {
      "prompt": "Przewozisz UN 2212 (azbest) i artykuly spozywcze. Co robisz?",
      "options": ["Laduje razem bez ograniczen", "Oddzielam wg CV28 — przegroda lub 0,8 m wolnej przestrzeni", "Odmawiam przewozu"],
      "correct": "Oddzielam wg CV28 — przegroda lub 0,8 m wolnej przestrzeni"
    }
  }
}, {
  "id": "b4-cv3-cv15",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR CV3 / CV15",
  "source": "kompendium",
  "page": 24,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Przepisy dotyczace manipulowania i ukladania wprowadzaja ograniczenie masy ladunku na jednostke transportowa (na \"otwartych tablicach\"). Dotyczy towarow klasy 1, 4.1, 5.2 (samoreaktywne, nadtlenki organiczne typu B, C, D, E, F), ktore maja wlasciwosci wybuchowe. Ograniczenia zawarte w przepisach CV3 i CV15.",
  "q": {
    "mcq": {
      "prompt": "Ograniczenie masy ladunku na jednostke transportowa zawieraja przepisy:",
      "options": ["CV2 i CV28", "CV3 i CV15", "S1 i S3"],
      "correct": "CV3 i CV15"
    }
  }
}, {
  "id": "b4-cv2-plomien",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR CV2 / 7.5.11",
  "source": "kompendium",
  "page": 24,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Przed dokonaniem zaladunku powierzchnia ladunkowa pojazdu lub kontenera powinna zostac dokladnie oczyszczona. Zabrania sie uzywania otwartego plomienia wewnatrz pojazdu lub kontenera oraz w ich poblizu, a takze podczas zaladunku i rozladunku (przepis szczegolny CV2 — 7.5.11).",
  "q": {
    "mcq": {
      "prompt": "Przed zaladunkiem powierzchnia ladunkowa powinna byc:",
      "options": ["Sucha", "Dokladnie oczyszczona", "Wylozona folia"],
      "correct": "Dokladnie oczyszczona"
    },
    "scenario": {
      "prompt": "Zaladunek towaru ADR. Czy mozna uzywac otwartego plomienia w poblizu pojazdu?",
      "options": ["Tak, poza kabina", "Nie — zakaz wg CV2", "Tylko przy klasie 9"],
      "correct": "Nie — zakaz wg CV2"
    }
  }
}, {
  "id": "b4-ladunek-calkowity",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 1.2.1",
  "source": "kompendium",
  "page": 24,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Ladunek calkowity oznacza ladunek pochodzacy od jednego nadawcy, majacego wylaczne prawo do uzywania pojazdu lub kontenera wielkiego, a wszystkie czynnosci zaladunkowe i rozladunkowe wykonywane sa zgodnie z instrukcjami nadawcy lub odbiorcy. W odniesieniu do materialow promieniotworczych odpowiednim okresleniem jest \"uzywanie wylaczne\".",
  "q": {
    "mcq": {
      "prompt": "W odniesieniu do materialow promieniotworczych \"ladunek calkowity\" nazywa sie:",
      "options": ["Przewoz dedykowany", "Uzywanie wylaczne", "Transport zamkniety"],
      "correct": "Uzywanie wylaczne"
    }
  }
}, {
  "id": "b4-pasazerowie",
  "block": 4,
  "topic": "Ruch drogowy i postoj",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.3.1",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "W pojezdzie \"na pelnym ADR\" nie wolno przewozic pasazerow, a jedynie czlonkow zalogi. Kazdy czlonek zalogi musi miec dokument tozsamosci.",
  "q": {
    "mcq": {
      "prompt": "Kogo wolno przewozic w pojezdzie na pelnym ADR?",
      "options": ["Dowolnych pasazerow", "Tylko czlonkow zalogi", "Pasazerow za zgoda nadawcy"],
      "correct": "Tylko czlonkow zalogi"
    }
  }
}, {
  "id": "b4-nadzor-parkingi",
  "block": 4,
  "topic": "Ruch drogowy i postoj",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.4 / S1(6), S14-S24",
  "source": "kompendium",
  "page": 22,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "order"],
  "why": "Pojazdy przewozace towary niebezpieczne w ilosciach podanych w przepisach specjalnych S1(6) i S14 do S24 powinny byc nadzorowane lub moga byc zaparkowane bez nadzoru na parkingach strzezonych lub strzezonych miejscach na terenie przedsiebiorstwa. W razie braku takich warunkow: (a) parking nadzorowany przez personel poinformowany o wlasciwosciach ladunku i miejscu pobytu kierowcy; (b) parking gdzie pojazd nie jest narazony na uszkodzenie; (c) miejsce na otwartym terenie, oddzielone od glownych drog i budynkow mieszkalnych.",
  "q": {
    "mcq": {
      "prompt": "Pojazd z towarami wg S1(6) i S14-S24 moze byc zaparkowany bez nadzoru:",
      "options": ["Na kazdym parkingu", "Na parkingu strzezonym lub strzezonym miejscu na terenie przedsiebiorstwa", "Tylko przy drodze"],
      "correct": "Na parkingu strzezonym lub strzezonym miejscu na terenie przedsiebiorstwa"
    },
    "order": {
      "prompt": "Ulóz alternatywy postoju wg kolejnosci z przepisow (a, b, c):",
      "items": ["Otwarty teren z dala od drog i budynkow", "Parking nadzorowany przez poinformowany personel", "Parking gdzie pojazd nie jest narazony na uszkodzenie"],
      "correct": ["Parking nadzorowany przez poinformowany personel", "Parking gdzie pojazd nie jest narazony na uszkodzenie", "Otwarty teren z dala od drog i budynkow"]
    }
  }
}, {
  "id": "b4-znak-b13a",
  "block": 4,
  "topic": "Ruch drogowy i postoj",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "znaki drogowe PL",
  "source": "kompendium",
  "page": 22,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Znak B-13a / C-3h oznacza zakaz wjazdu dla pojazdow przewozacych towary niebezpieczne WSZYSTKICH KLAS oznakowanych tablicami pomaranczowymi.",
  "q": {
    "mcq": {
      "prompt": "Znak B-13a zakazuje wjazdu pojazdom:",
      "options": ["Tylko z klasa 1", "Wszystkich klas oznakowanych tablicami pomaranczowymi", "Tylko cysternom"],
      "correct": "Wszystkich klas oznakowanych tablicami pomaranczowymi"
    }
  }
}, {
  "id": "b4-znak-b13",
  "block": 4,
  "topic": "Ruch drogowy i postoj",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "znaki drogowe PL",
  "source": "kompendium",
  "page": 22,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Znak B-13 oznacza zakaz wjazdu dla pojazdow przewozacych towary niebezpieczne klas: 1, gazy palne (2F), 3, 4.1, 4.2, 4.3, 5.1, 5.2 — czyli wszystkie nalepki z plomieniem.",
  "q": {
    "mcq": {
      "prompt": "Znak B-13 dotyczy towarow:",
      "options": ["Zagrazajacych srodowisku", "Z nalepkami z plomieniem (1, 2F, 3, 4.1, 4.2, 4.3, 5.1, 5.2)", "Trujacych"],
      "correct": "Z nalepkami z plomieniem (1, 2F, 3, 4.1, 4.2, 4.3, 5.1, 5.2)"
    },
    "scenario": {
      "prompt": "Wieziesz benzyne (klasa 3). Czy obowiazuje Cie znak B-13?",
      "options": ["Nie", "Tak — klasa 3 ma nalepke z plomieniem", "Tylko w cysternie"],
      "correct": "Tak — klasa 3 ma nalepke z plomieniem"
    }
  }
}, {
  "id": "b4-znak-b14",
  "block": 4,
  "topic": "Ruch drogowy i postoj",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "znaki drogowe PL",
  "source": "kompendium",
  "page": 22,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Znak B-14 oznacza zakaz wjazdu ze szkodliwymi dla srodowiska wodnego: gazy trujace, zrace, klasa 3, 4.3, 6.1, 6.2, 8, czesc klasy 9 + znak \"ryba\" (zagrazajacy srodowisku).",
  "q": {
    "mcq": {
      "prompt": "Znak B-14 dotyczy towarow:",
      "options": ["Z nalepkami z plomieniem", "Szkodliwych dla srodowiska wodnego", "Wybuchowych"],
      "correct": "Szkodliwych dla srodowiska wodnego"
    }
  }
}, {
  "id": "b4-znaki-pozostale",
  "block": 4,
  "topic": "Ruch drogowy i postoj",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "znaki drogowe PL",
  "source": "kompendium",
  "page": 22,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "D-37 — dozwolony wjazd z wszystkimi towarami niebezpiecznymi (tunel). C-17 — nakazany kierunek jazdy dla pojazdow przewozacych towary niebezpieczne. T-23i, T-23j, T-23h — tabliczki precyzujace rodzaj towaru.",
  "q": {
    "match": {
      "prompt": "Dopasuj znak do znaczenia:",
      "pairs": {
        "B-13a": "zakaz — wszystkie klasy z tablicami",
        "D-37": "dozwolony wjazd z wszystkimi towarami",
        "C-17": "nakazany kierunek jazdy"
      }
    }
  }
}, {
  "id": "b4-predkosc",
  "block": 4,
  "topic": "Ruch drogowy i postoj",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "przepisy krajowe",
  "source": "kompendium",
  "page": 22,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Dla przewozu towarow niebezpiecznych NIE obowiazuje podwyzszenie predkosci w terenie zabudowanym. Maksymalnie 50 km/h.",
  "q": {
    "mcq": {
      "prompt": "Maksymalna predkosc pojazdu z towarem ADR w terenie zabudowanym:",
      "options": ["50 km/h", "60 km/h", "70 km/h"],
      "correct": "50 km/h"
    },
    "scenario": {
      "prompt": "Teren zabudowany, znak dopuszcza 60 km/h. Wieziesz ADR. Ile mozesz jechac?",
      "options": ["60 km/h", "50 km/h — podwyzszenie nie obowiazuje przy ADR", "70 km/h"],
      "correct": "50 km/h — podwyzszenie nie obowiazuje przy ADR"
    }
  }
}, {
  "id": "b4-tunele-kod",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5 / kol. 15",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Kategoria tunelu podaje informacje, ktora umozliwia przewoznikowi (kierowcy) precyzyjne okreslenie kategorii tunelu, przez ktore NIE jest dozwolony przewoz konkretnego towaru. Podana jest pod znakiem B-13a w postaci litery B, C, D lub E.",
  "q": {
    "mcq": {
      "prompt": "Kategoria tunelu podana jest pod znakiem:",
      "options": ["B-13", "B-13a", "D-37"],
      "correct": "B-13a"
    }
  }
}, {
  "id": "b4-tunele-kategorie",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Kategorie tuneli: A — bez ograniczen (znak D-37, nieoznakowany), B, C, D, E — coraz bardziej restrykcyjne. Kod (B) = zagrazajace wybuchem o bardzo duzym zasiegu; (C) = wybuch o duzym zasiegu lub dzialanie trujace o duzym zasiegu; (D) = jw. lub duzy pozar; (E) = zakaz dla ilosci ograniczonych powyzej 8 t brutto.",
  "q": {
    "mcq": {
      "prompt": "Ktora kategoria tunelu jest najbardziej restrykcyjna?",
      "options": ["Kategoria A", "Kategoria C", "Kategoria E"],
      "correct": "Kategoria E"
    },
    "scenario": {
      "prompt": "Towar ma kod tunelowy (B). Przez ktore tunele mozesz przejechac?",
      "options": ["Wszystkie", "Tylko A (nieoznakowany / D-37)", "A, B i C"],
      "correct": "Tylko A (nieoznakowany / D-37)"
    }
  }
}, {
  "id": "b4-tunel-brak-kodu",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5 / kol. 15",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Do tunelu kategorii E moga wjezdzac pojazdy z towarami, ktore w kolumnie 15 tabeli A maja \"(-)\" — czyli brak kodu tunelowego. Naleza tu m.in. UN 2814, 2900, 2919, 3166, 3171, 3331, 3359, 3373, 3549.",
  "q": {
    "mcq": {
      "prompt": "Kod tunelowy \"(-)\" w kolumnie 15 oznacza:",
      "options": ["Zakaz wszystkich tuneli", "Brak ograniczen — mozna wjechac do kazdego tunelu", "Tylko tunel A"],
      "correct": "Brak ograniczen — mozna wjechac do kazdego tunelu"
    },
    "scenario": {
      "prompt": "Wieziesz UN 3373 (kod tunelowy \"-\"). Tunel kategorii E — wjezdzasz?",
      "options": ["Nie, zakaz", "Tak — kod \"(-)\" pozwala na kazdy tunel", "Tylko z eskorta"],
      "correct": "Tak — kod \"(-)\" pozwala na kazdy tunel"
    }
  }
}, {
  "id": "b4-tunel-zachowanie",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.6 / przepisy ruchu",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match", "scenario"],
  "why": "W tunelu ZAKAZUJE sie: palenia, uzywania okularow przeciwslonecznych, uzywania telefonu komorkowego i radia CB. W tunelu NALEZY: stosowac sie do znakow i sygnalow, sluchac komunikatow radiowych, wlaczyc swiatla mijania.",
  "q": {
    "mcq": {
      "prompt": "Czego NIE wolno robic w tunelu przewozac ADR?",
      "options": ["Wlaczac swiatel mijania", "Uzywac okularow przeciwslonecznych i telefonu", "Sluchac komunikatow radiowych"],
      "correct": "Uzywac okularow przeciwslonecznych i telefonu"
    },
    "match": {
      "prompt": "Dopasuj zachowanie w tunelu:",
      "pairs": {
        "Palenie": "zakazane",
        "Okulary przeciwsloneczne": "zakazane",
        "Swiatla mijania": "nakazane",
        "Komunikaty radiowe": "nakazane"
      }
    },
    "scenario": {
      "prompt": "Wjezdzasz do tunelu z ADR. Co robisz ze swiatlami?",
      "options": ["Gasze wszystkie", "Wlaczam swiatla mijania", "Wlaczam awaryjne"],
      "correct": "Wlaczam swiatla mijania"
    }
  }
}, {
  "id": "b4-austria-eskorta",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "wymogi krajowe",
  "source": "kompendium",
  "page": 24,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "W niektorych krajach wymaga sie dodatkowych wymogow, np. w Austrii jednostka transportowa powinna byc wyposazona w lampe o swietle pomaranczowym. Jednostki, ktorych oznakowanie na tablicy rozpoczyna sie od cyfry 2 lub zawierajace podwojne cyfry 3, 4, 5, 6, 8 lub poprzedzone litera X wymagaja eskorty podczas przejazdu przez tunele.",
  "q": {
    "mcq": {
      "prompt": "W Austrii jednostka transportowa z ADR powinna byc wyposazona w:",
      "options": ["Lampe o swietle pomaranczowym", "Radio CB", "Kamere cofania"],
      "correct": "Lampe o swietle pomaranczowym"
    }
  }
}, {
  "id": "b5-kolejnosc",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["order", "scenario"],
  "why": "Czynnosci wg instrukcji pisemnej: zahamowac pojazd, wylaczyc silnik i odlaczyc akumulator wylacznikiem glownym; unikac zrodel zaplonu (nie palic, nie uzywac e-papierosow, nie wlaczac urzadzen elektrycznych); powiadomic sluzby ratownicze; zalozyc kamizelke i ustawic stojace znaki ostrzegawcze; zapewnic ratownikom dostep do dokumentow; nie wchodzic na uwolnione materialy, pozostawac po stronie nawietrznej.",
  "q": {
    "order": {
      "prompt": "Ulóz kolejnosc dzialan po wypadku wg instrukcji pisemnej:",
      "items": ["Powiadomic sluzby ratownicze", "Zahamowac pojazd, wylaczyc silnik, odlaczyc akumulator", "Zalozyc kamizelke i ustawic znaki ostrzegawcze"],
      "correct": ["Zahamowac pojazd, wylaczyc silnik, odlaczyc akumulator", "Powiadomic sluzby ratownicze", "Zalozyc kamizelke i ustawic znaki ostrzegawcze"]
    },
    "scenario": {
      "prompt": "Wyciek z cysterny. Z ktorej strony sie ustawiasz?",
      "options": ["Po stronie nawietrznej", "Po stronie zawietrznej", "Bez znaczenia"],
      "correct": "Po stronie nawietrznej"
    }
  }
}, {
  "id": "b5-numery-alarmowe",
  "block": 5,
  "topic": "Powiadamianie sluzb",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "procedury krajowe",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Powiadamianie na numer 112 lub 999, 998 lub 997. Nalezy przekazac wszystkie dostepne informacje.",
  "q": {
    "mcq": {
      "prompt": "Numery alarmowe przy zdarzeniu z towarem niebezpiecznym:",
      "options": ["Tylko 112", "112 lub 999, 998, 997", "Tylko 998"],
      "correct": "112 lub 999, 998, 997"
    }
  }
}, {
  "id": "b5-kolejnosc-informacji",
  "block": 5,
  "topic": "Powiadamianie sluzb",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "procedury krajowe",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["order", "scenario"],
  "why": "Kolejnosc przekazywanych informacji: miejsce zdarzenia, rodzaj zdarzenia (wypadek, kolizja, wyciek), skutki zdarzenia, liczba ofiar, rozmiar zdarzenia (ile pojazdow, osob), numery UN przewozonego towaru, sposob jego przewozu (luzem, cysterna), ilosc towaru niebezpiecznego, czy nastapilo jego uwolnienie.",
  "q": {
    "order": {
      "prompt": "Ulóz kolejnosc informacji przekazywanych sluzbom:",
      "items": ["Numery UN przewozonego towaru", "Miejsce zdarzenia", "Rodzaj zdarzenia", "Liczba ofiar"],
      "correct": ["Miejsce zdarzenia", "Rodzaj zdarzenia", "Liczba ofiar", "Numery UN przewozonego towaru"]
    },
    "scenario": {
      "prompt": "Dzwonisz po sluzby. Od czego zaczynasz?",
      "options": ["Od numeru UN", "Od miejsca zdarzenia", "Od marki pojazdu"],
      "correct": "Od miejsca zdarzenia"
    }
  }
}, {
  "id": "b5-dokument-awaryjny",
  "block": 5,
  "topic": "Powiadamianie sluzb",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Najwazniejszym dokumentem w sytuacji awaryjnej jest DOKUMENT PRZEWOZOWY, poniewaz zawiera informacje na temat towaru i jego wlasciwosci.",
  "q": {
    "mcq": {
      "prompt": "Najwazniejszy dokument w sytuacji awaryjnej to:",
      "options": ["Instrukcja pisemna", "Dokument przewozowy", "Swiadectwo dopuszczenia"],
      "correct": "Dokument przewozowy"
    }
  }
}, {
  "id": "b5-gaszenie",
  "block": 5,
  "topic": "Gaszenie pozaru",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "mcq"],
  "why": "Jezeli jest to wlasciwe i bezpieczne, uzyc gasnic w celu ugaszenia malego lub bedacego w fazie poczatkowej pozaru, obejmujacego opony, hamulce lub przedzial silnika. Czlonkowie zalogi NIE powinni gasic pozaru obejmujacego przedzial ladunkowy. Nie gasimy ladunku.",
  "q": {
    "scenario": {
      "prompt": "Zapalila sie przestrzen ladunkowa z towarem niebezpiecznym. Twoje dzialanie:",
      "options": ["Gasze gasnica pokladowa", "Oddalam sie i wzywam straz — nie gasimy ladunku", "Otwieram ladunek"],
      "correct": "Oddalam sie i wzywam straz — nie gasimy ladunku"
    },
    "mcq": {
      "prompt": "Gasnica pokladowa kierowca moze gasic:",
      "options": ["Pozar przestrzeni ladunkowej", "Maly pozar opon, hamulcow lub silnika", "Kazdy pozar"],
      "correct": "Maly pozar opon, hamulcow lub silnika"
    }
  }
}, {
  "id": "b5-gasnica-parametry",
  "block": 5,
  "topic": "Gaszenie pozaru",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "praktyka gaszenia",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Strumien proszku kierujemy w zrodlo plomieni od strony nawietrznej. Czas wyladowania gasnicy 6 kg to okolo 10 s, a 2 kg to okolo 6 s. Zasieg gasnic to okolo 4 m.",
  "q": {
    "match": {
      "prompt": "Dopasuj gasnice do czasu wyladowania:",
      "pairs": {
        "Gasnica 6 kg": "okolo 10 s",
        "Gasnica 2 kg": "okolo 6 s"
      }
    },
    "mcq": {
      "prompt": "Zasieg gasnicy proszkowej wynosi okolo:",
      "options": ["1 m", "4 m", "10 m"],
      "correct": "4 m"
    }
  }
}, {
  "id": "b5-dgsa-zdarzenie",
  "block": 5,
  "topic": "Powiadamianie sluzb",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.8.5",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "O kazdym zdarzeniu nalezy poinformowac doradce DGSA w firmie w celu oceny, czy nie jest wymagane sporzadzenie raportu powypadkowego.",
  "q": {
    "mcq": {
      "prompt": "Kogo nalezy poinformowac o kazdym zdarzeniu z towarem niebezpiecznym?",
      "options": ["Tylko policje", "Doradce DGSA w firmie", "Nadawce"],
      "correct": "Doradce DGSA w firmie"
    },
    "scenario": {
      "prompt": "Doszlo do kolizji z niewielkim wyciekiem. Kto ocenia czy potrzebny raport powypadkowy?",
      "options": ["Kierowca", "Doradca DGSA", "Policja"],
      "correct": "Doradca DGSA"
    }
  }
}, {
  "id": "b5-mocowanie",
  "block": 5,
  "topic": "Mocowanie ladunku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 7.5.7",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Do mocowania ladunku uzywamy atestowanych pasow, burt przesuwanych, przegrod nastawnych, mat antyposlizgowych, konstrukcji pojazdu (punkty kotwiczenia) lub wypelnienia pustych przestrzeni. Sila dzialajaca na ladunek zmniejsza sie wraz ze wzrostem promienia zakretu. Ladunek ciekly w przypadku pietrowania nalezy umieszczac jak najnizej. Ladunek mozna pietrowac tylko jesli konstrukcja opakowania na to pozwala. Kat pasa maksymalnie 45 stopni.",
  "q": {
    "mcq": {
      "prompt": "Ladunek ciekly przy pietrowaniu nalezy umieszczac:",
      "options": ["Jak najwyzej", "Jak najnizej", "Na srodku"],
      "correct": "Jak najnizej"
    },
    "match": {
      "prompt": "Dopasuj element mocowania:",
      "pairs": {
        "Atestowane pasy": "mocowanie ladunku",
        "Maty antyposlizgowe": "zwiekszenie tarcia",
        "Wypelnienie pustych przestrzeni": "zapobiega przesuwaniu"
      }
    }
  }
}, {
  "id": "b5-pierwsza-pomoc",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Zdjac zanieczyszczone ubranie i uzyte zanieczyszczone wyposazenie ochronne oraz usunac je w sposob bezpieczny. Unikac wdychania oparow, dymu, pylu i pary poprzez pozostawanie po stronie nawietrznej. Nie wchodzic na uwolnione materialy i nie dotykac ich.",
  "q": {
    "mcq": {
      "prompt": "Co zrobic z zanieczyszczonym ubraniem po kontakcie z materialem?",
      "options": ["Wyprac", "Zdjac i usunac w sposob bezpieczny", "Zostawic na sobie"],
      "correct": "Zdjac i usunac w sposob bezpieczny"
    },
    "scenario": {
      "prompt": "Uwolniony material na jezdni. Twoje zachowanie:",
      "options": ["Sprawdzam co to, dotykajac", "Nie wchodze, nie dotykam, pozostaje po stronie nawietrznej", "Rozgarniam lopata"],
      "correct": "Nie wchodze, nie dotykam, pozostaje po stronie nawietrznej"
    }
  }
}, {
  "id": "b5-oznakowanie-miejsca",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5 / 5.4.3.4",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Zalozyc kamizelke ostrzegawcza i odpowiednio umiescic stojace znaki ostrzegawcze (dwa). Zapewnic przybylym ratownikom latwy dostep do dokumentow przewozowych.",
  "q": {
    "mcq": {
      "prompt": "Czym zabezpieczasz miejsce zdarzenia z wyposazenia ADR?",
      "options": ["Jednym znakiem", "Dwoma stojacymi znakami ostrzegawczymi", "Tylko swiatlami"],
      "correct": "Dwoma stojacymi znakami ostrzegawczymi"
    }
  }
}, {
  "id": "b5-zrodla-zaplonu",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Unikac zrodel zaplonu, w szczegolnosci nie palic, nie uzywac papierosow elektronicznych lub podobnych urzadzen oraz nie wlaczac zadnych urzadzen elektrycznych.",
  "q": {
    "mcq": {
      "prompt": "Po wypadku z towarem niebezpiecznym NIE wolno:",
      "options": ["Zakladac kamizelki", "Wlaczac urzadzen elektrycznych i uzywac e-papierosow", "Powiadamiac sluzb"],
      "correct": "Wlaczac urzadzen elektrycznych i uzywac e-papierosow"
    },
    "scenario": {
      "prompt": "Wyciek benzyny. Chcesz oswietlic miejsce telefonem. Czy mozna?",
      "options": ["Tak", "Nie — nie wlaczamy urzadzen elektrycznych", "Tylko latarka z wyposazenia"],
      "correct": "Nie — nie wlaczamy urzadzen elektrycznych"
    }
  }
}, {
  "id": "b5-wskazowki-klasy",
  "block": 5,
  "topic": "Wskazowki per klasa",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4 tabela",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Wskazowki dodatkowe z instrukcji pisemnej: klasa 1 — schronic sie i pozostac z dala od okien; 2.1/2.2/2.3 — schronic sie, unikac zaglebien terenu; 5.1/5.2 — nie dopuszczac do zmieszania z materialami zapalnymi lub palnymi (np. trocinami); 6.1 — uzyc maski ucieczkowej; 7 — ograniczyc czas narazenia; 4.3 — uwolniony material utrzymywac w stanie suchym, pod przykryciem.",
  "q": {
    "match": {
      "prompt": "Dopasuj klase do wskazowki z instrukcji pisemnej:",
      "pairs": {
        "Klasa 1": "schronic sie, z dala od okien",
        "Klasa 5.1": "nie mieszac z materialami palnymi",
        "Klasa 6.1": "uzyc maski ucieczkowej",
        "Klasa 7": "ograniczyc czas narazenia"
      }
    }
  }
}, {
  "id": "b5-fissile",
  "block": 5,
  "topic": "Wskazowki per klasa",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4 tabela",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Nalepka 7E (FISSILE — material rozszczepialny) oznacza zagrozenie reakcja lancuchowa.",
  "q": {
    "mcq": {
      "prompt": "Nalepka FISSILE (7E) oznacza zagrozenie:",
      "options": ["Napromieniowaniem zewnetrznym", "Reakcja lancuchowa", "Poparzeniem"],
      "correct": "Reakcja lancuchowa"
    }
  }
}, {
  "id": "b5-wiele-zagrozen",
  "block": 5,
  "topic": "Wskazowki per klasa",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4 uwaga 1",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "UWAGA 1 z instrukcji pisemnej: w przypadku towarow niebezpiecznych stwarzajacych wiecej niz jedno zagrozenie oraz ladunkow mieszanych, stosuje sie KAZDA z okreslonych dla nich wskazowek.",
  "q": {
    "mcq": {
      "prompt": "Towar stwarza wiecej niz jedno zagrozenie. Ktore wskazowki stosujesz?",
      "options": ["Tylko dla zagrozenia dominujacego", "Kazda z okreslonych wskazowek", "Zadnych"],
      "correct": "Kazda z okreslonych wskazowek"
    },
    "scenario": {
      "prompt": "Ladunek mieszany: klasa 3 i klasa 6.1. Jakie wskazowki stosujesz?",
      "options": ["Tylko dla klasy 3", "Obie — dla klasy 3 i 6.1", "Wybieram jedna"],
      "correct": "Obie — dla klasy 3 i 6.1"
    }
  }
}, {
  "id": "b4-duze-ryzyko-cel",
  "block": 4,
  "topic": "Towary duzego ryzyka",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.10",
  "source": "kompendium",
  "page": 25,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq"],
  "why": "Ochrona towarow ma na celu zminimalizowanie ryzyka kradziezy oraz uzycia ich niezgodnie z przeznaczeniem. W szczegolnosci zapobiezenie kradziezy pojazdow, kradziezy towarow, zamachom na zaparkowane pojazdy.",
  "q": {
    "mcq": {
      "prompt": "Celem ochrony towarow duzego ryzyka (dzial 1.10) jest:",
      "options": ["Ochrona przed pozarem", "Minimalizacja ryzyka kradziezy i uzycia niezgodnie z przeznaczeniem", "Ochrona srodowiska"],
      "correct": "Minimalizacja ryzyka kradziezy i uzycia niezgodnie z przeznaczeniem"
    }
  }
}, {
  "id": "b4-plan-ochrony",
  "block": 4,
  "topic": "Towary duzego ryzyka",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 1.10.3.2",
  "source": "kompendium",
  "page": 25,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "match"],
  "why": "Plan ochrony zawiera m.in.: szczegolowy podzial obowiazkow i wykaz osob, wykaz towarow niebezpiecznych podlegajacych ochronie, opis czynnosci i ocene zagrozen, plan szkolenia i procedury postepowania, procedury powiadamiania, procedury oceny i testowania planow, dzialania zapewniajace ochrone fizyczna informacji, dzialania ograniczajace dostep do informacji.",
  "q": {
    "mcq": {
      "prompt": "Plan ochrony towarow duzego ryzyka musi zawierac m.in.:",
      "options": ["Trase przejazdu", "Wykaz osob i wykaz towarow podlegajacych ochronie", "Numer rejestracyjny"],
      "correct": "Wykaz osob i wykaz towarow podlegajacych ochronie"
    },
    "match": {
      "prompt": "Dopasuj element planu ochrony:",
      "pairs": {
        "Wykaz osob": "podzial obowiazkow",
        "Plan szkolenia": "procedury postepowania",
        "Ochrona informacji": "ograniczenie dostepu"
      }
    }
  }
}, {
  "id": "b4-plan-ochrony-wymogi",
  "block": 4,
  "topic": "Towary duzego ryzyka",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.10",
  "source": "kompendium",
  "page": 26,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Zapamietaj: plan ochrony WYMAGA legitymowania kierowcy i wykazu osob. NIE WYMAGA specjalnego znakowania przesylek lub pojazdow, nadzoru GPS ani konwojenta.",
  "q": {
    "mcq": {
      "prompt": "Plan ochrony towarow duzego ryzyka NIE wymaga:",
      "options": ["Legitymowania kierowcy", "Nadzoru GPS i konwojenta", "Wykazu osob"],
      "correct": "Nadzoru GPS i konwojenta"
    },
    "scenario": {
      "prompt": "Przewozisz towar duzego ryzyka. Czy pojazd musi miec GPS?",
      "options": ["Tak, obowiazkowo", "Nie — plan ochrony nie wymaga GPS", "Tylko przy klasie 1"],
      "correct": "Nie — plan ochrony nie wymaga GPS"
    }
  }
}, {
  "id": "b4-duze-ryzyko-progi",
  "block": 4,
  "topic": "Towary duzego ryzyka",
  "kind": "ref",
  "scope": "podstawowy",
  "adrRef": "ADR 1.10.3.1",
  "source": "kompendium",
  "page": 26,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "mcq"],
  "why": "Progi towarow duzego ryzyka: klasa 1 (1.1, 1.2, 1.3) — kazda ilosc w sztukach; gazy palne nietrujace (F, FC) — cysterna 3000 l; gazy trujace (T, TF, TC, TO, TFC, TOC) — kazda ilosc; klasa 3 GP I i II — cysterna 3000 l; klasa 6.1 GP I — kazda ilosc; klasa 8 GP I — cysterna 3000 l.",
  "q": {
    "match": {
      "prompt": "Dopasuj towar do progu duzego ryzyka (cysterna):",
      "pairs": {
        "Gazy palne nietrujace (F, FC)": "3000 l",
        "Materialy zapalne ciekle GP I i II": "3000 l",
        "Materialy zrace GP I": "3000 l"
      }
    },
    "mcq": {
      "prompt": "Materialy trujace I grupy pakowania (6.1) sa towarem duzego ryzyka w ilosci:",
      "options": ["Powyzej 3000 l", "Kazda ilosc", "Powyzej 1000 kg"],
      "correct": "Kazda ilosc"
    }
  }
}, {
  "id": "b4-kontrola",
  "block": 4,
  "topic": "Towary duzego ryzyka",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "art. 99 ustawy",
  "source": "kompendium",
  "page": 26,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["mcq", "scenario"],
  "why": "Kontrola przewozu zgodnie z art. 99 ustawy o transporcie towarow niebezpiecznych moze byc przeprowadzana na drogach i parkingach przez: inspektorow Inspekcji Transportu Drogowego, funkcjonariuszy Policji, Strazy Granicznej, Sluzb Celnych oraz zolnierzy Zandarmerii Wojskowej (w zakresie przewozu wykonywanego przez sily zbrojne).",
  "q": {
    "mcq": {
      "prompt": "Kto NIE moze kontrolowac przewozu ADR na drodze?",
      "options": ["ITD", "Straz Pozarna", "Policja"],
      "correct": "Straz Pozarna"
    },
    "scenario": {
      "prompt": "Zandarmeria Wojskowa moze kontrolowac Twoj przewoz ADR:",
      "options": ["Zawsze", "Tylko w zakresie przewozu wykonywanego przez sily zbrojne", "Nigdy"],
      "correct": "Tylko w zakresie przewozu wykonywanego przez sily zbrojne"
    }
  }
}, {
  "id": "x-dokument-kabina-2025",
  "block": 4,
  "topic": "Zmiany ADR 2025",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1 (zmiana 2025)",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["mcq"],
  "why": "ROZSZERZENIE (poza kompendium): wedlug zrodel dot. ADR 2025 od 1 lipca 2025 dokumenty przewozowe musza znajdowac sie w kabinie kierowcy. Kompendium ADR 2023 tego nie zawiera. DO WERYFIKACJI.",
  "q": {
    "mcq": {
      "prompt": "Gdzie od lipca 2025 musi znajdowac sie dokument przewozowy?",
      "options": ["W biurze przewoznika", "W kabinie kierowcy", "U nadawcy"],
      "correct": "W kabinie kierowcy"
    }
  }
}, {
  "id": "x-baterie-sodowe-2025",
  "block": 2,
  "topic": "Zmiany ADR 2025",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2025 UN 3551/3552",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["mcq"],
  "why": "ROZSZERZENIE (poza kompendium): ADR 2025 wprowadza baterie sodowo-jonowe — UN 3551 (z elektrolitem organicznym) i UN 3552 (zapakowane z urzadzeniem lub w urzadzeniu). Kod klasyfikacyjny M4 obejmuje teraz baterie litowe i sodowo-jonowe. DO WERYFIKACJI.",
  "q": {
    "mcq": {
      "prompt": "Baterie sodowo-jonowe z elektrolitem organicznym (ADR 2025) maja numer:",
      "options": ["UN 3480", "UN 3551", "UN 3090"],
      "correct": "UN 3551"
    }
  }
}, {
  "id": "x-pojazdy-baterie-2025",
  "block": 2,
  "topic": "Zmiany ADR 2025",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 2025 UN 3556-3558",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["match"],
  "why": "ROZSZERZENIE (poza kompendium): ADR 2025 wprowadza numery UN 3556 (pojazd napedzany bateria litowo-jonowa), UN 3557 (litowo-metalowa), UN 3558 (sodowo-jonowa). Stosuje sie nowa instrukcje pakowania P912. DO WERYFIKACJI.",
  "q": {
    "match": {
      "prompt": "Dopasuj numer UN do rodzaju pojazdu (ADR 2025):",
      "pairs": {
        "UN 3556": "pojazd z bateria litowo-jonowa",
        "UN 3557": "pojazd z bateria litowo-metalowa",
        "UN 3558": "pojazd z bateria sodowo-jonowa"
      }
    }
  }
}, {
  "id": "x-lq-szkolenie-2025",
  "block": 1,
  "topic": "Zmiany ADR 2025",
  "kind": "fact",
  "scope": "podstawowy",
  "adrRef": "ADR 8.2.3 (doprecyzowanie 2025)",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["mcq"],
  "why": "ROZSZERZENIE (poza kompendium): wedlug zrodel dot. ADR 2025 doprecyzowano wymog szkolenia zalogi przewozacej towary w ilosciach ograniczonych (LQ). DO WERYFIKACJI — kompendium ADR 2023 tego nie precyzuje.",
  "q": {
    "mcq": {
      "prompt": "Czy zaloga przewozaca towary LQ wymaga udokumentowanego szkolenia (ADR 2025)?",
      "options": ["Nie, LQ jest calkowicie zwolnione", "Tak, wymog doprecyzowany w ADR 2025", "Tylko powyzej 8 t"],
      "correct": "Tak, wymog doprecyzowany w ADR 2025"
    }
  }
}, {
  "id": "s-1136-mnozniki-tabela",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.4",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Podstawa liczenia punktow: ilosc x mnoznik kategorii. Kat. 1 = x50, kat. 2 = x3, kat. 3 = x1, kat. 4 = x0. Suma nie moze przekroczyc 1000.",
  "q": {
    "match": {
      "prompt": "Dopasuj kategorie transportowa do mnoznika:",
      "pairs": {
        "Kategoria 1": "x50",
        "Kategoria 2": "x3",
        "Kategoria 3": "x1",
        "Kategoria 4": "x0"
      }
    }
  }
}, {
  "id": "s-1136-oblicz-1",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["fill"],
  "why": "Kategoria 2 ma mnoznik x3. 100 l x 3 = 300 punktow. Wynik ponizej 1000 — wylaczenie przysluguje.",
  "q": {
    "fill": {
      "prompt": "Wieziesz 100 l towaru kategorii transportowej 2. Ile punktow?",
      "correct": "300",
      "hint": "ilosc x mnoznik"
    }
  }
}, {
  "id": "s-1136-oblicz-2",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["fill"],
  "why": "Sumujemy iloczyny: 50 l kat. 2 = 50 x 3 = 150. 200 kg kat. 3 = 200 x 1 = 200. Razem 350 punktow. Wylaczenie przysluguje.",
  "q": {
    "fill": {
      "prompt": "Ladunek: 50 l kategorii 2 + 200 kg kategorii 3. Ile punktow lacznie?",
      "correct": "350",
      "hint": "zsumuj iloczyny"
    }
  }
}, {
  "id": "s-1136-oblicz-3",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["fill", "scenario"],
  "why": "300 l kat. 2 = 300 x 3 = 900 punktow. Dolozenie 200 kg kat. 3 (x1 = 200) daje 1100 — przekroczenie 1000. Wylaczenie nie przysluguje, jedziesz na pelnym ADR.",
  "q": {
    "fill": {
      "prompt": "Ladunek: 300 l kategorii 2 + 200 kg kategorii 3. Ile punktow?",
      "correct": "1100",
      "hint": "liczba"
    },
    "scenario": {
      "prompt": "Wyszlo 1100 punktow. Co to oznacza?",
      "options": ["Wylaczenie 1.1.3.6 przysluguje", "Przekroczone 1000 — pelny ADR", "Trzeba podzielic ladunek na dwa kursy"],
      "correct": "Przekroczone 1000 — pelny ADR"
    }
  }
}, {
  "id": "s-1136-kat4-zero",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["fill", "scenario"],
  "why": "Kategoria 4 ma mnoznik 0 — nie dolicza sie do sumy niezaleznie od ilosci. 500 kg kat. 4 = 0 punktow. Liczy sie tylko 100 l kat. 3 = 100 punktow.",
  "q": {
    "fill": {
      "prompt": "Ladunek: 500 kg kategorii 4 + 100 l kategorii 3. Ile punktow?",
      "correct": "100",
      "hint": "uwaga na mnoznik kat. 4"
    },
    "scenario": {
      "prompt": "Wieziesz 2 tony towaru kategorii 4. Ile to punktow?",
      "options": ["2000", "0 — kategoria 4 ma mnoznik zero", "666"],
      "correct": "0 — kategoria 4 ma mnoznik zero"
    }
  }
}, {
  "id": "s-1136-kat0-blokada",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Kategoria 0 ma limit 0 — kazda ilosc oznacza pelny ADR. Nie ma znaczenia, ze suma punktow z pozostalych towarow jest niska. Kategoria 0 blokuje wylaczenie calkowicie.",
  "q": {
    "scenario": {
      "prompt": "Ladunek: 5 kg towaru kategorii 0 + 50 l kategorii 3 (razem 50 punktow). Czy przysluguje wylaczenie 1.1.3.6?",
      "options": ["Tak, 50 punktow to malo", "Nie — kategoria 0 zawsze oznacza pelny ADR", "Tak, jesli kategoria 0 nie przekracza 20 kg"],
      "correct": "Nie — kategoria 0 zawsze oznacza pelny ADR"
    }
  }
}, {
  "id": "s-1136-kat1-wyjatek-oblicz",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["fill", "scenario"],
  "why": "UN 1017 (chlor) nalezy do wyjatku kategorii 1: limit 50 kg, mnoznik x20 zamiast x50. 20 kg x 20 = 400 punktow.",
  "q": {
    "fill": {
      "prompt": "Wieziesz 20 kg UN 1017 (wyjatek kategorii 1, mnoznik x20). Ile punktow?",
      "correct": "400",
      "hint": "ilosc x mnoznik wyjatku"
    },
    "scenario": {
      "prompt": "UN 1005 i UN 1017 w kategorii 1 maja mnoznik:",
      "options": ["x50 jak cala kategoria 1", "x20 — wyjatek", "x3"],
      "correct": "x20 — wyjatek"
    }
  }
}, {
  "id": "s-1136-gdzie-kategoria",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR kol. 15 Tabeli A",
  "source": "kompendium",
  "page": 10,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Zeby policzyc punkty, najpierw musisz znac kategorie transportowa towaru. Sprawdzasz ja w tabeli A, w kolumnie 15 (ta sama kolumna zawiera kod tunelowy w nawiasie).",
  "q": {
    "scenario": {
      "prompt": "Chcesz policzyc punkty 1.1.3.6. Skad bierzesz kategorie transportowa towaru?",
      "options": ["Z dokumentu przewozowego", "Z tabeli A, kolumna 15", "Z instrukcji pisemnej"],
      "correct": "Z tabeli A, kolumna 15"
    }
  }
}, {
  "id": "s-1136-co-zostaje",
  "block": 1,
  "topic": "Wyliczenie 1000 punktow",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6",
  "source": "kompendium",
  "page": 10,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Wylaczenie 1.1.3.6 nie zwalnia ze wszystkiego. ZOSTAJE: certyfikowane i oznakowane opakowania, gasnica 2 kg ABC z data przegladu, dokument przewozowy, szkolenie stanowiskowe. ODPADA: tablice pomaranczowe, zaswiadczenie ADR, instrukcja pisemna, skrzynka ADR, znaki drogowe ADR, DGSA, zakaz pasazerow.",
  "q": {
    "match": {
      "prompt": "Przewoz na 1.1.3.6 — co zostaje, a co odpada?",
      "pairs": {
        "Gasnica 2 kg ABC": "zostaje",
        "Dokument przewozowy": "zostaje",
        "Tablice pomaranczowe": "odpada",
        "Zaswiadczenie ADR": "odpada"
      }
    },
    "scenario": {
      "prompt": "Jedziesz na wylaczeniu 1.1.3.6. Kontrola pyta o instrukcje pisemna. Musisz ja miec?",
      "options": ["Tak, zawsze", "Nie — instrukcja odpada przy 1.1.3.6", "Tylko przy klasie 3"],
      "correct": "Nie — instrukcja odpada przy 1.1.3.6"
    }
  }
}, {
  "id": "s-tablica-33-1203",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Gorny numer 33: cyfra 3 = zapalnosc cieczy, podwojenie = nasilenie, czyli material latwo zapalny ciekly o temperaturze zaplonu ponizej 23 st. C. Dolny 1203 = benzyna silnikowa.",
  "q": {
    "scenario": {
      "prompt": "Cysterna z tablica 33 / 1203. Co wieziesz i jakie jest glowne zagrozenie?",
      "options": ["Olej napedowy, zagrozenie srodowiska", "Benzyne, material latwo zapalny (zaplon ponizej 23 st. C)", "Chlor, gaz trujacy"],
      "correct": "Benzyne, material latwo zapalny (zaplon ponizej 23 st. C)"
    }
  }
}, {
  "id": "s-tablica-x-woda",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Litera X przed numerem = material reaguje niebezpiecznie z woda. Woda moze byc uzyta tylko za zgoda specjalistow. To informacja ratujaca zycie przy gaszeniu.",
  "q": {
    "scenario": {
      "prompt": "Tablica X423. Pali sie ladunek. Straz pyta czy mozna lac wode. Twoja odpowiedz:",
      "options": ["Tak, woda gasi wszystko", "NIE bez zgody specjalistow — X oznacza niebezpieczna reakcje z woda", "Tylko malo wody"],
      "correct": "NIE bez zgody specjalistow — X oznacza niebezpieczna reakcje z woda"
    }
  }
}, {
  "id": "s-tablica-zero",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Zero na drugiej pozycji oznacza brak zagrozenia dodatkowego i brak nasilenia. Towar zwykle nalezy do II lub III grupy pakowania. Numer 30 = material zapalny ciekly (23-60 st. C).",
  "q": {
    "scenario": {
      "prompt": "Tablica 30 / 1202. Co mowi Ci zero na drugiej pozycji?",
      "options": ["Material jest wybuchowy", "Brak zagrozenia dodatkowego, zwykle II lub III grupa pakowania", "Reaguje z woda"],
      "correct": "Brak zagrozenia dodatkowego, zwykle II lub III grupa pakowania"
    }
  }
}, {
  "id": "s-tablica-90-3082",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 20,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Numer 90 = material zagrazajacy srodowisku, rozne materialy niebezpieczne. UN 3082 = material zagrazajacy srodowisku wodnemu, ciekly, i.n.o. (klasa 9).",
  "q": {
    "scenario": {
      "prompt": "Cysterna z tablica 90 / 3082. Wyciek do rowu. Co jest glownym problemem?",
      "options": ["Pozar", "Skazenie srodowiska wodnego", "Wybuch"],
      "correct": "Skazenie srodowiska wodnego"
    }
  }
}, {
  "id": "s-tablica-268-1017",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 18,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Numer 268 = gaz trujacy zracy. Cyfra 2 = emisja gazu, 6 = dzialanie trujace, 8 = dzialanie zrace. UN 1017 = chlor. Wymagana maska ucieczkowa (nalepka 2.3).",
  "q": {
    "scenario": {
      "prompt": "Tablica 268 / 1017 (chlor). Jakie wyposazenie dodatkowe jest wymagane?",
      "options": ["Lopata i pojemnik", "Maska ucieczkowa dla kazdego czlonka zalogi", "Tylko gasnica 2 kg"],
      "correct": "Maska ucieczkowa dla kazdego czlonka zalogi"
    }
  }
}, {
  "id": "s-tablica-sklad-cyfr",
  "block": 2,
  "topic": "Odczyt tablicy",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3",
  "source": "kompendium",
  "page": 18,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match"],
  "why": "Numer rozpoznawczy sklada sie z cyfr o stalym znaczeniu: 2 emisja gazu, 3 zapalnosc cieczy, 4 zapalnosc cial stalych, 5 utleniajace, 6 trujace/zakazne, 7 promieniotworcze, 8 zrace, 9 gwaltowna reakcja. Skladajac je czytasz zagrozenie bez tabeli.",
  "q": {
    "match": {
      "prompt": "Rozloz numer na zagrozenia:",
      "pairs": {
        "26": "gaz trujacy",
        "80": "material zracy",
        "336": "latwo zapalny ciekly trujacy",
        "539": "nadtlenek organiczny zapalny"
      }
    }
  }
}, {
  "id": "s-gasnice-40t",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.4",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "fill"],
  "why": "Zestaw 40 t = powyzej 7,5 t. Wymagane: minimum 2 gasnice, laczna pojemnosc 12 kg, w tym co najmniej jedna 2 kg do silnika/kabiny i co najmniej jedna dodatkowa 6 kg. Typ ABC.",
  "q": {
    "scenario": {
      "prompt": "Zestaw 40 t. Masz jedna gasnice 12 kg. Czy spelniasz wymog?",
      "options": ["Tak, pojemnosc sie zgadza", "Nie — musza byc minimum 2 gasnice", "Tak, jesli ma aktualny przeglad"],
      "correct": "Nie — musza byc minimum 2 gasnice"
    },
    "fill": {
      "prompt": "Zestaw 40 t: minimalna laczna pojemnosc gasnic to ___ kg.",
      "correct": "12",
      "hint": "liczba"
    }
  }
}, {
  "id": "s-gasnice-3t",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.4",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Bus 3 t = do 3,5 t. Wymagane: 2 gasnice, laczna pojemnosc 4 kg — czyli 2 kg do silnika/kabiny + 2 kg dodatkowa.",
  "q": {
    "scenario": {
      "prompt": "Bus 3 t z towarem ADR. Jakie gasnice?",
      "options": ["Jedna 4 kg", "Dwie gasnice, lacznie 4 kg (2 kg + 2 kg)", "Dwie po 6 kg"],
      "correct": "Dwie gasnice, lacznie 4 kg (2 kg + 2 kg)"
    }
  }
}, {
  "id": "s-gasnice-s3-6-2",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR przepis S3",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Przepis S3: dla klasy 6.2 (zakazne) niezaleznie od DMC pojazdu wystarczy gasnica 2 kg typu ABC, a latarka moze byc dowolnej konstrukcji. To wyjatek od tabeli mas.",
  "q": {
    "scenario": {
      "prompt": "Zestaw 24 t z odpadami medycznymi (klasa 6.2). Ile gasnicy wg przepisu S3?",
      "options": ["12 kg jak dla kazdego zestawu powyzej 7,5 t", "Wystarczy 2 kg ABC — wyjatek S3", "8 kg"],
      "correct": "Wystarczy 2 kg ABC — wyjatek S3"
    }
  }
}, {
  "id": "s-gasnice-1136",
  "block": 4,
  "topic": "Dobor gasnic",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6 / 8.1.4",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Pojazd na wylaczeniu 1.1.3.6 musi miec 1 gasnice 2 kg typu ABC. Wylaczenie zwalnia z pelnego wyposazenia, ale NIE z gasnicy.",
  "q": {
    "scenario": {
      "prompt": "Jedziesz na wylaczeniu 1.1.3.6 zestawem 20 t. Ile gasnic?",
      "options": ["Dwie, lacznie 12 kg jak przy pelnym ADR", "Jedna 2 kg ABC", "Zadna — wylaczenie zwalnia"],
      "correct": "Jedna 2 kg ABC"
    }
  }
}, {
  "id": "s-wyposazenie-klasa3",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Nalepka 3 nalezy do grupy 3, 4.1, 4.3, 8, 9 — wymagana lopata, oslona otworow kanalizacyjnych i pojemnik do zbierania pozostalosci (po 1 sztuce). Plyn do plukania oczu tez wymagany (nie jest na liscie wylaczen 1/2.x).",
  "q": {
    "scenario": {
      "prompt": "Wieziesz benzyne (nalepka 3). Jakie wyposazenie dodatkowe poza standardem?",
      "options": ["Maska ucieczkowa", "Lopata, oslona kanalizacji, pojemnik", "Nic dodatkowego"],
      "correct": "Lopata, oslona kanalizacji, pojemnik"
    }
  }
}, {
  "id": "s-wyposazenie-klasa2-3",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5.3",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Nalepka 2.3 (gazy trujace) wymaga maski ucieczkowej dla kazdego czlonka zalogi. Jednoczesnie plyn do plukania oczu NIE jest wymagany przy nalepkach 1, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3. Lopata tez nie — 2.3 nie jest na liscie 3/4.1/4.3/8/9.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz chlor (nalepka 2.3), zaloga 2 osoby. Czego potrzebujesz?",
      "options": ["2 maski ucieczkowe, bez plynu do oczu i lopaty", "1 maska, plyn do oczu, lopata", "Tylko lopata"],
      "correct": "2 maski ucieczkowe, bez plynu do oczu i lopaty"
    },
    "match": {
      "prompt": "Nalepka 2.3 — co wymagane, co nie:",
      "pairs": {
        "Maska ucieczkowa": "wymagana",
        "Plyn do plukania oczu": "niewymagany",
        "Lopata": "niewymagana"
      }
    }
  }
}, {
  "id": "s-wyposazenie-ilosci",
  "block": 4,
  "topic": "Dobor wyposazenia",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Na kazdego czlonka zalogi: kamizelka, latarka, rekawice, ochrona oczu, maska ucieczkowa (gdy wymagana). Po 1 sztuce w pojezdzie niezaleznie od zalogi: plyn do plukania oczu, lopata, oslona kanalizacji, pojemnik. Klin — dla kazdego pojazdu. Znaki stojace — 2 na jednostke.",
  "q": {
    "match": {
      "prompt": "Zaloga 2 osoby — ile sztuk?",
      "pairs": {
        "Kamizelka": "2 (na kazdego)",
        "Maska ucieczkowa": "2 (na kazdego)",
        "Plyn do plukania oczu": "1 (na pojazd)",
        "Lopata": "1 (na pojazd)"
      }
    },
    "scenario": {
      "prompt": "Zaloga 2 osoby, przewoz klasy 3. Ile lopat musisz miec?",
      "options": ["Dwie — po jednej na osobe", "Jedna — niezaleznie od liczby zalogi", "Zadnej"],
      "correct": "Jedna — niezaleznie od liczby zalogi"
    }
  }
}, {
  "id": "s-tunel-de-cysterna",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Kod (D/E) czytamy: D dotyczy cysterny i luzem, E dotyczy sztuk przesylki. Cysterna z kodem D nie moze wjechac do tunelu D ani E. Do C, B i A moze.",
  "q": {
    "scenario": {
      "prompt": "Dokument: kod tunelowy (D/E). Wieziesz w CYSTERNIE. Tunel kategorii D — wjezdzasz?",
      "options": ["Tak", "Nie — dla cysterny obowiazuje D, zakaz w tunelu D i E", "Tylko z eskorta"],
      "correct": "Nie — dla cysterny obowiazuje D, zakaz w tunelu D i E"
    }
  }
}, {
  "id": "s-tunel-de-sztuki",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Kod (D/E): przy przewozie w sztukach przesylki obowiazuje E — zakaz tylko w tunelu kategorii E. Do D, C, B i A wolno.",
  "q": {
    "scenario": {
      "prompt": "Ten sam kod (D/E), ale wieziesz w SZTUKACH PRZESYLKI. Tunel kategorii D — wjezdzasz?",
      "options": ["Nie", "Tak — dla sztuk obowiazuje E, zakaz dopiero w tunelu E", "Tylko noca"],
      "correct": "Tak — dla sztuk obowiazuje E, zakaz dopiero w tunelu E"
    }
  }
}, {
  "id": "s-tunel-b",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Kod (B) = zakaz w tunelach B, C, D i E. Przejechac mozna tylko tunelem kategorii A (nieoznakowany lub ze znakiem D-37). To najbardziej restrykcyjny kod dla przewozu.",
  "q": {
    "scenario": {
      "prompt": "Kod tunelowy (B). Przez ktore tunele mozesz przejechac?",
      "options": ["Wszystkie", "Tylko A (nieoznakowany lub D-37)", "A, B i C"],
      "correct": "Tylko A (nieoznakowany lub D-37)"
    }
  }
}, {
  "id": "s-tunel-minus",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.9.5 / kol. 15",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Kod \"(-)\" w kolumnie 15 tabeli A oznacza brak ograniczen tunelowych — wolno wjechac do kazdego tunelu, lacznie z E. Dotyczy m.in. UN 2814, 2900, 2919, 3166, 3171, 3331, 3359, 3373, 3549.",
  "q": {
    "scenario": {
      "prompt": "Kod tunelowy \"(-)\". Tunel kategorii E — wjezdzasz?",
      "options": ["Nie, E to zawsze zakaz", "Tak — kod (-) oznacza brak ograniczen", "Tylko jesli masz eskorte"],
      "correct": "Tak — kod (-) oznacza brak ograniczen"
    }
  }
}, {
  "id": "s-tunel-lq",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 3.4 / 1.9.5",
  "source": "kompendium",
  "page": 10,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Jednostka powyzej 12 t DMC przewozaca powyzej 8 t brutto towarow w ilosciach ograniczonych (LQ) musi byc oznakowana znakiem LQ i NIE MOZE wjezdzac do tunelu kategorii E.",
  "q": {
    "scenario": {
      "prompt": "Ciezarowka 24 t DMC, 10 t brutto towarow LQ. Tunel kategorii E — wjezdzasz?",
      "options": ["Tak, LQ jest zwolnione", "Nie — LQ powyzej 8 t brutto ma zakaz tunelu E", "Tak, jesli nie ma tablic"],
      "correct": "Nie — LQ powyzej 8 t brutto ma zakaz tunelu E"
    }
  }
}, {
  "id": "s-tunel-gdzie-kod",
  "block": 4,
  "topic": "Decyzja o tunelu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR kol. 15",
  "source": "kompendium",
  "page": 23,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Kod tunelowy towaru znajdziesz w dokumencie przewozowym (w nawiasie na koncu zapisu) oraz w tabeli A w kolumnie 15. Kategorie tunelu na drodze odczytasz z tabliczki pod znakiem B-13a.",
  "q": {
    "scenario": {
      "prompt": "Skad wiesz, jaki kod tunelowy ma Twoj towar?",
      "options": ["Z tablicy pomaranczowej", "Z dokumentu przewozowego (nawias) lub tabeli A kolumna 15", "Z instrukcji pisemnej"],
      "correct": "Z dokumentu przewozowego (nawias) lub tabeli A kolumna 15"
    }
  }
}, {
  "id": "s-kod-opakowania-y",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 6.1.2",
  "source": "kompendium",
  "page": 8,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Litera na drugim miejscu kodu opakowania: X = dla I, II i III grupy pakowania; Y = dla II i III; Z = tylko dla III. Opakowanie Y nie nadaje sie do towaru I grupy pakowania.",
  "q": {
    "scenario": {
      "prompt": "Opakowanie z kodem 1A2/Y. Chcesz zapakowac towar I grupy pakowania. Mozesz?",
      "options": ["Tak, Y pasuje do wszystkich", "Nie — Y jest tylko dla II i III grupy", "Tak, jesli towar jest ciekly"],
      "correct": "Nie — Y jest tylko dla II i III grupy"
    }
  }
}, {
  "id": "s-data-opakowania",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 4.1.1.15",
  "source": "kompendium",
  "page": 7,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Data produkcji na opakowaniu zapisana jest jako miesiac i rok, np. 07 21 = lipiec 2021. Opakowanie mozna uzywac 5 lat od daty produkcji, czyli do lipca 2026. Po 2,5 roku (styczen 2024) powinno byc przeprowadzone badanie.",
  "q": {
    "scenario": {
      "prompt": "Na DPPL widzisz oznaczenie 07 21. Do kiedy mozesz go uzywac?",
      "options": ["Do lipca 2023", "Do lipca 2026 (5 lat od produkcji)", "Bezterminowo"],
      "correct": "Do lipca 2026 (5 lat od produkcji)"
    }
  }
}, {
  "id": "s-x-opakowanie-vs-tablica",
  "block": 2,
  "topic": "Odczyt opakowania",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3 / 6.1.2",
  "source": "kompendium",
  "page": 17,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Pulapka egzaminacyjna: litera X ma DWA rozne znaczenia. Na tablicy pomaranczowej (przed numerem zagrozenia) = niebezpieczna reakcja z woda. W kodzie opakowania = mocne opakowanie do I, II i III grupy pakowania. To nie ma ze soba zwiazku.",
  "q": {
    "scenario": {
      "prompt": "Litera X w kodzie opakowania oznacza:",
      "options": ["Niebezpieczna reakcje z woda", "Mocne opakowanie do I, II i III grupy pakowania", "Material wybuchowy"],
      "correct": "Mocne opakowanie do I, II i III grupy pakowania"
    }
  }
}, {
  "id": "s-paliwo-limity",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.3",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Wylaczenie 1.1.3.3 dla paliwa w zbiornikach pojazdu: do 1500 l na jednostke transportowa, nie wiecej niz 500 l na przyczepie, w kanistrach nie wiecej niz 60 l.",
  "q": {
    "scenario": {
      "prompt": "Ciagnik 800 l + naczepa 400 l + 2 kanistry po 20 l = 1240 l. Czy miesci sie w wylaczeniu 1.1.3.3?",
      "options": ["Nie, przekroczone 1000 l", "Tak — 1240 l ponizej 1500 l, kanistry 40 l ponizej 60 l", "Tylko bez kanistrow"],
      "correct": "Tak — 1240 l ponizej 1500 l, kanistry 40 l ponizej 60 l"
    },
    "match": {
      "prompt": "Dopasuj limit paliwa (1.1.3.3):",
      "pairs": {
        "Jednostka transportowa": "1500 l",
        "Przyczepa": "500 l",
        "Kanistry": "60 l"
      }
    }
  }
}, {
  "id": "s-kanistry-przekroczenie",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.3",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Limit paliwa w zbiornikach dodatkowych (kanistrach) to 60 l. Przekroczenie tego limitu oznacza, ze wylaczenie 1.1.3.3 nie przysluguje dla nadwyzki — trzeba stosowac przepisy ADR.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz 100 l paliwa w kanistrach. Czy to sie miesci w wylaczeniu 1.1.3.3?",
      "options": ["Tak, do 1500 l", "Nie — limit dla kanistrow to 60 l", "Tak, jesli kanistry sa atestowane"],
      "correct": "Nie — limit dla kanistrow to 60 l"
    }
  }
}, {
  "id": "s-butle-po-gazach",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.6.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Wszystkie butle po gazach naleza do kategorii transportowej 4 — mnoznik 0, bez ograniczen ilosciowych. Moze je przewozic kierowca bez zaswiadczenia ADR. Uwaga: butle pozostaja oznakowane jak w stanie ladownym.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz 30 pustych butli po propanie. Potrzebujesz zaswiadczenia ADR?",
      "options": ["Tak, powyzej 20 butli", "Nie — wszystkie butle po gazach to kategoria 4, bez ograniczen", "Tylko jesli sa nieoczyszczone"],
      "correct": "Nie — wszystkie butle po gazach to kategoria 4, bez ograniczen"
    }
  }
}, {
  "id": "s-prozne-nalepki",
  "block": 1,
  "topic": "Wylaczenia w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.1.3",
  "source": "kompendium",
  "page": 11,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Prozne, nieoczyszczone opakowania pozostaja oznakowane tak jak w stanie ladownym. Nie usuwa sie nalepek ostrzegawczych ani numerow UN. Zdejmuje sie je dopiero po calkowitym oczyszczeniu (robi to rozladowca).",
  "q": {
    "scenario": {
      "prompt": "Rozladowales DPPL po farbie, nieoczyszczony. Co robisz z nalepka klasy 3?",
      "options": ["Usuwam — jest pusty", "Zostawiam — nieoczyszczone oznakowane jak ladowne", "Zaklejam tasma"],
      "correct": "Zostawiam — nieoczyszczone oznakowane jak ladowne"
    }
  }
}, {
  "id": "s-ladowanie-3-8",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 7.5.2.1",
  "source": "kompendium",
  "page": 25,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "W ADR wiekszosc klas mozna ladowac razem przy prawidlowym opakowaniu (inaczej niz w transporcie morskim IMDG). Zakazy 7.5.2.1 dotycza w uproszczeniu klasy 1 oraz 4.1+1 i 5.2+1 o wlasciwosciach wybuchowych.",
  "q": {
    "scenario": {
      "prompt": "Chcesz zaladowac razem kanistry z benzyna (3) i kwasem (8). Wolno?",
      "options": ["Nie, rozne klasy nigdy razem", "Tak — ladowanie razem tych klas jest dozwolone", "Tylko w osobnych kontenerach"],
      "correct": "Tak — ladowanie razem tych klas jest dozwolone"
    }
  }
}, {
  "id": "s-ladowanie-klasa1",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 7.5.2.1",
  "source": "kompendium",
  "page": 25,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Zakazy ladowania razem koncentruja sie na klasie 1 (materialy wybuchowe). Wyjatkiem jest podklasa 1.4S, ktora ma najlagodniejszy rezim. Szczegoly w tabeli 7.5.2.1.",
  "q": {
    "scenario": {
      "prompt": "Ktora grupa towarow ma najwiecej zakazow ladowania razem?",
      "options": ["Klasa 9", "Klasa 1 — materialy wybuchowe", "Klasa 3"],
      "correct": "Klasa 1 — materialy wybuchowe"
    }
  }
}, {
  "id": "s-cv28-zywnosc-decyzja",
  "block": 4,
  "topic": "Decyzja o zaladunku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 7.5.4 / CV28",
  "source": "kompendium",
  "page": 24,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Gdy w kolumnie 18 tabeli A jest przepis CV28, towar trzeba oddzielic od zywnosci i karmy. Sposoby: ciagle przegrody, sztuki bez nalepek 6.1/6.2/9 jako bufor, wolna przestrzen min. 0,8 m, albo calkowite przykrycie (plandeka, pokrywa).",
  "q": {
    "scenario": {
      "prompt": "Wieziesz towar z przepisem CV28 i artykuly spozywcze. Nie masz przegrody. Co robisz?",
      "options": ["Laduje razem, CV28 to zalecenie", "Zostawiam min. 0,8 m wolnej przestrzeni albo przykrywam calkowicie", "Odmawiam przewozu"],
      "correct": "Zostawiam min. 0,8 m wolnej przestrzeni albo przykrywam calkowicie"
    },
    "match": {
      "prompt": "Sposoby oddzielenia od zywnosci (CV28):",
      "pairs": {
        "Wolna przestrzen": "min. 0,8 m",
        "Ciagle przegrody": "wysokosc jak sztuki przesylek",
        "Przykrycie": "plandeka lub pokrywa"
      }
    }
  }
}, {
  "id": "s-dokument-odczyt",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Nawet nie znajac jezyka dokumentu, kierowca odczyta wlasciwosci towaru po numerze nalepki i grupie pakowania. UN 1580 CHLOROPIKRYNA 6.1 GP I: 6.1 = trujacy, GP I = silnie (najwieksze zagrozenie).",
  "q": {
    "scenario": {
      "prompt": "W dokumencie: UN 1580 CHLOROPIKRYNA 6.1 GP I. Co to mowi bez znajomosci jezyka?",
      "options": ["Material zapalny, male zagrozenie", "Material trujacy, silnie — I grupa pakowania", "Gaz duszacy"],
      "correct": "Material trujacy, silnie — I grupa pakowania"
    }
  }
}, {
  "id": "s-dokument-odpad-zapis",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1.1.3",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Slowo ODPAD umieszcza sie PO numerze UN, przed nazwa: UN 1230 odpad metanol 3 (6.1) II, (D/E).",
  "q": {
    "scenario": {
      "prompt": "Ktory zapis odpadu w dokumencie jest prawidlowy?",
      "options": ["odpad UN 1230 metanol 3 (6.1) II, (D/E)", "UN 1230 odpad metanol 3 (6.1) II, (D/E)", "UN 1230 metanol odpad 3 (6.1) II, (D/E)"],
      "correct": "UN 1230 odpad metanol 3 (6.1) II, (D/E)"
    }
  }
}, {
  "id": "s-dokument-prozny",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1.1.6",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Zapis dla proznych opakowan powinien zawierac nazwe opakowania oraz numery nalepek znajdujacych sie na opakowaniu, np. \"prozny DPPL, 8\".",
  "q": {
    "scenario": {
      "prompt": "Wieziesz prozny, nieoczyszczony DPPL po kwasie (nalepka 8). Jak zapisac w dokumencie?",
      "options": ["DPPL pusty", "prozny DPPL, 8", "UN 0000 puste opakowanie"],
      "correct": "prozny DPPL, 8"
    }
  }
}, {
  "id": "s-dokument-1136-punkty",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1.1.10",
  "source": "kompendium",
  "page": 12,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Przy zastosowaniu zwolnienia 1.1.3.6 nalezy w dokumencie umiescic zapis o calkowitej ilosci towaru dla kategorii transportowej oraz o \"punktach\" (wartosci obliczonej), np. kategoria transportowa 2 — 100 l — 300 punktow.",
  "q": {
    "scenario": {
      "prompt": "Jedziesz na wylaczeniu 1.1.3.6. Co dodatkowo musi byc w dokumencie?",
      "options": ["Nic dodatkowego", "Calkowita ilosc dla kategorii transportowej i wartosc obliczona (punkty)", "Numer zaswiadczenia ADR"],
      "correct": "Calkowita ilosc dla kategorii transportowej i wartosc obliczona (punkty)"
    }
  }
}, {
  "id": "s-oznakowanie-decyzja",
  "block": 4,
  "topic": "Oznakowanie pojazdu w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Sposob oznakowania zalezy od sposobu przewozu. Sztuki przesylki: tablice gladkie (bez numerow) przod i tyl, BEZ nalepek na pojezdzie. Luzem lub cysterna: tablice z numerami przod i tyl + nalepki z trzech stron (oba boki i tyl). Kontener-cysterna: nalepki z 4 stron.",
  "q": {
    "match": {
      "prompt": "Dopasuj sposob przewozu do oznakowania:",
      "pairs": {
        "Sztuki przesylki": "tablice gladkie przod i tyl, bez nalepek",
        "Luzem lub cysterna": "tablice z numerami + nalepki z 3 stron",
        "Kontener-cysterna": "nalepki z 4 stron"
      }
    },
    "scenario": {
      "prompt": "Wieziesz butle gazowe i DPPL (sztuki przesylki). Jak oznakowac pojazd?",
      "options": ["Tablice z numerami i nalepki z bokow", "Tablice gladkie bez numerow, przod i tyl, bez nalepek", "Bez oznakowania"],
      "correct": "Tablice gladkie bez numerow, przod i tyl, bez nalepek"
    }
  }
}, {
  "id": "s-cysterna-wielokomorowa-decyzja",
  "block": 4,
  "topic": "Oznakowanie pojazdu w praktyce",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.1.3",
  "source": "kompendium",
  "page": 21,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Dla UN 1202, 1203, 1223, 1268 i 1863 mozna oznakowac cysterne wielokomorowa tak, jakby wiozla jeden produkt — ten najniebezpieczniejszy z przewozonych. Benzyna (UN 1203, numer 33) jest niebezpieczniejsza niz olej napedowy (UN 1202, numer 30).",
  "q": {
    "scenario": {
      "prompt": "Cysterna wielokomorowa: olej napedowy (UN 1202) i benzyna (UN 1203). Jaka tablica?",
      "options": ["Dwie rozne tablice na komorach", "33/1203 — najniebezpieczniejszy z przewozonych", "30/1202"],
      "correct": "33/1203 — najniebezpieczniejszy z przewozonych"
    }
  }
}, {
  "id": "s-wypadek-sekwencja",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["order"],
  "why": "Sekwencja z instrukcji pisemnej: najpierw zabezpiecz pojazd (zahamuj, wylacz silnik, odlacz akumulator), potem zaloz kamizelke i ustaw znaki, powiadom sluzby, zapewnij ratownikom dostep do dokumentow. Oddal sie po stronie nawietrznej.",
  "q": {
    "order": {
      "prompt": "Ulóz kolejnosc dzialan po wypadku:",
      "items": ["Powiadom sluzby ratownicze", "Zahamuj, wylacz silnik, odlacz akumulator", "Zaloz kamizelke, ustaw znaki ostrzegawcze", "Zapewnij ratownikom dostep do dokumentow"],
      "correct": ["Zahamuj, wylacz silnik, odlacz akumulator", "Zaloz kamizelke, ustaw znaki ostrzegawcze", "Powiadom sluzby ratownicze", "Zapewnij ratownikom dostep do dokumentow"]
    }
  }
}, {
  "id": "s-gasic-czy-nie",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Kierowca gasi TYLKO maly lub poczatkowy pozar obejmujacy opony, hamulce lub przedzial silnika — i tylko jesli to bezpieczne. Pozaru przedzialu ladunkowego NIE gasi. Nie gasimy ladunku.",
  "q": {
    "match": {
      "prompt": "Gasic czy nie?",
      "pairs": {
        "Poczatkowy pozar opony": "gasic jesli bezpiecznie",
        "Pozar przedzialu ladunkowego": "NIE gasic",
        "Pozar silnika w fazie poczatkowej": "gasic jesli bezpiecznie"
      }
    },
    "scenario": {
      "prompt": "Pali sie naczepa z ladunkiem ADR. Masz 2 gasnice po 6 kg. Co robisz?",
      "options": ["Probuje gasic — mam 12 kg", "Oddalam sie i wzywam straz — nie gasimy ladunku", "Otwieram naczepe zeby sprawdzic"],
      "correct": "Oddalam sie i wzywam straz — nie gasimy ladunku"
    }
  }
}, {
  "id": "s-gasnica-technika",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "praktyka gaszenia",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Strumien proszku kierujemy w zrodlo plomieni, stojac od strony nawietrznej. Gasnica 6 kg wystarcza na ok. 10 sekund, 2 kg na ok. 6 sekund. Zasieg okolo 4 m. Masz jedna probe — celuj w zrodlo, nie w plomien.",
  "q": {
    "scenario": {
      "prompt": "Gasisz poczatkowy pozar opony gasnica 6 kg. Ile masz czasu?",
      "options": ["Okolo 30 sekund", "Okolo 10 sekund", "Okolo 2 minut"],
      "correct": "Okolo 10 sekund"
    },
    "match": {
      "prompt": "Parametry gasnic:",
      "pairs": {
        "Gasnica 6 kg": "ok. 10 s",
        "Gasnica 2 kg": "ok. 6 s",
        "Zasieg strumienia": "ok. 4 m"
      }
    }
  }
}, {
  "id": "s-zgloszenie-sluzbom",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "procedury krajowe",
  "source": "kompendium",
  "page": 27,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["order", "scenario"],
  "why": "Kolejnosc informacji dla sluzb: miejsce zdarzenia, rodzaj zdarzenia, skutki, liczba ofiar, rozmiar (ile pojazdow/osob), numery UN, sposob przewozu (luzem/cysterna), ilosc towaru, czy nastapilo uwolnienie. Numer UN odczytasz z tablicy lub dokumentu.",
  "q": {
    "order": {
      "prompt": "Ulóz kolejnosc informacji przekazywanych sluzbom:",
      "items": ["Numery UN i ilosc towaru", "Miejsce zdarzenia", "Rodzaj zdarzenia i skutki", "Liczba ofiar"],
      "correct": ["Miejsce zdarzenia", "Rodzaj zdarzenia i skutki", "Liczba ofiar", "Numery UN i ilosc towaru"]
    },
    "scenario": {
      "prompt": "Skad bierzesz numer UN do zgloszenia, jesli dokument splonal?",
      "options": ["Z pamieci", "Z tablicy pomaranczowej na pojezdzie", "Dzwonie do przewoznika"],
      "correct": "Z tablicy pomaranczowej na pojezdzie"
    }
  }
}, {
  "id": "s-wiatr-opary",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Nalezy unikac wdychania oparow, dymu, pylu i pary poprzez pozostawanie po stronie NAWIETRZNEJ — czyli tam, skad wieje wiatr. Wiatr wieje od Ciebie w strone zdarzenia, nie odwrotnie.",
  "q": {
    "scenario": {
      "prompt": "Wyciek z cysterny, wiatr wieje z zachodu. Gdzie sie ustawiasz?",
      "options": ["Na wschod od wycieku (z wiatrem)", "Na zachod od wycieku (strona nawietrzna)", "Bez znaczenia"],
      "correct": "Na zachod od wycieku (strona nawietrzna)"
    }
  }
}, {
  "id": "s-zrodla-zaplonu-decyzja",
  "block": 5,
  "topic": "Reakcja po wypadku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.3.4",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Po wypadku nalezy unikac zrodel zaplonu: nie palic, nie uzywac e-papierosow, NIE WLACZAC zadnych urzadzen elektrycznych. Telefon jako latarka to urzadzenie elektryczne — uzyj latarki z wyposazenia ADR (jest przystosowana).",
  "q": {
    "scenario": {
      "prompt": "Noc, wyciek benzyny, chcesz oswietlic miejsce. Czego uzywasz?",
      "options": ["Telefonu — ma najlepsza latarke", "Latarki z wyposazenia ADR", "Zapalniczki"],
      "correct": "Latarki z wyposazenia ADR"
    }
  }
}, {
  "id": "s-uprawnienia-cysterna",
  "block": 1,
  "topic": "Zakres uprawnien",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.2.1",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "ADR podstawowy obejmuje cysterny stale i odejmowalne do 1000 l oraz kontenery-cysterny do 3000 l. Powyzej tych progow wymagany jest kurs specjalistyczny cysterny (od 1 m3 = 1000 l).",
  "q": {
    "scenario": {
      "prompt": "Masz tylko ADR podstawowy. Kontener-cysterna 2500 l z olejem napedowym — mozesz?",
      "options": ["Nie, kazda cysterna wymaga kursu", "Tak — kontenery-cysterny do 3000 l sa w zakresie podstawowym", "Tylko do 1000 l"],
      "correct": "Tak — kontenery-cysterny do 3000 l sa w zakresie podstawowym"
    },
    "match": {
      "prompt": "Zakres ADR podstawowego:",
      "pairs": {
        "Cysterna stala/odejmowalna": "do 1000 l",
        "Kontener-cysterna": "do 3000 l"
      }
    }
  }
}, {
  "id": "s-uprawnienia-klasy",
  "block": 1,
  "topic": "Zakres uprawnien",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.2.1",
  "source": "kompendium",
  "page": 13,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "ADR podstawowy pozwala przewozic wszystkie klasy POZA 1 (wybuchowe) i 7 (promieniotworcze), w sztukach przesylki oraz luzem. Klasa 1 i 7 wymagaja osobnych kursow specjalistycznych.",
  "q": {
    "scenario": {
      "prompt": "Masz ADR podstawowy. Ktorych klas NIE wolno Ci wiezc?",
      "options": ["Klasy 3 i 8", "Klasy 1 i 7", "Klasy 6.1 i 6.2"],
      "correct": "Klasy 1 i 7"
    }
  }
}, {
  "id": "s-swiadectwo-kiedy",
  "block": 4,
  "topic": "Praca z dokumentem",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 9.1.3",
  "source": "kompendium",
  "page": 15,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Swiadectwo dopuszczenia (\"czerwony pasek\") wymagane jest dla pojazdow EX/II i EX/III (klasa 1), FL i AT (cysterny) oraz MEMU. Pojazdy przewozace sztuki przesylki (poza wybuchowymi) i luzem NIE musza go miec — np. butle z gazem, DPPL, kanistry.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz butle z gazem i kanistry na skrzyni. Czy pojazd potrzebuje swiadectwa dopuszczenia?",
      "options": ["Tak, zawsze przy ADR", "Nie — sztuki przesylki poza klasa 1 nie wymagaja swiadectwa", "Tak, powyzej 3,5 t"],
      "correct": "Nie — sztuki przesylki poza klasa 1 nie wymagaja swiadectwa"
    }
  }
}, {
  "id": "s-gdzie-sprawdzic",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1 / zrodla",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Kierowca nie musi pamietac wszystkiego — musi wiedziec, gdzie sprawdzic. Wykaz krajow ADR, dodatkowe wymagania krajowe i wykaz tuneli: bit.ly/krajeADR. Tabela A, instrukcje pisemne i formularz multimodalny do pobrania: doradca-adr.com/dokumenty-do-pobrania. Watpliwosci w firmie rozstrzyga doradca DGSA.",
  "q": {
    "match": {
      "prompt": "Gdzie sprawdzasz? Dopasuj zrodlo:",
      "pairs": {
        "Wymagania krajowe i wykaz tuneli": "bit.ly/krajeADR",
        "Tabela A i instrukcje pisemne": "doradca-adr.com/dokumenty-do-pobrania",
        "Watpliwosc w firmie": "doradca DGSA"
      }
    },
    "scenario": {
      "prompt": "Jedziesz do Austrii pierwszy raz. Skad sprawdzisz dodatkowe wymagania tego kraju?",
      "options": ["Z instrukcji pisemnej", "Z wykazu krajow ADR (bit.ly/krajeADR)", "Z tablicy pomaranczowej"],
      "correct": "Z wykazu krajow ADR (bit.ly/krajeADR)"
    }
  }
}, {
  "id": "s-ktora-edycja",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.6",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "ADR nowelizowany jest co 2 lata, nowe przepisy wchodza 1 stycznia roku NIEPARZYSTEGO. Edycje: 2021, 2023, 2025, 2027... Wiedza sprzed dwoch lat moze byc juz nieaktualna — dlatego kazde szkolenie i material trzeba sprawdzic pod katem edycji.",
  "q": {
    "scenario": {
      "prompt": "Masz material szkoleniowy oznaczony \"ADR 2023\". Jest rok 2026. Co to znaczy?",
      "options": ["Material jest aktualny, ADR sie nie zmienia", "Weszla juz edycja 2025 — material moze byc miejscami nieaktualny", "Material wygasl i jest bezuzyteczny"],
      "correct": "Weszla juz edycja 2025 — material moze byc miejscami nieaktualny"
    }
  }
}, {
  "id": "s-okres-przejsciowy",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.6",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Nowe przepisy wchodza 1 stycznia roku nieparzystego, ale do konca czerwca obowiazuje okres przejsciowy — mozna stosowac \"stara\" LUB \"nowa\" wersje przepisow. Od 1 lipca obowiazuje juz tylko nowa.",
  "q": {
    "scenario": {
      "prompt": "Marzec roku nieparzystego. Twoje instrukcje pisemne sa wg poprzedniej edycji ADR. Kontrola. Czy to naruszenie?",
      "options": ["Tak, od stycznia obowiazuje nowa edycja", "Nie — do konca czerwca trwa okres przejsciowy, wolno stosowac stara wersje", "Tak, ale kara jest symboliczna"],
      "correct": "Nie — do konca czerwca trwa okres przejsciowy, wolno stosowac stara wersje"
    }
  }
}, {
  "id": "s-multimodal-przepisy",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.4.2.1 / IMDG",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Poza ADR (droga) obowiazuja: RID (kolej), ADN (srodladowy), IMDG (morski), ICAO TI (lotniczy). Przy przewozie multimodalnym przesylki moga byc oznakowane wg kodeksu morskiego lub lotniczego — wtedy w dokumencie zapis \"Przewoz zgodny z 1.1.4.2.1\". Przed przewozem morskim wymagany jest certyfikat pakowania kontenera.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz kontener do portu, dalej plynie promem. Jakie przepisy obowiazuja na morzu?",
      "options": ["Dalej ADR", "IMDG — kodeks morski", "ICAO TI"],
      "correct": "IMDG — kodeks morski"
    },
    "match": {
      "prompt": "Dopasuj umowe do galezi transportu:",
      "pairs": {
        "ADR": "drogowy",
        "RID": "kolejowy",
        "IMDG": "morski",
        "ICAO TI": "lotniczy"
      }
    }
  }
}, {
  "id": "s-dgsa-czy-potrzebny",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.8.3",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Doradce DGSA powinna wyznaczyc KAZDA firma pakujaca, ladujaca, transportujaca lub rozladowujaca towary niebezpieczne — nie tylko przewoznicy. Kara za niewyznaczenie: 5000 PLN. DGSA sprawdza szkolenia, sporzadza sprawozdanie roczne i raport powypadkowy.",
  "q": {
    "scenario": {
      "prompt": "Jednoosobowa firma transportowa, wozisz tylko paliwo w cysternie. Potrzebujesz DGSA?",
      "options": ["Nie, to za mala firma", "Tak — kazda firma transportujaca towary niebezpieczne musi wyznaczyc doradce", "Tylko jesli zatrudniasz kierowcow"],
      "correct": "Tak — kazda firma transportujaca towary niebezpieczne musi wyznaczyc doradce"
    }
  }
}, {
  "id": "s-odstepstwa-umowy",
  "block": 1,
  "topic": "Podstawy prawne",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.5",
  "source": "kompendium",
  "page": 1,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Kraje moga wprowadzac dodatkowe wymagania (np. przejazd tunelami, okresowe zakazy ruchu) oraz umowy specjalne dopuszczajace odstepstwa od przepisow. Odstepstwa nie moga trwac dluzej niz 5 lat. Wykaz na bit.ly/krajeADR.",
  "q": {
    "scenario": {
      "prompt": "Umowa specjalna dopuszczajaca odstepstwo od ADR moze obowiazywac maksymalnie:",
      "options": ["1 rok", "5 lat", "Bezterminowo do odwolania"],
      "correct": "5 lat"
    }
  }
}, {
  "id": "s-jtr-wyposazenie-liczba",
  "block": 1,
  "topic": "Jednostka i sposoby przewozu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.1.5 / 1.2.1",
  "source": "kompendium",
  "page": 16,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Pulapka: klin pod kola liczy sie NA KAZDY POJAZD (ciagnik + naczepa = 2 kliny), ale stojace znaki ostrzegawcze liczy sie NA JEDNOSTKE TRANSPORTOWA (zestaw = 2 znaki, nie 4). Ciagnik z naczepa to jedna jednostka, ale dwa pojazdy.",
  "q": {
    "scenario": {
      "prompt": "Ciagnik siodlowy z naczepa. Ile klinow i ile stojacych znakow ostrzegawczych?",
      "options": ["1 klin, 2 znaki", "2 kliny (kazdy pojazd), 2 znaki (jednostka)", "2 kliny, 4 znaki"],
      "correct": "2 kliny (kazdy pojazd), 2 znaki (jednostka)"
    },
    "match": {
      "prompt": "Zestaw: ciagnik + naczepa. Ile sztuk?",
      "pairs": {
        "Klin pod kola": "2 — na kazdy pojazd",
        "Stojace znaki ostrzegawcze": "2 — na jednostke",
        "Plyn do plukania oczu": "1 — na pojazd"
      }
    }
  }
}, {
  "id": "s-jtr-paliwo-zestaw",
  "block": 1,
  "topic": "Jednostka i sposoby przewozu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.1.3.3 / 1.2.1",
  "source": "kompendium",
  "page": 9,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Limit 1500 l dotyczy CALEJ jednostki transportowej, nie kazdego pojazdu osobno. Ciagnik 1000 l + naczepa 400 l = 1400 l na jednostke — miesci sie. Ale uwaga: na przyczepie limit to dodatkowo max 500 l.",
  "q": {
    "scenario": {
      "prompt": "Ciagnik ma zbiorniki 1000 l, naczepa dodatkowy zbiornik 400 l. Razem 1400 l. Miesci sie w 1.1.3.3?",
      "options": ["Nie — kazdy pojazd ma limit 1500 l osobno, wiec jest problem", "Tak — 1400 l na cala jednostke, ponizej 1500 l", "Nie — przekroczony limit"],
      "correct": "Tak — 1400 l na cala jednostke, ponizej 1500 l"
    }
  }
}, {
  "id": "s-sposob-przewozu-rozpoznanie",
  "block": 1,
  "topic": "Jednostka i sposoby przewozu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 1.2.1 / 5.3",
  "source": "kompendium",
  "page": 6,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Rozpoznanie sposobu przewozu decyduje o oznakowaniu pojazdu. Sztuki przesylki to opakowania: kanistry, bebny, butle, DPPL, worki, BIG-BAGi, wiazki. Luzem to NIEOPAKOWANE materialy stale, np. zuzyte akumulatory. Cysterna to zbiornik z wyposazeniem.",
  "q": {
    "match": {
      "prompt": "Dopasuj ladunek do sposobu przewozu:",
      "pairs": {
        "BIG-BAGi z granulatem": "sztuki przesylki",
        "Zuzyte akumulatory nieopakowane": "luzem",
        "Paliwo w zbiorniku": "cysterna",
        "Butle gazowe na palecie": "sztuki przesylki"
      }
    },
    "scenario": {
      "prompt": "Wieziesz BIG-BAGi. To sztuki przesylki czy luzem?",
      "options": ["Luzem — material sypki", "Sztuki przesylki — BIG-BAG to opakowanie", "Zalezy od masy"],
      "correct": "Sztuki przesylki — BIG-BAG to opakowanie"
    }
  }
}, {
  "id": "s-luzem-czy-wolno",
  "block": 1,
  "topic": "Jednostka i sposoby przewozu",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR kol. 10/17 Tabeli A",
  "source": "kompendium",
  "page": 6,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Przewoz luzem NIE jest dozwolony domyslnie. Wolno tylko wtedy, gdy w tabeli A w kolumnie 10 lub 17 wskazany jest przepis szczegolny BK1, BK2, BK3, VC1, VC2 lub VC3. Przepisy BK wskazuja specjalny rodzaj kontenera. Przyklad: UN 3257 (material o podwyzszonej temperaturze ciekly) moze byc luzem na podstawie VC3.",
  "q": {
    "scenario": {
      "prompt": "Chcesz przewiezc material stały luzem. Gdzie sprawdzasz, czy wolno?",
      "options": ["W instrukcji pisemnej", "W tabeli A, kolumna 10 lub 17 — musi byc BK lub VC", "Na tablicy pomaranczowej"],
      "correct": "W tabeli A, kolumna 10 lub 17 — musi byc BK lub VC"
    }
  }
}, {
  "id": "s-kto-klasyfikuje-nie-ty",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR czesc 2",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Za klasyfikacje odpowiada PRODUCENT, NADAWCA i IPO (dla klasy 7 — PAA). Kierowca NIE klasyfikuje towaru. Jesli masz watpliwosci co do klasyfikacji, nie zgadujesz — pytasz nadawce albo doradce DGSA.",
  "q": {
    "scenario": {
      "prompt": "Nadawca dal Ci towar bez nalepki. Mowi, ze \"to chyba klasa 3\". Co robisz?",
      "options": ["Naklejam nalepke 3 — brzmi sensownie", "Nie klasyfikuje towaru — to obowiazek nadawcy, zadam prawidlowej klasyfikacji", "Wioze bez nalepki"],
      "correct": "Nie klasyfikuje towaru — to obowiazek nadawcy, zadam prawidlowej klasyfikacji"
    }
  }
}, {
  "id": "s-przypisz-klase",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR czesc 2",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Rozpoznanie klasy po towarze to podstawa. Benzyna i olej napedowy = klasa 3 (ciecze zapalne). Propan/butan = klasa 2 (gazy). Kwas siarkowy = klasa 8 (zrace). Baterie litowe = klasa 9. Azotan amonu = klasa 5.1 (utleniajacy).",
  "q": {
    "match": {
      "prompt": "Dopasuj towar do klasy:",
      "pairs": {
        "Benzyna": "klasa 3",
        "Propan w butli": "klasa 2",
        "Kwas siarkowy": "klasa 8",
        "Baterie litowe": "klasa 9"
      }
    },
    "scenario": {
      "prompt": "Wieziesz azotan amonu, ktory podtrzymuje spalanie. Ktora klasa?",
      "options": ["Klasa 3 — bo palny", "Klasa 5.1 — utleniajacy", "Klasa 9"],
      "correct": "Klasa 5.1 — utleniajacy"
    }
  }
}, {
  "id": "s-grupa-pakowania-ktore-klasy",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.1.1.3",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Grup pakowania NIE MAJA klasy 1, 2, 5.2, 6.2, 7 oraz przedmioty. Jesli w dokumencie przy klasie 2 widzisz grupe pakowania — to blad. Grupa pakowania okresla natezenie zagrozenia dominujacego: I duze, II srednie, III male.",
  "q": {
    "scenario": {
      "prompt": "W dokumencie: UN 1978 PROPAN 2.1 GP II. Co jest nie tak?",
      "options": ["Nic, zapis prawidlowy", "Klasa 2 nie ma grup pakowania — GP II nie powinno tam byc", "Propan to klasa 3"],
      "correct": "Klasa 2 nie ma grup pakowania — GP II nie powinno tam byc"
    }
  }
}, {
  "id": "s-grupa-pakowania-natezenie",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.1.1.3",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Grupa pakowania = natezenie zagrozenia dominujacego. I = duze, II = srednie, III = male. Benzyna UN 1203 = II. Olej napedowy UN 1202 = III. Im nizsza cyfra rzymska, tym grozniejszy towar.",
  "q": {
    "match": {
      "prompt": "Dopasuj grupe pakowania do natezenia zagrozenia:",
      "pairs": {
        "I": "duze zagrozenie",
        "II": "srednie zagrozenie",
        "III": "male zagrozenie"
      }
    },
    "scenario": {
      "prompt": "Dwa towary: jeden GP I, drugi GP III. Ktory jest grozniejszy?",
      "options": ["GP III", "GP I — I oznacza duze zagrozenie", "Takie same"],
      "correct": "GP I — I oznacza duze zagrozenie"
    }
  }
}, {
  "id": "s-kod-klasyfikacyjny",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.1.1.2",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Zagrozenie dodatkowe okreslane jest kodem literowym: F = palne, T = trujace. Kod klasyfikacyjny mowi wiecej niz sama klasa — np. gaz z kodem TF to gaz trujacy i palny jednoczesnie. To druga nalepka w dokumencie przewozowym.",
  "q": {
    "match": {
      "prompt": "Dopasuj kod literowy do zagrozenia:",
      "pairs": {
        "F": "palne",
        "T": "trujace"
      }
    },
    "scenario": {
      "prompt": "Gaz o kodzie klasyfikacyjnym TF. Jakie ma zagrozenia?",
      "options": ["Tylko trujacy", "Trujacy i palny jednoczesnie", "Tylko palny"],
      "correct": "Trujacy i palny jednoczesnie"
    }
  }
}, {
  "id": "s-pozycja-grupowa",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 3.1.2",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Numer UN moze byc przypisany do JEDNEJ substancji (UN 1090 ACETON) albo do POZYCJI GRUPOWEJ — kilku towarow o podobnych wlasciwosciach (UN 1263 FARBA). Przy pozycji grupowej pod jednym numerem UN kryja sie rozne produkty.",
  "q": {
    "scenario": {
      "prompt": "UN 1263 FARBA. Czy to jedna konkretna substancja?",
      "options": ["Tak, jedna farba", "Nie — to pozycja grupowa, wiele produktow o podobnych wlasciwosciach", "To numer zagrozenia"],
      "correct": "Nie — to pozycja grupowa, wiele produktow o podobnych wlasciwosciach"
    },
    "match": {
      "prompt": "Dopasuj typ pozycji:",
      "pairs": {
        "UN 1090 ACETON": "jedna substancja",
        "UN 1263 FARBA": "pozycja grupowa"
      }
    }
  }
}, {
  "id": "s-ino-uzupelnienie",
  "block": 2,
  "topic": "Klasyfikacja",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 3.1.2.8",
  "source": "kompendium",
  "page": 2,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "I.N.O. = inaczej nie okreslony. Wymaga uzupelnienia o nazwy techniczne skladnikow w nawiasie, np. UN 1964 WEGLOWODORY GAZOWE, MIESZANINA SPREZONA I.N.O (zawiera wodor i argon) 2.1 (B/D). Bez tego zapis jest niekompletny.",
  "q": {
    "scenario": {
      "prompt": "W dokumencie: UN 1964 WEGLOWODORY GAZOWE, MIESZANINA SPREZONA I.N.O. 2.1. Czego brakuje?",
      "options": ["Niczego, zapis pelny", "Nazw technicznych skladnikow w nawiasie", "Numeru nalepki"],
      "correct": "Nazw technicznych skladnikow w nawiasie"
    }
  }
}, {
  "id": "s-podklasa-gazu",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.2",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Klasa 2: 2.1 gazy palne (propan), 2.2 gazy niepalne i nietrujace — MOGA BYC DUSZACE (azot, argon), 2.3 gazy trujace (chlor). Pulapka: 2.2 nie jest \"bezpieczny\" — dusi, wypierajac tlen. Dlatego przy gazach unika sie zaglebien terenu.",
  "q": {
    "match": {
      "prompt": "Dopasuj gaz do podklasy:",
      "pairs": {
        "Propan": "2.1 palny",
        "Azot": "2.2 niepalny, duszacy",
        "Chlor": "2.3 trujacy"
      }
    },
    "scenario": {
      "prompt": "Wyciek azotu (2.2) w zaglebieniu terenu. Czy to grozne?",
      "options": ["Nie, azot jest niepalny i nietrujacy", "Tak — dusi, wypierajac tlen; unikac zaglebien", "Tylko przy otwartym ogniu"],
      "correct": "Tak — dusi, wypierajac tlen; unikac zaglebien"
    }
  }
}, {
  "id": "s-podklasa-4",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.41-43",
  "source": "kompendium",
  "page": 3,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Klasa 4: 4.1 zapalne stale i samoreaktywne, 4.2 podatne na samozapalenie (piroforyczne, fosfor bialy, rozdrobnione metale), 4.3 wydzielaja z woda gazy palne. Skutek praktyczny: 4.3 MUSZA byc w pojazdach zamknietych, a uwolniony material trzyma sie w stanie suchym pod przykryciem.",
  "q": {
    "match": {
      "prompt": "Dopasuj podklase klasy 4:",
      "pairs": {
        "4.1": "zapalne stale, samoreaktywne",
        "4.2": "samozapalne (piroforyczne)",
        "4.3": "z woda wydzielaja gazy palne"
      }
    },
    "scenario": {
      "prompt": "Wieziesz material klasy 4.3. Zaczyna padac deszcz, plandeka przecieka. Problem?",
      "options": ["Nie, woda nie szkodzi", "Tak — 4.3 z woda wydziela gazy palne, musi byc pojazd zamkniety", "Tylko przy duzej ilosci"],
      "correct": "Tak — 4.3 z woda wydziela gazy palne, musi byc pojazd zamkniety"
    }
  }
}, {
  "id": "s-podklasa-5",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.51-52",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Klasa 5.1 (utleniajace) same nie musza sie palic, ale WZMAGAJA palenie. Nie wolno ich mieszac z materialami zapalnymi — np. trocinami. W kontakcie moga gwaltownie reagowac, wybuchac, powodowac pozar. 5.2 to nadtlenki organiczne (typy A-F), niektore wybuchowe.",
  "q": {
    "scenario": {
      "prompt": "Material utleniajacy (5.1) rozsypal sie na trociny w naczepie. Zagrozenie?",
      "options": ["Zadne, 5.1 sam sie nie pali", "Powazne — utleniacz z materialem palnym moze gwaltownie reagowac i zapalic sie", "Tylko przy ogrzaniu powyzej 100 st. C"],
      "correct": "Powazne — utleniacz z materialem palnym moze gwaltownie reagowac i zapalic sie"
    }
  }
}, {
  "id": "s-podklasa-6-pulapka",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.61-62",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Klasa 6.1 = trujace (zatrucie przez polkniecie, wdychanie, skore). Klasa 6.2 = zakazne (odpady medyczne, wirusy, bakterie, priony). PULAPKA: NIE wystepuja materialy jednoczesnie zakazne I trujace — takie polaczenie nie istnieje w ADR.",
  "q": {
    "scenario": {
      "prompt": "Czy moze istniec material jednoczesnie zakazny (6.2) i trujacy (6.1)?",
      "options": ["Tak, czesto wystepuje", "Nie — takie polaczenie nie wystepuje w ADR", "Tylko w odpadach medycznych"],
      "correct": "Nie — takie polaczenie nie wystepuje w ADR"
    },
    "match": {
      "prompt": "Dopasuj podklase klasy 6:",
      "pairs": {
        "6.1": "trujace",
        "6.2": "zakazne (odpady medyczne, wirusy)"
      }
    }
  }
}, {
  "id": "s-klasa9-co-tam",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2.2.9",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Klasa 9 to \"rozne\" — wpadaja tu towary bez wspolnego mianownika: azbest, materialy w podwyzszonej temperaturze (stale >240 st. C, ciekle >100 st. C), akumulatory litowe, przedmioty ratownicze, materialy zagrazajace srodowisku wodnemu (UN 3077/3082).",
  "q": {
    "match": {
      "prompt": "Ktore towary naleza do klasy 9?",
      "pairs": {
        "Azbest": "klasa 9",
        "Baterie litowe": "klasa 9",
        "Asfalt 150 st. C": "klasa 9 (podwyzszona temperatura)"
      }
    },
    "scenario": {
      "prompt": "Wieziesz asfalt o temperaturze 150 st. C. Czy to towar niebezpieczny?",
      "options": ["Nie, to zwykly asfalt", "Tak — klasa 9, material ciekly powyzej 100 st. C", "Tak, klasa 3"],
      "correct": "Tak — klasa 9, material ciekly powyzej 100 st. C"
    }
  }
}, {
  "id": "s-co-nie-podlega-adr",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 3.3 SP 188",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Nie podlegaja ADR: akumulatory i ogniwa litowe zawarte w urzadzeniach wg przepisu 188, pojazdy poddane fumigacji, czynniki chlodzace jak UN 1845 suchy lod. Uwaga: mimo ze nie podlegaja ADR, nadal stwarzaja zagrozenie — fumigacja i suchy lod grozą uduszeniem.",
  "q": {
    "match": {
      "prompt": "Dopasuj status:",
      "pairs": {
        "Baterie litowe w urzadzeniu (przepis 188)": "nie podlega ADR",
        "Suchy lod UN 1845": "nie podlega ADR",
        "Jednostka po fumigacji": "nie podlega ADR"
      }
    },
    "scenario": {
      "prompt": "Wieziesz suchy lod jako czynnik chlodzacy. Nie podlega ADR — czy zagrozenie znika?",
      "options": ["Tak, brak ADR = brak zagrozenia", "Nie — nadal grozi uduszeniem, wymaga przewietrzania", "Tylko powyzej 100 kg"],
      "correct": "Nie — nadal grozi uduszeniem, wymaga przewietrzania"
    }
  }
}, {
  "id": "s-temp-kontrolowana-kiedy",
  "block": 2,
  "topic": "Klasy zagrozen",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 7.1.7",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Temperatury kontrolowanej moga wymagac klasy 4.1 (samoreaktywne) i 5.2 (nadtlenki organiczne) — reakcja egzotermiczna. Wtedy: termometr z 2 czujnikami, sprawdzanie co 4-6 h, rejestracja, procedura na wypadek utraty kontroli temperatury. Zapis w dokumencie: TEMPERATURA KONTROLOWANA / TEMPERATURA AWARYJNA.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz nadtlenek organiczny w temperaturze kontrolowanej. Co ile sprawdzasz temperature?",
      "options": ["Co godzine", "Co 4-6 h, z rejestracja", "Raz na poczatku trasy"],
      "correct": "Co 4-6 h, z rejestracja"
    }
  }
}, {
  "id": "s-znak-srodowisko-prog",
  "block": 3,
  "topic": "Materialy zagrazajace srodowisku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.2.1.8.1",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario"],
  "why": "Znak materialu zagrazajacego srodowisku (ryba i uschniete drzewo) umieszcza sie na opakowaniach WIEKSZYCH niz 5 kg lub 5 litrow. Ponizej tego progu znak nie jest wymagany.",
  "q": {
    "scenario": {
      "prompt": "Kanister 3 l z materialem zagrazajacym srodowisku. Czy potrzebny znak ryba/drzewo?",
      "options": ["Tak, zawsze", "Nie — znak od opakowan powyzej 5 kg lub 5 l", "Tylko przy transporcie miedzynarodowym"],
      "correct": "Nie — znak od opakowan powyzej 5 kg lub 5 l"
    }
  }
}, {
  "id": "s-un-3077-3082",
  "block": 3,
  "topic": "Materialy zagrazajace srodowisku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 3.2.1",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["scenario", "match"],
  "why": "Material zagrazajacy srodowisku: UN 3077 gdy STALY, UN 3082 gdy CIEKLY. Oba naleza do klasy 9. Numer rozpoznawczy zagrozenia dla nich to 90.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz ciekly material zagrazajacy srodowisku. Ktory numer UN?",
      "options": ["UN 3077", "UN 3082", "UN 1203"],
      "correct": "UN 3082"
    },
    "match": {
      "prompt": "Dopasuj stan skupienia do numeru UN:",
      "pairs": {
        "Staly": "UN 3077",
        "Ciekly": "UN 3082"
      }
    }
  }
}, {
  "id": "s-znak-temperatura-prog",
  "block": 3,
  "topic": "Materialy zagrazajace srodowisku",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.2.1.8.1",
  "source": "kompendium",
  "page": 4,
  "edition": "ADR 2023",
  "status": "core",
  "verifiedBy": null,
  "formats": ["match", "scenario"],
  "why": "Znak podwyzszonej temperatury (czerwony trojkat z termometrem) dotyczy materialow stalych powyzej 240 st. C i cieklych powyzej 100 st. C. Zagrozenie poparzeniem — unikac kontaktu z goracymi czesciami jednostki i z uwolnionym materialem.",
  "q": {
    "match": {
      "prompt": "Dopasuj prog podwyzszonej temperatury:",
      "pairs": {
        "Material staly": "powyzej 240 st. C",
        "Material ciekly": "powyzej 100 st. C"
      }
    },
    "scenario": {
      "prompt": "Ciekly material o temperaturze 120 st. C. Czy wymaga znaku podwyzszonej temperatury?",
      "options": ["Nie, prog to 240 st. C", "Tak — dla cieklych prog to 100 st. C", "Tylko w cysternie"],
      "correct": "Tak — dla cieklych prog to 100 st. C"
    }
  }
}, {
  "id": "s-2025-dokument-kabina",
  "block": 4,
  "topic": "Zmiany ADR 2025",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 5.4.1 (2025)",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["scenario"],
  "why": "ZMIANA ADR 2025: od 1 lipca 2025 dokumenty przewozowe musza znajdowac sie w kabinie kierowcy. Wczesniej dopuszczalne bylo inne umiejscowienie. Kompendium ADR 2023 tego nie zawiera.",
  "q": {
    "scenario": {
      "prompt": "Kontrola pyta o dokument przewozowy. Zostal w biurze przewoznika. Zgodnie z ADR 2025:",
      "options": ["To dopuszczalne, wystarczy przeslac skan", "Naruszenie — od lipca 2025 dokument musi byc w kabinie", "Zalezy od klasy towaru"],
      "correct": "Naruszenie — od lipca 2025 dokument musi byc w kabinie"
    }
  }
}, {
  "id": "s-2025-baterie-sodowe",
  "block": 2,
  "topic": "Zmiany ADR 2025",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2025 UN 3551/3552",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["match", "scenario"],
  "why": "ZMIANA ADR 2025: wprowadzono baterie sodowo-jonowe — UN 3551 (z elektrolitem organicznym) i UN 3552 (zapakowane z urzadzeniem lub w urzadzeniu). Kod klasyfikacyjny M4 obejmuje teraz baterie litowe i sodowo-jonowe. Kompendium ADR 2023 tego nie zawiera.",
  "q": {
    "match": {
      "prompt": "Dopasuj numer UN (ADR 2025):",
      "pairs": {
        "UN 3551": "baterie sodowo-jonowe z elektrolitem organicznym",
        "UN 3552": "baterie sodowo-jonowe w urzadzeniu lub z urzadzeniem"
      }
    },
    "scenario": {
      "prompt": "Wieziesz baterie sodowo-jonowe. Ktora klasa i numer UN (ADR 2025)?",
      "options": ["Klasa 9, UN 3480 jak litowe", "Klasa 9, UN 3551", "Nie podlega ADR"],
      "correct": "Klasa 9, UN 3551"
    }
  }
}, {
  "id": "s-2025-pojazdy-baterie",
  "block": 2,
  "topic": "Zmiany ADR 2025",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 2025 UN 3556-3558",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["match"],
  "why": "ZMIANA ADR 2025: wprowadzono osobne numery dla pojazdow napedzanych bateriami — UN 3556 (litowo-jonowa), UN 3557 (litowo-metalowa), UN 3558 (sodowo-jonowa). Stosuje sie nowa instrukcje pakowania P912. Kompendium ADR 2023 tego nie zawiera.",
  "q": {
    "match": {
      "prompt": "Dopasuj numer UN do pojazdu (ADR 2025):",
      "pairs": {
        "UN 3556": "pojazd z bateria litowo-jonowa",
        "UN 3557": "pojazd z bateria litowo-metalowa",
        "UN 3558": "pojazd z bateria sodowo-jonowa"
      }
    }
  }
}, {
  "id": "s-2025-lq-szkolenie",
  "block": 1,
  "topic": "Zmiany ADR 2025",
  "kind": "skill",
  "scope": "podstawowy",
  "adrRef": "ADR 8.2.3 (2025)",
  "source": "research",
  "page": null,
  "edition": "ADR 2025",
  "status": "ext-2025",
  "verifiedBy": "domo",
  "formats": ["scenario"],
  "why": "ZMIANA ADR 2025: doprecyzowano wymog szkolenia zalogi przewozacej towary w ilosciach ograniczonych (LQ). Mimo zlagodzenia przepisow dla LQ, szkolenie stanowiskowe pozostaje wymagane i powinno byc udokumentowane. Kompendium ADR 2023 tego nie precyzuje.",
  "q": {
    "scenario": {
      "prompt": "Wieziesz towary w ilosciach ograniczonych (LQ). Czy potrzebujesz szkolenia?",
      "options": ["Nie, LQ jest calkowicie zwolnione", "Tak — szkolenie stanowiskowe, wymog doprecyzowany w ADR 2025", "Tak, pelny kurs ADR"],
      "correct": "Tak — szkolenie stanowiskowe, wymog doprecyzowany w ADR 2025"
    }
  }
},
{
  "id": "x-sp677-baterie-uszkodzone-2025",
  "block": 1, "topic": "Zmiany ADR 2025", "kind": "fact", "scope": "podstawowy",
  "adrRef": "ADR 2025, SP 677 (3.3)", "source": "specialist-training", "page": null,
  "edition": "ADR 2025", "status": "rozszerzenie", "verifiedBy": null, "formats": ["mcq"],
  "why": "ROZSZERZENIE (poza kompendium): ADR 2025 wprowadza przepis szczegolny SP 677 dla baterii litowych i sodowo-jonowych uszkodzonych w sposob krytyczny. Takie baterie przewozi sie jako kategoria transportowa 0 — nigdy nie podlegaja wylaczeniu 1.1.3.6. DO WERYFIKACJI DGSA.",
  "q": { "mcq": { "prompt": "Do jakiej kategorii transportowej ADR 2025 przypisuje krytycznie uszkodzone baterie (SP 677)?", "options": ["Kategoria 0 (nigdy nie zwolniona)", "Kategoria 2", "Kategoria 4 (bez ograniczen)"], "correct": "Kategoria 0 (nigdy nie zwolniona)" } }
},
{
  "id": "x-kamizelka-eniso20471-2025",
  "block": 4, "topic": "Zmiany ADR 2025", "kind": "fact", "scope": "podstawowy",
  "adrRef": "ADR 2025, 8.1.5 + EN ISO 20471:2023", "source": "key-amendments-2025", "page": null,
  "edition": "ADR 2025", "status": "rozszerzenie", "verifiedBy": null, "formats": ["mcq"],
  "why": "ROZSZERZENIE (poza kompendium): ADR 2025 doprecyzowuje, ze kamizelka ostrzegawcza w wyposazeniu pojazdu ma spelniac norme EN ISO 20471:2023 (lepsza widocznosc w slabym swietle). DO WERYFIKACJI DGSA.",
  "q": { "mcq": { "prompt": "Jaka norme ma spelniac kamizelka ostrzegawcza wg ADR 2025?", "options": ["EN ISO 20471:2023", "EN 471:1994 (stara)", "Dowolna kamizelka odblaskowa"], "correct": "EN ISO 20471:2023" } }
},
{
  "id": "x-segregacja-klasa1-uproszczenie-2025",
  "block": 4, "topic": "Zmiany ADR 2025", "kind": "fact", "scope": "specjalistyczny",
  "adrRef": "ADR 2025, 7.5.2.2", "source": "key-amendments-2025", "page": null,
  "edition": "ADR 2025", "status": "rozszerzenie", "verifiedBy": null, "formats": ["mcq"],
  "why": "ROZSZERZENIE (poza kompendium): ADR 2025 upraszcza matryce mieszanego ladowania, szczegolnie dla klasy 1 (materialy wybuchowe). Zakres specjalistyczny. DO WERYFIKACJI DGSA.",
  "q": { "mcq": { "prompt": "Co ADR 2025 zmienil w zasadach mieszanego ladowania?", "options": ["Uproscil matryce, szczegolnie dla klasy 1", "Zniosl wszystkie ograniczenia segregacji", "Wprowadzil zakaz mieszanego ladowania"], "correct": "Uproscil matryce, szczegolnie dla klasy 1" } }
},
{
  "id": "b3-obowiazek-srodowisko",
  "block": 3, "topic": "Obowiazek ochrony srodowiska", "kind": "fact", "scope": "podstawowy",
  "adrRef": "ADR 1.4.1 / 7.5.1", "source": "adr-2025", "page": null,
  "edition": "ADR 2025", "status": "core", "verifiedBy": null, "formats": ["mcq"],
  "why": "Kazdy uczestnik przewozu ma obowiazek podejmowac srodki zapobiegajace szkodzie w srodowisku podczas przewozu, zaladunku i rozladunku. To ogolna zasada — niezaleznie od tego, czy doszlo do wycieku.",
  "q": { "mcq": { "prompt": "Kiedy kierowca ma obowiazek chronic srodowisko przed skazeniem towarem niebezpiecznym?", "options": ["Przez caly czas przewozu, zaladunku i rozladunku", "Tylko po wycieku", "Tylko przy materialach klasy 9"], "correct": "Przez caly czas przewozu, zaladunku i rozladunku" } }
},
{
  "id": "b3-odpady-klasyfikacja",
  "block": 3, "topic": "Odpady", "kind": "fact", "scope": "podstawowy",
  "adrRef": "ADR 2.1.3 / 5.4.1.1.3", "source": "adr-2025", "page": null,
  "edition": "ADR 2025", "status": "core", "verifiedBy": null, "formats": ["mcq", "scenario"],
  "why": "Odpad podlega ADR, jesli spelnia kryteria ktorejs z klas zagrozenia. W dokumencie przed nazwe wpisuje sie slowo ODPAD (np. UN 1230 ODPAD METANOL). Za klasyfikacje odpowiada nadawca/producent, a NIE kierowca.",
  "q": { "mcq": { "prompt": "Kiedy odpad podlega przepisom ADR?", "options": ["Gdy spelnia kryteria ktorejs z klas zagrozenia ADR", "Zawsze — kazdy odpad", "Nigdy — odpady sa wylaczone z ADR"], "correct": "Gdy spelnia kryteria ktorejs z klas zagrozenia ADR" }, "scenario": { "prompt": "Kto odpowiada za sklasyfikowanie odpadu jako towaru niebezpiecznego ADR?", "options": ["Nadawca / producent odpadu", "Kierowca podczas zaladunku", "Odbiorca po dostawie"], "correct": "Nadawca / producent odpadu" } }
},
{
  "id": "b3-numer-zagrozenia-90",
  "block": 3, "topic": "Materialy zagrazajace srodowisku", "kind": "fact", "scope": "podstawowy",
  "adrRef": "ADR 5.3.2.3", "source": "adr-2025", "page": null,
  "edition": "ADR 2025", "status": "core", "verifiedBy": null, "formats": ["mcq", "fill"],
  "why": "Numer rozpoznawczy zagrozenia (gorny numer na tablicy pomaranczowej) dla materialow zagrazajacych srodowisku UN 3077 i UN 3082 to 90. Nalezy do znaczen specjalnych.",
  "q": { "mcq": { "prompt": "Jaki numer rozpoznawczy zagrozenia maja materialy zagrazajace srodowisku UN 3077 i UN 3082?", "options": ["90", "99", "X80"], "correct": "90" }, "fill": { "prompt": "Numer rozpoznawczy zagrozenia dla materialu zagrazajacego srodowisku (UN 3077 / 3082) to ___.", "correct": "90", "hint": "dwie cyfry, znaczenie specjalne" } }
},
{
  "id": "b5-pierwsza-pomoc-kontakt",
  "block": 5, "topic": "Pierwsza pomoc", "kind": "fact", "scope": "podstawowy",
  "adrRef": "ADR 5.4.3 (instrukcje pisemne)", "source": "adr-2025", "page": null,
  "edition": "ADR 2025", "status": "core", "verifiedBy": null, "formats": ["mcq", "scenario"],
  "why": "Przy kontakcie substancji ze skora lub oczami: natychmiast plukac miejsce duza iloscia letniej wody przez co najmniej 15-20 minut, zdejmujac skazona odziez. NIE stosowac srodkow neutralizujacych. DO WERYFIKACJI: tresc medyczna, przeglad ratownik/instruktor.",
  "q": { "mcq": { "prompt": "Co zrobic przy kontakcie substancji niebezpiecznej ze skora lub oczami?", "options": ["Plukac duza iloscia letniej wody min. 15-20 minut", "Przetrzec sucha szmatka", "Posmarowac kremem neutralizujacym"], "correct": "Plukac duza iloscia letniej wody min. 15-20 minut" }, "scenario": { "prompt": "Substancja zraca prysnela kierowcy do oka. Pierwsza czynnosc?", "options": ["Natychmiast plukac oko letnia woda, szeroko otwierajac powieke", "Zamknac oko i czekac na pogotowie", "Przetrzec oko i zneutralizowac substancja zasadowa"], "correct": "Natychmiast plukac oko letnia woda, szeroko otwierajac powieke" } }
},
{
  "id": "b5-zajecia-praktyczne-info",
  "block": 5, "topic": "Reakcja po wypadku", "kind": "ref", "scope": "podstawowy",
  "adrRef": "program kursu (Dz.U. 2021 poz. 2150)", "source": "curriculum", "page": null,
  "edition": "ADR 2025", "status": "info", "verifiedBy": null, "formats": ["mcq"],
  "why": "INFO: zajecia praktyczne z pierwszej pomocy i gaszenia pozaru sa obowiazkowa czescia kursu stacjonarnego ADR. Trening w aplikacji utrwala wiedze, realny skill cwiczy sie na kursie z instruktorem.",
  "q": { "mcq": { "prompt": "Gdzie cwiczy sie praktycznie gaszenie pozaru i pierwsza pomoc w ramach ADR?", "options": ["Na zajeciach praktycznych kursu stacjonarnego z instruktorem", "Wylacznie w aplikacji", "Nie ma zajec praktycznych w kursie ADR"], "correct": "Na zajeciach praktycznych kursu stacjonarnego z instruktorem" } }
}];
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

const PACKS = [{
  id: "tachograf",
  title: "Tachograf",
  icon: "🕐",
  facts: [{
    id: "tacho:symbole",
    formats: ["mcq", "match"],
    why: "Cztery podstawowe symbole aktywności są ustawowe i identyczne w całej UE.",
    q: {
      mcq: {
        prompt: "Który symbol oznacza prowadzenie pojazdu?",
        options: ["Kierownica", "Łóżko", "Skrzyżowane młotki", "Kwadrat"],
        correct: "Kierownica"
      },
      match: {
        prompt: "Dopasuj symbol do aktywności.",
        pairs: {
          "Kierownica": "jazda",
          "Łóżko": "odpoczynek",
          "Skrzyżowane młotki": "inna praca",
          "Kwadrat (przekreślony)": "dyspozycyjność"
        }
      }
    },
    ref: "Rozp. 165/2014"
  }, {
    id: "tacho:karta-56",
    formats: ["mcq", "fill"],
    why: "Kierowca okazuje na kontroli bieżący dzień + poprzednie 56 dni (od 31.12.2024; wcześniej 28).",
    q: {
      mcq: {
        prompt: "Za ile ostatnich dni musisz wykazać aktywność na kontroli?",
        options: ["7 dni", "28 dni", "56 dni", "365 dni"],
        correct: "56 dni"
      },
      fill: {
        prompt: "Kierowca musi okazać aktywność za bieżący dzień i poprzednie ___ dni.",
        correct: "56"
      }
    },
    ref: "Rozp. 165/2014 art. 36 · Pakiet Mobilności"
  }, {
    id: "tacho:zakres-2026",
    formats: ["mcq", "scenario"],
    why: "Od 1 lipca 2026 tachograf obejmuje też pojazdy >2,5 t w transporcie międzynarodowym i kabotażu.",
    q: {
      mcq: {
        prompt: "Od kiedy tachograf obejmuje pojazdy >2,5 t w transporcie międzynarodowym?",
        options: ["Od 2023", "Od 1 lipca 2026", "Od 2028", "Nigdy"],
        correct: "Od 1 lipca 2026"
      },
      scenario: {
        prompt: "Prowadzisz busa 3 t w przewozie międzynarodowym po 1.07.2026. Potrzebujesz tachografu?",
        options: ["Tak, wymagany", "Nie, tylko >3,5 t", "Tylko w Niemczech"],
        correct: "Tak, wymagany"
      }
    },
    ref: "Rozp. 165/2014 zm. 2020/1054"
  }, {
    id: "tacho:wpis-manualny",
    formats: ["mcq", "scenario"],
    why: "Aktywność bez karty w czytniku (np. prom, inna praca) uzupełniasz wpisem manualnym przy najbliższym logowaniu.",
    q: {
      mcq: {
        prompt: "Kiedy robisz wpis manualny?",
        options: ["Nigdy", "Gdy aktywność odbyła się bez karty w tachografie", "Tylko na koniec miesiąca"],
        correct: "Gdy aktywność odbyła się bez karty w tachografie"
      },
      scenario: {
        prompt: "Wracałeś promem 6 h bez karty w czytniku. Co robisz przy najbliższym włożeniu karty?",
        options: ["Nic", "Wpis manualny: odpoczynek na promie", "Wyjmuję kartę na stałe"],
        correct: "Wpis manualny: odpoczynek na promie"
      }
    },
    ref: "Rozp. 165/2014 art. 34"
  }, {
    id: "tacho:awaria",
    formats: ["mcq", "fill"],
    why: "Przy awarii tachografu prowadzisz zapis ręczny (wydruk/rewers), a naprawa w drodze powrotnej lub do 7 dni.",
    q: {
      mcq: {
        prompt: "Co robisz przy awarii tachografu w trasie?",
        options: ["Jadę bez rejestracji", "Prowadzę zapis ręczny aktywności", "Wracam natychmiast do bazy"],
        correct: "Prowadzę zapis ręczny aktywności"
      },
      fill: {
        prompt: "Niesprawny tachograf musi zostać naprawiony najpóźniej w ciągu ___ dni.",
        correct: "7"
      }
    },
    ref: "Rozp. 165/2014 art. 37"
  }]
}, {
  id: "czas-pracy",
  title: "Czas pracy",
  icon: "⏱️",
  facts: [{
    id: "czas:dzienny",
    formats: ["mcq", "fill", "scenario"],
    why: "Dzienny czas prowadzenia to maks. 9 h, do 10 h najwyżej dwa razy w tygodniu.",
    q: {
      mcq: {
        prompt: "Ile wynosi standardowy dzienny limit prowadzenia?",
        options: ["8 h", "9 h", "10 h", "11 h"],
        correct: "9 h"
      },
      fill: {
        prompt: "Dzienny czas jazdy można wydłużyć do 10 h najwyżej ___ razy w tygodniu.",
        correct: "dwa"
      },
      scenario: {
        prompt: "Jechałeś już 9 h dziś i dwa razy w tym tygodniu po 10 h. Możesz dziś jechać dłużej?",
        options: ["Tak, do 10 h", "Nie, limit 10 h wykorzystany 2x", "Tak, bez limitu"],
        correct: "Nie, limit 10 h wykorzystany 2x"
      }
    },
    ref: "Rozp. 561/2006 art. 6 ust. 1"
  }, {
    id: "czas:przerwa-45",
    formats: ["mcq", "match", "order"],
    why: "Po 4,5 h jazdy obowiązkowa przerwa 45 min — w całości albo 15 + 30 min (w tej kolejności).",
    q: {
      mcq: {
        prompt: "Po ilu godzinach jazdy musisz zrobić przerwę?",
        options: ["3 h", "4 h", "4,5 h", "6 h"],
        correct: "4,5 h"
      },
      match: {
        prompt: "Dopasuj przerwę do reguły.",
        pairs: {
          "Przerwa pełna": "45 min",
          "Podział przerwy": "15 + 30 min"
        }
      },
      order: {
        prompt: "Ułóż poprawny podział przerwy 45 min.",
        correct: ["15 min", "30 min"]
      }
    },
    ref: "Rozp. 561/2006 art. 7"
  }, {
    id: "czas:tygodniowy",
    formats: ["mcq", "match"],
    why: "Tygodniowy czas jazdy maks. 56 h; w dwóch kolejnych tygodniach łącznie maks. 90 h.",
    q: {
      mcq: {
        prompt: "Ile wynosi maksymalny tygodniowy czas prowadzenia?",
        options: ["45 h", "56 h", "60 h", "90 h"],
        correct: "56 h"
      },
      match: {
        prompt: "Dopasuj limit do okresu.",
        pairs: {
          "Jeden tydzień": "56 h",
          "Dwa kolejne tygodnie": "90 h"
        }
      }
    },
    ref: "Rozp. 561/2006 art. 6 ust. 2–3"
  }, {
    id: "czas:odp-dzienny",
    formats: ["mcq", "fill", "scenario"],
    why: "Normalny odpoczynek dzienny min. 11 h; skrócony 9 h maks. 3 razy między odpoczynkami tygodniowymi; podział tylko 3 h + 9 h.",
    q: {
      mcq: {
        prompt: "Ile wynosi normalny dzienny odpoczynek?",
        options: ["8 h", "9 h", "11 h", "24 h"],
        correct: "11 h"
      },
      fill: {
        prompt: "Skrócony odpoczynek dzienny (9 h) można stosować maks. ___ razy między odpoczynkami tygodniowymi.",
        correct: "3"
      },
      scenario: {
        prompt: "Chcesz podzielić odpoczynek dzienny. Jaki podział jest dozwolony?",
        options: ["3 h + 9 h (razem 12 h)", "5 h + 6 h", "4 h + 7 h"],
        correct: "3 h + 9 h (razem 12 h)"
      }
    },
    ref: "Rozp. 561/2006 art. 8 ust. 2, 4"
  }, {
    id: "czas:odp-tygodniowy",
    formats: ["mcq", "scenario"],
    why: "Normalny odpoczynek tygodniowy 45 h; skrócony min. 24 h. Regularnego 45 h nie wolno spędzać w kabinie.",
    q: {
      mcq: {
        prompt: "Ile wynosi normalny tygodniowy odpoczynek?",
        options: ["24 h", "36 h", "45 h", "56 h"],
        correct: "45 h"
      },
      scenario: {
        prompt: "Gdzie NIE wolno spędzać regularnego odpoczynku tygodniowego (45 h)?",
        options: ["W hotelu", "W kabinie ciężarówki", "W domu"],
        correct: "W kabinie ciężarówki"
      }
    },
    ref: "Rozp. 561/2006 art. 8 ust. 6, 8"
  }]
}, {
  id: "pierwsza-pomoc",
  title: "Pierwsza pomoc",
  icon: "🩹",
  facts: [{
    id: "pp:kolejnosc",
    formats: ["mcq", "order"],
    why: "Najpierw bezpieczeństwo własne i miejsca, potem ocena poszkodowanego, potem wezwanie pomocy.",
    q: {
      mcq: {
        prompt: "Co robisz jako pierwsze na miejscu wypadku?",
        options: ["Wyciągam poszkodowanego", "Zabezpieczam siebie i miejsce zdarzenia", "Dzwonię do rodziny"],
        correct: "Zabezpieczam siebie i miejsce zdarzenia"
      },
      order: {
        prompt: "Ułóż kolejność działań.",
        correct: ["Zabezpiecz miejsce", "Oceń poszkodowanego", "Zadzwoń 112", "Udziel pomocy do przyjazdu służb"]
      }
    },
    ref: "Łańcuch przeżycia"
  }, {
    id: "pp:112",
    formats: ["mcq", "match"],
    why: "Uniwersalny numer alarmowy w UE to 112. Podajesz: lokalizację, rodzaj zdarzenia, liczbę i stan poszkodowanych.",
    q: {
      mcq: {
        prompt: "Jaki jest uniwersalny numer alarmowy w UE?",
        options: ["112", "911", "999", "997"],
        correct: "112"
      },
      match: {
        prompt: "Dopasuj informację do celu zgłoszenia.",
        pairs: {
          "Lokalizacja": "dokąd jechać",
          "Rodzaj zdarzenia": "jakie służby",
          "Liczba poszkodowanych": "ile zespołów"
        }
      }
    },
    ref: "System 112"
  }, {
    id: "pp:rko",
    formats: ["mcq", "fill"],
    why: "Przy braku oddechu: RKO 30 uciśnięć / 2 oddechy, tempo 100–120/min, głębokość 5–6 cm.",
    q: {
      mcq: {
        prompt: "Jaki jest schemat RKO u dorosłego?",
        options: ["15:2", "30:2", "50:5"],
        correct: "30:2"
      },
      fill: {
        prompt: "Tempo uciśnięć klatki piersiowej to ___–120 na minutę.",
        correct: "100"
      }
    },
    ref: "Wytyczne resuscytacji"
  }, {
    id: "pp:pozycja-boczna",
    formats: ["mcq", "scenario"],
    why: "Nieprzytomnego z zachowanym oddechem układasz w pozycji bocznej — chroni drogi oddechowe.",
    q: {
      mcq: {
        prompt: "Poszkodowany nieprzytomny, ale oddycha. Co robisz?",
        options: ["Pozycja boczna i kontrola oddechu", "RKO natychmiast", "Sadzam go"],
        correct: "Pozycja boczna i kontrola oddechu"
      },
      scenario: {
        prompt: "Kierowca po kolizji nieprzytomny w aucie, oddycha, brak zagrożenia pożarem. Wyciągasz go?",
        options: ["Tak, zawsze", "Nie — nie przemieszczam bez potrzeby, wzywam pomoc", "Tak, żeby ułożyć na ziemi"],
        correct: "Nie — nie przemieszczam bez potrzeby, wzywam pomoc"
      }
    },
    ref: "Wytyczne pierwszej pomocy"
  }, {
    id: "pp:krwotok",
    formats: ["mcq", "order"],
    why: "Krwotok: bezpośredni ucisk na ranę, opatrunek uciskowy, uniesienie kończyny jeśli możliwe.",
    q: {
      mcq: {
        prompt: "Pierwsze działanie przy silnym krwotoku z kończyny?",
        options: ["Bezpośredni ucisk na ranę", "Podanie wody", "Czekanie na karetkę bez działania"],
        correct: "Bezpośredni ucisk na ranę"
      },
      order: {
        prompt: "Ułóż postępowanie przy krwotoku.",
        correct: ["Uciśnij ranę", "Załóż opatrunek uciskowy", "Unieś kończynę", "Kontroluj do przyjazdu służb"]
      }
    },
    ref: "Wytyczne pierwszej pomocy"
  }]
}, {
  id: "eco-driving",
  title: "Eco-driving",
  icon: "🍃",
  facts: [{
    id: "eco:przewidywanie",
    formats: ["mcq", "scenario"],
    why: "Przewidywanie ruchu i utrzymanie płynności ogranicza hamowanie — największe źródło strat energii.",
    q: {
      mcq: {
        prompt: "Co najbardziej obniża spalanie w trasie?",
        options: ["Płynna jazda i przewidywanie", "Częste hamowanie i przyspieszanie", "Jazda na luzie z górki"],
        correct: "Płynna jazda i przewidywanie"
      },
      scenario: {
        prompt: "Widzisz czerwone światło 300 m przed sobą. Co robisz?",
        options: ["Utrzymuję gaz i hamuję przed światłami", "Wcześnie odpuszczam gaz i toczę się", "Przyspieszam, może zdążę"],
        correct: "Wcześnie odpuszczam gaz i toczę się"
      }
    },
    ref: "Zasady eco-drivingu"
  }, {
    id: "eco:obroty",
    formats: ["mcq", "fill"],
    why: "W ciężarówce najekonomiczniejszy zakres to zielone pole obrotomierza (zwykle ok. 1000–1400 obr./min).",
    q: {
      mcq: {
        prompt: "W jakim zakresie obrotów jedziesz najekonomiczniej?",
        options: ["Zielone pole obrotomierza", "Czerwone pole", "Zawsze maksymalne obroty"],
        correct: "Zielone pole obrotomierza"
      },
      fill: {
        prompt: "Ekonomiczny zakres obrotów w ciężarówce zaczyna się zwykle ok. ___ obr./min.",
        correct: "1000"
      }
    },
    ref: "Technika jazdy ciężarówką"
  }, {
    id: "eco:tempomat",
    formats: ["mcq", "scenario"],
    why: "Tempomat (zwłaszcza predykcyjny) wyrównuje prędkość i obniża spalanie na trasie; w terenie górzystym używaj z głową.",
    q: {
      mcq: {
        prompt: "Kiedy tempomat najbardziej oszczędza paliwo?",
        options: ["Na płaskiej trasie", "W korku", "Na stromych zjazdach"],
        correct: "Na płaskiej trasie"
      },
      scenario: {
        prompt: "Długi łagodny zjazd. Co robisz dla ekonomii?",
        options: ["Wykorzystuję rozpęd / eco-roll", "Dodaję gazu", "Hamuję ciągle"],
        correct: "Wykorzystuję rozpęd / eco-roll"
      }
    },
    ref: "Zasady eco-drivingu"
  }, {
    id: "eco:ogumienie",
    formats: ["mcq", "fill"],
    why: "Zbyt niskie ciśnienie w oponach zwiększa opory toczenia i spalanie oraz przyspiesza zużycie.",
    q: {
      mcq: {
        prompt: "Jak niskie ciśnienie w oponach wpływa na spalanie?",
        options: ["Zwiększa je", "Zmniejsza je", "Bez wpływu"],
        correct: "Zwiększa je"
      },
      fill: {
        prompt: "Ciśnienie w oponach sprawdzasz regularnie, minimum raz na ___ (okres).",
        correct: "tydzień"
      }
    },
    ref: "Eksploatacja pojazdu"
  }]
}, {
  id: "zaladunek",
  title: "Załadunek",
  icon: "📦",
  facts: [{
    id: "zal:rozklad-masy",
    formats: ["mcq", "scenario"],
    why: "Środek ciężkości ładunku możliwie nisko i nad osiami; przeciążenie osi to mandat i ryzyko.",
    q: {
      mcq: {
        prompt: "Gdzie powinien wypadać środek ciężkości ładunku?",
        options: ["Jak najniżej, nad osiami", "Jak najwyżej", "Z tyłu naczepy zawsze"],
        correct: "Jak najniżej, nad osiami"
      },
      scenario: {
        prompt: "Ciężka skrzynia i lekkie kartony. Co ładujesz niżej?",
        options: ["Ciężką skrzynię", "Kartony", "Bez znaczenia"],
        correct: "Ciężką skrzynię"
      }
    },
    ref: "Zasady załadunku"
  }, {
    id: "zal:dmc-osie",
    formats: ["mcq", "fill"],
    why: "Sprawdzasz DMC i naciski osi — przeciążenie osi możliwe nawet przy prawidłowej masie całkowitej.",
    q: {
      mcq: {
        prompt: "Czy przy prawidłowej masie całkowitej można przeciążyć oś?",
        options: ["Tak, przy złym rozmieszczeniu", "Nie, nigdy", "Tylko zimą"],
        correct: "Tak, przy złym rozmieszczeniu"
      },
      fill: {
        prompt: "Dopuszczalną masę całkowitą pojazdu oznacza skrót ___.",
        correct: "DMC"
      }
    },
    ref: "Przepisy o ruchu drogowym"
  }, {
    id: "zal:kontrola-trasa",
    formats: ["mcq", "order"],
    why: "Zabezpieczenie ładunku kontrolujesz przed startem, po pierwszych kilometrach i po każdej przerwie.",
    q: {
      mcq: {
        prompt: "Kiedy sprawdzasz zabezpieczenie ładunku?",
        options: ["Nigdy w trasie", "Po pierwszych km i po przerwach", "Tylko na końcu"],
        correct: "Po pierwszych km i po przerwach"
      },
      order: {
        prompt: "Ułóż kolejność kontroli ładunku.",
        correct: ["Sprawdź przed startem", "Sprawdź po pierwszych kilometrach", "Sprawdź po przerwach"]
      }
    },
    ref: "Dobre praktyki mocowania"
  }, {
    id: "zal:dokumenty",
    formats: ["mcq", "match"],
    why: "Załadunek potwierdzasz w dokumentach przewozowych; rozbieżności zgłaszasz przed wyjazdem (uwagi w CMR).",
    q: {
      mcq: {
        prompt: "Widzisz uszkodzone opakowania przy załadunku. Co robisz?",
        options: ["Wpisuję uwagi do CMR przed wyjazdem", "Ignoruję", "Zgłaszam po rozładunku"],
        correct: "Wpisuję uwagi do CMR przed wyjazdem"
      },
      match: {
        prompt: "Dopasuj dokument do funkcji.",
        pairs: {
          "CMR": "międzynarodowy list przewozowy",
          "WZ": "wydanie towaru z magazynu"
        }
      }
    },
    ref: "Konwencja CMR"
  }]
}, {
  id: "mocowanie",
  title: "Mocowanie",
  icon: "🔗",
  facts: [{
    id: "moc:metody",
    formats: ["mcq", "match"],
    why: "EN 12195-1 przewiduje trzy metody: mocowanie (lashing), blokowanie (blocking), ryglowanie (locking).",
    q: {
      mcq: {
        prompt: "Które to metody zabezpieczania wg EN 12195-1?",
        options: ["Mocowanie, blokowanie, ryglowanie", "Klejenie, wiązanie, ważenie", "Tylko pasy"],
        correct: "Mocowanie, blokowanie, ryglowanie"
      },
      match: {
        prompt: "Dopasuj metodę do opisu.",
        pairs: {
          "Mocowanie (lashing)": "pasy/łańcuchy napinające ładunek",
          "Blokowanie (blocking)": "oparcie o ścianę/belki",
          "Ryglowanie (locking)": "mechaniczne zamki (np. twist-lock)"
        }
      }
    },
    ref: "EN 12195-1:2010"
  }, {
    id: "moc:lc",
    formats: ["mcq", "fill"],
    why: "LC (Lashing Capacity) to maksymalna dopuszczalna siła robocza pasa, w daN na etykiecie.",
    q: {
      mcq: {
        prompt: "Co oznacza LC na etykiecie pasa?",
        options: ["Długość pasa", "Maksymalną siłę roboczą (daN)", "Kolor pasa"],
        correct: "Maksymalną siłę roboczą (daN)"
      },
      fill: {
        prompt: "LC (Lashing Capacity) podaje się w jednostce ___.",
        correct: "daN"
      }
    },
    ref: "EN 12195-2"
  }, {
    id: "moc:stf-shf",
    formats: ["mcq", "match"],
    why: "STF to siła napięcia pozostająca w pasie po naprężeniu; SHF (ok. 50 daN) to znormalizowana siła ręki.",
    q: {
      mcq: {
        prompt: "Co opisuje STF?",
        options: ["Siłę napięcia pasa po naprężeniu", "Długość pasa", "Wagę ładunku"],
        correct: "Siłę napięcia pasa po naprężeniu"
      },
      match: {
        prompt: "Dopasuj skrót do znaczenia.",
        pairs: {
          "LC": "maks. siła robocza",
          "STF": "siła napięcia wstępnego",
          "SHF": "siła ręki (~50 daN)"
        }
      }
    },
    ref: "EN 12195-2 — etykieta pasa"
  }, {
    id: "moc:tarcie",
    formats: ["mcq", "scenario"],
    why: "Maty antypoślizgowe zwiększają współczynnik tarcia — mniej pasów potrzebnych do tej samej pewności.",
    q: {
      mcq: {
        prompt: "Po co stosuje się maty antypoślizgowe?",
        options: ["Zwiększają tarcie, mniej pasów", "Dla koloru", "Zastępują pasy całkowicie"],
        correct: "Zwiększają tarcie, mniej pasów"
      },
      scenario: {
        prompt: "Paleta na śliskiej podłodze naczepy. Co poprawi zabezpieczenie najprościej?",
        options: ["Mata antypoślizgowa pod paletę", "Wyższa prędkość", "Nic"],
        correct: "Mata antypoślizgowa pod paletę"
      }
    },
    ref: "EN 12195-1 — współczynnik tarcia"
  }, {
    id: "moc:stan-pasa",
    formats: ["mcq", "scenario"],
    why: "Pas z przecięciami, przetarciami szwów lub nieczytelną etykietą wycofujesz z użycia.",
    q: {
      mcq: {
        prompt: "Kiedy pas nadaje się do wycofania?",
        options: ["Przecięcia/przetarcia lub brak etykiety", "Gdy jest brudny", "Po każdym kursie"],
        correct: "Przecięcia/przetarcia lub brak etykiety"
      },
      scenario: {
        prompt: "Pas ma naderwany szew, ale „jeszcze trzyma”. Używasz go?",
        options: ["Nie — wycofuję z użycia", "Tak, jak zawsze", "Tak, tylko na krótkie trasy"],
        correct: "Nie — wycofuję z użycia"
      }
    },
    ref: "EN 12195-2 — kontrola stanu"
  }]
}];

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
const MIN = 60 * 1000,
  DAY = 24 * 60 * 60 * 1000;
const INTERVALS = {
  1: 10 * MIN,
  2: DAY,
  3: 3 * DAY,
  4: 7 * DAY,
  5: 16 * DAY
};
const newFact = id => ({
  id,
  box: 1,
  dueAt: null,
  seen: 0,
  correct: 0,
  lapses: 0
});
function review(f, answer, now) {
  const seen = f.seen + 1;
  if (answer === "correct") {
    const box = Math.min(f.box + 1, 5);
    return {
      ...f,
      box,
      dueAt: now + INTERVALS[box],
      seen,
      correct: f.correct + 1
    };
  }
  return {
    ...f,
    box: 1,
    dueAt: now + INTERVALS[1],
    seen,
    correct: 0,
    lapses: f.box > 1 ? f.lapses + 1 : f.lapses
  };
}
function buildQueue(facts, now, {
  max = 60,
  newLimit = 60
} = {}) {
  const due = [],
    fresh = [];
  for (const f of facts) {
    if (f.dueAt === null) fresh.push(f);else if (f.dueAt <= now) due.push(f);
  }
  due.sort((a, b) => a.dueAt - b.dueAt);
  fresh.sort((a, b) => a.box - b.box || (a.id < b.id ? -1 : 1));
  return [...due, ...fresh.slice(0, newLimit)].slice(0, max);
}
const FORMAT_BY_BOX = {
  1: ["mcq"],
  2: ["mcq", "match"],
  3: ["match", "fill"],
  4: ["fill", "order"],
  5: ["order", "scenario"]
};
function pickFormat(box, supported, rand = 0) {
  const b = Math.max(1, Math.min(5, box));
  const pref = FORMAT_BY_BOX[b].filter(f => supported.includes(f));
  const pool = pref.length ? pref : supported;
  return pool[Math.min(pool.length - 1, Math.floor(rand * pool.length))];
}
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
  const k = license.load();
  return !!(k && k.length > 3);
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
      max: 60,
      newLimit: 60
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
        onBack: onExit,
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
    onBack: () => setScreen("modules"),
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
    onReset: () => {
      storage.clear();
      setStates(ALL.map(f => newFact(f.id)));
    }
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
  }, "Gotów na dziś?")), /*#__PURE__*/React.createElement("div", {
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
  }), /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.text, false, C.line),
    onClick: onProgress
  }, "Mój postęp")), /*#__PURE__*/React.createElement(TrFoot, null));
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
    left: /*#__PURE__*/React.createElement(BackBtn, {
      onBack: onBack
    })
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
  }, "Gotów na dziś?")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderRadius: 10,
      background: C.card,
      border: `1px solid ${C.line}`,
      fontSize: 12,
      color: C.dim,
      lineHeight: 1.5
    }
  }, "Pomogę Ci przygotować się do egzaminu albo razem sprawdzimy, czy wszystko pamiętasz."), /*#__PURE__*/React.createElement("div", {
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
  }, "Jak zdobyć uprawnienia ADR"), /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.text, false, C.line),
    onClick: onProgress
  }, "Mój postęp")), /*#__PURE__*/React.createElement(TrFoot, null));
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
  }, fmtCorrect(question))), question.why && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: 13,
      color: "#9AA0AA",
      lineHeight: 1.5
    }
  }, question.why), /*#__PURE__*/React.createElement("div", {
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
  onReset
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const byBox = [1, 2, 3, 4, 5].map(b => states.filter(s => s.box === b).length);
  const blockStats = BLOCKS.map(b => {
    const st = states.filter(s => FACTS.find(f => f.id === s.id)?.block === b.id);
    return {
      ...b,
      total: st.length,
      started: st.filter(s => s.box >= 2).length,
      learned: st.filter(s => s.box >= 4).length
    };
  });
  return /*#__PURE__*/React.createElement(TrShell, null, /*#__PURE__*/React.createElement(TrHeader, {
    title: "Postęp",
    left: /*#__PURE__*/React.createElement(BackBtn, {
      onBack: onHome
    })
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
      ...cardStyle
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      marginBottom: 14,
      fontFamily: C.mono
    }
  }, "ROZKŁAD W PUDEŁKACH LEITNERA"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 8,
      height: 110
    }
  }, byBox.map((n, i) => {
    const max = Math.max(...byBox, 1);
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        fontWeight: 800,
        fontFamily: C.mono,
        color: n ? C.greenLite : C.faint
      }
    }, n), /*#__PURE__*/React.createElement("div", {
      style: {
        width: "100%",
        height: `${n / max * 70 + 4}px`,
        borderRadius: 6,
        background: i >= 3 ? C.green : i >= 1 ? C.amber : C.red,
        opacity: n ? 1 : 0.25,
        transition: "height .4s"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11,
        color: C.dim,
        fontFamily: C.mono
      }
    }, i + 1));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: C.dim,
      marginBottom: 12,
      fontFamily: C.mono
    }
  }, "POSTĘP PER BLOK"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, blockStats.map(bs => {
    const p = bs.total ? Math.round(bs.started / bs.total * 100) : 0;
    return /*#__PURE__*/React.createElement("div", {
      key: bs.id
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        marginBottom: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.text
      }
    }, bs.name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.dim,
        fontFamily: C.mono
      }
    }, bs.started, "/", bs.total, " · ", bs.learned, "★")), /*#__PURE__*/React.createElement("div", {
      style: {
        height: 5,
        borderRadius: 3,
        background: C.line,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${p}%`,
        background: p >= 80 ? C.green : p >= 40 ? C.amber : C.red,
        transition: "width .4s"
      }
    })));
  }))), /*#__PURE__*/React.createElement("button", {
    style: btn(C.red, "#fff"),
    onClick: onHome
  }, "Wróć na start"), !confirmReset ? /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.dim, false, C.line),
    onClick: () => setConfirmReset(true)
  }, "Wyczyść mój postęp") : /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardStyle,
      borderColor: C.red + "55"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.text,
      marginBottom: 12,
      lineHeight: 1.5
    }
  }, "Na pewno? Cały postęp nauki zostanie trwale usunięty."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: btn(C.card, C.text, false, C.line),
    onClick: () => setConfirmReset(false)
  }, "Anuluj"), /*#__PURE__*/React.createElement("button", {
    style: btn(C.red, "#fff"),
    onClick: () => {
      onReset();
      setConfirmReset(false);
      onHome();
    }
  }, "Usuń")))), /*#__PURE__*/React.createElement(TrFoot, null));
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
  }, habitPill, right || null);
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
