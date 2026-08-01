import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Search, X, Check, ChevronsUpDown, Cpu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SEARCH_KEYWORD_MAX_LENGTH } from "@/shared/constants/search.constant";
import { InternalUser } from "./types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/Popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/Command";
import { cn } from "@/lib/utils";
import { DeviceRequestStatus } from "@/shared/enums/assets.enum.ts";

export type DeviceRequestFilterKey =
  | "search"
  | "status"
  | "user"
  | "deviceType"
  | "reset";

export interface DeviceRequestFilters {
  search: string;
  status: string;
  user: string;
  deviceType: string;
}

interface DeviceRequestsFilterProps {
  filters: DeviceRequestFilters;
  onFilterChange: (key: DeviceRequestFilterKey, value?: string) => void;
  onApply: () => void;
  users: InternalUser[];
  deviceTypes: any[];
}

export default function DeviceRequestsFilter({
  filters,
  onFilterChange,
  onApply,
  users,
  deviceTypes
}: DeviceRequestsFilterProps) {
  const { t } = useTranslation();
  const userList = Array.isArray(users) ? users : [];
  const deviceTypeList = Array.isArray(deviceTypes) ? deviceTypes : [];

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
      {/* Search */}
      <div className="relative max-w-sm flex-grow">
        <Input
          value={filters.search}
          maxLength={SEARCH_KEYWORD_MAX_LENGTH}
          placeholder={t("device.requests.filter.placeholder")}
          onChange={e => onFilterChange("search", e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {/* Status */}
      <Select
        value={filters.status}
        onValueChange={v => onFilterChange("status", v)}
      >
        <SelectTrigger className="w-[180px] bg-white">
          <SelectValue placeholder={t("device.requests.status.label")} />
        </SelectTrigger>
        <SelectContent className="bg-white text-gray-900 border shadow-lg">
          <SelectItem value="all">
            {t("device.requests.filter.allStatus")}
          </SelectItem>
          <SelectItem value="PENDING">
            {t("device.requests.status." + DeviceRequestStatus.PENDING)}
          </SelectItem>
          <SelectItem value="APPROVED">
            {t("device.requests.status." + DeviceRequestStatus.APPROVED)}
          </SelectItem>
          <SelectItem value="REJECTED">
            {t("device.requests.status." + DeviceRequestStatus.REJECTED)}
          </SelectItem>
        </SelectContent>
      </Select>

      {/* User */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-[250px] justify-between bg-white text-gray-900"
          >
            {filters.user !== "all"
              ? userList.find(u => u.id === filters.user)?.name
              : t("device.requests.filter.allEmployees")}
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[250px] p-0 bg-white text-gray-900 shadow-xl">
          <Command className="bg-white">
            <CommandInput className="border-0 focus:ring-0 focus:outline-none" />
            <CommandEmpty className="py-4 text-center text-gray-500">
              {t("common.noData")}
            </CommandEmpty>

            <CommandGroup>
              <CommandItem
                onSelect={() => onFilterChange("user", "all")}
                className="cursor-pointer hover:bg-blue-50"
              >
                {t("device.requests.filter.allEmployees")}
              </CommandItem>

              {userList
                .filter(u => u.isActive !== false)
                .map(u => (
                  <CommandItem
                    key={u.id}
                    onSelect={() => onFilterChange("user", u.id)}
                    className="cursor-pointer hover:bg-blue-50 aria-selected:bg-blue-100"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        filters.user === u.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {u.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Device type */}
      <Select
        value={filters.deviceType}
        onValueChange={v => onFilterChange("deviceType", v)}
      >
        <SelectTrigger className="w-[220px] bg-white">
          <SelectValue placeholder={t("device.requests.filter.allDevices")} />
        </SelectTrigger>
        <SelectContent className="bg-white text-gray-900 border shadow-lg">
          <SelectItem value="all">
            {t("device.requests.filter.allDevices")}
          </SelectItem>
          {deviceTypeList.map(d => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onApply} className="flex items-center gap-2">
        <Search size={16} />
        {t("assets.search")}
      </Button>

      {/* Reset */}
      <Button variant="ghost" onClick={() => onFilterChange("reset")}>
        <X size={16} />
        {t("device.requests.filter.deleteFilter")}
      </Button>
    </div>
  );
}
