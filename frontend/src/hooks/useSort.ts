import { useState, useMemo } from "react";
import { SortConfig, SortDirection } from "@/shared/@types/dataTable.type";

export function useSort<T>(data: T[], defaultSort?: SortConfig) {
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>(
    defaultSort || undefined
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a: any, b: any) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const compareResult = aValue > bValue ? 1 : -1;
      return sortConfig.direction === "asc" ? compareResult : -compareResult;
    });
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: SortDirection = "asc";

    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    setSortConfig(direction ? { key, direction } : undefined);
  };

  return { sortedData, sortConfig, requestSort };
}
