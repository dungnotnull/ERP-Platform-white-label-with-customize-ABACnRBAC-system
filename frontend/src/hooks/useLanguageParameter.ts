import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LanguageKey, useLanguage } from "@/context/LanguageContext";

export function useLanguageParameter() {
  const { search } = useLocation();
  const { changeLanguage } = useLanguage();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const langParam = params.get("lang");

    if (
      langParam &&
      (langParam === LanguageKey.JA || langParam === LanguageKey.VI)
    ) {
      changeLanguage(langParam);
    }
  }, [search, changeLanguage]);
}
