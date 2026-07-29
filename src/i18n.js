// i18n — lekka warstwa tłumaczeń (scaffold). PL działa; EN/DE/UK/RU dokładane partiami.
// Użycie: t("klucz", "fallback PL"). Zmiana języka: setLang(kod) -> reload.
export const LANGS = [
  ["pl", "Polski"],
  ["en", "English"],
  ["de", "Deutsch"],
  ["uk", "Українська"],
  ["ru", "Русский"],
];
const KEY = "masteradr.lang.v1";

export function getLang() {
  try { return localStorage.getItem(KEY) || "pl"; } catch (e) { return "pl"; }
}
export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch (e) {}
}

// Słownik. Klucz -> { pl, en, de, uk, ru }. Brakujące języki spadają na PL.
const DICT = {
  "home.ready": {
    pl: "Gotów na dziś?",
    en: "Ready for today?",
    de: "Bereit für heute?",
    uk: "Готові до сьогодні?",
    ru: "Готовы на сегодня?",
  },
  "home.intro": {
    pl: "Poprowadzę Cię przez cały materiał ADR — krok po kroku, w Twoim tempie. Podsuwam pytania dokładnie wtedy, gdy zaczynasz zapominać, żeby wiedza została na egzamin i na trasę.",
    en: "I'll guide you through the whole ADR material — step by step, at your pace. I serve up questions right when you start to forget, so the knowledge sticks for the exam and the road.",
    de: "Ich führe dich durch den gesamten ADR-Stoff — Schritt für Schritt, in deinem Tempo. Ich stelle Fragen genau dann, wenn du zu vergessen beginnst, damit das Wissen für die Prüfung und die Straße bleibt.",
    uk: "Проведу тебе через увесь матеріал ADR — крок за кроком, у твоєму темпі. Підкидаю питання саме тоді, коли починаєш забувати, щоб знання залишились для іспиту й дороги.",
    ru: "Проведу тебя через весь материал ADR — шаг за шагом, в твоём темпе. Подкидываю вопросы именно тогда, когда начинаешь забывать, чтобы знания остались для экзамена и дороги.",
  },
  "home.daily": {
    pl: "Powtórka dnia",
    en: "Daily review",
    de: "Tägliche Wiederholung",
    uk: "Щоденне повторення",
    ru: "Ежедневное повторение",
  },
  "profile.title": {
    pl: "PROFIL", en: "PROFILE", de: "PROFIL", uk: "ПРОФІЛЬ", ru: "ПРОФИЛЬ",
  },
  "profile.login": {
    pl: "Zaloguj się", en: "Log in", de: "Anmelden", uk: "Увійти", ru: "Войти",
  },
  "profile.lang": {
    pl: "Język", en: "Language", de: "Sprache", uk: "Мова", ru: "Язык",
  },
};

export function t(key, fallback) {
  const l = getLang();
  const e = DICT[key];
  if (e) return e[l] || e.pl || fallback || key;
  return fallback || key;
}
