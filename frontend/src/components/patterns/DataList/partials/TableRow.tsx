import { TableCell } from "./TableCell.tsx";
import { Column } from "@/shared/@types/dataTable.type.ts";

interface TableRowProps<T> {
  row: T;
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
  cellClassName?: string;
}

export function TableRow<T>({
  row,
  columns,
  onRowClick,
  rowClassName,
  cellClassName
}: TableRowProps<T>) {
  const handleClick = () => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const className =
    typeof rowClassName === "function" ? rowClassName(row) : rowClassName;

  return (
    <tr
      onClick={handleClick}
      className={className}
      style={{ cursor: onRowClick ? "pointer" : "default" }}
    >
      {columns.map(column => {
        const value =
          typeof column.accessor === "function"
            ? column.accessor(row)
            : row[column.accessor as keyof T];

        return (
          <TableCell
            key={column.id}
            column={column}
            row={row}
            value={value}
            className={cellClassName}
          />
        );
      })}
    </tr>
  );
}
