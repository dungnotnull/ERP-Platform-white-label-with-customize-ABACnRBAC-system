import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import DataListMobile from "@/components/patterns/DataList/mobile";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedOrganizationName } from "@/shared/utils/localizedOrganizationName.util";
import useResponsive from "@/hooks/useResponsive.tsx";
import { withButtonActions } from "@/components/patterns/DataList";
import { AlertTriangle } from "lucide-react";
import EmployeeAssignFieldCell from "@/pages/employees/partials/EmployeeAssignFieldCell";
import { ConfirmAlert } from "@/components/patterns/ConfirmAlert.tsx";
import { Column } from "@/shared/@types/dataTable.type.ts";
import { useQueryDataTable } from "@/hooks/useQueryDataTable.ts";
import {
  ApiRouteNames,
  AppRouteNames,
  apiRoutes,
  appRoutes
} from "@/shared/constants/routes.constant.ts";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination.tsx";
import { useNavigate } from "react-router-dom";
import {
  useUrlPagination,
  useUrlPaginationDefaults
} from "@/hooks/useUrlPagination";
import { toast } from "react-toastify";
import { apiClient } from "@/services/api/apiClient.service";
import { normalizePaginatedResponse } from "@/shared/utils/apiResponse.util";
import { clampSearchKeyword } from "@/shared/constants/search.constant";
import { softDeleteInternalUser } from "@/pages/employees/partials/employeeActions.util";
import {
  extractApiErrorPayload,
  resolveApiErrorMessage
} from "@/shared/utils/apiErrorMessage.util";
import { renderEmployeeNameCell } from "@/pages/employees/partials/employeeNameCell";
import { renderMultilineScrollTextCell } from "@/components/cells/multilineScrollTextCell";
import { internalUsersQueryKey } from "@/shared/queries/internalUser.queries";
import QRCode from "react-qr-code";
// import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/Dialog";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/Select";

interface InternalUser {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  department: {
    id: string;
    nameVi?: string;
    nameJa?: string;
    name?: string;
    code: string;
  } | null;
  position: {
    id: string;
    nameVi?: string;
    nameJa?: string;
    name?: string;
  } | null;
  departmentId?: string;
  positionId?: string;
  isActive: boolean;
  createdAt: string;
  deviceSummary?: {
    total: number;
    activeAssignments: number;
  };
}

interface EmployeesDataListProps {
  reloadKey: number;
  filters: EmployeeFilters;
  onEdit: (employee: InternalUser) => void;
  onReload?: () => void;
  departments: any[];
  positions: any[];
}

interface EmployeeFilters {
  status: string;
  department: string;
  position: string;
  search: string;
}

export default function EmployeesDataList({
  reloadKey,
  filters,
  onEdit,
  onReload,
  departments,
  positions
}: EmployeesDataListProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isDesktop } = useResponsive();
  const defaultPagination = useUrlPaginationDefaults();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<InternalUser | null>(
    null
  );
  const [qrUser, setQrUser] = useState<InternalUser | null>(null);
  const [editFieldUser, setEditFieldUser] = useState<InternalUser | null>(null);
  const [editFieldType, setEditFieldType] = useState<
    "department" | "position" | null
  >(null);
  const [editValue, setEditValue] = useState("");

  const queryParams = {
    ...Object.keys(filters).reduce<Record<string, string>>((acc, key) => {
      const filterKey = key as keyof EmployeeFilters;
      const filterValue = filters[filterKey].trim();
      if (!filterValue) return acc;

      if (filterKey === "status") {
        acc.status = filterValue;
        return acc;
      }

      if (filterValue !== "all") {
        const paramKey = filterKey === "search" ? "q" : filterKey;
        acc[paramKey] =
          filterKey === "search"
            ? clampSearchKeyword(filterValue)
            : filterValue;
      }
      return acc;
    }, {})
  };

  const openFieldEditor = (
    user: InternalUser,
    field: "department" | "position"
  ) => {
    setEditFieldUser(user);
    setEditFieldType(field);
    const currentId =
      field === "department"
        ? (user.department?.id ?? user.departmentId)
        : (user.position?.id ?? user.positionId);
    setEditValue(currentId || "");
  };

  const fieldLabel = (field: "department" | "position") =>
    field === "department"
      ? t("employees.department.label")
      : t("employees.position.label");

  const columns: Column<InternalUser>[] = [
    {
      id: "name",
      header: <span className="whitespace-nowrap">{t("employees.name")}</span>,
      accessor: "name",
      sortable: true,
      maxWidth: 250,
      cellClassName: "max-w-[250px]",
      cell: value => renderEmployeeNameCell(value)
    },
    {
      id: "email",
      header: (
        <span className="whitespace-nowrap w-52">{t("employees.email")}</span>
      ),
      accessor: "email",
      sortable: false,
      maxWidth: 220,
      cellClassName: "max-w-[220px]",
      cell: value => renderMultilineScrollTextCell(value)
    },
    {
      id: "employeeCode",
      header: <span className="whitespace-nowrap">{t("employees.code")}</span>,
      accessor: "employeeCode",
      sortable: true,
      maxWidth: 160,
      cellClassName: "max-w-[160px]",
      cell: value => renderMultilineScrollTextCell(value)
    },
    {
      id: "department",
      header: (
        <span className="whitespace-nowrap">
          {t("employees.department.label")}
        </span>
      ),
      accessor: row => row.department?.code ?? "",
      maxWidth: 180,
      cellClassName: "max-w-[180px]",
      cell: (_: unknown, row) => (
        <EmployeeAssignFieldCell
          row={row}
          field="department"
          t={t}
          onAssign={() => openFieldEditor(row, "department")}
        />
      )
    },
    {
      id: "position",
      header: (
        <span className="whitespace-nowrap w-40">
          {t("employees.position.label")}
        </span>
      ),
      accessor: row => row.position?.nameVi ?? row.position?.name ?? "",
      maxWidth: 180,
      cellClassName: "max-w-[180px]",
      cell: (_: unknown, row) => (
        <EmployeeAssignFieldCell
          row={row}
          field="position"
          t={t}
          onAssign={() => openFieldEditor(row, "position")}
        />
      )
    },
    {
      id: "deviceSummary.activeAssignments",
      header: (
        <span className="whitespace-nowrap">{t("employees.deviceCount")}</span>
      ),
      accessor: row => row.deviceSummary?.activeAssignments ?? 0,
      sortable: true,
      align: "center",
      width: "110px",
      cell: (_: unknown, row) => (
        <span className="tabular-nums font-medium">
          {row.deviceSummary?.activeAssignments ?? 0}
        </span>
      )
    },
    {
      id: "isActive",
      header: (
        <span className="whitespace-nowrap w-40">
          {t("employees.status.label")}
        </span>
      ),
      accessor: "isActive",
      cell: (value: boolean) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
          }`}
        >
          {value
            ? t("employees.status.active")
            : t("employees.status.inactive")}
        </span>
      )
    }
    // {
    //   id: "qr",
    //   header: <span className="whitespace-nowrap">{t('employees.qr')}</span>,
    //   accessor: (row: InternalUser) => row.id,
    //   cell: (_: any, row) => (
    //     <Button
    //       variant="outline"
    //       size="icon"
    //       onClick={(e) => {
    //         e.stopPropagation();
    //         setQrUser(row); // mở modal hiển thị QR
    //       }}
    //     >
    //       <QrCode className="w-4 h-4" />
    //     </Button>
    //   ),
    // },
  ];

  const { data, isLoading, pagination, totalItems, sort } =
    useQueryDataTable<InternalUser>({
      initialData: [],
      queryKey: [
        ...internalUsersQueryKey,
        JSON.stringify(queryParams),
        String(reloadKey)
      ],
      url: apiRoutes[ApiRouteNames.INTERNAL_USERS],
      columns,
      defaultPagination,
      transformResponse: normalizePaginatedResponse,
      queryParams
    });

  const { handlePageChange, handlePageSizeChange } =
    useUrlPagination(pagination);

  const handleRowClick = (rowData: InternalUser) => {
    navigate(`${appRoutes[AppRouteNames.EMPLOYEE_DETAIL]}/${rowData.id}`);
  };

  const handleEditAction = (rowData?: InternalUser) => {
    if (rowData) onEdit(rowData);
  };

  const handleDeleteAction = (rowData?: InternalUser) => {
    setEmployeeToDelete(rowData ?? null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await softDeleteInternalUser(employeeToDelete.id);
      toast.success(
        t("employees.delete.success", { name: employeeToDelete.name })
      );
      setIsDeleteDialogOpen(false);
      setEmployeeToDelete(null);
      onReload?.();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(resolveApiErrorMessage(err, t, "employees.delete.failed"));
    } finally {
      setIsDeleting(false);
    }
  };

  const employeeColumns = withButtonActions<InternalUser>(columns, {
    onEdit: handleEditAction,
    onDelete: handleDeleteAction
  });
  return (
    <>
      {isDesktop ? (
        <DataListDesktopUI<InternalUser>
          data={data}
          columns={employeeColumns}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
          sortConfig={{
            config: sort.sortConfig,
            onSortChange: sort.requestSort
          }}
        />
      ) : (
        <DataListMobile<InternalUser & { action?: unknown }>
          data={data}
          triggerConfig={{ accessor: "name", accessorSecondary: "email" }}
          columns={employeeColumns}
          onClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
          hideTriggerLabel
          renderSubtitle={i18n.language === "vi" ? "department.nameVi" : "department.nameJa"}
        />
      )}

      <DataListPagination
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        totalPages={Math.ceil(totalItems / pagination.pageSize)}
        pageSizeOptions={pagination.pageSizeOptions}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={totalItems}
      />

      <ConfirmAlert
        open={isDeleteDialogOpen}
        title={t("employees.delete.title", {
          name: employeeToDelete?.name ?? ""
        })}
        onConfirm={confirmDelete}
        confirmText={t("common.delete")}
        confirmClassName="bg-red-600 hover:bg-red-700"
        isLoading={isDeleting}
        icon={
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        }
        onOpenChange={setIsDeleteDialogOpen}
      />

      {/* Edit Department/Position Dialog */}
      <Dialog
        open={!!editFieldUser}
        onOpenChange={() => setEditFieldUser(null)}
      >
        <DialogContent className="sm:max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>
              {t("employees.quickEdit.title", {
                field: editFieldType ? fieldLabel(editFieldType) : "",
                name: editFieldUser?.name ?? ""
              })}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-700 font-medium">
              {editFieldType ? fieldLabel(editFieldType) : ""}
            </label>

            <Select
              value={editValue}
              onValueChange={value => setEditValue(value)}
            >
              <SelectTrigger className="w-full bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue
                  placeholder={
                    editFieldType
                      ? t("employees.quickEdit.selectPlaceholder", {
                          field: fieldLabel(editFieldType)
                        })
                      : ""
                  }
                />
              </SelectTrigger>

              <SelectContent className="bg-white text-gray-900 border border-gray-200 shadow-lg rounded-md">
                {editFieldType === "department" ? (
                  <>
                    {departments.map(department => (
                      <SelectItem key={department.id} value={department.id}>
                        {getLocalizedOrganizationName(
                          department,
                          i18n.language
                        )}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <>
                    {positions.map(position => (
                      <SelectItem key={position.id} value={position.id}>
                        {getLocalizedOrganizationName(position, i18n.language)}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditFieldUser(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={async () => {
                if (!editFieldUser || !editFieldType || !editValue) return;
                try {
                  await apiClient.patch(
                    `${apiRoutes[ApiRouteNames.INTERNAL_USERS]}/${editFieldUser.id}/department-position`,
                    { [editFieldType]: editValue }
                  );

                  toast.success(
                    t("employees.quickEdit.updateSuccess", {
                      field: fieldLabel(editFieldType)
                    })
                  );
                  setEditFieldUser(null);
                  onReload?.();
                } catch (err) {
                  console.error("Update error:", err);
                  const payload = extractApiErrorPayload(err);
                  toast.error(
                    payload?.errorCode || payload?.message
                      ? resolveApiErrorMessage(err, t)
                      : t("employees.quickEdit.updateFailed", {
                          field: fieldLabel(editFieldType)
                        })
                  );
                }
              }}
            >
              {t("common.save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!qrUser} onOpenChange={() => setQrUser(null)}>
        <DialogContent className="sm:max-w-sm text-center space-y-4">
          <DialogHeader>
            <DialogTitle>
              {t("qr_code.title")} - {qrUser?.name}
            </DialogTitle>
          </DialogHeader>

          {qrUser && (
            <div className="flex flex-col items-center space-y-3">
              <QRCode
                value={JSON.stringify({
                  id: qrUser.id,
                  name: qrUser.name,
                  email: qrUser.email,
                  department: qrUser.department,
                  position: qrUser.position
                })}
                size={180}
              />
              <p className="text-sm text-gray-600">
                {t("qr_code.description")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
