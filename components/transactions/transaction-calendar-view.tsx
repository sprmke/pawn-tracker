'use client';

import { useMemo } from 'react';
import type { TransactionWithInvestor } from '@/lib/types';
import {
  Calendar,
  CalendarConfig,
  CalendarEvent,
} from '@/components/common/calendar';
import {
  useTransactionCalendarEvents,
  TransactionCalendarEvent,
} from './use-transaction-calendar-events';
import { TransactionEventCard } from './transaction-event-card';

interface TransactionCalendarViewProps {
  transactions: TransactionWithInvestor[];
  onTransactionClick: (transaction: TransactionWithInvestor) => void;
}

export function TransactionCalendarView({
  transactions,
  onTransactionClick,
}: TransactionCalendarViewProps) {
  const calendarEvents = useTransactionCalendarEvents(transactions);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderEventCard = (event: CalendarEvent, eventIndex: number) => {
    const transactionEvent = event as TransactionCalendarEvent;

    return (
      <TransactionEventCard
        key={`${transactionEvent.transaction.id}-${eventIndex}`}
        transaction={transactionEvent.transaction}
        onClick={() => onTransactionClick(transactionEvent.transaction)}
        formatCurrency={formatCurrency}
        size="sm"
      />
    );
  };

  const calendarConfig: CalendarConfig = useMemo(
    () => ({
      formatCurrency,
      onEventClick: (event) => {
        const transactionEvent = event as TransactionCalendarEvent;
        onTransactionClick(transactionEvent.transaction);
      },
      renderEventCard,
      alwaysShowSummary: true,
      allEvents: calendarEvents,
      legendGroups: [
        {
          title: 'Out',
          items: [{ label: 'Out', color: 'bg-rose-400' }],
        },
        {
          title: 'In',
          items: [{ label: 'In', color: 'bg-emerald-400' }],
        },
      ],
    }),
    [onTransactionClick, calendarEvents]
  );

  return <Calendar events={calendarEvents} config={calendarConfig} />;
}
