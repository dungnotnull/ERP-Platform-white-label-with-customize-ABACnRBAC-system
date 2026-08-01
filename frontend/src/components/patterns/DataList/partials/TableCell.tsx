import { Column } from "@/shared/@types/dataTable.type.ts";
import { cn } from "@/lib/utils.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";

interface TableCellProps<T> {
  column: Column<T>;
  row: T;
  value: any;
  className?: string;
}

export function TableCell<T>({
  column,
  row,
  value,
  className
}: TableCellProps<T>) {
  const cellContent = column.cell ? column.cell(value, row) : value;

  const style: React.CSSProperties = {
    textAlign: column.align || "left",
    width: column.width,
    minWidth: column.minWidth,
    maxWidth: column.maxWidth
  };

  return (
    <td className={cn(className, column.cellClassName)} style={style}>
      {typeof cellContent === "string" &&
      cellContent.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) ? (
        <Avatar>
          <AvatarImage
            src={cellContent}
            alt={cellContent}
            className="w-[50px]"
          />
          <AvatarFallback>{cellContent}</AvatarFallback>
        </Avatar>
      ) : (
        cellContent
      )}
    </td>
  );
}
