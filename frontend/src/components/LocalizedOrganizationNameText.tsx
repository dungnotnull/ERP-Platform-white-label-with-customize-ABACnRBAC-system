import { useLocalizedOrganizationName } from "@/hooks/useLocalizedOrganizationName";
import { LocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";

type LocalizedOrganizationNameTextProps = {
  item: (LocalizedOrganizationName & { name?: string }) | null | undefined;
  fallback?: string;
};

export function LocalizedOrganizationNameText({
  item,
  fallback = "—"
}: LocalizedOrganizationNameTextProps) {
  const label = useLocalizedOrganizationName(item);
  return <>{label || fallback}</>;
}
