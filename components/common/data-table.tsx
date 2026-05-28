'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Pagination } from './pagination';

export interface ColumnDef<TData> {
  id: string;
  header: string;
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => any;
  cell?: (row: TData) => React.ReactNode;
  sortable?: boolean;
  sortFn?: (a: TData, b: TData, direction: 'asc' | 'desc') => number;
  className?: string;
  headerClassName?: string;
  hidden?: boolean;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  itemsPerPage?: number;
  itemsPerPageOptions?: number[];
  itemName?: string;
  onRowClick?: (row: TData) => void;
  expandedContent?: (row: TData) => React.ReactNode;
  expandedRows?: Set<string | number>;
  getRowId?: (row: TData) => string | number;
  emptyState?: React.ReactNode;
  initialSortField?: string;
  initialSortDirection?: 'asc' | 'desc';
  rowClickOnMobileOnly?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  itemsPerPage: initialItemsPerPage = 10,
  itemsPerPageOptions = [10, 15, 20, 50],
  itemName = 'items',
  onRowClick,
  expandedContent,
  expandedRows,
  getRowId,
  emptyState,
  initialSortField,
  initialSortDirection = 'asc',
  rowClickOnMobileOnly = false,
}: DataTableProps<TData>) {
  const [sortField, setSortField] = React.useState<string | null>(
    initialSortField || null
  );
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
    initialSortDirection
  );
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialItemsPerPage);
  const [isMobile, setIsMobile] = React.useState(false);

  // Track if we're on mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1536); // 2xl breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSort = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column?.sortable) return;

    if (sortField === columnId) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(columnId);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    const column = columns.find((col) => col.id === sortField);
    if (!column) return data;

    return [...data].sort((a, b) => {
      // Use custom sort function if provided
      if (column.sortFn) {
        return column.sortFn(a, b, sortDirection);
      }

      // Default sorting logic
      let aValue: any;
      let bValue: any;

      if (column.accessorFn) {
        aValue = column.accessorFn(a);
        bValue = column.accessorFn(b);
      } else if (column.accessorKey) {
        aValue = a[column.accessorKey];
        bValue = b[column.accessorKey];
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection, columns]);

  // Filter out hidden columns
  const visibleColumns = React.useMemo(
    () => columns.filter((col) => !col.hidden),
    [columns]
  );

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const SortButton = ({
    columnId,
    children,
  }: {
    columnId: string;
    children: React.ReactNode;
  }) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column?.sortable) return <>{children}</>;

    return (
      <button
        onClick={() => handleSort(columnId)}
        className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    );
  };

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead key={column.id} className={column.headerClassName}>
                    <SortButton columnId={column.id}>
                      {column.header}
                    </SortButton>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map((row, index) => {
                const rowId = getRowId ? getRowId(row) : index;
                const isExpanded = expandedRows?.has(rowId);
                const shouldEnableRowClick =
                  onRowClick && (!rowClickOnMobileOnly || isMobile);

                return (
                  <React.Fragment key={rowId}>
                    <TableRow
                      className={`${
                        shouldEnableRowClick ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => shouldEnableRowClick && onRowClick?.(row)}
                    >
                      {visibleColumns.map((column) => {
                        let cellContent: React.ReactNode;

                        if (column.cell) {
                          cellContent = column.cell(row);
                        } else if (column.accessorFn) {
                          cellContent = column.accessorFn(row);
                        } else if (column.accessorKey) {
                          cellContent = String(row[column.accessorKey] ?? '');
                        }

                        return (
                          <TableCell
                            key={column.id}
                            className={column.className}
                          >
                            {cellContent}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Expanded Content Row */}
                    {isExpanded && expandedContent && (
                      <TableRow key={`${rowId}-expanded`}>
                        <TableCell
                          colSpan={visibleColumns.length}
                          className="bg-muted/30 p-4"
                        >
                          {expandedContent(row)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={sortedData.length}
          itemName={itemName}
          itemsPerPage={itemsPerPage}
          itemsPerPageOptions={itemsPerPageOptions}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </CardContent>
    </Card>
  );
}
