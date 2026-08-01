import { useEffect, useRef, useState } from "react";
import { apiClient } from "@/services/api/apiClient.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/Input";
import { useUserProfile } from "@/shared/hooks/useUserProfile.ts";
import DeviceHandoverPrint from "./DeviceHandoverPrint";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateInternalUsersQueries } from "@/shared/queries/internalUser.queries";
import {
  canReturnSelection,
  dedupeDevicesById
} from "@/shared/utils/deviceSelection.util";
import type { Device } from "@/shared/@types/assets.type";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";

export default function ReturnDeviceDialog({
  open,
  onClose,
  selectedDevices = [],
  onSuccess,
  onHandoverPrintClose
}: {
  open: boolean;
  onClose: () => void;
  selectedDevices?: Device[];
  onSuccess?: () => void;
  onHandoverPrintClose?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");
  const [devicesToReturn, setDevicesToReturn] = useState<Device[]>([]);
  const { user } = useUserProfile();
  const [printData, setPrintData] = useState<{
    type: "return";
    giver: string;
    receiver: string;
    date: Date;
    devices: Device[];
    notes: string;
  } | null>(null);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const validatedOnOpenRef = useRef(false);
  const submittingRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDevicesToReturn(dedupeDevicesById(selectedDevices));
    }

    if (!open) {
      setReturnNotes("");
      setDevicesToReturn([]);
      validatedOnOpenRef.current = false;
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
  }, [open, selectedDevices]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (validatedOnOpenRef.current) {
      return;
    }

    validatedOnOpenRef.current = true;

    if (devicesToReturn.length === 0) {
      return;
    }

    if (!canReturnSelection(devicesToReturn)) {
      toast.error(t("assets.return.error.invalidStatus"));
      onClose();
    }
  }, [open, devicesToReturn, onClose, t]);

  const handleReturn = async () => {
    if (submittingRef.current) {
      return;
    }

    if (devicesToReturn.length === 0) {
      toast.warn(t("assets.return.error.noDevices"));
      return;
    }

    if (!canReturnSelection(devicesToReturn)) {
      toast.error(t("assets.return.error.invalidStatus"));
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      let successfulReturns = 0;
      const returnedDevices: Device[] = [];

      const assignmentUser =
        devicesToReturn[0]?.currentAssignment?.userName ||
        t("assets.return.unknownUser");

      for (const device of devicesToReturn) {
        try {
          await apiClient.put(
            apiRoutes[ApiRouteNames.RETURN_DEVICE].replace(":id", device.id),
            {
              returnedBy: user?.name || "admin",
              returnNotes:
                returnNotes ||
                `${t("assets.return.recalledBy")} ${user?.name || "admin"}`
            }
          );

          successfulReturns++;
          returnedDevices.push(device);
        } catch (error) {
          console.error(`Lỗi thu hồi thiết bị ${device.id}:`, error);
          toast.error(
            resolveApiErrorMessage(
              error,
              t,
              "assets.return.error.deviceRecallFailed"
            )
          );
        }
      }

      if (successfulReturns > 0) {
        setPrintData({
          type: "return",
          giver: assignmentUser,
          receiver: user?.name || "HR",
          date: new Date(),
          devices: returnedDevices,
          notes:
            returnNotes ||
            `${t("assets.return.recalledBy")} ${user?.name || "admin"}`
        });

        onClose();
        void invalidateInternalUsersQueries(queryClient);
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
      toast.error(resolveApiErrorMessage(err, t, "assets.errors.returnFailed"));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={isOpen => !isOpen && onClose()}>
        <DialogContent className="sm:max-w-md space-y-4 overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {t("common.deviceRecallConfirmation")}
              {devicesToReturn.length > 0 ? ` (${devicesToReturn.length})` : ""}
            </DialogTitle>
            <DialogDescription>
              {t("assets.return.description")}
            </DialogDescription>
          </DialogHeader>

          <p className="text-sm text-gray-700">
            {t("common.deviceReturnNote1")} {t("common.deviceReturnNote2")}
          </p>

          <div className="min-w-0 overflow-hidden rounded-md border bg-gray-50 p-3">
            {devicesToReturn.length > 0 ? (
              <ul className="max-h-40 space-y-2 overflow-y-auto overflow-x-hidden text-sm">
                {devicesToReturn.map(d => (
                  <li key={d.id} className="min-w-0">
                    <p className="break-words font-medium">{d.name}</p>
                    <p className="mt-0.5 break-all text-xs text-gray-500">
                      {d.serialNumber}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {t("common.noData")}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="returnNotes" className="text-sm font-medium">
              {t("assets.label.note")} ({t("common.option")})
            </label>
            <Input
              id="returnNotes"
              value={returnNotes}
              onChange={e => setReturnNotes(e.target.value)}
              placeholder={t("assets.label.note")}
              className="bg-white"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleReturn}
              disabled={loading || devicesToReturn.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? t("common.handling") : t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {printData && (
        <DeviceHandoverPrint
          type={printData.type}
          giver={printData.giver}
          receiver={printData.receiver}
          date={printData.date}
          devices={printData.devices}
          notes={printData.notes || ""}
          onClose={() => {
            setPrintData(null);
            onHandoverPrintClose?.();
            onClose();
          }}
        />
      )}
    </>
  );
}
