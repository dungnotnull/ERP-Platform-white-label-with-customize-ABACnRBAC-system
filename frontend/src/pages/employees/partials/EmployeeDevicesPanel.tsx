import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import ReturnDeviceDialog from "@/pages/assets/partials/ReturnDeviceDialog";
import SelectableDeviceTable from "@/pages/employees/partials/SelectableDeviceTable";
import {
  canReturnSelection,
  dedupeDevicesById
} from "@/shared/utils/deviceSelection.util";
import type { Device } from "@/shared/@types/assets.type";
import { toast } from "react-toastify";

interface EmployeeDevicesPanelProps {
  devices: Device[];
  onDevicesChanged?: () => void | Promise<void>;
}

export default function EmployeeDevicesPanel({
  devices,
  onDevicesChanged
}: EmployeeDevicesPanelProps) {
  const { t } = useTranslation();
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
  const [devicesForReturn, setDevicesForReturn] = useState<Device[]>([]);
  const [openReturnModal, setOpenReturnModal] = useState(false);

  const assignedDevices = useMemo(() => dedupeDevicesById(devices), [devices]);
  const canReturn = canReturnSelection(selectedDevices);
  const returnCount = selectedDevices.length;

  const resetSelection = () => {
    setSelectedDeviceIds([]);
    setSelectedDevices([]);
    setDevicesForReturn([]);
  };

  const reloadDevices = () => {
    resetSelection();
    void onDevicesChanged?.();
  };

  const toggleSelectAll = () => {
    const allSelected =
      assignedDevices.length > 0 &&
      assignedDevices.every(device => selectedDeviceIds.includes(device.id));

    if (allSelected) {
      setSelectedDeviceIds([]);
      setSelectedDevices([]);
      return;
    }

    if (!canReturnSelection(assignedDevices)) {
      toast.warn(t("assets.selection.differentAssignee"));
      return;
    }

    setSelectedDeviceIds(assignedDevices.map(device => device.id));
    setSelectedDevices(assignedDevices);
  };

  const toggleDevice = (device: Device) => {
    const exists = selectedDeviceIds.includes(device.id);

    if (exists) {
      const nextIds = selectedDeviceIds.filter(id => id !== device.id);
      setSelectedDeviceIds(nextIds);
      setSelectedDevices(prev =>
        prev.filter(item => nextIds.includes(item.id))
      );
      return;
    }

    const nextDevices = dedupeDevicesById([...selectedDevices, device]);
    if (!canReturnSelection(nextDevices)) {
      toast.warn(t("assets.selection.differentAssignee"));
      return;
    }

    setSelectedDeviceIds(nextDevices.map(item => item.id));
    setSelectedDevices(nextDevices);
  };

  const handleOpenReturn = () => {
    if (!canReturn) {
      return;
    }

    setDevicesForReturn(selectedDevices);
    setOpenReturnModal(true);
  };

  const assignedCountLabel = useMemo(
    () => `${assignedDevices.length} ${t("device.label")}`,
    [assignedDevices.length, t]
  );

  return (
    <>
      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold">
            {t("assets.assignedAssets")} -{" "}
            <span className="text-red-600">{assignedCountLabel}</span>
          </h2>
          <Button
            className="shrink-0"
            onClick={handleOpenReturn}
            disabled={!canReturn}
          >
            {returnCount > 0
              ? `${t("assets.returnAssets")} (${returnCount})`
              : t("assets.returnAssets")}
          </Button>
        </div>

        <SelectableDeviceTable
          devices={assignedDevices}
          selectedDeviceIds={selectedDeviceIds}
          onToggleDevice={toggleDevice}
          onToggleAll={toggleSelectAll}
          showAssignedAt
        />
      </div>

      <ReturnDeviceDialog
        open={openReturnModal}
        onClose={() => {
          setOpenReturnModal(false);
          setDevicesForReturn([]);
        }}
        selectedDevices={devicesForReturn}
        onSuccess={reloadDevices}
        onHandoverPrintClose={resetSelection}
      />
    </>
  );
}
