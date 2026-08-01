import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { apiRoutes, ApiRouteNames } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { extractApiList } from "@/shared/utils/apiResponse.util";
import { toast } from "react-toastify";
import DeviceHandoverPrint from "./DeviceHandoverPrint";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateInternalUsersQueries } from "@/shared/queries/internalUser.queries";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import {
  canAssignSelection,
  dedupeDevicesById,
  getAssignedUserId,
  isUsableDevice
} from "@/shared/utils/deviceSelection.util";
import type { Device } from "@/shared/@types/assets.type";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/Popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from "@/components/ui/Command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProfile } from "@/shared/hooks/useUserProfile";

interface AssignDeviceDialogProps {
  open: boolean;
  onClose: () => void;
  selectedDevices?: Device[];
  fixedAssignee?: {
    id: string;
    name: string;
    department?: unknown;
  };
  onSuccess?: () => void;
  onHandoverPrintClose?: () => void;
}

export default function AssignDeviceDialog({
  open,
  onClose,
  selectedDevices = [],
  fixedAssignee,
  onSuccess,
  onHandoverPrintClose
}: AssignDeviceDialogProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [showPrint, setShowPrint] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useUserProfile();
  const validatedOnOpenRef = useRef(false);
  const submittingRef = useRef(false);
  const wasOpenRef = useRef(false);
  const [devicesToAssign, setDevicesToAssign] = useState<Device[]>([]);

  const validateAssignableDevices = (loadedDevices: Device[]) => {
    const invalid = loadedDevices.some(
      device => !isUsableDevice(device) || Boolean(getAssignedUserId(device))
    );
    if (invalid || !canAssignSelection(loadedDevices)) {
      toast.error(t("assets.assign.error.invalidStatus"));
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDevicesToAssign(dedupeDevicesById(selectedDevices));
    }

    if (!open) {
      setSelectedUser("");
      setDevicesToAssign([]);
      validatedOnOpenRef.current = false;
      wasOpenRef.current = false;
      return;
    }

    if (fixedAssignee) {
      setSelectedUser(fixedAssignee.id);
    } else {
      void fetchUsers();
    }

    wasOpenRef.current = true;
  }, [open, selectedDevices, fixedAssignee]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (validatedOnOpenRef.current) {
      return;
    }

    validatedOnOpenRef.current = true;

    if (devicesToAssign.length === 0) {
      return;
    }

    if (!validateAssignableDevices(devicesToAssign)) {
      onClose();
    }
  }, [open, devicesToAssign, onClose, t]);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get(
        apiRoutes[ApiRouteNames.INTERNAL_USERS],
        {
          params: { limit: 1000 }
        }
      );
      setUsers(extractApiList(data));
    } catch (error) {
      console.error(error);
      toast.error(t("assets.assign.error.loadUsers"));
    }
  };

  const handleAssign = async () => {
    if (submittingRef.current) {
      return;
    }

    if (!selectedUser && !fixedAssignee) {
      toast.warn(t("assets.assign.error.selectEmployee"));
      return;
    }

    if (!validateAssignableDevices(devicesToAssign)) {
      return;
    }

    const selectedUserData = fixedAssignee
      ? {
          id: fixedAssignee.id,
          name: fixedAssignee.name,
          department: fixedAssignee.department
        }
      : users.find(u => u.id === selectedUser);

    if (!selectedUserData) {
      toast.error(t("assets.assign.error.userNotFound"));
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    try {
      const assignedDevices: Device[] = [];

      for (const device of devicesToAssign) {
        try {
          await apiClient.post(apiRoutes[ApiRouteNames.ASSIGN_DEVICE], {
            deviceId: device.id,
            userId: selectedUserData.id,
            userName: selectedUserData.name,
            assignedBy: "admin"
          });
          assignedDevices.push(device);
        } catch (error) {
          console.error(`Assign failed for device ${device.id}:`, error);
          toast.error(
            resolveApiErrorMessage(
              error,
              t,
              "assets.assign.error.deviceAssignFailed"
            )
          );
        }
      }

      if (assignedDevices.length === 0) {
        toast.error(t("assets.errors.assignFailed"));
        return;
      }

      setPrintData({
        giver: user?.name ?? "",
        receiver: selectedUserData.name,
        department: getLocalizedOrganizationName(
          selectedUserData.department,
          i18n.language
        ),
        date: new Date(),
        devices: assignedDevices
      });

      setShowPrint(true);

      onClose();
      void invalidateInternalUsersQueries(queryClient);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error(resolveApiErrorMessage(err, t, "assets.errors.assignFailed"));
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
            <DialogTitle>{t("assets.assignAssets")}</DialogTitle>
            <DialogDescription>
              {t("assets.assign.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 overflow-hidden rounded-md border bg-gray-50 p-3">
            {devicesToAssign.length > 0 ? (
              <ul className="max-h-40 space-y-2 overflow-y-auto overflow-x-hidden text-sm">
                {devicesToAssign.map(d => (
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

          {fixedAssignee ? (
            <div className="rounded-md border bg-gray-50 p-3 text-sm">
              <p className="font-medium">{fixedAssignee.name}</p>
              <p className="mt-1 text-xs text-gray-500">
                {t("employees.devices.fixedAssigneeHint")}
              </p>
            </div>
          ) : (
            <div className="text-sm">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between bg-white"
                  >
                    {selectedUser
                      ? users.find(u => u.id === selectedUser)?.name
                      : t("employees.selectEmployees")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0 bg-white text-gray-900 shadow-xl border border-gray-200 w-[450px]"
                  onWheel={e => e.stopPropagation()}
                >
                  <Command
                    className="bg-white"
                    filter={(value, search) => {
                      const normalize = (s: string) =>
                        s
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .toLowerCase();
                      return normalize(value).includes(normalize(search))
                        ? 1
                        : 0;
                    }}
                  >
                    <CommandInput
                      className="border-0 focus:ring-0 focus:outline-none"
                      placeholder={t("employees.selectEmployees")}
                    />
                    <CommandEmpty>{t("common.noData")}</CommandEmpty>
                    <CommandList className="max-h-[250px]">
                      <CommandGroup>
                        {users.map(u => {
                          const departmentName = getLocalizedOrganizationName(
                            u.department,
                            i18n.language
                          );
                          return (
                            <CommandItem
                              key={u.id}
                              value={`${u.name} ${departmentName}`}
                              onSelect={() => {
                                setSelectedUser(u.id);
                                setPopoverOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUser === u.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {u.name} - {departmentName}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

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
              onClick={handleAssign}
              disabled={loading || devicesToAssign.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? t("common.handling") : t("assets.assignAssets")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showPrint && printData && (
        <DeviceHandoverPrint
          type="handover"
          giver={printData.giver}
          receiver={printData.receiver}
          department={printData.department}
          date={printData.date}
          devices={printData.devices}
          notes={printData.notes || ""}
          onClose={() => {
            setShowPrint(false);
            onHandoverPrintClose?.();
          }}
        />
      )}
    </>
  );
}
