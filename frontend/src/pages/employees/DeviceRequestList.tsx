import { useState, useCallback, useEffect } from "react";
import { useQueryDataTable } from "@/hooks/useQueryDataTable";
import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination";
import { useNavigate } from "react-router-dom";
import {
  useUrlPagination,
  useUrlPaginationDefaults
} from "@/hooks/useUrlPagination";
import { useTranslation } from "react-i18next";
import PageTopBar from "@/components/PageTopBar";
import { ClipboardListIcon, PlusIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { apiClient } from "@/services/api/apiClient.service";
import { extractApiList } from "@/shared/utils/apiResponse.util";
import { clampSearchKeyword } from "@/shared/constants/search.constant";
import config from "@/shared/constants/config.constant";
import type { InternalUser } from "./partials/types";
import type { DeviceRequest } from "@/shared/@types/assets.type";
import DeviceRequestsFilter from "./partials/DeviceRequestFilter";
import { toast } from "react-toastify";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import type {
  DeviceRequestFilters,
  DeviceRequestFilterKey
} from "./partials/DeviceRequestFilter";
import DeviceRequestFormModal from "./partials/DeviceRequestFormModal";
import { ChangeDeviceRequestStatus } from "./partials/ChangeDeviceRequestStatus";
import { useUserProfile } from "@/shared/hooks/useUserProfile.ts";
import DeviceRequestDetailDialog from "./partials/DeviceRequestDetailDialog";

const initialFilters = {
  search: "",
  status: "all",
  user: "all",
  deviceType: "all"
};

interface Filters {
  search: string;
  status: string;
  user: string;
  deviceType: string;
}

export type FilterKey = keyof Filters | "reset";

export default function DeviceRequestList() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<DeviceRequestFilters>(initialFilters);
  const [reloadKey, setReloadKey] = useState(0);
  const navigate = useNavigate();
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<any[]>([]);
  const defaultPagination = useUrlPaginationDefaults({
    pageSizeOptions: [10, 25, 50, 100]
  });
  const [openCreate, setOpenCreate] = useState(false);
  const [, setDeviceRequests] = useState<DeviceRequest[]>([]);
  const { user } = useUserProfile();
  const approvedByUserId = user?._id || "admin-user-id";
  const [open, setOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [draftFilters, setDraftFilters] =
    useState<DeviceRequestFilters>(initialFilters);

  const handleFilterChange = useCallback(
    (key: DeviceRequestFilterKey, value?: string) => {
      if (key === "reset") {
        setFilters(initialFilters);
        setDraftFilters(initialFilters);
        setReloadKey(k => k + 1);
        return;
      }

      setDraftFilters(prev => ({
        ...prev,
        [key]:
          key === "search" && value ? clampSearchKeyword(value) : (value ?? "")
      }));
    },
    []
  );

  const handleApplyFilters = () => {
    setFilters(draftFilters);
  };

  // const handleFilterChange = useCallback(
  //   (key: DeviceRequestFilterKey, value?: string) => {
  //     if (key === "reset") {
  //       setFilters(initialFilters);
  //       setReloadKey(k => k + 1);
  //     } else {
  //       setFilters(prev => ({
  //         ...prev,
  //         [key]:
  //           key === "search" && value
  //             ? clampSearchKeyword(value)
  //             : (value ?? "")
  //       }));
  //     }
  //   },
  //   []
  // );

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [usersPayload, deviceTypesPayload] = await Promise.all([
          apiClient.get(apiRoutes[ApiRouteNames.INTERNAL_USERS], {
            params: { limit: 1000, status: "all" }
          }),
          apiClient.get(apiRoutes[ApiRouteNames.DEVICE_TYPES])
        ]);
        setUsers(extractApiList<InternalUser>(usersPayload));
        setDeviceTypes(extractApiList(deviceTypesPayload));
      } catch (error) {
        console.error("Failed to fetch device request filter options:", error);
        setUsers([]);
        setDeviceTypes([]);
      }
    };
    fetchFilterOptions();
  }, []);

  const queryParams = {
    search: filters.search
      ? clampSearchKeyword(filters.search) || undefined
      : undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    userId: filters.user !== "all" ? filters.user : undefined,
    deviceTypeId: filters.deviceType !== "all" ? filters.deviceType : undefined
  };

  const columns = [
    {
      id: "user",
      header: t("device.requests.user"),
      accessor: "user",
      cell: (_: any, row: any) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.user?.name ?? "-"}</span>

          <span className="text-xs text-gray-500">
            {row.user?.employeeCode ?? ""}
          </span>
        </div>
      )
    },
    {
      id: "type",
      header: t("device.requests.type.label"),
      accessor: "type",
      cell: (v: string) => t(`device.requests.type.${v}`)
    },
    {
      id: "deviceType",
      header: t("device.deviceName"),
      accessor: "items",
      cell: (_: any, row: any) => {
        if (!row.items?.length) return "-";

        return (
          <div className="flex flex-col gap-1">
            {row.items.map((item: any, idx: number) => (
              <div key={idx} className="text-sm">
                {item.deviceType?.name ?? "-"} x {item.quantity}
              </div>
            ))}
          </div>
        );
      }
    },
    {
      id: "status",
      header: t("device.requests.status.label"),
      accessor: "status",
      cell: (_: any, row: any) => {
        const isCompleted = row.status === "COMPLETED";

        if (isCompleted) {
          return (
            <span
              className="
                        inline-flex
                        items-center
                        justify-center
                        min-w-[120px]
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        rounded-full
                        bg-green-100
                        text-green-800
                    "
            >
              {t("device.requests.status.COMPLETED")}
            </span>
          );
        }

        return (
          <ChangeDeviceRequestStatus
            defaultValue={row.status ?? "pending"}
            statuses={[
              { id: "REJECTED", name: "REJECTED" },
              { id: "APPROVED", name: "APPROVED" },
              { id: "PENDING", name: "PENDING" },
              { id: "COMPLETED", name: "COMPLETED" }
            ]}
            onChange={async newStatusId => {
              try {
                const url = config.getApiUrl(
                  `${apiRoutes[ApiRouteNames.DEVICE_REQUESTS]}/${row.id}/status`
                );

                await apiClient.put(url, {
                  status: newStatusId,
                  approvedByUserId: approvedByUserId ?? null
                });

                setDeviceRequests(prev =>
                  prev.map(r =>
                    r.id === row.id ? { ...r, status: newStatusId } : r
                  )
                );

                toast.success(
                  t("device.requests.updateStatusSuccess", {
                    status: t(`device.requests.status.${newStatusId}`)
                  })
                );
              } catch (err) {
                console.error("UPDATE ERROR:", err);
                toast.error(
                  resolveApiErrorMessage(
                    err,
                    t,
                    "device.requests.updateStatusFailed"
                  )
                );
              }
            }}
          />
        );
      }
    },
    {
      id: "requestedBy",
      header: t("device.requests.requestedBy"),
      accessor: "requestedByUser",
      cell: (_: any, row: any) => (
        <div className="flex flex-col">
          <span>{row.requestedByUser?.name ?? "-"}</span>

          <span className="text-xs text-gray-500">
            {row.requestedByUser?.email ?? ""}
          </span>
        </div>
      )
    },
    {
      id: "createdAt",
      header: t("common.update"),
      accessor: "createdAt",
      cell: (v: string) => (v ? new Date(v).toLocaleString("vi-VN") : "-")
    },
    {
      id: "action",
      header: "",
      accessor: "id",
      cell: (_: any, row: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedRequest(row);
            setOpen(true);
          }}
        >
          {t("common.show")}
        </Button>
      )
    }
  ];

  const { data, isLoading, pagination, totalItems } = useQueryDataTable({
    initialData: [],
    queryKey: [
      "device-requests",
      String(reloadKey),
      JSON.stringify(queryParams)
    ],
    url: apiRoutes[ApiRouteNames.DEVICE_REQUESTS],
    columns,
    queryParams,
    defaultPagination
  });

  const { handlePageChange, handlePageSizeChange } =
    useUrlPagination(pagination);

  return (
    <div className="pr-5 md:pr-[50px] md:pl-0 ">
      <PageTopBar
        title={t("device.requests.list")}
        description={t("device.requests.description")}
        Icon={ClipboardListIcon}
      />

      <DeviceRequestsFilter
        filters={draftFilters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        users={users}
        deviceTypes={deviceTypes}
      />

      <div className="flex items-center gap-4 mb-6">
        {/* ⭐ Nút Quay lại */}
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border hover:bg-blue-900"
          size="sm"
        >
          <ArrowLeft size={18} />
          {t("common.back") ?? "Quay lại"}
        </Button>

        <Button
          size="sm"
          className="flex items-center gap-2 rounded-lg border hover:bg-blue-900"
          onClick={() => setOpenCreate(true)}
        >
          <PlusIcon size={16} />
          {t("device.requests.create")}
        </Button>
      </div>

      <DataListDesktopUI
        data={data}
        columns={columns}
        isLoading={isLoading}
        emptyMessage={t("common.noData")}
      />

      <DataListPagination
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        totalPages={pagination.totalPages}
        pageSizeOptions={pagination.pageSizeOptions}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={totalItems}
      />

      <DeviceRequestFormModal
        open={openCreate}
        onOpenChange={setOpenCreate}
        users={users}
        deviceTypes={deviceTypes}
        onSuccess={() => setReloadKey(k => k + 1)}
      />

      <DeviceRequestDetailDialog
        open={open}
        onOpenChange={setOpen}
        data={selectedRequest}
      />
    </div>
  );
}
