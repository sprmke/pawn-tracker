'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { CalendarEvent, CalendarEventSent, CalendarEventDue } from './types';

interface DailySummaryProps {
  events: CalendarEvent[];
  formatCurrency: (amount: number) => string;
  size?: 'sm' | 'md' | 'lg';
}

export function DailySummary({
  events,
  formatCurrency,
  size = 'md',
}: DailySummaryProps) {
  if (events.length <= 1) return null;

  const totalOut = events
    .filter((e) => e.type === 'sent')
    .reduce((sum, e) => sum + (e as CalendarEventSent).totalAmount, 0);

  const totalIn = events
    .filter((e) => e.type === 'due')
    .reduce((sum, e) => sum + (e as CalendarEventDue).totalAmount, 0);

  const sizeClasses = {
    sm: {
      container: 'p-1.5 text-[9px] space-y-0.5',
      icon: 'h-2.5 w-2.5',
      text: 'text-[9px]',
    },
    md: {
      container: 'p-2 text-xs space-y-1',
      icon: 'h-3 w-3',
      text: 'text-xs',
    },
    lg: {
      container: 'p-3 text-sm space-y-1',
      icon: 'h-4 w-4',
      text: 'text-sm',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div
      className={`mb-2 bg-gray-50 border border-gray-300 rounded ${classes.container}`}
    >
      {totalOut > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-red-600 font-semibold flex items-center gap-1">
            <ArrowUp className={classes.icon} />
            {size === 'lg' ? 'Total Out:' : 'Out:'}
          </span>
          <span
            className={`font-bold text-red-700 ${
              size === 'lg' ? 'text-lg' : ''
            }`}
          >
            {formatCurrency(totalOut)}
          </span>
        </div>
      )}
      {totalIn > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-green-600 font-semibold flex items-center gap-1">
            <ArrowDown className={classes.icon} />
            {size === 'lg' ? 'Total In:' : 'In:'}
          </span>
          <span
            className={`font-bold text-green-700 ${
              size === 'lg' ? 'text-lg' : ''
            }`}
          >
            {formatCurrency(totalIn)}
          </span>
        </div>
      )}
      {totalOut > 0 && totalIn > 0 && (
        <div
          className={`flex items-center justify-between ${
            size === 'lg' ? 'pt-2' : 'pt-0.5'
          } border-t border-gray-300`}
        >
          <span className="text-gray-700 font-semibold">Net:</span>
          <span
            className={`font-bold ${
              totalIn - totalOut >= 0 ? 'text-green-700' : 'text-red-700'
            } ${size === 'lg' ? 'text-lg' : ''}`}
          >
            {formatCurrency(totalIn - totalOut)}
          </span>
        </div>
      )}
    </div>
  );
}
