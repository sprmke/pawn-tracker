import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
  itemName?: string;
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  onItemsPerPageChange?: (itemsPerPage: number) => void;
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

/**
 * Generate page numbers with ellipsis for smart pagination
 * Shows: first page, last page, current page, and 1 neighbor on each side
 * Uses ellipsis (...) for gaps
 */
function getPageNumbers(currentPage: number, totalPages: number): PageItem[] {
  // If 7 or fewer pages, show all
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: PageItem[] = [];
  const siblings = 1; // Number of pages to show on each side of current

  // Always include first page
  pages.push(1);

  // Calculate range around current page
  const rangeStart = Math.max(2, currentPage - siblings);
  const rangeEnd = Math.min(totalPages - 1, currentPage + siblings);

  // Add ellipsis after first page if needed
  if (rangeStart > 2) {
    pages.push('ellipsis-start');
  }

  // Add pages in range
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if needed
  if (rangeEnd < totalPages - 1) {
    pages.push('ellipsis-end');
  }

  // Always include last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalItems,
  itemName = 'items',
  itemsPerPage,
  itemsPerPageOptions,
  onItemsPerPageChange,
}: PaginationProps) {
  if (totalPages <= 1 && !itemsPerPage) return null;

  const pageItems = getPageNumbers(currentPage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-4 border-t">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of{' '}
          {totalItems} {itemName}
        </div>
        {itemsPerPage && itemsPerPageOptions && onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {pageItems.map((item, index) =>
              typeof item === 'number' ? (
                <Button
                  key={item}
                  variant={currentPage === item ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(item)}
                  className="w-8 h-8 p-0"
                >
                  {item}
                </Button>
              ) : (
                <span
                  key={item}
                  className="flex items-center justify-center w-8 h-8 text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ),
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
