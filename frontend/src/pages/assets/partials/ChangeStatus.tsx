import { AssetStatus } from "@/shared/enums/assets.enum.ts";
import { useEffect, useMemo, useState } from "react";
import CustomSelect, {
  DropdownOption
} from "@/components/patterns/CustomSelect.tsx";
import { useTranslation } from "react-i18next";

const mappingAssetStatusColor: Record<string, string[]> = {
  [AssetStatus.USABLE]: ["#14532D", "#F0FDF4"],
  [AssetStatus.PENDING_REPAIR]: ["#FACC15", "#FEFCE8"],
  [AssetStatus.BROKEN]: ["#EF4444", "#fac8c8"],
  [AssetStatus.HANDED_OVER]: ["#172554", "#EFF6FF"],
  // [AssetStatus.DISPOSED]: ["#6B7280", "#F3F4F6"],
  [AssetStatus.MAINTENANCE]: ["#f57d3c", "#FFF7ED"],
  [AssetStatus.LOST]: ["#9e0069", "#fccaed"]
};

interface DeviceStatus {
  id: string;
  name: string;
}

interface ChangeStatusProps {
  defaultValue: string;
  statuses: DeviceStatus[];
  onChange?: (statusId: string) => void;
  disabled?: boolean;
}

export const ChangeStatus = ({
  defaultValue,
  statuses,
  onChange,
  disabled = false
}: ChangeStatusProps) => {
  const { t } = useTranslation();

  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const currentStatus = useMemo(() => {
    return statuses.find(s => String(s.id) === String(value));
  }, [statuses, value]);

  const selectedColors = currentStatus
    ? mappingAssetStatusColor[currentStatus.name] || ["#000", "#fff"]
    : ["#000", "#fff"];

  const options: DropdownOption[] = useMemo(() => {
    return statuses
      .filter(s => {
        if (currentStatus?.name === AssetStatus.HANDED_OVER) {
          return s.name !== AssetStatus.USABLE;
        }

        return s.name !== AssetStatus.HANDED_OVER;
      })
      .map(s => ({
        value: String(s.id),
        label: t(`assets.status.${s.name}`)
      }));
  }, [statuses, currentStatus, t]);

  return (
    <CustomSelect
      disabled={disabled}
      options={options}
      value={value}
      onValueChange={val => {
        const newVal = Array.isArray(val) ? val[0] : val;
        setValue(newVal);
        onChange?.(newVal);
      }}
      size="sm"
      className="max-w-[150px]"
      triggerClassName={`
        rounded-[20px]
        disabled:opacity-100
        disabled:text-current
      `}
      contentClassName="[&_*]:text-xs"
      customColors={{
        border: selectedColors[0],
        text: selectedColors[0],
        hover: selectedColors[1],
        background: selectedColors[1],
        popoverBg: "#fff"
      }}
    />
  );
};
