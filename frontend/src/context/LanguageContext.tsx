import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode
} from "react";
import { useTranslation } from "react-i18next";

export enum LanguageKey {
  JA = "ja",
  VI = "vi"
}

interface LanguageContextType {
  currentLanguage: LanguageKey;
  changeLanguage: (lng: LanguageKey) => void;
  languages: { code: LanguageKey; name: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

interface LanguageProviderProps {
  children: ReactNode;
}

const LANGUAGES: { code: LanguageKey; name: string }[] = [
  { code: LanguageKey.VI, name: "Tiếng Việt" },
  { code: LanguageKey.JA, name: "日本語" }
];

const getInitialLanguage = (): LanguageKey => {
  if (typeof window === "undefined") return LanguageKey.VI;
  const saved = localStorage.getItem("i18nextLng");
  if (saved === LanguageKey.JA || saved === LanguageKey.VI) return saved;
  return LanguageKey.VI;
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] =
    useState<LanguageKey>(getInitialLanguage);

  useEffect(() => {
    const saved = localStorage.getItem("i18nextLng");
    if (saved === LanguageKey.JA || saved === LanguageKey.VI) {
      setCurrentLanguage(saved);
    }
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(currentLanguage);
  }, [currentLanguage, i18n]);

  const changeLanguage = useCallback(
    (lng: LanguageKey) => {
      setCurrentLanguage(prev => {
        if (prev === lng) return prev;
        localStorage.setItem("i18nextLng", lng);
        return lng;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      currentLanguage,
      changeLanguage,
      languages: LANGUAGES
    }),
    [currentLanguage, changeLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
