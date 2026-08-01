import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ForkliftIcon, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { FilterKey } from "../index";
import { SEARCH_KEYWORD_MAX_LENGTH } from "@/shared/constants/search.constant";

interface Filters {
  name: string;
  contactPerson: string;
  search: string;
}

export default function SuppliersFilter({
  filters,
  onFilterChange,
  onApply
}: {
  filters: Filters;
  onFilterChange: (key: FilterKey, value?: string) => void;
  onApply: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="
    relative
    overflow-hidden

    flex flex-wrap gap-4 p-5 mb-6

    rounded-[24px]

    border border-blue-200

    bg-gradient-to-r
    from-[#EEF5FF]
    via-white
    to-[#EAF3FF]

    shadow-md

    before:absolute
    before:top-0
    before:left-0
    before:h-full
    before:w-1

    before:bg-gradient-to-b
    before:from-blue-400
    before:to-blue-600
  "
    >
      <ForkliftIcon
        size={100}
        className="
      absolute
      -top-6
      -right-6

      text-blue-500/10

      rotate-12

      pointer-events-none
      select-none
    "
      />
      <div className="relative max-w-sm flex-grow">
        <Input
          placeholder={t("common.searchPlaceholder") as string}
          value={filters.search}
          maxLength={SEARCH_KEYWORD_MAX_LENGTH}
          onChange={e => onFilterChange("search", e.target.value)}
          className="w-full pl-10"
        />
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* <div className="relative max-w-sm flex-grow">
        <Input
          placeholder={t("supplier.name")}
          value={filters.name}
          onChange={(e) => onFilterChange("name", e.target.value)}
          className="w-full"
        />
      </div>

      <div className="relative max-w-sm flex-grow">
        <Input
          placeholder={t("supplier.contactPerson")}
          value={filters.contactPerson}
          onChange={(e) => onFilterChange("contactPerson", e.target.value)}
          className="w-full"
        />
      </div> */}

      <Button
        variant="ghost"
        onClick={() => onFilterChange("reset")}
        className="gap-2"
      >
        <X size={16} />
        {t("employees.filter.deleteFilter")}
      </Button>

      <Button type="button" onClick={onApply} className="gap-2 z-[49]">
        <Search size={16} />
        {t("employees.search")}
      </Button>
    </div>
  );
}
