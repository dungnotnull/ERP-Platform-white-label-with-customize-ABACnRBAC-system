import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import SupplierForm from "./SupplierForm";
import { useTranslation } from "react-i18next";
import type { Supplier } from "./types";

interface SupplierFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierToEdit: Supplier | null;
  mode?: "view" | "edit";
  onSuccess: () => void;
}

export default function SupplierFormModal({
  open,
  onOpenChange,
  supplierToEdit,
  mode,
  onSuccess
}: SupplierFormModalProps) {
  const { t, i18n } = useTranslation();
  const isEditMode = !!supplierToEdit;
  const title = isEditMode ? t("common.update") : t("common.addNew");
  const readOnly = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? title : ""}</DialogTitle>
        </DialogHeader>

        <SupplierForm
          key={`${supplierToEdit?.id ?? "new"}-${i18n.language}`}
          initialData={supplierToEdit}
          onSuccess={onSuccess}
          readOnly={readOnly}
        />
      </DialogContent>
    </Dialog>
  );
}
