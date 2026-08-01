import { MonitorSmartphone, PlusCircle } from "lucide-react";
import PageTopBar from "@/components/PageTopBar";
import AssetsDataList from "@/pages/assets/partials/AssetsDataList.tsx";
import { useTranslation } from "react-i18next";
import ImportDevices from "@/pages/assets/partials/ImportDevices.tsx";
import ExportDevices from "@/pages/assets/partials/ExportDevices.tsx";
import AssetsFilter from "@/pages/assets/partials/AssetsFilter";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateInternalUsersQueries } from "@/shared/queries/internalUser.queries";
import { Button } from "@/components/ui/Button";
import AssignDeviceDialog from "@/pages/assets/partials/AssignDeviceDialog";
import ReturnDeviceDialog from "@/pages/assets/partials/ReturnDeviceDialog";
import DeviceFormDialog from "@/pages/assets/partials/DeviceFormDialog";
import type {
  DeviceRequest,
  DeviceType,
  DeviceStatus,
  Device
} from "@/shared/@types/assets.type";
import {
  canAssignSelection,
  canReturnSelection,
  getAssignableDevices,
  getReturnableDevices
} from "@/shared/utils/deviceSelection.util";
import { useSearchParams } from "react-router-dom";
import { useDeviceMasterData } from "./partials/useDeviceMasterData";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";
import NoteDialog from "@/components/ui/NoteDialog";

export default function AssetsManagement() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const initialFilters = {
    type: "all",
    status: "all",
    search: ""
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [reloadKey, setReloadKey] = useState(0);
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [openReturnModal, setOpenReturnModal] = useState(false);
  const [openDeviceForm, setOpenDeviceForm] = useState(false);
  const [editDevice, setEditDevice] = useState<any | null>(null);
  const [allDeviceRequests, _setAllDeviceRequests] = useState<DeviceRequest[]>(
    []
  );
  const [openApprovedDialog, setOpenApprovedDialog] = useState(false);
  const [selectedRequestType, _setSelectedRequestType] = useState<
    "NEW" | "REPLACE" | "REPAIR" | null
  >(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<Device[]>([]);
  const { data } = useDeviceMasterData();

  useEffect(() => {
    setSelectedDeviceIds([]);
    setSelectedDevices([]);
  }, [reloadKey]);

  const handleApplyFilters = (newFilters: typeof initialFilters) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", "1");
    setSearchParams(next);

    setAppliedFilters(newFilters);
  };

  const approvedRequestsByType = useMemo(() => {
    if (!selectedRequestType) return [];

    return allDeviceRequests.filter(
      r => r.status === "approve" && r.type === selectedRequestType
    );
  }, [allDeviceRequests, selectedRequestType]);

  const groupedApprovedDevices = useMemo(() => {
    const map: Record<
      string,
      {
        deviceTypeName: string;
        quantity: number;
        requests: DeviceRequest[];
      }
    > = {};

    approvedRequestsByType.forEach(req => {
      req.items.forEach(
        (item: { deviceType: { id: any; name: any }; quantity: number }) => {
          const key = item.deviceType.id;

          if (!map[key]) {
            map[key] = {
              deviceTypeName: item.deviceType.name,
              quantity: 0,
              requests: []
            };
          }

          map[key].quantity += item.quantity;

          if (!map[key].requests.find(r => r.id === req.id)) {
            map[key].requests.push(req);
          }
        }
      );
    });

    return Object.values(map);
  }, [approvedRequestsByType]);

  const assignableDevices = useMemo(
    () => getAssignableDevices(selectedDevices),
    [selectedDevices]
  );
  const returnableDevices = useMemo(
    () => getReturnableDevices(selectedDevices),
    [selectedDevices]
  );
  const canAssign = canAssignSelection(selectedDevices);
  const canReturn = canReturnSelection(selectedDevices);
  const assignCount = assignableDevices.length;
  const returnCount = returnableDevices.length;

  const resetDeviceSelection = () => {
    setSelectedDeviceIds([]);
    setSelectedDevices([]);
  };

  const reloadAssetsAndClearSelection = () => {
    resetDeviceSelection();
    setReloadKey(k => k + 1);
    void invalidateInternalUsersQueries(queryClient);
  };

  const handleSelectionChange = useCallback(
    (ids: string[], devices: Device[]) => {
      setSelectedDeviceIds(ids);
      setSelectedDevices(devices);
    },
    []
  );

  return (
    <div className="pr-5 md:pr-[50px] md:pl-0">
      <PageTopBar
        title={t("menu.sidebar.assets")}
        description={t("assets.description")}
        Icon={MonitorSmartphone}
      />

      <AssetsFilter
        deviceTypes={(data?.deviceTypes as DeviceType[]) ?? []}
        statuses={(data?.statuses as DeviceStatus[]) ?? []}
        filters={appliedFilters}
        onSearch={handleApplyFilters}
      />

      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <ImportDevices
          onSuccess={() => {
            setReloadKey(prev => prev + 1);
          }}
        />
        <ExportDevices />
        <Button
          onClick={() => {
            setEditDevice(null);
            setOpenDeviceForm(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          {t("assets.addAsset")}
        </Button>
        <Button onClick={() => setOpenAssignModal(true)} disabled={!canAssign}>
          {assignCount > 0
            ? `${t("assets.assignAssets")} (${assignCount})`
            : t("assets.assignAssets")}
        </Button>
        <Button onClick={() => setOpenReturnModal(true)} disabled={!canReturn}>
          {returnCount > 0
            ? `${t("assets.returnAssets")} (${returnCount})`
            : t("assets.returnAssets")}
        </Button>
        <div className="flex justify-end xl:flex-1">
          <NoteDialog
            title="assets.notes.title"
            content="assets.notes.content"
            triggerLabel="assets.notes.trigger"
          />
        </div>
      </div>

      <AssetsDataList
        filters={appliedFilters}
        reloadKey={reloadKey}
        deviceTypes={(data?.deviceTypes as DeviceType[]) ?? []}
        statuses={(data?.statuses as DeviceStatus[]) ?? []}
        selectedDeviceIds={selectedDeviceIds}
        selectedDevices={selectedDevices}
        onSelectionChange={handleSelectionChange}
        onReload={() => setReloadKey(prev => prev + 1)}
      />

      <AssignDeviceDialog
        open={openAssignModal}
        onClose={() => setOpenAssignModal(false)}
        selectedDevices={assignableDevices}
        onSuccess={reloadAssetsAndClearSelection}
        onHandoverPrintClose={resetDeviceSelection}
      />

      <ReturnDeviceDialog
        open={openReturnModal}
        onClose={() => setOpenReturnModal(false)}
        selectedDevices={returnableDevices}
        onSuccess={reloadAssetsAndClearSelection}
        onHandoverPrintClose={resetDeviceSelection}
      />

      <DeviceFormDialog
        open={openDeviceForm}
        onClose={() => setOpenDeviceForm(false)}
        editDevice={editDevice}
        deviceTypes={data?.deviceTypes ?? []}
        deviceStatus={data?.statuses ?? []}
        onSuccess={() => setReloadKey(k => k + 1)}
      />

      <Dialog open={openApprovedDialog} onOpenChange={setOpenApprovedDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRequestType &&
                t(`device.requests.type.${selectedRequestType}`)}{" "}
              - {t(`device.requests.status.APPROVE`)}
            </DialogTitle>
          </DialogHeader>

          {groupedApprovedDevices.length === 0 ? (
            <div className="text-sm text-gray-500">{t(`common.noData`)}</div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-auto">
              {groupedApprovedDevices.map(d => (
                <div
                  key={d.deviceTypeName}
                  className="border rounded-md px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">
                      {t("device.deviceType") + " : " + d.deviceTypeName}
                    </div>
                    <div className="text-sm font-bold text-gray-700">
                      {t("common.quantity") + " : " + d.quantity}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {d.requests.map((r: DeviceRequest) => (
                      <div
                        key={r.id}
                        className="border-l-2 border-blue-400 pl-3 py-1"
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {r.user?.name || t("device.requests.unknownUser")} -{" "}
                          {r.user?.employeeCode}
                        </div>

                        <div className="text-sm text-gray-700">
                          {r.reason || t("device.requests.defaultReason")}
                        </div>

                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>
                            {r.approvedAt
                              ? new Date(r.approvedAt).toLocaleString("vi-VN")
                              : "-"}
                          </span>

                          <span>
                            {r.items.find(
                              i => i.deviceType.name === d.deviceTypeName
                            )?.quantity ?? 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
