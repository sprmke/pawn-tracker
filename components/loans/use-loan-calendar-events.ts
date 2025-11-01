'use client';

import { useMemo } from 'react';
import { LoanWithInvestors } from '@/lib/types';
import { toLocalDateString } from '@/lib/date-utils';
import {
  CalendarEvent,
  CalendarEventSent,
  CalendarEventDue,
  CalendarEventInterestDue,
} from '@/components/common/calendar';

export function useLoanCalendarEvents(loans: LoanWithInvestors[]) {
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    loans.forEach((loan) => {
      // Group transactions by sent date
      const sentDateMap = new Map<
        string,
        Array<(typeof loan.loanInvestors)[0]>
      >();

      loan.loanInvestors.forEach((li) => {
        const dateKey = toLocalDateString(li.sentDate);
        const existing = sentDateMap.get(dateKey) || [];
        existing.push(li);
        sentDateMap.set(dateKey, existing);
      });

      // Create sent date events
      sentDateMap.forEach((transactions, dateKey) => {
        const investors = transactions.map((t) => ({
          name: t.investor.name,
          amount: parseFloat(t.amount),
        }));
        const totalAmount = investors.reduce((sum, inv) => sum + inv.amount, 0);
        // Check if any of these transactions are unpaid
        const hasUnpaidTransactions = transactions.some((t) => !t.isPaid);

        events.push({
          type: 'sent',
          loan,
          date: new Date(dateKey + 'T00:00:00'),
          investors,
          totalAmount,
          hasUnpaidTransactions,
        } as CalendarEventSent);
      });

      // Check if loan has multiple interest dates
      const hasAnyMultipleInterest = loan.loanInvestors.some(
        (li) =>
          li.hasMultipleInterest &&
          li.interestPeriods &&
          li.interestPeriods.length > 0
      );

      if (hasAnyMultipleInterest) {
        // Create interest due events for each investor with multiple interest periods
        loan.loanInvestors.forEach((li) => {
          if (
            li.hasMultipleInterest &&
            li.interestPeriods &&
            li.interestPeriods.length > 0
          ) {
            li.interestPeriods.forEach((period) => {
              const principal = parseFloat(li.amount);
              let interest = 0;

              if (period.interestType === 'rate') {
                const rate = parseFloat(period.interestRate) / 100;
                interest = principal * rate;
              } else {
                interest = parseFloat(period.interestRate);
              }

              events.push({
                type: 'interest_due',
                loan,
                loanInvestor: li,
                interestPeriod: period,
                date: new Date(period.dueDate),
                principal,
                interest,
                totalAmount: principal + interest,
              } as CalendarEventInterestDue);
            });
          }
        });
      } else {
        // Create traditional due date event for one-time due date loans
        const totalPrincipal = loan.loanInvestors.reduce(
          (sum, li) => sum + parseFloat(li.amount),
          0
        );
        const totalInterest = loan.loanInvestors.reduce((sum, li) => {
          const capital = parseFloat(li.amount);
          if (li.interestType === 'rate') {
            const rate = parseFloat(li.interestRate) / 100;
            return sum + capital * rate;
          } else {
            return sum + parseFloat(li.interestRate);
          }
        }, 0);

        events.push({
          type: 'due',
          loan,
          date: new Date(loan.dueDate),
          totalPrincipal,
          totalInterest,
          totalAmount: totalPrincipal + totalInterest,
        } as CalendarEventDue);
      }
    });

    return events;
  }, [loans]);

  return calendarEvents;
}
