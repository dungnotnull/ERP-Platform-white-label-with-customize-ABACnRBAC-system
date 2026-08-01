import { useCallback, useLayoutEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { PaginationConfig } from "@/shared/@types/dataTable.type";

const DEFAULT_PAGE_SIZES = [10, 25, 50, 100];

/** F5/reload — không restore trang từ URL; back/forward thì restore. */
export function isBrowserReload(): boolean {
  if (typeof performance === "undefined") return false;
  const entry = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return entry?.type === "reload";
}

export interface UseUrlPaginationOptions {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export type UrlPaginationHandlers = {
  goToPage: (pageIndex: number) => void;
  changePageSize: (pageSize: number) => void;
};

/** Initial pagination: always page 1; page size from URL `limit` if present. */
export function useUrlPaginationDefaults(
  options?: UseUrlPaginationOptions
): Pick<PaginationConfig, "pageIndex" | "pageSize" | "pageSizeOptions"> {
  const [searchParams] = useSearchParams();
  const defaultPageSize = options?.defaultPageSize ?? 10;
  const pageSizeOptions = options?.pageSizeOptions ?? DEFAULT_PAGE_SIZES;

  const pageSize = useMemo(() => {
    if (searchParams.has("limit")) {
      const parsed = Number(searchParams.get("limit"));
      return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPageSize;
    }
    return defaultPageSize;
  }, [searchParams, defaultPageSize]);

  const pageIndex = useMemo(() => {
    // if (isBrowserReload()) return 0;
    if (searchParams.has("page")) {
      const parsed = Number(searchParams.get("page"));
      return Number.isFinite(parsed) && parsed > 0 ? parsed - 1 : 0;
    }
    return 0;
  }, [searchParams]);

  return useMemo(
    () => ({
      pageIndex,
      pageSize,
      pageSizeOptions
    }),
    [pageIndex, pageSize, pageSizeOptions]
  );
}

/** Sync pagination with URL; reset to page 1 on mount (F5). */
export function useUrlPagination(
  pagination: UrlPaginationHandlers,
  _options?: UseUrlPaginationOptions
) {
  const [searchParams, setSearchParams] = useSearchParams();

  useLayoutEffect(() => {
    if (!isBrowserReload()) return;
    const page = searchParams.get("page");
    if (page && page !== "1") {
      const next = new URLSearchParams(searchParams);
      next.set("page", "1");
      setSearchParams(next, { replace: true });
      pagination.goToPage(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = useCallback(
    (pageIndex: number) => {
      console.log("handlePageChange", pageIndex);
      const next = new URLSearchParams(searchParams);
      next.set("page", String(pageIndex + 1));
      setSearchParams(next);
      pagination.goToPage(pageIndex);
    },
    [searchParams, setSearchParams, pagination]
  );

  const handlePageSizeChange = useCallback(
    (pageSize: number) => {
      const next = new URLSearchParams(searchParams);
      next.set("limit", String(pageSize));
      next.set("page", "1");
      setSearchParams(next);
      pagination.changePageSize(pageSize);
    },
    [searchParams, setSearchParams, pagination]
  );

  return { handlePageChange, handlePageSizeChange };
}
