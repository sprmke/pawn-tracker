import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function SummaryMetricSkeleton() {
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

function ActivityPanelSkeleton({ variant }: { variant: 'empty' | 'list' }) {
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
        {variant == 'empty' ? (
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

function ChartCardSkeleton({ showToggle = false }: { showToggle?: boolean }) {
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-44" />
          {showToggle && (
            <Skeleton className="h-9 w-[140px] rounded-2xl" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Skeleton className="h-[280px] w-full rounded-2xl" />
      </CardContent>
    </Card>
  );
}

function SectionHeadingSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-5 w-40" />
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-8 md:space-y-10">
      {/* Page header — eyebrow, title, description */}
      <div className="mb-8 space-y-2 md:mb-10">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-48 sm:h-9 md:w-56" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {/* Summary — 5 individual bento cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SummaryMetricSkeleton key={i} />
        ))}
      </div>

      {/* Activity */}
      <section className="space-y-4">
        <SectionHeadingSkeleton />
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <ActivityPanelSkeleton variant="empty" />
          <ActivityPanelSkeleton variant="list" />
          <ActivityPanelSkeleton variant="empty" />
          <ActivityPanelSkeleton variant="list" />
        </div>
      </section>

      {/* Analytics */}
      <section className="space-y-4">
        <SectionHeadingSkeleton />
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCardSkeleton showToggle />
          <ChartCardSkeleton />
        </div>
      </section>

      {/* Portfolio */}
      <section className="space-y-4">
        <SectionHeadingSkeleton />
        <div className="grid gap-5 lg:grid-cols-2">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      </section>
    </div>
  );
}
