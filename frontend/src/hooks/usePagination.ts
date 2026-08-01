import { useState, useMemo } from "react";
import { PaginationConfig } from "@/shared/@types/dataTable.type";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

export function usePagination<T>(
  data: T[],
  defaultConfig?: Partial<PaginationConfig>
) {
  const [pageIndex, setPageIndex] = useState(defaultConfig?.pageIndex || 0);
  const [pageSize, setPageSize] = useState(defaultConfig?.pageSize || 10);
  const pageSizeOptions = defaultConfig?.pageSizeOptions || DEFAULT_PAGE_SIZES;

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  const paginatedData = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, pageIndex, pageSize]);

  const goToPage = (page: number) => {
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    setPageIndex(validPage);
  };

  const nextPage = () => {
    goToPage(pageIndex + 1);
  };

  const previousPage = () => {
    goToPage(pageIndex - 1);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
  };

  return {
    paginatedData,
    pagination: {
      pageIndex,
      pageSize,
      totalItems,
      totalPages,
      pageSizeOptions
    },
    goToPage,
    nextPage,
    previousPage,
    changePageSize
  };
}
