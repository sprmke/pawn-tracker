import { useMemo } from 'react';
import type { TransactionWithInvestor } from '@/lib/types';
import type { CalendarEventTransaction } from '@/components/common/calendar';

export interface TransactionCalendarEvent extends CalendarEventTransaction {
  transaction: TransactionWithInvestor;
}

export function useTransactionCalendarEvents(
  transactions: TransactionWithInvestor[]
): TransactionCalendarEvent[] {
  return useMemo(() => {
    const events: TransactionCalendarEvent[] = [];

    transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount);

      events.push({
        type: 'transaction',
        date: new Date(transaction.date),
        transaction,
        amount,
        direction: transaction.direction,
      });
    });

    return events;
  }, [transactions]);
}
