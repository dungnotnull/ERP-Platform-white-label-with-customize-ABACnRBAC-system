import DataListDesktopUI from "@/components/patterns/DataList/desktop";
import DataListMobile from "@/components/patterns/DataList/mobile";
import { DataListPagination } from "@/components/patterns/DataList/partials/DataListPagination";
import { useQueryDataTable } from "@/hooks/useQueryDataTable";
import useResponsive from "@/hooks/useResponsive";
import { Column } from "@/shared/@types/dataTable.type";
import {
  useUrlPagination,
  useUrlPaginationDefaults
} from "@/hooks/useUrlPagination";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  ApiRouteNames,
  apiRoutes
} from "@/shared/constants/routes.constant.ts";

interface OrderHistoryItem {
  id: string;
  assetType: string;
  assetName: string;
  purchaseDate: string;
  warrantyExpiryDate: string;
  quantity: number;
  price?: number;
  totalAmount?: number;
}

interface OrderHistoryDataListProps {
  id: string;
}

export default function OrderHistoryDataList({
  id
}: OrderHistoryDataListProps) {
  const { t } = useTranslation();
  const { isDesktop } = useResponsive();
  const defaultPagination = useUrlPaginationDefaults();

  const queryParams = React.useMemo(() => ({ supplierId: id }), [id]);

  // ===== Columns =====
  const columns: Column<OrderHistoryItem>[] = [
    // { id: "id", header: "ID", accessor: "id", width: "120px" },
    { id: "assetType", header: t("device.deviceType"), accessor: "assetType" },
    { id: "assetName", header: t("device.deviceName"), accessor: "assetName" },
    {
      id: "purchaseDate",
      header: t("purchase.purchaseDate"),
      accessor: "purchaseDate",
      cell: v => <span>{new Date(v).toLocaleDateString()}</span>
    },
    {
      id: "warranty",
      header: t("assets.label.warrantyExpiryDate"),
      accessor: "warrantyExpiryDate",
      cell: v => (
        <span>{v ? new Date(v).toLocaleDateString() : t("common.noData")}</span>
      )
    },
    { id: "quantity", header: t("common.quantity"), accessor: "quantity" },
    {
      id: "price",
      header: t("purchase.item.unitPrice"),
      accessor: "price",
      cell: v => (v ? v.toLocaleString() : "-")
    },
    {
      id: "totalPrice",
      header: t("purchase.totalAmount"),
      accessor: "totalAmount",
      cell: v => (v ? v.toLocaleString() : "-")
    }
  ];

  // ===== Fetch order history =====
  const { data, isLoading, pagination, totalItems } =
    useQueryDataTable<OrderHistoryItem>({
      initialData: [],
      queryKey: ["supplier-order-history", JSON.stringify(queryParams)],
      url: `${apiRoutes[ApiRouteNames.ORDER_HISTORY]}`,
      columns,
      defaultPagination,
      queryParams
    });

  const { handlePageChange, handlePageSizeChange } =
    useUrlPagination(pagination);

  return (
    <>
      {isDesktop ? (
        <DataListDesktopUI<OrderHistoryItem>
          data={data}
          columns={columns}
          isLoading={isLoading}
          emptyMessage={t("common.noData")}
        />
      ) : (
        <DataListMobile<OrderHistoryItem>
          data={data}
          columns={columns}
          triggerConfig={{ accessor: "assetName" }}
          isLoading={isLoading}
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
    </>
  );
}
