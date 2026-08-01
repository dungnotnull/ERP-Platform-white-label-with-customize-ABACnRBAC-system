import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import PositionForm, { PositionFormInitial } from "./PositionForm";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";

interface PositionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  positionToEdit?: PositionFormInitial | null;
  onSuccess: () => void;
}

export default function PositionFormModal({
  open,
  onOpenChange,
  positionToEdit,
  onSuccess
}: PositionFormModalProps) {
  const { t, i18n } = useTranslation();
  const isEditMode = !!positionToEdit?.id;

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
              ? t("teams.positionForm.editTitle", {
                  name: getLocalizedOrganizationName(
                    positionToEdit,
                    i18n.language
                  )
                })
              : t("teams.addPosition")}
          </DialogTitle>
        </DialogHeader>
        <PositionForm
          key={`${positionToEdit?.id ?? "new"}-${i18n.language}`}
          initialData={positionToEdit}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
