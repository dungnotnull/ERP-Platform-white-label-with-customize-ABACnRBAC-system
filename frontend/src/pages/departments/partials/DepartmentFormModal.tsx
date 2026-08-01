import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import DepartmentForm, { DepartmentFormInitial } from "./DepartmentForm";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";

interface DepartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departmentToEdit?: DepartmentFormInitial | null;
  onSuccess: () => void;
}

export default function DepartmentFormModal({
  open,
  onOpenChange,
  departmentToEdit,
  onSuccess
}: DepartmentFormModalProps) {
  const { t, i18n } = useTranslation();
  const isEditMode = !!departmentToEdit?.id;

  const handleSuccess = () => {
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? t("teams.departmentForm.editTitle", {
                  name: getLocalizedOrganizationName(
                    departmentToEdit,
                    i18n.language
                  )
                })
              : t("teams.addDepartment")}
          </DialogTitle>
        </DialogHeader>
        <DepartmentForm
          key={`${departmentToEdit?.id ?? "new"}-${i18n.language}`}
          initialData={departmentToEdit}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
