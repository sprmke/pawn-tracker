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
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUpDown } from 'lucide-react';
import { Pagination } from './pagination';

/** Just wide enough for the 16px checkbox; the table wrapper supplies the outer gutter. */
const SELECTION_COLUMN_WIDTH = '1.5rem';

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
  enableRowSelection?: boolean;
  selectedRowIds?: Set<string | number>;
  onSelectedRowIdsChange?: (ids: Set<string | number>) => void;
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
  enableRowSelection = false,
  selectedRowIds,
  onSelectedRowIdsChange,
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

  const showSelection =
    enableRowSelection &&
    !!onSelectedRowIdsChange &&
    !!getRowId &&
    !!selectedRowIds;

  const getId = (row: TData, index: number) =>
    getRowId ? getRowId(row) : index;

  const pageRowIds = React.useMemo(
    () => paginatedData.map((row, index) => getId(row, index)),
    [paginatedData, getRowId],
  );

  const allPageSelected =
    showSelection &&
    pageRowIds.length > 0 &&
    pageRowIds.every((id) => selectedRowIds!.has(id));

  const somePageSelected =
    showSelection && pageRowIds.some((id) => selectedRowIds!.has(id));

  const toggleRowSelection = (rowId: string | number) => {
    if (!onSelectedRowIdsChange || !selectedRowIds) return;

    onSelectedRowIdsChange(
      (() => {
        const next = new Set(selectedRowIds);
        if (next.has(rowId)) {
          next.delete(rowId);
        } else {
          next.add(rowId);
        }
        return next;
      })(),
    );
  };

  const togglePageSelection = () => {
    if (!onSelectedRowIdsChange || !selectedRowIds) return;

    onSelectedRowIdsChange(
      (() => {
        const next = new Set(selectedRowIds);
        if (allPageSelected) {
          pageRowIds.forEach((id) => next.delete(id));
        } else {
          pageRowIds.forEach((id) => next.add(id));
        }
        return next;
      })(),
    );
  };

  const totalColumnCount = visibleColumns.length + (showSelection ? 1 : 0);

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
        type="button"
        onClick={() => handleSort(columnId)}
        className="inline-flex max-w-full items-center gap-1 text-left leading-tight hover:text-foreground transition-colors cursor-pointer"
      >
        <span className="min-w-0">{children}</span>
        <ArrowUpDown className="h-2.5 w-2.5 shrink-0 opacity-70" />
      </button>
    );
  };

  const selectionColumnProps = {
    className: 'px-0 py-3',
    style: {
      width: SELECTION_COLUMN_WIDTH,
      minWidth: SELECTION_COLUMN_WIDTH,
      maxWidth: SELECTION_COLUMN_WIDTH,
    } satisfies React.CSSProperties,
  };

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          {showSelection && (
            <colgroup>
              <col style={{ width: SELECTION_COLUMN_WIDTH }} />
            </colgroup>
          )}
          <TableHeader>
            <TableRow>
              {showSelection && (
                <TableHead {...selectionColumnProps}>
                  <Checkbox
                    checked={
                      allPageSelected
                        ? true
                        : somePageSelected
                          ? 'indeterminate'
                          : false
                    }
                    onCheckedChange={togglePageSelection}
                    aria-label="Select all on page"
                  />
                </TableHead>
              )}
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
                      {showSelection && (
                        <TableCell {...selectionColumnProps}>
                          <Checkbox
                            checked={selectedRowIds!.has(rowId)}
                            onCheckedChange={() => toggleRowSelection(rowId)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Select row"
                          />
                        </TableCell>
                      )}
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
                          colSpan={totalColumnCount}
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
