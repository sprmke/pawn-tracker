/** Tailwind grid classes for summary metric card rows (server + client safe). */
export function getSummaryMetricGridCols(count: number) {
  if (count <= 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-3';
  if (count === 4) return 'grid-cols-2 lg:grid-cols-4';
  if (count === 5) return 'grid-cols-2 md:grid-cols-3 2xl:grid-cols-5';
  // 6+ metrics: 3-column rows (never 5–6 columns on one line)
  return 'grid-cols-2 md:grid-cols-3';
}

/** Max metrics on investor detail (3 loan + 3 debt + interest + earnings + lot). */
export const INVESTOR_DETAIL_METRIC_COUNT = 9;

/** Investor detail always uses 3 columns on md+ regardless of metric count. */
export const INVESTOR_DETAIL_SUMMARY_GRID =
  'grid-cols-2 md:grid-cols-3' as const;
