export type LocalizedOrganizationName = {
  nameVi?: string | null;
  nameJa?: string | null;
  name?: string | null;
};

export function getLocalizedOrganizationName(
  item: LocalizedOrganizationName | null | undefined,
  language: string
): string {
  const normalized = normalizeLocalizedOrganizationName(item);
  if (!normalized?.nameVi) {
    return "";
  }

  if (language.startsWith("ja")) {
    return normalized.nameJa?.trim() || normalized.nameVi;
  }

  return normalized.nameVi;
}

/** Backward compat when API still returns legacy `name` field */
export function normalizeLocalizedOrganizationName(
  item: LocalizedOrganizationName | null | undefined
): LocalizedOrganizationName | null {
  if (!item) return null;

  return {
    nameVi: item.nameVi ?? item.name ?? "",
    nameJa: item.nameJa ?? ""
  };
}
