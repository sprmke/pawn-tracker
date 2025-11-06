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
  allEvents?: CalendarEvent[];
  currentDate?: Date;
}

export function DailySummary({
  events,
  formatCurrency,
  size = 'md',
  alwaysShow = false,
  allEvents,
  currentDate,
}: DailySummaryProps) {
  // Show summary if alwaysShow is true OR if there are multiple events
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

  // Get final balance from transaction events
  // Calculate total balance across ALL investors
  let finalBalance: number | null = null;

  if (alwaysShow && allEvents && currentDate) {
    // Normalize currentDate to end of day for comparison
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all transaction events up to and including the current date
    const transactionsUpToDate = allEvents.filter(
      (e) => e.type === 'transaction' && e.date <= endOfDay
    ) as CalendarEventTransaction[];

    if (transactionsUpToDate.length > 0) {
      // Group by investor and get the latest transaction for each investor
      const latestByInvestor = new Map<number, CalendarEventTransaction>();

      transactionsUpToDate.forEach((txEvent) => {
        const investorId = txEvent.transaction.investorId;
        const existing = latestByInvestor.get(investorId);

        if (
          !existing ||
          txEvent.date > existing.date ||
          (txEvent.date.getTime() === existing.date.getTime() &&
            txEvent.transaction.id > existing.transaction.id)
        ) {
          latestByInvestor.set(investorId, txEvent);
        }
      });

      // Sum up the balances from the latest transaction of each investor
      finalBalance = Array.from(latestByInvestor.values()).reduce(
        (sum, txEvent) => sum + parseFloat(txEvent.transaction.balance),
        0
      );
    } else {
      // When alwaysShow is true but no transactions found, show balance as 0
      finalBalance = 0;
    }
  } else {
    // Original behavior: calculate total balance from transactions on this day
    const transactionEvents = events.filter(
      (e) => e.type === 'transaction'
    ) as CalendarEventTransaction[];

    if (transactionEvents.length > 0) {
      // Group by investor and get the latest transaction for each investor
      const latestByInvestor = new Map<number, CalendarEventTransaction>();

      transactionEvents.forEach((txEvent) => {
        const investorId = txEvent.transaction.investorId;
        const existing = latestByInvestor.get(investorId);

        if (
          !existing ||
          txEvent.date > existing.date ||
          (txEvent.date.getTime() === existing.date.getTime() &&
            txEvent.transaction.id > existing.transaction.id)
        ) {
          latestByInvestor.set(investorId, txEvent);
        }
      });

      // Sum up the balances from the latest transaction of each investor
      finalBalance = Array.from(latestByInvestor.values()).reduce(
        (sum, txEvent) => sum + parseFloat(txEvent.transaction.balance),
        0
      );
    }
  }

  // If alwaysShow is true and there are no events, just show "No transactions" with balance if available
  const hasActivity = totalOut > 0 || totalIn > 0;

  const sizeClasses = {
    sm: {
      container: 'p-1.5 text-[10px] space-y-0.5',
      icon: 'h-2.5 w-2.5',
      text: 'text-[10px]',
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

  // Don't show anything if not alwaysShow and no activity and no balance
  if (!alwaysShow && !hasActivity && finalBalance === null) return null;

  return (
    <div
      className={`mb-2 bg-muted/30 border border-border rounded ${classes.container}`}
    >
      {totalOut > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            {size === 'lg' ? 'Total Out:' : 'Out:'}
          </span>
          <span
            className={`font-bold text-rose-700 dark:text-rose-400 ${
              size === 'lg' ? 'text-lg' : ''
            }`}
          >
            {totalOut >= 0 ? '-' : '+'}
            {formatCurrency(totalOut)}
          </span>
        </div>
      )}
      {totalIn > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            {size === 'lg' ? 'Total In:' : 'In:'}
          </span>
          <span
            className={`font-bold text-emerald-700 dark:text-emerald-400 ${
              size === 'lg' ? 'text-lg' : ''
            }`}
          >
            {totalIn >= 0 ? '+' : '-'}
            {formatCurrency(totalIn)}
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
      {finalBalance !== null && (
        <div
          className={`flex items-center justify-between ${
            size === 'lg' ? 'pt-2' : 'pt-0.5'
          } ${hasActivity ? 'border-t border-gray-300' : ''}`}
        >
          <span className="text-gray-500 font-semibold">Balance:</span>
          <span
            className={`font-bold ${
              finalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
            } ${size === 'lg' ? 'text-lg' : ''}`}
          >
            {formatCurrency(finalBalance)}
          </span>
        </div>
      )}
    </div>
  );
}
