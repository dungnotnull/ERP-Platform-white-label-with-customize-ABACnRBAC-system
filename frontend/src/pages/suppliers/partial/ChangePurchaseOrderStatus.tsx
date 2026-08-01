import { PurchaseOrderStatus } from "@/shared/enums/assets.enum.ts";
import { useState } from "react";
import CustomSelect, {
  DropdownOption
} from "@/components/patterns/CustomSelect.tsx";
import { useTranslation } from "react-i18next";

const mappingPurchaseOrderStatusColor: Record<string, string[]> = {
  [PurchaseOrderStatus.APPROVED]: ["#14532D", "#F0FDF4"],
  [PurchaseOrderStatus.DRAFT]: ["#FACC15", "#FEFCE8"],
  [PurchaseOrderStatus.PENDING]: ["#EF4444", "#FEF2F2"]
};

interface PurchaseStatus {
  id: string; // UUID
  name: string; // code: USABLE, PENDING_REPAIR, ...
}

interface ChangeStatusProps {
  // deviceId: string;
  defaultValue: string;
  statuses: PurchaseStatus[];
  onChange?: (statusId: string) => void; // callback
}

export const ChangePurchaseOrderStatus = ({
  defaultValue,
  statuses,
  onChange
}: ChangeStatusProps) => {
  const [value, setValue] = useState<string>(defaultValue);
  const { t } = useTranslation();

  const toI18nKey = (name: string) => name.toLowerCase();

  const options: DropdownOption[] = statuses.map(s => ({
    value: s.id, // UUID
    label: t(`purchase.status.${toI18nKey(s.name)}`)
  }));

  const currentStatus = statuses.find(s => s.id === value);
  const selectedColors = currentStatus
    ? mappingPurchaseOrderStatusColor[currentStatus.name] || ["#000", "#fff"]
    : ["#000", "#fff"];

  return (
    <CustomSelect
      options={options}
      value={value}
      onValueChange={val => {
        const newVal = Array.isArray(val) ? val[0] : val;
        setValue(newVal);
        if (onChange) onChange(newVal);
      }}
      size="sm"
      className="max-w-[150px]"
      triggerClassName="rounded-[20px]"
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
