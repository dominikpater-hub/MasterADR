# DriverOS Trener ADR — budowa apki na Androida (ThinkPad)

Ten projekt jest **gotowy do zbudowania**. Poniżej dokładne kroki. Przetestowane —
`npm install` i `npm run build` przechodzą. Twoje zadanie: zainstalować narzędzia,
rozpakować projekt, odpalić kilka komend.

---

## CO MUSISZ ZAINSTALOWAĆ (raz)

### 1. Node.js 22+
Capacitor 7 wymaga Node 20+, ale weź 22 LTS (najbezpieczniej).
- Pobierz: https://nodejs.org (wersja LTS)
- Sprawdź po instalacji w terminalu:
  ```
  node --version    # ma być v20 lub v22+
  npm --version
  ```

### 2. Android Studio (najnowszy stabilny)
- Pobierz: https://developer.android.com/studio
- **Ważne:** Android Studio instaluje JDK sam. NIE musisz osobno ściągać Javy.
- W trakcie instalacji (Setup Wizard) zgódź się na pobranie Android SDK.
- Po instalacji otwórz raz Android Studio, żeby dokończył pobieranie SDK.

### 3. Zmienne środowiskowe (Android SDK)
Android Studio wie, gdzie jest SDK, ale terminal musi też wiedzieć.
- **Windows:** dodaj do zmiennych środowiskowych:
  - `ANDROID_HOME` = `C:\Users\TWOJA_NAZWA\AppData\Local\Android\Sdk`
- **Linux/Mac:** dodaj do `~/.bashrc` lub `~/.zshrc`:
  ```
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools
  ```
- Zrestartuj terminal.

---

## BUDOWA APKI (za każdym razem, gdy zmienisz kod)

Rozpakuj ten projekt gdzieś na dysku, wejdź do folderu w terminalu, potem:

### Krok 1 — zainstaluj zależności projektu
```
npm install
```

### Krok 2 — zbuduj apkę webową
```
npm run build
```
Powstanie folder `dist/` — to jest twoja apka jako strona web.

### Krok 3 — dodaj platformę Android (TYLKO ZA PIERWSZYM RAZEM)
```
npx cap add android
```
Powstanie folder `android/` — to jest natywny projekt Android Studio.

### Krok 4 — zsynchronizuj (za każdym razem po `npm run build`)
```
npx cap sync
```
To wrzuca zbudowaną apkę web do projektu Android.

### Krok 5 — otwórz w Android Studio
```
npx cap open android
```
Android Studio się otworzy. Poczekaj, aż zakończy "Gradle sync" (pasek na dole).

### Krok 6 — uruchom
- Podłącz telefon kablem USB (włącz "debugowanie USB" w opcjach programisty telefonu)
  **albo** uruchom emulator (Device Manager w Android Studio → utwórz urządzenie API 24+).
- Kliknij zielony przycisk ▶ (Run).
- Apka wgra się na telefon/emulator i uruchomi.

---

## GDY CHCESZ WYSŁAĆ DO GOOGLE PLAY

Potrzebujesz podpisanego pliku AAB (Android App Bundle):

1. W Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**
2. Utwórz klucz podpisu (keystore) — **ZAPISZ GO I HASŁO**, bez tego nie zaktualizujesz apki nigdy.
3. Wybierz wariant **release**.
4. Powstanie plik `.aab` — ten wrzucasz do Google Play Console.

Do tego jeszcze będziesz potrzebował (osobno, poza kodem):
- Konto Google Play Developer ($25 jednorazowo)
- Polityka prywatności (URL) — bo apka zapisuje dane lokalnie
- Ikona, screeny, opis w sklepie
- Wypełniona sekcja "Data safety" (zapis lokalny, brak wysyłki danych)

---

## TYPOWE PROBLEMY

**"Gradle sync failed"** → Android Studio → File → Invalidate Caches → Restart.
Zwykle to kwestia niedokończonego pobierania SDK.

**"SDK location not found"** → nie ustawiłeś `ANDROID_HOME`. Wróć do sekcji zmiennych.

**Biała apka po uruchomieniu** → sprawdź, czy zrobiłeś `npm run build` PRZED `npx cap sync`.
Kolejność: build → sync → open.

**Apka nie widzi zmian w kodzie** → po każdej zmianie: `npm run build` potem `npx cap sync`.
Sam `open` nie odświeża.

---

## STRUKTURA PROJEKTU

```
driveros-adr/
├── src/
│   ├── AdrTrainer.jsx        # główny komponent (trener)
│   ├── adr-content-full.js   # 218 pozycji ADR (treść)
│   └── main.jsx              # punkt wejścia React
├── index.html                # szkielet HTML
├── package.json              # zależności
├── vite.config.js            # konfiguracja budowania
├── capacitor.config.json     # konfiguracja apki (nazwa, ID, kolor)
└── dist/                     # (powstaje po build) apka web
    └── android/              # (powstaje po cap add) projekt Android Studio
```

Zmiana treści ADR → edytuj `src/adr-content-full.js`, potem build + sync.
Zmiana wyglądu/logiki → edytuj `src/AdrTrainer.jsx`, potem build + sync.
Zmiana nazwy/ID apki → edytuj `capacitor.config.json` PRZED `cap add android`.
