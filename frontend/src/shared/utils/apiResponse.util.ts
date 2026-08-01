export interface PaginatedResult<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedTableResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export function normalizePaginatedResponse<T>(
  payload: unknown
): PaginatedTableResponse<T> {
  const paginated = (payload ?? {}) as PaginatedResult<T>;
  const items = extractApiList<T>(payload);
  const total = paginated.total ?? items.length;
  const page = paginated.page ?? 1;
  const limit = paginated.limit ?? (items.length || 10);
  const pageCount =
    (paginated as { pageCount?: number }).pageCount ??
    (limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);

  return {
    items,
    total,
    page,
    limit,
    pageCount
  };
}

export function extractApiList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && "items" in payload) {
    const items = (payload as PaginatedResult<T>).items;
    return Array.isArray(items) ? items : [];
  }

  return [];
}
