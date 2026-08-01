import React from "react";
import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import DataListMobile from "@/components/patterns/DataList/mobile";
import { Column } from "@/shared/@types/dataTable.type.ts";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination";
import { withButtonActions } from "@/components/patterns/DataList";
import { useTranslation } from "react-i18next";
import useResponsive from "@/hooks/useResponsive";
import { useQueryDataTable } from "@/hooks/useQueryDataTable";
import { ApiRouteNames, apiRoutes } from "@/shared/constants/routes.constant";
import { PurchaseOrder, PurchaseOrderFilters } from "../partial/types";
import {
  useUrlPagination,
  useUrlPaginationDefaults
} from "@/hooks/useUrlPagination";
import { ChangePurchaseOrderStatus } from "./ChangePurchaseOrderStatus";
import { apiClient } from "@/services/api/apiClient.service";
import config from "@/shared/constants/config.constant";
import { toast } from "react-toastify";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessage.util";

interface PurchaseOrdersDataListProps {
  reloadKey?: number;
  filters?: PurchaseOrderFilters;
  onEdit?: (purchaseOrder: PurchaseOrder) => void;
}

export default function PurchaseOrdersDataList({
  reloadKey,
  filters,
  onEdit
}: PurchaseOrdersDataListProps) {
  const { t } = useTranslation();
  const isDesktop = useResponsive();
  const defaultPagination = useUrlPaginationDefaults();

  // ===== Build query params =====
  const queryParams = React.useMemo(() => {
    const filterObj = filters ?? {};

    return Object.keys(filterObj).reduce<Record<string, string>>((acc, key) => {
      const rawValue = filterObj[key as keyof PurchaseOrderFilters];

      if (rawValue === undefined || rawValue === null) return acc;

      const value = String(rawValue).trim();

      if (value.length > 0) {
        acc[key] = value;
      }

      return acc;
    }, {});
  }, [filters]);

  // 🧾 columns config
  const columns: Column<PurchaseOrder>[] = [
    {
      id: "invoiceNumber",
      accessor: "invoiceNumber",
      header: t("purchase.order.invoiceNumber"),
      width: "200px"
    },
    {
      id: "supplierName",
      accessor: "supplierName",
      header: t("supplier.name"),
      width: "350px",
      cell: (_, row) => {
        const supplierName = row.supplier ?? "--";
        return (
          <div className="inline-flex items-center gap-2.5">
            <span>{supplierName.name}</span>
          </div>
        );
      }
    },
    {
      id: "deviceName",
      accessor: "deviceName",
      header: t("purchase.item.deviceName"),
      width: "350px",
      cell: (_, row) => {
        return (
          <div className="flex flex-col gap-2">
            {row.items?.map(item => (
              <div key={item.id} className="p-2 rounded bg-gray-50 border">
                <div className="font-medium">{item.deviceName}</div>
                <div className="text-sm text-gray-500">
                  {t("purchase.item.quantity")}: {item.quantity} –{" "}
                  {t("purchase.item.unitPrice")}:{" "}
                  {Number(item.unitPrice).toLocaleString("vi-VN")}
                </div>
              </div>
            ))}
          </div>
        );
      }
    },
    {
      id: "totalAmount",
      accessor: "totalAmount",
      header: t("purchase.totalAmount"),
      width: "120px",
      cell: (_, row) => {
        const totalAmount = row.totalAmount ?? 0;
        return <span>{Number(totalAmount).toLocaleString("vi-VN")}</span>;
      }
    },
    {
      id: "status",
      accessor: "status",
      header: t("purchase.status.label"),
      width: "120px",
      cell: (_, row: any) => (
        <ChangePurchaseOrderStatus
          defaultValue={row.status ?? "draft"}
          statuses={[
            { id: "draft", name: "draft" },
            { id: "approved", name: "approved" },
            { id: "pending", name: "pending" }
          ]}
          onChange={async newStatusId => {
            // only allow when draft or pending
            if (!["draft", "pending"].includes(row.status)) {
              toast.error(t("purchase.order.statusChangeBlocked"));
              return;
            }

            try {
              const url = config.getApiUrl(`/purchase-orders/${row.id}/status`);
              await apiClient.put(
                url,
                {
                  statusId: newStatusId,
                  items: row.items ?? [],
                  supplierId: row.supplier?.id,
                  orderDate: row.orderDate
                } // payload backend
              );
              // Optionally, update local row data if table is not auto-refresh
              row.status = newStatusId;
              toast.success(t("common.update") + " " + t("common.success"));
            } catch (err) {
              toast.error(
                resolveApiErrorMessage(err, t, "common.errors.operationFailed")
              );
            }
          }}
        />
      )
    },
    {
      id: "updateAt",
      accessor: "createdAt",
      header: t("purchase.purchaseDate"),
      width: "150px",
      cell: (_, row) => {
        const orderDate = row.orderDate ?? "";
        return <span>{new Date(orderDate).toLocaleDateString("vi-VN")}</span>;
      }
    }
  ];

  // ▶️ Add actions if needed
  const columnsWithActions = withButtonActions(columns, {
    onEdit
  });

  // ===== Fetch data =====
  const { data, isLoading, pagination, totalItems } =
    useQueryDataTable<PurchaseOrder>({
      initialData: [],
      queryKey: [
        "purchaseOrder",
        JSON.stringify(queryParams),
        String(reloadKey)
      ],
      url: apiRoutes[ApiRouteNames.PURCHASE_ORDERS],
      columns,
      defaultPagination,
      queryParams
    });

  const { handlePageChange, handlePageSizeChange } =
    useUrlPagination(pagination);

  // const handleEditAction = (rowData?: Supplier) => {
  //     if (rowData) onEdit(rowData);
  // };

  const handleRowClick = () => {
    // onEdit(rowData);
  };

  // UI render
  return (
    <div className="w-full">
      {/* Desktop */}
      {isDesktop ? (
        <DataListDesktopUI<PurchaseOrder>
          data={data}
          columns={columnsWithActions}
          onRowClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
        />
      ) : (
        <DataListMobile<PurchaseOrder & { action?: unknown }>
          data={data}
          triggerConfig={{ accessor: "invoiceNumber" }}
          columns={columnsWithActions}
          onClick={handleRowClick}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
        />
      )}

      {/* pagination */}
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
