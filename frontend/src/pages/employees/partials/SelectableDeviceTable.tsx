import { Checkbox } from "@/components/ui/Checkbox";
import type { Device } from "@/shared/@types/assets.type";
import { useTranslation } from "react-i18next";
import useResponsive from "@/hooks/useResponsive";
import { cn } from "@/lib/utils";

interface SelectableDeviceTableProps {
  devices: Device[];
  selectedDeviceIds: string[];
  onToggleDevice: (device: Device) => void;
  onToggleAll?: () => void;
  showAssignedAt?: boolean;
}

export default function SelectableDeviceTable({
  devices,
  selectedDeviceIds,
  onToggleDevice,
  onToggleAll,
  showAssignedAt = false
}: SelectableDeviceTableProps) {
  const { t } = useTranslation();
  const { isMobile } = useResponsive();
  const columnCount = showAssignedAt ? 6 : 5;
  const allSelected =
    devices.length > 0 &&
    devices.every(device => selectedDeviceIds.includes(device.id));
  const someSelected =
    devices.some(device => selectedDeviceIds.includes(device.id)) &&
    !allSelected;
  const headerChecked: boolean | "indeterminate" = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  if (isMobile) {
    return (
      <div className="mt-4 flex flex-col gap-3">
        {/* Select all row */}
        {devices.length > 0 && onToggleAll && (
          <div className="flex items-center gap-2 px-1 pb-2 border-b border-gray-200">
            <Checkbox
              checked={headerChecked}
              onCheckedChange={() => onToggleAll()}
              aria-label={t("common.selectAll")}
            />
            <span className="text-sm font-semibold text-gray-700">
              {t("common.selectAll")}
            </span>
          </div>
        )}

        {devices.length > 0 ? (
          devices.map(device => {
            const isSelected = selectedDeviceIds.includes(device.id);
            return (
              <div
                key={device.id}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  isSelected
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleDevice(device)}
                    aria-label={device.serialNumber}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {t("device.deviceType")}
                      </span>
                      <span className="text-sm text-gray-900 break-words">
                        {device.deviceType?.name || "-"}
                      </span>

                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {t("device.deviceName")}
                      </span>
                      <span className="text-sm text-gray-900 break-words">
                        {device.name || "-"}
                      </span>

                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {t("device.serialNumber")}
                      </span>
                      <span className="text-sm text-gray-900 break-words">
                        {device.serialNumber || "-"}
                      </span>

                      <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {t("device.model")}
                      </span>
                      <span className="text-sm text-gray-900 break-words">
                        {device.model || "-"}
                      </span>

                      {showAssignedAt && (
                        <>
                          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                            {t("device.deviceAssignedDate")}
                          </span>
                          <span className="text-sm text-gray-900 break-words">
                            {device.currentAssignment?.assignedAt
                              ? new Date(
                                  device.currentAssignment.assignedAt
                                ).toLocaleString()
                              : "-"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-sm text-gray-500">
            {t("common.noData")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="neumorphic-table-wrapper mt-4">
      <table className="min-w-full text-sm neumorphic-table">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="p-2 border w-10">
              {devices.length > 0 && onToggleAll && (
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={() => onToggleAll()}
                  aria-label={t("common.selectAll")}
                />
              )}
            </th>
            <th className="p-2 border">{t("device.deviceType")}</th>
            <th className="p-2 border">{t("device.deviceName")}</th>
            <th className="p-2 border">{t("device.serialNumber")}</th>
            <th className="p-2 border">{t("device.model")}</th>
            {showAssignedAt && (
              <th className="p-2 border">{t("device.deviceAssignedDate")}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {devices.length > 0 ? (
            devices.map(device => (
              <tr key={device.id}>
                <td className="p-2 border text-center">
                  <Checkbox
                    checked={selectedDeviceIds.includes(device.id)}
                    onCheckedChange={() => onToggleDevice(device)}
                    aria-label={device.serialNumber}
                  />
                </td>
                <td className="p-2 border text-center">
                  {device.deviceType?.name || "-"}
                </td>
                <td className="p-2 border text-center">{device.name || "-"}</td>
                <td className="p-2 border text-center">
                  {device.serialNumber || "-"}
                </td>
                <td className="p-2 border text-center">
                  {device.model || "-"}
                </td>
                {showAssignedAt && (
                  <td className="p-2 border text-center">
                    {device.currentAssignment?.assignedAt
                      ? new Date(
                          device.currentAssignment.assignedAt
                        ).toLocaleString()
                      : "-"}
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-2 border text-center" colSpan={columnCount}>
                {t("common.noData")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

