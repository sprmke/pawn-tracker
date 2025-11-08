import { useState, useMemo } from 'react';

type SortDirection = 'asc' | 'desc';

interface UseSortingProps<T, K extends keyof T> {
  items: T[];
  defaultField: K;
  defaultDirection?: SortDirection;
  sortFn?: (items: T[], field: K, direction: SortDirection) => T[];
}

export function useSorting<T, K extends keyof T>({
  items,
  defaultField,
  defaultDirection = 'asc',
  sortFn,
}: UseSortingProps<T, K>) {
  const [sortField, setSortField] = useState<K>(defaultField);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultDirection);

  const handleSort = (field: K) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = useMemo(() => {
    if (sortFn) {
      return sortFn(items, sortField, sortDirection);
    }

    // Default sorting logic
    return [...items].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortField, sortDirection, sortFn]);

  return {
    sortField,
    sortDirection,
    sortedItems,
    handleSort,
  };
}
