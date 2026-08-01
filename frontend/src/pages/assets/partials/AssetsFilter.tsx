import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Cpu, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AssetStatus } from "@/shared/enums/assets.enum.ts";
import { DropdownOption } from "@/components/patterns/CustomSelect.tsx";

interface DeviceFilters {
  type: string;
  status: string;
  search: string;
}

interface DeviceType {
  id: string;
  name: string;
}

interface DeviceStatus {
  id: string;
  name: string;
}

export const mappingAssetStatusColor: Record<AssetStatus, [string, string]> = {
  [AssetStatus.USABLE]: ["#14532D", "#F0FDF4"],
  [AssetStatus.PENDING_REPAIR]: ["#FACC15", "#FEFCE8"],
  [AssetStatus.BROKEN]: ["#EF4444", "#FEF2F2"],
  [AssetStatus.HANDED_OVER]: ["#172554", "#EFF6FF"],
  // [AssetStatus.DISPOSED]: ["#6B7280", "#F3F4F6"],
  [AssetStatus.MAINTENANCE]: ["#EA580C", "#FFF7ED"],
  [AssetStatus.LOST]: ["#f10404", "#FFF7ED"]
};

const DEFAULT_STATUS_COLORS: [string, string] = ["#64748B", "#F1F5F9"];

const EXTENDED_STATUS_COLORS: Record<string, [string, string]> = {
  ...mappingAssetStatusColor,
  available: ["#14532D", "#F0FDF4"],
  maintenance: ["#FACC15", "#FEFCE8"]
  // disposed: ["#EF4444", "#FEF2F2"]
};

function getStatusColors(statusName: string): [string, string] {
  return EXTENDED_STATUS_COLORS[statusName] ?? DEFAULT_STATUS_COLORS;
}

interface AssetsFilterProps {
  deviceTypes: DeviceType[];
  statuses: DeviceStatus[];
  filters: DeviceFilters;
  onSearch: (filters: DeviceFilters) => void;
}

export default function AssetsFilter({
  deviceTypes,
  statuses,
  filters,
  onSearch
}: AssetsFilterProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [typeInput, setTypeInput] = useState(filters.type || "all");
  const [statusInput, setStatusInput] = useState(filters.status || "all");

  useEffect(() => {
    setSearchInput(filters.search || "");
    setTypeInput(filters.type || "all");
    setStatusInput(filters.status || "all");
  }, [filters]);

  const assetStatusOptions: DropdownOption[] = useMemo(() => {
    return statuses.map(s => ({
      value: String(s.id),
      label: t(`assets.status.${s.name}`)
    }));
  }, [statuses, t]);

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
      <Cpu
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
          placeholder={t("assets.filter.placeholder")}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSearch({
                search: searchInput,
                type: typeInput,
                status: statusInput
              });
            }
          }}
          className="w-full pl-10 pr-24"
        />

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      <Select
        value={typeInput}
        onValueChange={value => {
          setTypeInput(value);
        }}
      >
        <SelectTrigger className="w-[220px] bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <SelectValue placeholder={t("assets.filter.deviceType")} />
        </SelectTrigger>
        <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
          <SelectItem value="all">{t("assets.filter.allDevices")}</SelectItem>
          {deviceTypes.map(type => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={statusInput}
        onValueChange={value => {
          setStatusInput(value);
        }}
      >
        <SelectTrigger className="w-[220px] bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          {statusInput !== "all" ? (
            (() => {
              const selected = statuses.find(s => s.id === statusInput);
              const [textColor, backgroundColor] = selected
                ? getStatusColors(selected.name)
                : ["#000", "#eee"];
              return (
                <span
                  className="px-2 py-1 text-xs font-medium rounded-full"
                  style={{
                    backgroundColor,
                    color: textColor
                  }}
                >
                  {t("assets.status." + selected?.name)}
                </span>
              );
            })()
          ) : (
            <SelectValue placeholder={t("assets.filter.assetStatus")} />
          )}
        </SelectTrigger>

        <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
          <SelectItem value="all">{t("assets.filter.allStatus")}</SelectItem>
          {statuses.map(item => {
            const option = assetStatusOptions.find(
              opt => opt.value === item.id
            );
            const [textColor] = getStatusColors(item.name);
            return (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: textColor }}
                  />
                  {option
                    ? option.label
                    : t(`assets.status.${item.name}`, {
                        defaultValue: item.name
                      })}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        onClick={() => {
          setSearchInput("");
          setTypeInput("all");
          setStatusInput("all");
        }}
        className="gap-2"
      >
        <X size={18} />
        {t("assets.filter.deleteFilter")}
      </Button>

      <Button
        type="button"
        className="gap-2 shrink-0 z-[49]"
        onClick={() => {
          onSearch({
            search: searchInput,
            type: typeInput,
            status: statusInput
          });
        }}
      >
        <Search size={16} />
        {t("assets.search")}
      </Button>
    </div>
  );
}
