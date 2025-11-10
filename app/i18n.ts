import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { LANGUAGES, DEFAULT_LANGUAGE } from "./consts/i18n.const";

// Import translation files
import en from "./locales/en.json";
import zh from "./locales/zh.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";
import pt from "./locales/pt.json";
import id from "./locales/id.json";
import fr from "./locales/fr.json";
import ja from "./locales/ja.json";
import ru from "./locales/ru.json";
import de from "./locales/de.json";

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  es: { translation: es },
  ar: { translation: ar },
  pt: { translation: pt },
  id: { translation: id },
  fr: { translation: fr },
  ja: { translation: ja },
  ru: { translation: ru },
  de: { translation: de },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES.map((lang) => lang.code),
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
