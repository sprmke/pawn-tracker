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

export { getSummaryMetricGridCols } from '@/lib/summary-grid';

interface MetricItem {
  label: string;
  value: string | ReactNode;
  subValue?: string;
  valueClassName?: string;
  icon?: LucideIcon;
  accentClassName?: string;
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
                {metric.value}
              </p>
              {metric.subValue && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground break-words">
                  {metric.subValue}
                </p>
              )}
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
