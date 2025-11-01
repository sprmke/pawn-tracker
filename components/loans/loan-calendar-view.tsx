'use client';

import { useMemo } from 'react';
import { LoanWithInvestors } from '@/lib/types';
import {
  Calendar,
  CalendarConfig,
  CalendarEvent,
  CalendarEventSent,
  CalendarEventDue,
  CalendarEventInterestDue,
} from '@/components/common/calendar';
import { useLoanCalendarEvents } from './use-loan-calendar-events';
import {
  LoanSentEventCard,
  LoanDueEventCard,
  LoanInterestDueEventCard,
} from './loan-event-cards';

interface LoanCalendarViewProps {
  loans: LoanWithInvestors[];
  onLoanClick: (loan: LoanWithInvestors) => void;
}

export function LoanCalendarView({
  loans,
  onLoanClick,
}: LoanCalendarViewProps) {
  const calendarEvents = useLoanCalendarEvents(loans);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderEventCard = (event: CalendarEvent, eventIndex: number) => {
    if (event.type === 'sent') {
      const sentEvent = event as CalendarEventSent;

      return (
        <LoanSentEventCard
          key={`${sentEvent.loan.id}-sent-${eventIndex}`}
          loan={sentEvent.loan}
          onClick={() => onLoanClick(sentEvent.loan)}
          formatCurrency={formatCurrency}
          investors={sentEvent.investors}
          totalAmount={sentEvent.totalAmount}
          size="sm"
          isFuture={sentEvent.hasUnpaidTransactions}
        />
      );
    } else if (event.type === 'due') {
      const dueEvent = event as CalendarEventDue;
      return (
        <LoanDueEventCard
          key={`${dueEvent.loan.id}-due-${eventIndex}`}
          loan={dueEvent.loan}
          onClick={() => onLoanClick(dueEvent.loan)}
          formatCurrency={formatCurrency}
          totalPrincipal={dueEvent.totalPrincipal}
          totalInterest={dueEvent.totalInterest}
          totalAmount={dueEvent.totalAmount}
          size="sm"
        />
      );
    } else if (event.type === 'interest_due') {
      const interestDueEvent = event as CalendarEventInterestDue;
      return (
        <LoanInterestDueEventCard
          key={`${interestDueEvent.loan.id}-interest-due-${interestDueEvent.loanInvestor.id}-${interestDueEvent.interestPeriod.id}`}
          loan={interestDueEvent.loan}
          onClick={() => onLoanClick(interestDueEvent.loan)}
          formatCurrency={formatCurrency}
          investorName={interestDueEvent.loanInvestor.investor.name}
          principal={interestDueEvent.principal}
          interest={interestDueEvent.interest}
          totalAmount={interestDueEvent.totalAmount}
          size="sm"
        />
      );
    }
    return null;
  };

  const calendarConfig: CalendarConfig = useMemo(
    () => ({
      formatCurrency,
      onEventClick: (event) => {
        if (event.type === 'sent') {
          onLoanClick((event as CalendarEventSent).loan);
        } else if (event.type === 'due') {
          onLoanClick((event as CalendarEventDue).loan);
        } else if (event.type === 'interest_due') {
          onLoanClick((event as CalendarEventInterestDue).loan);
        }
      },
      renderEventCard,
      legendGroups: [
        {
          title: 'Out',
          items: [
            { label: 'Sent', color: 'bg-rose-400' },
            { label: 'Scheduled', color: 'bg-amber-300' },
          ],
        },
        {
          title: 'In',
          items: [
            { label: 'Interest Due', color: 'bg-sky-400' },
            { label: 'Due Date', color: 'bg-emerald-400' },
          ],
        },
      ],
    }),
    [onLoanClick]
  );

  return <Calendar events={calendarEvents} config={calendarConfig} />;
}
