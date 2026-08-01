import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/Dialog";
import PurchaseOrdersForm from "./PurchaseOrdersForm";
import { useTranslation } from "react-i18next";
import type { PurchaseOrder, Supplier } from "./types";
import { apiClient } from "@/services/api/apiClient.service";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import config from "@/shared/constants/config.constant";

interface PurchaseOrdersFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrdersToEdit: PurchaseOrder | null;
  mode?: "view" | "edit";
  onSuccess: () => void;
}

export default function PurchaseOrdersFormModal({
  open,
  onOpenChange,
  purchaseOrdersToEdit,
  mode,
  onSuccess
}: PurchaseOrdersFormModalProps) {
  const { t, i18n } = useTranslation();
  const isEditMode = !!purchaseOrdersToEdit;
  const title = isEditMode ? t("common.update") : t("common.addNew");
  const readOnly = mode === "view";
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const url = config.getApiUrl(apiRoutes[ApiRouteNames.SUPPLIERS]);
        const res = await apiClient.get(url);

        setSuppliers(res.data.data.items || []);
      } catch (error) {
        console.error("Failed to fetch device types:", error);
      }
    };
    fetchTypes();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1024px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? title : ""}</DialogTitle>
          <DialogDescription>{/* {t("purchase.notes")} */}</DialogDescription>
        </DialogHeader>

        <PurchaseOrdersForm
          key={`${purchaseOrdersToEdit?.id ?? "new"}-${i18n.language}`}
          initialData={purchaseOrdersToEdit}
          supplierOptions={suppliers}
          onSuccess={onSuccess}
          readOnly={readOnly}
          items={[]}
        />
      </DialogContent>
    </Dialog>
  );
}
