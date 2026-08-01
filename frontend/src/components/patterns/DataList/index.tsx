import type { Column } from "@/shared/@types/dataTable.type.ts";
import { Button } from "@/components/ui/Button";
import { Edit, Printer, Trash2 } from "lucide-react";

type ButtonActionFunction<T> = (rowData: T) => void;

export function withButtonActions<T>(
  columns: Column<T>[],
  actions?: {
    onEdit?: ButtonActionFunction<T>;
    onPrint?: ButtonActionFunction<T>;
    onDelete?: ButtonActionFunction<T>;
  }
): Column<T & { action?: unknown }>[] {
  return [
    ...columns,
    {
      id: "action",
      header: "",
      accessor: "action",
      cell: (_value, row) => {
        if (!actions) return undefined;

        return (
          <div className="flex justify-end md:justify-center gap-2">
            {actions.onPrint && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={e => {
                  e.stopPropagation();
                  if (actions?.onPrint) {
                    actions.onPrint(row);
                  }
                }}
              >
                <Printer className="h-4 w-4" />
              </Button>
            )}

            {actions?.onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={e => {
                  e.stopPropagation();
                  if (actions?.onEdit) {
                    actions.onEdit(row);
                  }
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}

            {actions?.onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={e => {
                  e.stopPropagation();
                  if (actions?.onDelete) {
                    actions.onDelete(row);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
      width: "fit-content"
    }
  ];
}
