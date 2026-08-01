import { cn } from "@/lib/utils.ts";
import { TableHeader } from "@/components/patterns/DataList/partials/TableHeader";
import { TableBody } from "@/components/patterns/DataList/partials/TableBody";
import { DataListUIProps, SortConfig } from "@/shared/@types/dataTable.type.ts";

const defaultClassNames = {
  wrapperTable:
    "overflow-x-auto w-full rounded-md border border-slate-200/80 bg-white/85 shadow-[var(--shadow-neo-md)] p-2",
  trHead: "border-b border-slate-200/80",
  trBody: "border-b border-slate-200/80 even:bg-blue-500/60 odd:bg-white/50",
  table:
    "min-w-full table-auto border-separate border-spacing-0 bg-gradient-to-r from-blue-100 via-sky-50 to-indigo-100",
  th: "p-3 text-left whitespace-nowrap text-slate-700 font-semibold",
  td: "p-3 break-words bg-white/90"
};

interface DataListDesktopUIProps<T> extends DataListUIProps<T> {
  sortConfig?: {
    config?: SortConfig;
    onSortChange?: (key: string) => void;
  };
  tableClassNames?: {
    header?: string;
    row?: string;
    body?: string;
  };
  onRowClick?: (row: T) => void;
  tableMode?: "default" | "nowrap" | "truncate";
}

export default function DataListDesktopUI<T>({
  columns,
  data,
  className,
  isLoading,
  emptyMessage,
  sortConfig,
  tableClassNames,
  onRowClick,
  tableMode = "default"
}: DataListDesktopUIProps<T>) {
  const cellModeClass =
    tableMode === "nowrap"
      ? "whitespace-nowrap"
      : tableMode === "truncate"
        ? "truncate"
        : "whitespace-normal";
  return (
    <div className={defaultClassNames.wrapperTable}>
      <table
        className={cn(defaultClassNames.table, className)}
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <TableHeader
          rowClassName={cn(defaultClassNames.trHead)}
          columns={columns}
          sortConfig={sortConfig?.config}
          onSort={sortConfig?.onSortChange}
          enableSort={!!sortConfig}
          className={tableClassNames?.header}
          thClassName={defaultClassNames.th}
        />

        <TableBody
          data={data}
          columns={columns}
          onRowClick={onRowClick}
          rowClassName={cn(defaultClassNames.trBody, tableClassNames?.row)}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          className={tableClassNames?.body}
          cellClassName={cn(defaultClassNames.td, cellModeClass)}
        />
      </table>
    </div>
  );
}
