import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { LucideIdCard, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import type { FilterKey } from "../index";
import { SEARCH_KEYWORD_MAX_LENGTH } from "@/shared/constants/search.constant";

interface EmployeeFilters {
  status: string;
  department: string;
  position: string;
  search: string;
}

interface EmployeesFilterProps {
  filters: EmployeeFilters;
  onFilterChange: (type: FilterKey, value?: string) => void;
  onApply: () => void;
  departments: { id: string; nameVi: string; nameJa?: string; name?: string }[];
  positions: { id: string; nameVi: string; nameJa?: string; name?: string }[];
}

export default function EmployeesFilter({
  filters,
  onFilterChange,
  onApply,
  departments,
  positions
}: EmployeesFilterProps) {
  const { t, i18n } = useTranslation();

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
      <LucideIdCard
        size={100}
        className="
      absolute
      -top-6
      -right-6

      text-blue-500/10

      rotate-45

      pointer-events-none
      select-none
    "
      />
      <div className="relative max-w-sm flex-grow">
        <Input
          placeholder={t("employees.filter.placeholder")}
          value={filters.search}
          maxLength={SEARCH_KEYWORD_MAX_LENGTH}
          onChange={e => onFilterChange("search", e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApply();
            }
          }}
          className="w-full pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      <Select
        value={filters.status}
        onValueChange={value => onFilterChange("status", value)}
      >
        <SelectTrigger className="w-[180px] bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder={t("employees.status.label")} />
        </SelectTrigger>
        <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
          <SelectItem value="all">{t("employees.status.all")}</SelectItem>
          <SelectItem value="active">{t("employees.status.active")}</SelectItem>
          <SelectItem value="inactive">
            {t("employees.status.inactive")}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.department}
        onValueChange={value => onFilterChange("department", value)}
      >
        <SelectTrigger className="w-[180px] bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder={t("employees.department.label")} />
        </SelectTrigger>
        <SelectContent className="bg-white">
          <SelectItem value="all">{t("employees.department.all")}</SelectItem>
          {departments.map(department => (
            <SelectItem key={department.id} value={department.id}>
              {getLocalizedOrganizationName(department, i18n.language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.position}
        onValueChange={value => onFilterChange("position", value)}
      >
        <SelectTrigger className="w-[180px] bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder={t("employees.position.label")} />
        </SelectTrigger>
        <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
          <SelectItem value="all">{t("employees.position.all")}</SelectItem>
          {positions.map(position => (
            <SelectItem key={position.id} value={position.id}>
              {getLocalizedOrganizationName(position, i18n.language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
