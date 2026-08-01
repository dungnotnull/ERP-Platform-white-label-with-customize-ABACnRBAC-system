export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessor: keyof T | ((row: T) => any);
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export interface FilterConfig {
  key: string;
  value: any;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  enableSort?: boolean;
  enableFilter?: boolean;
  enablePagination?: boolean;
  defaultSortConfig?: SortConfig;
  defaultFilterConfig?: FilterConfig[];
  defaultPaginationConfig?: Partial<PaginationConfig>;
  onRowClick?: (row: T) => void;
  rowClassName?: string | ((row: T) => string);
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export interface ApiResponse<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface QueryDataTableProps<T>
  extends Omit<DataTableProps<T>, "data" | "isLoading"> {
  url: string;
  queryKey: string | string[];
  initialData?: T[];
  serverSide?: boolean;
  transformResponse?: (data: any) => T[];
  queryParams?: Record<string, any>;
  refetchOnWindowFocus?: boolean;
  errorMessage?: string;
}

export interface DataListUIProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  className?: string;
  emptyMessage?: string;
}
