'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet,
  Activity,
  CheckCircle2,
  TrendingUp,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getSummaryMetricGridCols } from '@/lib/summary-grid';
import { formatCurrency } from '@/lib/format';
import { usePriceVisibilityStore } from '@/stores/price-visibility-store';

export { getSummaryMetricGridCols } from '@/lib/summary-grid';

export interface MetricItem {
  label: string;
  /** Pre-formatted or custom display (use `amount` for currency that respects visibility). */
  value?: string | ReactNode;
  /** Formatted on the client so price visibility toggle applies (including server-rendered pages). */
  amount?: number;
  subValue?: string;
  /** e.g. `"of {amount}"` — `{amount}` is replaced with formatted currency. */
  subValueTemplate?: string;
  subAmount?: number;
  valueClassName?: string;
  icon?: LucideIcon;
  accentClassName?: string;
}

function resolveMetricValue(metric: MetricItem): string | ReactNode {
  if (metric.amount !==undefined) {
    return formatCurrency(metric.amount);
  }
  return metric.value ?? '—';
}

function resolveMetricSubValue(metric: MetricItem): string | undefined {
  if (metric.subValueTemplate && metric.subAmount !==undefined) {
    return metric.subValueTemplate.replace(
      '{amount}',
      formatCurrency(metric.subAmount),
    );
  }
  return metric.subValue;
}

interface SummaryCardProps {
  metrics: MetricItem[];
  className?: string;
}

const defaultMetricStyles: Array<{
  icon: LucideIcon;
  accentClassName: string;
}> = [
  { icon: Wallet, accentClassName: 'bg-primary/12 text-primary' },
  { icon: Activity, accentClassName: 'bg-chart-5/15 text-chart-5' },
  { icon: CheckCircle2, accentClassName: 'bg-chart-4/12 text-chart-4' },
  { icon: TrendingUp, accentClassName: 'bg-chart-2/12 text-chart-2' },
  { icon: CircleDollarSign, accentClassName: 'bg-chart-1/12 text-chart-1' },
];

export function SummaryCard({ metrics, className }: SummaryCardProps) {
  usePriceVisibilityStore((state) => state.pricesHidden);

  return (
    <div
      className={cn(
        'grid gap-4 md:gap-5',
        className ?? getSummaryMetricGridCols(metrics.length)
      )}
    >
      {metrics.map((metric, index) => {
        const defaults =
          defaultMetricStyles[index % defaultMetricStyles.length];
        const Icon = metric.icon ?? defaults.icon;
        const accentClassName =
          metric.accentClassName ?? defaults.accentClassName;

        return (
          <Card
            key={index}
            className="group border-border/40 surface-card-interactive"
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {metric.label}
                </p>
                <div
                  className={cn(
                    'icon-well-sm shrink-0 transition-transform duration-300 group-hover:scale-105',
                    accentClassName,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p
                className={cn(
                  'text-base font-bold tabular-nums leading-snug break-words sm:text-lg',
                  metric.valueClassName,
                )}
              >
                {resolveMetricValue(metric)}
              </p>
              {(() => {
                const subValue = resolveMetricSubValue(metric);
                return (
                  subValue && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground break-words">
                      {subValue}
                    </p>
                  )
                );
              })()}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface MetricDisplayProps {
  label: string;
  value: string | ReactNode;
  subValue?: string;
  valueClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function MetricDisplay({
  label,
  value,
  subValue,
  valueClassName,
  size = 'md',
}: MetricDisplayProps) {
  const sizeStyles = {
    sm: {
      label: 'text-[10px]',
      value: 'text-sm',
      subValue: 'text-[10px]',
    },
    md: {
      label: 'text-xs',
      value: 'text-base sm:text-lg',
      subValue: 'text-xs',
    },
    lg: {
      label: 'text-sm',
      value: 'text-xl sm:text-2xl',
      subValue: 'text-sm',
    },
  };

  const styles = sizeStyles[size];

  return (
    <div className="space-y-1">
      <p className={cn('text-muted-foreground font-medium', styles.label)}>
        {label}
      </p>
      <p
        className={cn('font-bold tracking-tight', styles.value, valueClassName)}
      >
        {value}
      </p>
      {subValue && (
        <p className={cn('text-muted-foreground', styles.subValue)}>
          {subValue}
        </p>
      )}
    </div>
  );
}
