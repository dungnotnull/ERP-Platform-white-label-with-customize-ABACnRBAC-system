import { useLanguage } from "@/context/LanguageContext";

export function useUrlWithLanguage() {
  const { currentLanguage } = useLanguage();

  const getUrlWithLanguage = (url: string) => {
    const hasQueryParams = url.includes("?");
    const separator = hasQueryParams ? "&" : "?";

    return `${url}${separator}lang=${currentLanguage}`;
  };

  return { getUrlWithLanguage };
}
