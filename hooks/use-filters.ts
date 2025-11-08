import { useState, useMemo } from 'react';

interface FilterState {
  [key: string]: string | string[] | number | boolean;
}

interface UseFiltersProps<T> {
  items: T[];
  filterFn: (item: T, filters: FilterState) => boolean;
}

export function useFilters<T>({ items, filterFn }: UseFiltersProps<T>) {
  const [filters, setFilters] = useState<FilterState>({});

  const filteredItems = useMemo(() => {
    return items.filter((item) => filterFn(item, filters));
  }, [items, filters, filterFn]);

  const setFilter = (
    key: string,
    value: string | string[] | number | boolean
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilter = (key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return {
    filters,
    filteredItems,
    setFilter,
    clearFilter,
    clearAllFilters,
    hasActiveFilters,
  };
}
