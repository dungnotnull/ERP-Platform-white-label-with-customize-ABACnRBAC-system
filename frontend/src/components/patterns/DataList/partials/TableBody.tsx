import { TableRow } from "./TableRow.tsx";
import { Column } from "@/shared/@types/dataTable.type.ts";
import { cn } from "@/lib/utils.ts";
import { Skeleton } from "@/components/ui/Skeleton";

interface TableBodyProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  cellClassName?: string;
}

const SKELETON_ROWS = 10;

export function TableBody<T>({
  data,
  columns,
  onRowClick,
  rowClassName,
  isLoading,
  emptyMessage = "No data available",
  className,
  cellClassName
}: TableBodyProps<T>) {
  if (isLoading) {
    return (
      <tbody className={className}>
        {Array.from({ length: SKELETON_ROWS }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {columns.map((_, colIndex) => (
              <td key={colIndex} className="px-4 py-3">
                <Skeleton className="h-4 w-full" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody className={className}>
        <tr>
          <td
            colSpan={columns.length}
            className="text-center py-10 text-sm text-muted-foreground"
          >
            {emptyMessage}
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={className}>
      {data.map((row, index) => (
        <TableRow
          key={index}
          row={row}
          columns={columns}
          onRowClick={onRowClick}
          rowClassName={cn(cellClassName, rowClassName)}
          cellClassName={cellClassName}
        />
      ))}
    </tbody>
  );
}
