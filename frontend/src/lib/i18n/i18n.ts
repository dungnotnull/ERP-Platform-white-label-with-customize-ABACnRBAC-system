import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import jaTranslation from "@/lib/i18n/locales/ja/trans.json";
import viTranslation from "@/lib/i18n/locales/vi/trans.json";
import config, { NodeEnv } from "@/shared/constants/config.constant.ts";

const resources = {
  ja: {
    translation: jaTranslation
  },
  vi: {
    translation: viTranslation
  }
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "vi",
    supportedLngs: ["vi", "ja"],
    defaultNS: "translation",
    debug: config.env === NodeEnv.DEV,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng"
    }
  });

export default i18n;
