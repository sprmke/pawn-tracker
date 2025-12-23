'use client';
import React, { useState, useMemo } from 'react';
import { Pagination } from './pagination';

interface CardPaginationProps<T> {
  items: T[];
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  renderItems: (paginatedItems: T[]) => React.ReactNode;
  itemName?: string;
  className?: string;
}

export function CardPagination<T>({
  items,
  itemsPerPage: initialItemsPerPage = 10,
  itemsPerPageOptions = [10, 15, 20, 50],
  renderItems,
  itemName = 'items',
  className = '',
}: CardPaginationProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calculate pagination values
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Get paginated items
  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  // Reset to page 1 when items change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {renderItems(paginatedItems)}

      {items.length > Math.min(...itemsPerPageOptions) && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={items.length}
            itemName={itemName}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={itemsPerPageOptions}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}
    </div>
  );
}
