import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import DataListMobile from "@/components/patterns/DataList/mobile";
import { useTranslation } from "react-i18next";
import useResponsive from "@/hooks/useResponsive.tsx";
import { Column } from "@/shared/@types/dataTable.type.ts";
import { useQueryDataTable } from "@/hooks/useQueryDataTable.ts";
import {
  ApiRouteNames,
  apiRoutes
} from "@/shared/constants/routes.constant.ts";
import { withButtonActions } from "@/components/patterns/DataList";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination.tsx";
import {
  useUrlPagination,
  useUrlPaginationDefaults
} from "@/hooks/useUrlPagination";
import * as React from "react";
import { normalizePaginatedResponse } from "@/shared/utils/apiResponse.util";
import { clampSearchKeyword } from "@/shared/constants/search.constant";
import { renderMultilineScrollTextCell } from "@/components/cells/multilineScrollTextCell";
import { ConfirmAlert } from "@/components/patterns/ConfirmAlert";
import { useState } from "react";
import { toast } from "react-toastify";
import { resolveSupplierApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";
import { apiClient } from "@/services/api/apiClient.service";
import { AlertTriangle } from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  notes: string;
  updatedAt: string;
  createdAt: string;
}

interface SupplierFilters {
  name: string;
  contactPerson: string;
  search: string;
}

interface SuppliersDataListProps {
  reloadKey: number;
  filters: SupplierFilters;
  onEdit: (supplier: Supplier) => void;
  onView: (supplier: Supplier) => void;
  onReload: () => void;
}

export default function SuppliersDataList({
  reloadKey,
  filters,
  onEdit,
  // onView,
  onReload
}: SuppliersDataListProps) {
  const { t } = useTranslation();
  const { isDesktop } = useResponsive();
  const defaultPagination = useUrlPaginationDefaults();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(
    null
  );

  const buildSearchQuery = (f: SupplierFilters) => {
    const parts = [f.search, f.name, f.contactPerson]
      .map(v => (v?.trim() ? clampSearchKeyword(v.trim()) : ""))
      .filter(Boolean) as string[];
    const combined = parts.join(" ").trim();
    return combined ? clampSearchKeyword(combined) : "";
  };

  const queryParams = React.useMemo(() => {
    const search = buildSearchQuery(filters);
    return search ? { search } : {};
  }, [filters]);

  // ===== Columns =====
  const columns: Column<Supplier>[] = [
    {
      id: "name",
      header: t("supplier.name"),
      accessor: "name",
      sortable: true,
      maxWidth: 280,
      cellClassName: "max-w-[280px]",
      cell: v => renderMultilineScrollTextCell(v, "font-medium")
    },
    {
      id: "contactPerson",
      header: t("supplier.contactPerson"),
      accessor: "contactPerson",
      sortable: false,
      maxWidth: 180,
      cellClassName: "max-w-[180px]",
      cell: v => renderMultilineScrollTextCell(v)
    },
    {
      id: "phone",
      header: t("supplier.phone"),
      accessor: "phone",
      sortable: false,
      maxWidth: 140,
      cellClassName: "max-w-[140px]",
      cell: v => renderMultilineScrollTextCell(v, "text-blue-600")
    },
    {
      id: "email",
      header: t("supplier.email"),
      accessor: "email",
      sortable: false,
      maxWidth: 220,
      cellClassName: "max-w-[220px]",
      cell: v => renderMultilineScrollTextCell(v, "text-gray-700")
    },
    {
      id: "updatedAt",
      header: t("common.updatedAt"),
      accessor: "updatedAt",
      sortable: true,
      width: "180px",
      cell: v => (
        <span className="text-gray-500 text-xs whitespace-nowrap">
          {new Date(v).toLocaleString()}
        </span>
      )
    }
    // {
    //     id: "actions",
    //     header: '',
    //     accessor: "id",
    //     width: "140px",
    //     cell: (_, row) => (
    //       <Button
    //         size="sm"
    //         className="flex items-center gap-2 hover:bg-blue-900 border-blue-600"
    //         onClick={() => {
    //           navigate(`/suppliers/order-history/${row.id}`);
    //         }}
    //       >
    //         {t("purchase.order.orderHistory")}
    //       </Button>
    //     )
    //   }
  ];

  // ===== Fetch data =====
  const { data, isLoading, pagination, totalItems, sort } =
    useQueryDataTable<Supplier>({
      initialData: [],
      queryKey: ["suppliers", JSON.stringify(queryParams), String(reloadKey)],
      url: apiRoutes[ApiRouteNames.SUPPLIERS],
      columns,
      defaultPagination,
      transformResponse: normalizePaginatedResponse,
      queryParams
    });

  const { handlePageChange, handlePageSizeChange } =
    useUrlPagination(pagination);

  const handleEditAction = (rowData?: Supplier) => {
    if (rowData) onEdit(rowData);
  };

  const handleDeleteAction = (rowData?: Supplier) => {
    if (!rowData) return;

    setSupplierToDelete(rowData);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;

    try {
      await apiClient.delete(
        `${apiRoutes[ApiRouteNames.SUPPLIERS]}/${supplierToDelete.id}`
      );

      toast.success(
        t("supplier.delete.success", {
          name: supplierToDelete.name
        })
      );

      setIsDeleteDialogOpen(false);
      setSupplierToDelete(null);

      // refresh list
      onReload?.();
    } catch (error: unknown) {
      toast.error(
        resolveSupplierApiErrorMessage(error, t, "supplier.delete.failed")
      );
    }
  };

  const supplierColumns = withButtonActions<Supplier>(columns, {
    onEdit: handleEditAction,
    onDelete: handleDeleteAction
  });

  return (
    <>
      {isDesktop ? (
        <DataListDesktopUI<Supplier>
          data={data}
          columns={supplierColumns}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
          sortConfig={{
            config: sort.sortConfig,
            onSortChange: sort.requestSort
          }}
        />
      ) : (
        <DataListMobile<Supplier & { action?: unknown }>
          data={data}
          triggerConfig={{ accessor: "name", accessorSecondary: "email" }}
          columns={supplierColumns}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
          hideTriggerLabel
        />
      )}

      <DataListPagination
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        totalPages={pagination.totalPages}
        pageSizeOptions={pagination.pageSizeOptions}
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        totalItems={totalItems}
      />

      {/* Confirm Delete */}
      <ConfirmAlert
        open={isDeleteDialogOpen}
        title={`${t("supplier.delete.title", { name: supplierToDelete?.name || "" })}`}
        description={t("supplier.delete.description")}
        onConfirm={confirmDelete}
        confirmText={t("supplier.delete.confirmText")}
        confirmClassName="bg-red-600 hover:bg-red-700"
        icon={
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
        }
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}
