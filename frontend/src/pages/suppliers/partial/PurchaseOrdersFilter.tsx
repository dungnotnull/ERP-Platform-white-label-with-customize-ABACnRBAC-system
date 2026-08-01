import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Cpu, X } from "lucide-react"; // Import icon
import { useTranslation } from "react-i18next";
import type { FilterKey } from "../purchaseOrders";
import { PurchaseOrderFilters } from "../partial/types";

export default function PurchaseOrdersFilter({
  filters,
  onFilterChange
}: {
  filters: PurchaseOrderFilters;
  onFilterChange: (key: FilterKey, value?: string) => void;
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
      <Cpu
        size={140}
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
          placeholder={t("purchase.order.invoiceNumber")}
          value={filters.invoiceNumber}
          onChange={e => onFilterChange("invoiceNumber", e.target.value)}
        />
      </div>

      <div className="relative max-w-sm flex-grow">
        <Input
          placeholder={t("supplier.name")}
          value={filters.supplierName}
          onChange={e => onFilterChange("supplierName", e.target.value)}
        />
      </div>

      <div className="relative max-w-sm flex-grow">
        <Button
          variant="outline"
          onClick={() => onFilterChange("reset")}
          disabled={
            !filters.invoiceNumber && !filters.supplierName && !filters.status
          }
        >
          <X className="mr-2 h-4 w-4" />
          {t("common.resetFilters")}
        </Button>
      </div>
    </div>
  );
}
