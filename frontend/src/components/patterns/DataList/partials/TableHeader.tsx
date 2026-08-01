import { Column, SortConfig } from "@/shared/@types/dataTable.type.ts";
import { cn } from "@/lib/utils.ts";

interface TableHeaderProps<T> {
  columns: Column<T>[];
  sortConfig?: SortConfig;
  onSort?: (key: string) => void;
  enableSort?: boolean;
  className?: string;
  rowClassName?: string;
  thClassName?: string;
}

export function TableHeader<T>({
  columns,
  sortConfig,
  onSort,
  enableSort = true,
  className,
  rowClassName,
  thClassName
}: TableHeaderProps<T>) {
  return (
    <thead className={className}>
      <tr className={rowClassName}>
        {columns.map(column => {
          const isSorted = sortConfig?.key === column.id;
          const sortDirection = isSorted ? sortConfig.direction : null;

          const handleSort = () => {
            if (enableSort && column.sortable && onSort) {
              onSort(column.id);
            }
          };

          return (
            <th
              key={column.id}
              onClick={handleSort}
              className={cn(thClassName, column.headerClassName)}
              style={{
                cursor: enableSort && column.sortable ? "pointer" : "default",
                textAlign: column.align || "left",
                width: column.width,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    column.align === "right"
                      ? "flex-end"
                      : column.align === "center"
                        ? "center"
                        : "flex-start"
                }}
              >
                {column.header}
                {enableSort && column.sortable && (
                  <span style={{ marginLeft: "4px" }}>
                    {!sortDirection && "⇅"}
                    {sortDirection === "asc" && "↑"}
                    {sortDirection === "desc" && "↓"}
                  </span>
                )}
              </div>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
