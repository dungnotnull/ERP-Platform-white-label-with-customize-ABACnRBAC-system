import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  getLocalizedOrganizationName,
  LocalizedOrganizationName,
  normalizeLocalizedOrganizationName
} from "@/shared/utils/localizedOrganizationName.util";

export function useLocalizedOrganizationName(
  item: (LocalizedOrganizationName & { name?: string }) | null | undefined
): string {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const normalized = normalizeLocalizedOrganizationName(item);
    return getLocalizedOrganizationName(normalized, i18n.language);
  }, [item, i18n.language]);
}
