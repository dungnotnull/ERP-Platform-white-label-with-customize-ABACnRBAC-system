import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { useTranslation } from "react-i18next";
import DeviceRequestForm from "./DeviceRequestForm";
import type { InternalUser } from "../partials/types";

interface DeviceRequestFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: InternalUser[];
  deviceTypes: any[];
  onSuccess: () => void;
}

export default function DeviceRequestFormModal({
  open,
  onOpenChange,
  users,
  deviceTypes,
  onSuccess
}: DeviceRequestFormModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{`
                ${t("device.requests.create")} : ${t("device.requests.type.NEW_ASSIGNMENT")} | ${t("device.requests.type.REPLACEMENT")} | ${t("device.requests.type.REPAIR")} 
                ${t("device.label")}
            `}</DialogTitle>
        </DialogHeader>

        <DeviceRequestForm
          users={users}
          deviceTypes={deviceTypes}
          onSuccess={() => {
            onOpenChange(false);
            onSuccess();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
