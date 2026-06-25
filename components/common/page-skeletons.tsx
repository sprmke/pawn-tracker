import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  INVESTOR_DETAIL_METRIC_COUNT,
  INVESTOR_DETAIL_SUMMARY_GRID,
} from '@/lib/summary-grid';

/* ─── Primitives ─── */

export function SummaryMetricSkeleton() {
  return (
    <Card className="border-border/40">
      <CardContent className="p-4 md:p-5">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        </div>
        <Skeleton className="h-6 w-36 sm:h-7" />
        <Skeleton className="mt-2 h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function ActivityPanelSkeleton({
  variant = 'empty',
}: {
  variant?: 'empty' | 'list';
}) {
  return (
    <Card className="relative overflow-hidden border-border/40">
      <Skeleton className="absolute inset-x-0 top-0 h-1 rounded-t-3xl" />
      <CardHeader className="pb-2 pt-6">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
        </div>
      </CardHeader>
      <CardContent className="min-w-0 px-5 pb-5 pt-0">
        {variant === 'empty' ? (
          <Skeleton className="h-[88px] w-full rounded-2xl" />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-muted/40 px-3 py-2.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-2xl border border-border/50 bg-muted/30 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-[55%]" />
                    <Skeleton className="h-4 w-16 shrink-0" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type TableColumnSkeleton = {
  headerWidth: string;
  cellWidth?: string;
  cellHeight?: string;
  pill?: boolean;
};

function TableRowSkeleton({
  columns,
  tall,
}: {
  columns: TableColumnSkeleton[];
  tall?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 border-b border-border/50 px-4 last:border-0',
        tall ? 'py-5' : 'py-4'
      )}
    >
      {columns.map((col, i) => (
        <Skeleton
          key={i}
          className={cn(
            'shrink-0',
            col.pill ? 'h-6 rounded-full' : col.cellHeight ?? 'h-4',
            col.cellWidth ?? col.headerWidth
          )}
        />
      ))}
    </div>
  );
}

export function DataTableSkeleton({
  columns,
  rows = 8,
  tallRows = false,
  className,
}: {
  columns: TableColumnSkeleton[];
  rows?: number;
  tallRows?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn('border-border/40 overflow-hidden', className)}>
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/50 bg-muted/30 px-4 py-3">
          {columns.map((col, i) => (
            <Skeleton key={i} className={cn('h-3 shrink-0', col.headerWidth)} />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} tall={tallRows} />
        ))}
      </CardContent>
    </Card>
  );
}

const LOANS_TABLE_COLUMNS: TableColumnSkeleton[] = [
  { headerWidth: 'w-28', cellWidth: 'w-32' },
  { headerWidth: 'w-14', cellWidth: 'w-16', pill: true },
  { headerWidth: 'w-14', cellWidth: 'w-20', pill: true },
  { headerWidth: 'w-16', cellWidth: 'w-24', cellHeight: 'h-10' },
  { headerWidth: 'w-16', cellWidth: 'w-24', cellHeight: 'h-10' },
  { headerWidth: 'w-20', cellWidth: 'w-24' },
  { headerWidth: 'w-14', cellWidth: 'w-16' },
  { headerWidth: 'w-20', cellWidth: 'w-24' },
  { headerWidth: 'w-20', cellWidth: 'w-24' },
  { headerWidth: 'w-14', cellWidth: 'w-16' },
  { headerWidth: 'w-12', cellWidth: 'w-14' },
];

const TRANSACTIONS_TABLE_COLUMNS: TableColumnSkeleton[] = [
  { headerWidth: 'w-16', cellWidth: 'w-20' },
  { headerWidth: 'w-24', cellWidth: 'w-36' },
  { headerWidth: 'w-20', cellWidth: 'w-28' },
  { headerWidth: 'w-14', cellWidth: 'w-18', pill: true },
  { headerWidth: 'w-14', cellWidth: 'w-10', pill: true },
  { headerWidth: 'w-16', cellWidth: 'w-24' },
  { headerWidth: 'w-12', cellWidth: 'w-14' },
];

export function LoansTableSkeleton(props?: {
  rows?: number;
  className?: string;
}) {
  return (
    <DataTableSkeleton
      columns={LOANS_TABLE_COLUMNS}
      rows={props?.rows ?? 8}
      tallRows
      className={props?.className}
    />
  );
}

export function TransactionsTableSkeleton(props?: {
  rows?: number;
  className?: string;
}) {
  return (
    <DataTableSkeleton
      columns={TRANSACTIONS_TABLE_COLUMNS}
      rows={props?.rows ?? 8}
      className={props?.className}
    />
  );
}

export function ListPageFiltersSkeleton({
  showMoreFilters = true,
}: {
  showMoreFilters?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-11 min-w-0 flex-1 rounded-2xl" />
        <Skeleton className="hidden h-11 w-[180px] rounded-2xl xl:block" />
        <Skeleton className="hidden h-11 w-[180px] rounded-2xl xl:block" />
        {showMoreFilters && (
          <Skeleton className="h-11 w-[130px] rounded-2xl" />
        )}
      </div>
    </div>
  );
}

export function ListPageHeaderSkeleton({
  actionCount = 4,
}: {
  actionCount?: number;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32 sm:h-9" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: actionCount }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/* ─── Full pages ─── */

export function LoansPageSkeleton({
  showTitle = false,
}: {
  showTitle?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showTitle ? (
        <div className="mb-8 space-y-2 md:mb-10">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            Loans
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage all your pawn loans
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-32 rounded-2xl" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
          </div>
        </div>
      ) : (
        <ListPageHeaderSkeleton actionCount={5} />
      )}
      <ListPageFiltersSkeleton />
      <LoansTableSkeleton />
    </div>
  );
}

export function TransactionsPageSkeleton({
  showTitle = false,
}: {
  showTitle?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showTitle ? (
        <div className="mb-8 space-y-2 md:mb-10">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            Transactions
          </h1>
          <p className="text-sm text-muted-foreground">
            View and manage all transactions
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-36 rounded-2xl" />
            <Skeleton className="h-9 w-32 rounded-2xl" />
          </div>
        </div>
      ) : (
        <ListPageHeaderSkeleton actionCount={4} />
      )}
      <ListPageFiltersSkeleton />
      <TransactionsTableSkeleton />
    </div>
  );
}

export function DebtsPageSkeleton({
  showTitle = false,
}: {
  showTitle?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showTitle ? (
        <div className="mb-8 space-y-2 md:mb-10">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            Borrowings
          </h1>
          <p className="text-sm text-muted-foreground">
            Track borrowings and projected interest costs
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-9 w-28 rounded-2xl" />
            <Skeleton className="h-9 w-32 rounded-2xl" />
          </div>
        </div>
      ) : (
        <ListPageHeaderSkeleton actionCount={2} />
      )}
      <ListPageFiltersSkeleton />
      <TransactionsTableSkeleton />
    </div>
  );
}

export function InvestorDetailHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-52 sm:h-9 md:w-64" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
    </div>
  );
}

export function InvestorContactCardSkeleton() {
  return (
    <Card className="border-border/40">
      <CardContent className="p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-full max-w-[200px]" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function InvestorLoansFiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Skeleton className="h-11 min-w-0 flex-1 rounded-2xl" />
        <Skeleton className="hidden h-11 w-[180px] rounded-2xl xl:block" />
        <Skeleton className="hidden h-11 w-[180px] rounded-2xl xl:block" />
        <Skeleton className="h-11 w-[130px] rounded-2xl" />
        <Skeleton className="h-9 w-24 rounded-2xl" />
        <Skeleton className="h-9 w-24 rounded-2xl" />
      </div>
    </div>
  );
}

export function InvestorDetailTabsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Skeleton className="h-11 min-w-0 flex-1 rounded-2xl" />
        <Skeleton className="hidden h-11 w-[180px] rounded-2xl xl:block" />
        <Skeleton className="hidden h-11 w-[180px] rounded-2xl xl:block" />
        <Skeleton className="h-11 w-[130px] rounded-2xl" />
        <Skeleton className="h-9 w-24 rounded-2xl" />
        <Skeleton className="h-9 w-24 rounded-2xl" />
      </div>
      <LoansTableSkeleton rows={6} />
    </div>
  );
}

export { INVESTOR_DETAIL_METRIC_COUNT } from '@/lib/summary-grid';

export function InvestorDetailPageSkeleton({
  metricCount = INVESTOR_DETAIL_METRIC_COUNT,
}: {
  metricCount?: number;
}) {
  return (
    <div className="space-y-6">
      <InvestorDetailHeaderSkeleton />

      <div className="flex gap-2">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>

      <InvestorContactCardSkeleton />

      <div
        className={cn('grid gap-4 md:gap-5', INVESTOR_DETAIL_SUMMARY_GRID)}
      >
        {Array.from({ length: metricCount }).map((_, i) => (
          <SummaryMetricSkeleton key={i} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <ActivityPanelSkeleton variant="empty" />
        <ActivityPanelSkeleton variant="list" />
        <ActivityPanelSkeleton variant="empty" />
        <ActivityPanelSkeleton variant="list" />
      </div>

      <InvestorDetailTabsSkeleton />
    </div>
  );
}
