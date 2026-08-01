import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import EmployeeForm from "./EmployeeForm";
import { useTranslation } from "react-i18next";
import type { InternalUser } from "./types";

interface EmployeeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeToEdit: InternalUser | null;
  onSuccess: () => void;
  departments: any[];
  positions: any[];
}

export default function EmployeeFormModal({
  open,
  onOpenChange,
  employeeToEdit,
  onSuccess,
  departments,
  positions
}: EmployeeFormModalProps) {
  const { t, i18n } = useTranslation();
  const isEditMode = !!employeeToEdit;
  const title = isEditMode
    ? t("employees.form.editTitle", { name: employeeToEdit?.name ?? "" })
    : t("employees.addEmployee");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <EmployeeForm
          key={`${employeeToEdit?.id ?? "new"}-${i18n.language}`}
          initialData={employeeToEdit}
          onSuccess={onSuccess}
          onCancel={() => onOpenChange(false)}
          departments={departments}
          positions={positions}
        />
      </DialogContent>
    </Dialog>
  );
}
