import { useMemo } from "react";
import { useSort } from "./useSort";
import { useFilter } from "./useFilter";
import { usePagination } from "./usePagination";
import type {
  Column,
  FilterConfig,
  PaginationConfig,
  SortConfig
} from "@/shared/@types/dataTable.type";

interface UseDataTableOptions<T> {
  data: T[];
  columns: Column<T>[];
  defaultSort?: SortConfig;
  defaultFilters?: FilterConfig[];
  defaultPagination?: Partial<PaginationConfig>;
  enableSort?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
}

export function useDataTable<T>({
  data,
  columns,
  defaultSort,
  defaultFilters,
  defaultPagination,
  enableSort = true,
  enableFilter = true,
  enablePagination = true
}: UseDataTableOptions<T>) {
  const { sortedData, sortConfig, requestSort } = useSort(
    data,
    enableSort ? defaultSort : undefined
  );

  const { filteredData, filters, setFilter, clearFilters } = useFilter(
    sortedData,
    enableFilter ? defaultFilters : undefined
  );

  const {
    paginatedData,
    pagination,
    goToPage,
    nextPage,
    previousPage,
    changePageSize
  } = usePagination(
    filteredData,
    enablePagination ? defaultPagination : undefined
  );

  const processedData = useMemo(() => {
    if (enablePagination) return paginatedData;
    if (enableFilter) return filteredData;
    if (enableSort) return sortedData;
    return data;
  }, [
    enablePagination,
    enableFilter,
    enableSort,
    paginatedData,
    filteredData,
    sortedData,
    data
  ]);

  return {
    data: processedData,
    totalItems: filteredData.length,
    columns,
    sort: {
      sortConfig,
      requestSort,
      enabled: enableSort
    },
    filter: {
      filters,
      setFilter,
      clearFilters,
      enabled: enableFilter
    },
    pagination: {
      ...pagination,
      goToPage,
      nextPage,
      previousPage,
      changePageSize,
      enabled: enablePagination
    }
  };
}
