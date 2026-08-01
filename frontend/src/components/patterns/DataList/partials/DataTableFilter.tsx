import { Column, FilterConfig } from "@/shared/@types/dataTable.type.ts";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

interface DataTableFilterProps<T> {
  columns: Column<T>[];
  filters: FilterConfig[];
  onFilterChange: (key: string, value: any) => void;
  onClearFilters: () => void;
  className?: string;
}

export function DataTableFilter<T>({
  columns,
  filters,
  onFilterChange,
  onClearFilters,
  className
}: DataTableFilterProps<T>) {
  const filterableColumns = columns.filter(column => column.filterable);

  if (filterableColumns.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 my-4">
        {filterableColumns.map(column => {
          const filterValue =
            filters.find(f => f.key === column.id)?.value || "";

          return (
            <div key={column.id} className="flex items-center gap-1">
              <Label htmlFor={`filter-${column.id}`} className="mr-1">
                {column.header}:
              </Label>
              <Input
                id={`filter-${column.id}`}
                type="text"
                value={filterValue}
                onChange={e => onFilterChange(column.id, e.target.value)}
                placeholder={`Filter ${column.header}`}
                className="h-8 w-40"
              />
            </div>
          );
        })}

        {filters.length > 0 && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
}
