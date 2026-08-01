import { useQueryDataTable } from "@/hooks/useQueryDataTable";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination";
import {
  useUrlPagination,
  useUrlPaginationDefaults
} from "@/hooks/useUrlPagination";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import PageTopBar from "@/components/PageTopBar";
import { ListOrderedIcon, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { normalizePaginatedResponse } from "@/shared/utils/apiResponse.util";
import { Column } from "@/shared/@types/dataTable.type";

export default function EmployeeDeviceSummary() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const defaultPagination = useUrlPaginationDefaults();

  const columns: Column<Record<string, unknown>>[] = [
    { id: "userName", header: t("employees.name"), accessor: "userName" },
    {
      id: "group",
      header: t("employees.department.label"),
      accessor: "groupNameVi",
      cell: (_: unknown, row: Record<string, unknown>) =>
        getLocalizedOrganizationName(
          {
            nameVi: String(row.groupNameVi ?? ""),
            nameJa: String(row.groupNameJa ?? "")
          },
          i18n.language
        )
    },
    {
      id: "deviceType",
      header: t("device.deviceType"),
      accessor: "deviceType"
    },
    {
      id: "deviceName",
      header: t("device.deviceName"),
      accessor: "deviceName"
    },
    {
      id: "totalDevices",
      header: t("common.quantity"),
      accessor: "totalDevices"
    },
    {
      id: "latestAssignedAt",
      header: t("device.deviceAssignedDate"),
      accessor: "latestAssignedAt",
      cell: (v: string) => (v ? new Date(v).toLocaleString() : "-")
    }
  ];

  const { data, isLoading, pagination, totalItems } = useQueryDataTable({
    initialData: [],
    queryKey: ["employee-device-summary"],
    url: apiRoutes[ApiRouteNames.EMPLOYEE_DEVICE_SUMMARY],
    columns,
    defaultPagination,
    transformResponse: normalizePaginatedResponse
  });

  const { handlePageChange, handlePageSizeChange } =
    useUrlPagination(pagination);

  return (
    <div className="">
      <div className="">
        <PageTopBar
          title={t("employees.deviceReportByEmployee")}
          description={t("employees.deviceReportByEmployee")}
          Icon={ListOrderedIcon}
        />

        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border hover:bg-blue-900 mb-2"
          size="sm"
        >
          <ArrowLeft size={18} />
          {t("common.back") ?? "Quay lại"}
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
    </div>
  );
}
