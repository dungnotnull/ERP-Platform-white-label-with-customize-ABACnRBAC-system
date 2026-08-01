import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import DataListMobile from "@/components/patterns/DataList/mobile";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import useResponsive from "@/hooks/useResponsive";
import { toast } from "react-toastify";
import { withButtonActions } from "@/components/patterns/DataList";
import { AlertTriangle } from "lucide-react";
import { ConfirmAlert } from "@/components/patterns/ConfirmAlert";
import type {
  Device,
  DeviceStatus,
  DeviceType
} from "@/shared/@types/assets.type";
import { Column } from "@/shared/@types/dataTable.type";
import { ChangeStatus } from "@/pages/assets/partials/ChangeStatus";
import { useQueryDataTable } from "@/hooks/useQueryDataTable";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { Checkbox } from "@/components/ui/Checkbox";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination";
import { WarrantyExpiryDateCell } from "@/pages/assets/partials/WarrantyExpiryDateCell";
import DeviceFormDialog from "./DeviceFormDialog";
import {
  MultilineScrollText,
  renderMultilineScrollTextCell
} from "@/components/cells/multilineScrollTextCell";

import { apiClient } from "@/services/api/apiClient.service";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import { normalizePaginatedResponse } from "@/shared/utils/deviceRequest.util";
import { clampSearchKeyword } from "@/shared/constants/search.constant";
import { canAddDeviceToSelection } from "@/shared/utils/deviceSelection.util";

import { useSearchParams, useNavigate } from "react-router-dom";

const allowedSortFields = [
  "serialNumber",
  "deviceTypeId",
  "name",
  "warrantyExpiryDate",
  "purchaseDate",
  "createdAt"
];

export default function AssetsDataList({
  filters,
  reloadKey,
  deviceTypes,
  statuses,
  selectedDeviceIds,
  selectedDevices,
  onSelectionChange,
  onReload
}: {
  filters: {
    type: string;
    status: string;
    search: string;
  };
  reloadKey: number;
  deviceTypes: DeviceType[];
  statuses: DeviceStatus[];
  selectedDeviceIds: string[];
  selectedDevices: Device[];
  onSelectionChange?: (ids: string[], devices: Device[]) => void;
  onReload?: () => void;
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [openDeviceForm, setOpenDeviceForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const { t } = useTranslation();
  const { isDesktop } = useResponsive();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const pageParam = Number(searchParams.get("page"));
  const limitParam = Number(searchParams.get("limit"));
  const sortParam = searchParams.get("sort");
  const orderParam = searchParams.get("order");

  const validPage =
    Number.isInteger(pageParam) && pageParam > 0 ? pageParam - 1 : 0;

  const validLimit =
    Number.isInteger(limitParam) && [10, 25, 50, 100].includes(limitParam)
      ? limitParam
      : 10;

  const validSort =
    sortParam && allowedSortFields.includes(sortParam)
      ? sortParam
      : "createdAt";

  const validOrder =
    orderParam === "asc" || orderParam === "desc" ? orderParam : "desc";

  useEffect(() => {
    const shouldReplace =
      pageParam !== validPage + 1 ||
      limitParam !== validLimit ||
      sortParam !== validSort ||
      orderParam !== validOrder;

    if (!shouldReplace) return;

    const next = new URLSearchParams(searchParams);

    next.set("page", String(validPage + 1));
    next.set("limit", String(validLimit));
    next.set("sort", validSort);
    next.set("order", validOrder);

    setSearchParams(next, { replace: true });
  }, [
    pageParam,
    limitParam,
    sortParam,
    orderParam,
    validPage,
    validLimit,
    validSort,
    validOrder,
    searchParams,
    setSearchParams
  ]);

  const currentPage = validPage;
  const currentLimit = validLimit;

  // Gọi API (react-query hook)
  const {
    data: devices,
    isLoading,
    pagination,
    totalItems,
    sort
  } = useQueryDataTable<Device>({
    initialData: [],

    queryKey: [
      "devices",
      JSON.stringify(filters),
      reloadKey.toString(),
      currentPage.toString(),
      currentLimit.toString()
    ],

    url: apiRoutes[ApiRouteNames.DEVICES],
    columns: [],
    defaultPagination: {
      pageIndex: currentPage,
      pageSize: currentLimit
    },
    transformResponse: normalizePaginatedResponse,
    queryParams: {
      page: currentPage + 1,
      limit: currentLimit,

      deviceTypeId: filters.type !== "all" ? filters.type : undefined,

      deviceStatusId: filters.status !== "all" ? filters.status : undefined,

      search: filters.search?.trim()
        ? clampSearchKeyword(filters.search.trim()) || undefined
        : undefined
    }
  });

  const toggleCheckbox = (device: Device) => {
    const exists = selectedDeviceIds.includes(device.id);

    if (exists) {
      const nextIds = selectedDeviceIds.filter(id => id !== device.id);
      const nextDevices = selectedDevices.filter(d => nextIds.includes(d.id));
      onSelectionChange?.(nextIds, nextDevices);
      return;
    }

    const validation = canAddDeviceToSelection(selectedDevices, device);

    if (!validation.allowed) {
      if (validation.reason === "not_selectable") {
        toast.warn(t("assets.selection.notSelectable"));
      } else if (validation.reason === "mixed_status") {
        toast.warn(t("assets.selection.mixedStatus"));
      } else if (validation.reason === "different_assignee") {
        toast.warn(t("assets.selection.differentAssignee"));
      }
      return;
    }

    const nextIds = [...selectedDeviceIds, device.id];
    const nextDevices = [...selectedDevices, device];
    onSelectionChange?.(nextIds, nextDevices);
  };

  const columns: Column<Device>[] = [
    {
      id: "serialNumber",
      header: (
        <span className="whitespace-nowrap">{t("assets.label.serial")}</span>
      ),
      accessor: "id",
      sortable: true,
      maxWidth: 160,
      cellClassName: "max-w-[160px]",
      cell: (_, row: Device) => {
        const device = row;
        const serial = device?.serialNumber ?? t("common.noData");
        return (
          <div className="flex min-w-0 items-start gap-2.5">
            <Checkbox
              className="mt-0.5 shrink-0"
              onClick={e => e.stopPropagation()}
              checked={selectedDeviceIds.includes(device.id)}
              onCheckedChange={() => toggleCheckbox(device)}
            />
            <MultilineScrollText
              value={serial}
              className="min-w-0 flex-1 font-bold"
            />
          </div>
        );
      }
    },
    {
      id: "deviceTypeId",
      header: (
        <span className="whitespace-nowrap">{t("assets.label.type")}</span>
      ),
      accessor: "deviceType",
      sortable: true,
      maxWidth: 140,
      cellClassName: "max-w-[140px]",
      cell: (value: DeviceType) => renderMultilineScrollTextCell(value?.name)
    },
    {
      id: "name",
      header: (
        <span className="whitespace-nowrap">{t("assets.label.name")}</span>
      ),
      accessor: "name",
      sortable: true,
      maxWidth: 180,
      cellClassName: "max-w-[180px]",
      cell: (value: string, row: Device) => (
        <div className="flex flex-col">
          <MultilineScrollText value={value} className="font-medium" />

          {row.currentAssignment?.userName && (
            <div
              className="mt-1 flex items-center gap-1 text-xs text-blue-600 cursor-pointer hover:underline"
              onClick={e => {
                e.stopPropagation(); // tránh trigger click của row
                navigate(`/employee-detail/${row.currentAssignment?.userId}`);
              }}
            >
              <span>👤</span>
              <span className="truncate">{row.currentAssignment.userName}</span>
            </div>
          )}
        </div>
      )
    },
    {
      id: "status",
      header: (
        <span className="truncate block max-w-[140px]">
          {t("assets.label.status")}
        </span>
      ),
      accessor: "status",
      cell: (value: DeviceStatus, row: Device) => {
        const statusName = value?.name;

        // handed_over => chỉ hiển thị label
        if (statusName === "handed_over") {
          const colors = ["#172554", "#EFF6FF"];

          return (
            <div
              className="flex h-8 w-[150px] items-center justify-center rounded-[20px] border px-3 text-xs font-semibold"
              style={{
                borderColor: colors[0],
                color: colors[0],
                backgroundColor: colors[1]
              }}
            >
              <span className="truncate">
                {t(`assets.status.${statusName}`)}
              </span>
            </div>
          );
        }

        return (
          <ChangeStatus
            disabled={true}
            defaultValue={value?.id || ""}
            statuses={statuses.map(s => ({
              id: s.id,
              name: s.name
            }))}
            onChange={async newStatusId => {
              try {
                await apiClient.put(
                  `${apiRoutes[ApiRouteNames.DEVICES]}/${row.id}/status`,
                  { newStatusId }
                );

                toast.success(t("assets.status.updated"));

                onReload?.();
              } catch (error: unknown) {
                toast.error(
                  resolveApiErrorMessage(error, t, "assets.status.updateFailed")
                );
              }
            }}
          />
        );
      }
    },
    {
      id: "warrantyExpiryDate",
      header: (
        <span className="truncate block max-w-[140px]">
          {t("assets.label.warrantyExpiryDate")}
        </span>
      ),
      accessor: "warrantyExpiryDate",
      sortable: true,
      cell: (value: string) => (
        <span className="truncate block max-w-[140px]">
          <WarrantyExpiryDateCell dateValue={value} />
        </span>
      )
    },
    {
      id: "purchaseDate",
      header: (
        <span className="truncate block max-w-[140px]">
          {t("assets.label.purchaseDate")}
        </span>
      ),
      accessor: "purchaseDate",
      sortable: true,
      cell: value =>
        value ? (
          <span className="truncate block max-w-[140px]">
            <WarrantyExpiryDateCell dateValue={value} />
          </span>
        ) : (
          "—"
        )
    }
  ];

  const handleEditAction = (rowData?: Device) => {
    if (!rowData) return;
    setEditingDevice(rowData);
    setOpenDeviceForm(true);
    // toast.info(`Editing device: ${rowData?.name}`);
  };

  const handleDeleteAction = (rowData?: Device) => {
    if (!rowData) return;
    console.log("Attempting to delete device:", rowData);
    const statusName = rowData.status?.name;

    if (statusName === "handed_over") {
      toast.warning(
        t("assets.deleteAssignedDevice") ||
          "Không thể xóa thiết bị đang được bàn giao cho nhân viên."
      );
      return;
    }
    setDeviceToDelete(rowData);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;

    try {
      await apiClient.delete(
        `${apiRoutes[ApiRouteNames.DEVICES]}/${deviceToDelete.id}`
      );

      toast.success(
        t("assets.status.deleteSuccess", {
          name: deviceToDelete.name
        })
      );

      setIsDeleteDialogOpen(false);
      setDeviceToDelete(null);

      onReload?.();
    } catch (error: unknown) {
      toast.error(
        resolveApiErrorMessage(error, t, "assets.status.deleteFailed")
      );
    }
  };

  const assetColumns = withButtonActions<Device>(columns, {
    onEdit: handleEditAction,
    onDelete: handleDeleteAction
  });

  return (
    <>
      {isDesktop ? (
        <div className="overflow-x-auto">
          {/* ✅ Chỉ render khi có data và columns hợp lệ */}
          {assetColumns?.length && Array.isArray(devices) ? (
            <DataListDesktopUI<Device>
              data={devices}
              columns={assetColumns}
              onRowClick={row => console.log("Clicked:", row)}
              isLoading={isLoading}
              emptyMessage={t("common.noData")}
              sortConfig={{
                config: sort.sortConfig,
                onSortChange: sort.requestSort
              }}
            />
          ) : (
            <div className="text-gray-500 text-sm p-4 break-words">
              {t("common.handling")}
            </div>
          )}
        </div>
      ) : assetColumns?.length && Array.isArray(devices) ? (
        <DataListMobile<Device & { action?: unknown }>
          data={devices}
          columns={assetColumns}
          triggerConfig={{
            accessor: "serialNumber",
            accessorSecondary: "action"
          }}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
        />
      ) : (
        <div className="text-gray-500 text-sm p-4 break-words">
          {t("common.handling")}
        </div>
      )}

      {/* Pagination */}
      <DataListPagination
        onPageChange={page => {
          const next = new URLSearchParams(searchParams);
          next.set("page", String(page + 1));
          setSearchParams(next);
        }}
        onPageSizeChange={size => {
          const next = new URLSearchParams(searchParams);
          next.set("limit", String(size));
          next.set("page", "1");
          setSearchParams(next);
        }}
        totalPages={pagination.totalPages}
        pageSizeOptions={pagination.pageSizeOptions}
        pageIndex={currentPage}
        pageSize={currentLimit}
        totalItems={totalItems}
      />

      {/* Confirm Delete */}
      <ConfirmAlert
        open={isDeleteDialogOpen}
        title={`${t("assets.delete.title", { name: deviceToDelete?.name || "" })}`}
        description={t("assets.delete.description")}
        onConfirm={confirmDelete}
        confirmText={t("assets.delete.confirmText")}
        confirmClassName="bg-red-600 hover:bg-red-700"
        icon={
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        }
        onOpenChange={setIsDeleteDialogOpen}
      />

      <DeviceFormDialog
        open={openDeviceForm}
        editDevice={editingDevice}
        deviceTypes={deviceTypes}
        deviceStatus={statuses}
        onClose={() => {
          setOpenDeviceForm(false);
          setEditingDevice(null);
        }}
        onSuccess={() => {
          setOpenDeviceForm(false);
          setEditingDevice(null);
          onReload?.();
        }}
      />
    </>
  );
}
