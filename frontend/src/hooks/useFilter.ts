import { useState, useMemo } from "react";
import { FilterConfig } from "@/shared/@types/dataTable.type";

export function useFilter<T>(data: T[], defaultFilters?: FilterConfig[]) {
  const [filters, setFilters] = useState<FilterConfig[]>(defaultFilters || []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return filters.every(filter => {
        const value = item[filter.key as keyof T];
        if (typeof value === "string") {
          return value.toLowerCase().includes(filter.value.toLowerCase());
        }
        return value === filter.value;
      });
    });
  }, [data, filters]);

  const setFilter = (key: string, value: any) => {
    const filterIndex = filters.findIndex(filter => filter.key === key);

    if (filterIndex > -1) {
      const newFilters = [...filters];
      if (value === "") {
        newFilters.splice(filterIndex, 1);
      } else {
        newFilters[filterIndex] = { key, value };
      }
      setFilters(newFilters);
    } else if (value !== "") {
      setFilters([...filters, { key, value }]);
    }
  };

  const clearFilters = () => {
    setFilters([]);
  };

  return { filteredData, filters, setFilter, clearFilters };
}
