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

      // Check if sent date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      const isFutureSentDate = eventDate > today;

      return (
        <LoanSentEventCard
          key={`${sentEvent.loan.id}-sent-${eventIndex}`}
          loan={sentEvent.loan}
          onClick={() => onLoanClick(sentEvent.loan)}
          formatCurrency={formatCurrency}
          investors={sentEvent.investors}
          totalAmount={sentEvent.totalAmount}
          size="sm"
          isFuture={isFutureSentDate}
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
            { label: 'Sent', color: 'bg-red-500' },
            { label: 'Scheduled', color: 'bg-yellow-500' },
          ],
        },
        {
          title: 'In',
          items: [
            { label: 'Interest Due', color: 'bg-blue-600' },
            { label: 'Due Date', color: 'bg-green-600' },
          ],
        },
      ],
    }),
    [onLoanClick]
  );

  return <Calendar events={calendarEvents} config={calendarConfig} />;
}
