'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { chartGradientId, chartGradientPair } from './chart-theme';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  children,
  action,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn('border-border/40', className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold tracking-tight">
            {title}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

interface ChartEmptyStateProps {
  icon: LucideIcon;
  message: string;
}

export function ChartEmptyState({ icon: Icon, message }: ChartEmptyStateProps) {
  return (
    <div className="empty-state-well">
      <Icon className="mb-3 h-10 w-10 text-muted-foreground/35" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface ChartLegendProps {
  payload?: Array<{ value?: string; color?: string }>;
  variant?: 'dot' | 'bar';
}

export function ChartLegend({ payload, variant = 'dot' }: ChartLegendProps) {
  if (!payload?.length) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-1 pt-5">
      {payload.map((entry, index) => (
        <div
          key={`legend-${index}`}
          className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/50 px-3 py-1.5"
        >
          <div
            className={cn(
              'shrink-0 ring-2 ring-background',
              variant == 'bar'
                ? 'h-2 w-3 rounded-sm'
                : 'h-2.5 w-2.5 rounded-full'
            )}
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

interface ChartPieLegendProps {
  payload?: Array<{
    value?: string;
    color?: string;
    payload?: { value?: number };
  }>;
}

export function ChartPieLegend({ payload }: ChartPieLegendProps) {
  if (!payload?.length) return null;

  const total = payload.reduce(
    (sum, entry) => sum + (entry.payload?.value ?? 0),
    0
  );

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-1 pt-5">
      {payload.map((entry, index) => {
        const value = entry.payload?.value ?? 0;
        const pct = total > 0 ? Math.round((value / total) * 100) : 0;

        return (
          <div
            key={`pie-legend-${index}`}
            className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/50 px-3 py-1.5"
          >
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-background"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs font-medium text-foreground">
              {entry.value}
              <span className="ml-1 text-muted-foreground">· {pct}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface ChartGradientDefsProps {
  keys: Array<{ id: string; color: string }>;
}

export function ChartGradientDefs({ keys }: ChartGradientDefsProps) {
  return (
    <defs>
      {keys.map(({ id, color }) => {
        const { light, base } = chartGradientPair(color);
        const gradId = chartGradientId(id);
        return (
          <linearGradient
            key={gradId}
            id={gradId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={light} stopOpacity={0.95} />
            <stop offset="100%" stopColor={base} stopOpacity={1} />
          </linearGradient>
        );
      })}
    </defs>
  );
}

/** Soft area fill under line charts */
export function ChartAreaGradientDefs({
  keys,
}: {
  keys: Array<{ id: string; color: string }>;
}) {
  return (
    <defs>
      {keys.map(({ id, color }) => {
        const gradId = `${chartGradientId(id)}-area`;
        return (
          <linearGradient
            key={gradId}
            id={gradId}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        );
      })}
    </defs>
  );
}
