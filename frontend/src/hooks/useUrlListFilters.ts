import { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { clampSearchKeyword } from "@/shared/constants/search.constant";

export interface UseUrlListFiltersConfig<T extends Record<string, string>> {
  keys: (keyof T)[];
  /** Map filter field → URL query param (default: field name) */
  urlKeys?: Partial<Record<keyof T, string>>;
  /** Bỏ khỏi URL khi giá trị bằng chuỗi này (vd. "all") */
  omitWhen?: Partial<Record<keyof T, string>>;
  /** Các field search — giới hạn độ dài keyword (mặc định: `search`) */
  searchKeys?: (keyof T)[];
}

function clampFilterValue<T extends Record<string, string>>(
  key: keyof T,
  value: string,
  config: UseUrlListFiltersConfig<T>
): string {
  const searchKeys: (keyof T)[] =
    config.searchKeys ?? (["search"] as (keyof T)[]);
  if (searchKeys.some(k => k === key)) {
    return clampSearchKeyword(value);
  }
  return value;
}

function readFiltersFromUrl<T extends Record<string, string>>(
  searchParams: URLSearchParams,
  initial: T,
  config: UseUrlListFiltersConfig<T>
): T {
  const next = { ...initial };
  for (const key of config.keys) {
    const urlKey = config.urlKeys?.[key] ?? String(key);
    const raw = searchParams.get(urlKey);
    if (raw !== null) {
      next[key] = clampFilterValue(key, raw, config) as T[keyof T];
    }
  }
  return next;
}

function writeFiltersToUrl<T extends Record<string, string>>(
  params: URLSearchParams,
  filters: T,
  config: UseUrlListFiltersConfig<T>
): void {
  for (const key of config.keys) {
    const urlKey = config.urlKeys?.[key] ?? String(key);
    const value = clampFilterValue(key, (filters[key] ?? "").trim(), config);
    const omitValue = config.omitWhen?.[key];
    if (!value || (omitValue !== undefined && value === omitValue)) {
      params.delete(urlKey);
    } else {
      params.set(urlKey, value);
    }
  }
}

/** Đồng bộ bộ lọc danh sách với URL (giữ filter khi quay lại từ detail). */
export function useUrlListFilters<T extends Record<string, string>>(
  initialFilters: T,
  config: UseUrlListFiltersConfig<T>
) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [draftFilters, setDraftFilters] = useState<T>(() =>
    readFiltersFromUrl(searchParams, initialFilters, config)
  );
  const [appliedFilters, setAppliedFilters] = useState<T>(() =>
    readFiltersFromUrl(searchParams, initialFilters, config)
  );

  const handleFilterChange = useCallback(
    (key: keyof T | "reset", value?: string) => {
      if (key === "reset") {
        setDraftFilters(initialFilters);
        return;
      }
      setDraftFilters(prev => ({
        ...prev,
        [key]: clampFilterValue(key, value ?? "", config)
      }));
    },
    [initialFilters]
  );

  const handleApplyFilters = useCallback(() => {
    const nextFilters = { ...draftFilters };
    setAppliedFilters(nextFilters);
    const next = new URLSearchParams(searchParams);
    writeFiltersToUrl(next, nextFilters, config);
    next.set("page", "1");
    setSearchParams(next);
  }, [draftFilters, searchParams, setSearchParams, config]);

  return {
    draftFilters,
    appliedFilters,
    handleFilterChange,
    handleApplyFilters,
    setDraftFilters,
    setAppliedFilters
  };
}
