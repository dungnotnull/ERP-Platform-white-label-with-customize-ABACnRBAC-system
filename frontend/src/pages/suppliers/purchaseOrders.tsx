import { useCallback, useState } from "react";
import PageTopBar from "@/components/PageTopBar";
import PurchaseOrdersDataList from "./partial/PurchaseOrdersDataList";
import { ClipboardList, PlusCircle, ArrowLeft } from "lucide-react";
import PurchaseOrdersFilter from "./partial/PurchaseOrdersFilter";
import { PurchaseOrder, PurchaseOrderFilters } from "./partial/types";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import PurchaseOrdersFormModal from "./partial/PurchaseOrderFormModal";
import { useNavigate } from "react-router-dom";

const initialFilters = {
  orderCode: "",
  supplierName: "",
  status: "",
  search: ""
};

export type FilterKey = keyof PurchaseOrderFilters | "reset";
export type HandleFilterChange = (key: FilterKey, value?: string) => void;

export default function PurchaseOrders() {
  const [filters, setFilters] = useState(initialFilters);
  const [reloadKey, setReloadKey] = useState(0);
  const [editingPurchaseOrders, setEditingPurchaseOrders] =
    useState<PurchaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleFilterChange = useCallback<HandleFilterChange>((key, value) => {
    if (key === "reset") {
      setFilters(initialFilters);
      setReloadKey(prev => prev + 1);
    } else {
      setFilters(prev => ({ ...prev, [key]: value || "" }));
    }
  }, []);

  const handleEdit = (purchaseOrder: PurchaseOrder) => {
    setEditingPurchaseOrders(purchaseOrder);
    // setModalMode("edit");
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="pr-5 md:pr-[50px] md:pl-0">
        <PageTopBar
          title={t("purchase.title")}
          description={t("purchase.description")}
          Icon={ClipboardList}
        />

        <PurchaseOrdersFilter
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      <div className="flex justify-start mb-4 gap-2">
        {/* ⭐ Nút Quay lại */}
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border hover:bg-blue-900"
          size="sm"
        >
          <ArrowLeft size={18} />
          {t("common.back") ?? "Quay lại"}
        </Button>

        <Button
          onClick={() => {
            setEditingPurchaseOrders(null);
            setIsModalOpen(true);
          }}
          size="sm"
          className="flex items-center gap-2 text-white hover:bg-blue-900 "
        >
          <PlusCircle className="w-4 h-4" />
          {t("purchase.addPurchase")}
        </Button>
      </div>

      <PurchaseOrdersDataList
        reloadKey={reloadKey}
        filters={filters}
        onEdit={handleEdit}
      />

      <PurchaseOrdersFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        purchaseOrdersToEdit={editingPurchaseOrders}
        mode={editingPurchaseOrders ? "edit" : undefined}
        onSuccess={() => {
          setIsModalOpen(false);
          setReloadKey(prev => prev + 1);
        }}
      />
    </>
  );
}
