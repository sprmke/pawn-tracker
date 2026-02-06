'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricItem {
  label: string;
  value: string | ReactNode;
  subValue?: string;
  valueClassName?: string;
}

interface SummaryCardProps {
  metrics: MetricItem[];
  className?: string;
}

export function SummaryCard({ metrics, className }: SummaryCardProps) {
  // Determine grid columns based on number of metrics
  const getGridCols = (count: number) => {
    if (count <= 3) return 'grid-cols-3';
    if (count === 4) return 'grid-cols-2 sm:grid-cols-4';
    if (count === 5) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';
    if (count === 6) return 'grid-cols-3 sm:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-7';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-0">
        <div
          className={cn(
            'grid divide-x divide-border',
            getGridCols(metrics.length),
          )}
        >
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="p-3 sm:p-4 text-center hover:bg-muted/30 transition-colors"
            >
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                {metric.label}
              </p>
              <p
                className={cn(
                  'text-sm lg:text-base font-bold truncate',
                  metric.valueClassName,
                )}
              >
                {metric.value}
              </p>
              {metric.subValue && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">
                  {metric.subValue}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact metric display for inline summaries
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
    <div className="space-y-0.5">
      <p className={cn('text-muted-foreground font-medium', styles.label)}>
        {label}
      </p>
      <p className={cn('font-semibold', styles.value, valueClassName)}>
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
