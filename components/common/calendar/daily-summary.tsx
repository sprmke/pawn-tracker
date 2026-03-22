'use client';

import {
  CalendarEvent,
  CalendarEventSent,
  CalendarEventDue,
  CalendarEventInterestDue,
  CalendarEventTransaction,
} from './types';

interface DailySummaryProps {
  events: CalendarEvent[];
  formatCurrency: (amount: number) => string;
  size?: 'sm' | 'md' | 'lg';
  alwaysShow?: boolean;
}

export function DailySummary({
  events,
  formatCurrency,
  size = 'md',
  alwaysShow = false,
}: DailySummaryProps) {
  if (!alwaysShow && events.length <= 1) return null;

  // Calculate total OUT (sent + transaction Out)
  const totalOut = events.reduce((sum, e) => {
    if (e.type === 'sent') {
      return sum + (e as CalendarEventSent).totalAmount;
    } else if (e.type === 'transaction') {
      const txEvent = e as CalendarEventTransaction;
      return txEvent.direction === 'Out' ? sum + txEvent.amount : sum;
    }
    return sum;
  }, 0);

  // Calculate total IN (due + interest_due + transaction In)
  const totalIn = events.reduce((sum, e) => {
    if (e.type === 'due') {
      return sum + (e as CalendarEventDue).totalAmount;
    } else if (e.type === 'interest_due') {
      return sum + (e as CalendarEventInterestDue).totalAmount;
    } else if (e.type === 'transaction') {
      const txEvent = e as CalendarEventTransaction;
      return txEvent.direction === 'In' ? sum + txEvent.amount : sum;
    }
    return sum;
  }, 0);

  const hasActivity = totalOut > 0 || totalIn > 0;

  if (!alwaysShow && !hasActivity) return null;

  const sizeClasses = {
    sm: {
      container: 'p-1.5 text-[10px] space-y-0.5',
      text: 'text-[10px]',
    },
    md: {
      container: 'p-2 text-xs space-y-1',
      text: 'text-xs',
    },
    lg: {
      container: 'p-3 text-sm space-y-1',
      text: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`mb-2 bg-muted/30 border border-border rounded ${classes.container}`}
    >
      {totalOut > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            {size === 'lg' ? 'Total Out:' : 'Out:'}
          </span>
          <span
            className={`font-bold text-rose-700 dark:text-rose-400 ${
              size === 'lg' ? 'text-lg' : ''
            }`}
          >
            -{formatCurrency(totalOut)}
          </span>
        </div>
      )}
      {totalIn > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {size === 'lg' ? 'Total In:' : 'In:'}
          </span>
          <span
            className={`font-bold text-emerald-700 dark:text-emerald-400 ${
              size === 'lg' ? 'text-lg' : ''
            }`}
          >
            +{formatCurrency(totalIn)}
          </span>
        </div>
      )}
      {totalOut > 0 && totalIn > 0 && (
        <div
          className={`flex items-center justify-between ${
            size === 'lg' ? 'pt-2' : 'pt-0.5'
          } border-t border-border`}
        >
          <span className="text-foreground font-semibold">Net:</span>
          <span
            className={`font-bold ${
              totalIn - totalOut >= 0
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-400'
            } ${size === 'lg' ? 'text-lg' : ''}`}
          >
            {formatCurrency(totalIn - totalOut)}
          </span>
        </div>
      )}
    </div>
  );
}
