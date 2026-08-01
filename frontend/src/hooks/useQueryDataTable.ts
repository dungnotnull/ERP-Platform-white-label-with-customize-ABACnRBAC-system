import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Column,
  FilterConfig,
  PaginationConfig,
  SortConfig
} from "@/shared/@types/dataTable.type";
import { useDataTable } from "./useDataTable";
import ApiClientService, {
  apiClient as apiClientService
} from "@/services/api/apiClient.service.ts";

type QueryKeyItem = string | number | boolean | object | null | undefined;
type QueryKey = QueryKeyItem[];

// Define the API response structure matching what your API returns
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

interface QueryDataTableOptions<T> {
  url: string;
  columns: Column<T>[];
  queryKey: string | string[];
  initialData?: T[];
  defaultSort?: SortConfig;
  defaultFilters?: FilterConfig[];
  defaultPagination?: Partial<PaginationConfig>;
  enableSort?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
  serverSide?: boolean;
  apiClient?: ApiClientService;
  transformResponse?: (data: any) => PaginatedResponse<T>;
  queryParams?: Record<string, any>;
  refetchOnWindowFocus?: boolean;
}

export function useQueryDataTable<T>({
  url,
  columns,
  queryKey,
  initialData = [],
  defaultSort,
  defaultFilters,
  defaultPagination,
  enableSort = true,
  enableFilter = true,
  enablePagination = true,
  serverSide = true,
  apiClient = apiClientService,
  transformResponse = data => data as PaginatedResponse<T>,
  queryParams = {},
  refetchOnWindowFocus = false
}: QueryDataTableOptions<T>) {
  const [serverSortConfig, setServerSortConfig] = useState<
    SortConfig | undefined
  >(defaultSort || undefined);
  const [serverFilters, setServerFilters] = useState<FilterConfig[]>(
    defaultFilters || []
  );
  const serverPagination = {
    pageIndex: defaultPagination?.pageIndex ?? 0,
    pageSize: defaultPagination?.pageSize ?? 10
  };

  const baseQueryKey: QueryKey = Array.isArray(queryKey)
    ? [...queryKey]
    : [queryKey];

  let fullQueryKey: QueryKey;

  if (serverSide) {
    fullQueryKey = [
      ...baseQueryKey,
      {
        sort: serverSortConfig,
        filters: serverFilters,
        page: serverPagination.pageIndex,
        limit: serverPagination.pageSize,
        ...queryParams
      }
    ];
  } else {
    fullQueryKey =
      Object.keys(queryParams).length > 0
        ? [...baseQueryKey, queryParams]
        : baseQueryKey;
  }

  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<PaginatedResponse<T>>({
    queryKey: fullQueryKey,
    queryFn: async () => {
      const params = { ...queryParams };

      if (serverSide) {
        if (serverSortConfig) {
          params.sort = serverSortConfig.key;
          params.order = serverSortConfig.direction;
        }

        if (serverFilters.length > 0) {
          serverFilters.forEach(filter => {
            params[`filter_${filter.key}`] = filter.value;
          });
        }

        if (params.page == null) {
          params.page = serverPagination.pageIndex + 1;
        }

        if (params.limit == null) {
          params.limit = serverPagination.pageSize;
        }
      }
      const response = await apiClient?.get(url, { params });
      return transformResponse(response);
    },
    initialData:
      initialData.length > 0
        ? {
            items: initialData,
            total: initialData.length,
            page: 1,
            limit: serverPagination.pageSize,
            pageCount: Math.ceil(initialData.length / serverPagination.pageSize)
          }
        : undefined,
    refetchOnWindowFocus
  });

  const handleServerSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";

    if (serverSortConfig && serverSortConfig.key === key) {
      if (serverSortConfig.direction === "asc") {
        direction = "desc";
      } else if (serverSortConfig.direction === "desc") {
        direction = null;
      }
    }

    setServerSortConfig(direction ? { key, direction } : undefined);
  };

  const handleServerFilter = (key: string, value: any) => {
    const filterIndex = serverFilters.findIndex(filter => filter.key === key);

    if (filterIndex > -1) {
      const newFilters = [...serverFilters];
      if (value === "") {
        newFilters.splice(filterIndex, 1);
      } else {
        newFilters[filterIndex] = { key, value };
      }
      setServerFilters(newFilters);
    } else if (value !== "") {
      setServerFilters([...serverFilters, { key, value }]);
    }
  };

  const handleServerPageChange = (_pageIndex: number) => {};
  const handleServerPageSizeChange = (_pageSize: number) => {};

  const clientSideTable = useDataTable({
    data: responseData?.items || initialData,
    columns,
    defaultSort,
    defaultFilters,
    defaultPagination,
    enableSort,
    enableFilter,
    enablePagination
  });

  if (serverSide) {
    return {
      data: responseData?.items || initialData,
      isLoading,
      isError,
      error,
      refetch,
      totalItems: responseData?.total || 0,
      columns,
      sort: {
        sortConfig: serverSortConfig,
        requestSort: handleServerSort,
        enabled: enableSort
      },
      filter: {
        filters: serverFilters,
        setFilter: handleServerFilter,
        clearFilters: () => setServerFilters([]),
        enabled: enableFilter
      },
      pagination: {
        pageIndex: serverPagination.pageIndex,
        pageSize: serverPagination.pageSize,
        totalPages: responseData?.pageCount || 1,
        pageSizeOptions: defaultPagination?.pageSizeOptions || [
          10, 25, 50, 100
        ],
        goToPage: handleServerPageChange,
        nextPage: () => handleServerPageChange(serverPagination.pageIndex + 1),
        previousPage: () =>
          handleServerPageChange(serverPagination.pageIndex - 1),
        changePageSize: handleServerPageSizeChange,
        enabled: enablePagination
      }
    };
  } else {
    return {
      ...clientSideTable,
      isLoading,
      isError,
      error,
      refetch
    };
  }
}
