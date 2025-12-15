import { google } from 'googleapis';
import { LoanWithInvestors } from '@/lib/types';
import { toLocalDateString } from '@/lib/date-utils';

// Initialize Google Calendar API
function getCalendarClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
      /\\n/g,
      '\n'
    ),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

interface CalendarEventData {
  type: 'sent' | 'due' | 'interest_due' | 'summary';
  date: Date;
  loan?: LoanWithInvestors;
  loans?: LoanWithInvestors[];
  loanAmounts?: Map<number, { amount: number; isOut: boolean }>; // loan ID -> amount for this specific day
  investors?: Array<{ name: string; amount: number }>;
  totalAmount?: number;
  totalPrincipal?: number;
  totalInterest?: number;
  investorName?: string;
  principal?: number;
  interest?: number;
  loanInvestorId?: number;
  interestPeriodId?: number;
  direction?: 'in' | 'out';
  loanCount?: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function createEventDescription(eventData: CalendarEventData): string {
  const {
    type,
    loan,
    loans,
    loanAmounts,
    investors,
    totalAmount,
    totalPrincipal,
    totalInterest,
    investorName,
    principal,
    interest,
    direction,
    loanCount,
  } = eventData;

  // Get the app URL from environment or use default
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://pawn-tracker.vercel.app';

  let description = '';

  if (type === 'summary') {
    if (loans && loans.length > 0 && loanAmounts) {
      description += `Loans:\n`;
      loans.forEach((l) => {
        const loanData = loanAmounts.get(l.id);
        if (loanData) {
          const sign = loanData.isOut ? '-' : '+';
          description += `  • ${l.loanName}: ${sign}${formatCurrency(
            Math.abs(loanData.amount)
          )}\n`;
        }
      });
      description += `\n`;
    }

    // Use HTML-style bold for better compatibility with + or - sign
    const sign = (totalAmount || 0) >= 0 ? '+' : '-';
    description += `<b>Total: ${sign}${formatCurrency(
      Math.abs(totalAmount || 0)
    )}</b>\n`;
    description += `\n<a href="${appUrl}/loans">View All Loans</a>`;
  } else if (loan) {
    const loanUrl = `${appUrl}/loans/${loan.id}`;

    description = `Loan: ${loan.loanName}\n`;
    description += `Type: ${loan.type}\n`;
    description += `Status: ${loan.status}\n\n`;

    if (type === 'sent') {
      description += `Investors:\n`;
      investors?.forEach((inv) => {
        description += `  • ${inv.name}: -${formatCurrency(inv.amount)}\n`;
      });
      description += `\n<b>Total: -${formatCurrency(totalAmount || 0)}</b>\n`;
    } else if (type === 'due') {
      description += `Investor: ${investorName}\n`;
      description += `Principal: +${formatCurrency(totalPrincipal || 0)}\n`;
      description += `Interest: +${formatCurrency(totalInterest || 0)}\n`;
      description += `\n<b>Total: +${formatCurrency(totalAmount || 0)}</b>\n`;
    } else if (type === 'interest_due') {
      description += `Investor: ${investorName}\n`;
      description += `\n<b>Total: +${formatCurrency(interest || 0)}</b>\n`;
    }

    if (loan.notes) {
      description += `\nNotes: ${loan.notes}`;
    }

    description += `\n\n<a href="${loanUrl}">View Loan Details</a>`;
  }

  return description;
}

function createEventSummary(eventData: CalendarEventData): string {
  const { type, loan, totalAmount, investorName } = eventData;

  if (type === 'summary') {
    const sign = (totalAmount || 0) >= 0 ? '+' : '-';
    return `Daily Summary ${sign}${formatCurrency(Math.abs(totalAmount || 0))}`;
  } else if (loan) {
    if (type === 'sent') {
      return `${loan.type}: ${loan.loanName} - Disbursement (-${formatCurrency(
        totalAmount || 0
      )})`;
    } else if (type === 'due') {
      return `${loan.type}: ${
        loan.loanName
      } - Due Date (${investorName} +${formatCurrency(totalAmount || 0)})`;
    } else if (type === 'interest_due') {
      return `${loan.type}: ${
        loan.loanName
      } - Interest Due (${investorName} +${formatCurrency(
        eventData.interest || 0
      )})`;
    }
    return loan.loanName;
  }

  return 'Event';
}

function getEventColor(
  type: 'sent' | 'due' | 'interest_due' | 'summary'
): string {
  // Google Calendar color IDs
  // 11 = Red (for sent/disbursement)
  // 2 = Sage/Light Green (for due date)
  // 7 = Peacock/Light Blue (for interest due)
  // 8 = Graphite (for daily summary)
  switch (type) {
    case 'sent':
      return '11'; // Red
    case 'due':
      return '2'; // Sage (light green)
    case 'interest_due':
      return '7'; // Peacock (light blue)
    case 'summary':
      return '8'; // Graphite
    default:
      return '1'; // Default
  }
}

export async function createCalendarEvent(
  eventData: CalendarEventData
): Promise<string | null> {
  try {
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      console.warn(
        'Google Calendar credentials not configured. Skipping calendar event creation.'
      );
      return null;
    }

    const calendar = getCalendarClient();
    const { date, loan } = eventData;

    // Create event date (all-day event)
    const eventDate = toLocalDateString(date);

    // Note: Service accounts cannot add attendees without Domain-Wide Delegation
    // Investors are listed in the event description instead
    const event = {
      summary: createEventSummary(eventData),
      description: createEventDescription(eventData),
      start: {
        date: eventDate,
        timeZone: 'Asia/Manila',
      },
      end: {
        date: eventDate,
        timeZone: 'Asia/Manila',
      },
      colorId: getEventColor(eventData.type),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      sendUpdates: 'none', // Don't send email notifications (requires Domain-Wide Delegation)
    });

    console.log('Calendar event created:', response.data.id);
    return response.data.id || null;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  eventData: CalendarEventData
): Promise<boolean> {
  try {
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      console.warn(
        'Google Calendar credentials not configured. Skipping calendar event update.'
      );
      return false;
    }

    const calendar = getCalendarClient();
    const { date, loan } = eventData;

    // Create event date (all-day event)
    const eventDate = toLocalDateString(date);

    // Note: Service accounts cannot add attendees without Domain-Wide Delegation
    // Investors are listed in the event description instead
    const event = {
      summary: createEventSummary(eventData),
      description: createEventDescription(eventData),
      start: {
        date: eventDate,
        timeZone: 'Asia/Manila',
      },
      end: {
        date: eventDate,
        timeZone: 'Asia/Manila',
      },
      colorId: getEventColor(eventData.type),
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId,
      requestBody: event,
      sendUpdates: 'none', // Don't send email notifications (requires Domain-Wide Delegation)
    });

    console.log('Calendar event updated:', eventId);
    return true;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    if (
      !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    ) {
      console.warn(
        'Google Calendar credentials not configured. Skipping calendar event deletion.'
      );
      return false;
    }

    const calendar = getCalendarClient();

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
      sendUpdates: 'none', // Don't send cancellation notifications (requires Domain-Wide Delegation)
    });

    console.log('Calendar event deleted:', eventId);
    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

export async function deleteMultipleCalendarEvents(
  eventIds: string[]
): Promise<void> {
  if (!eventIds || eventIds.length === 0) return;

  for (const eventId of eventIds) {
    await deleteCalendarEvent(eventId);
  }
}

// Generate calendar events for a loan
export async function generateLoanCalendarEvents(
  loan: LoanWithInvestors
): Promise<string[]> {
  const eventIds: string[] = [];

  try {
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
    for (const [dateKey, transactions] of sentDateMap.entries()) {
      const investors = transactions.map((t) => ({
        name: t.investor.name,
        amount: parseFloat(t.amount),
      }));
      const totalAmount = investors.reduce((sum, inv) => sum + inv.amount, 0);

      const eventId = await createCalendarEvent({
        type: 'sent',
        date: new Date(dateKey + 'T00:00:00'),
        loan,
        investors,
        totalAmount,
      });

      if (eventId) {
        eventIds.push(eventId);
      }
    }

    // Check if loan has multiple interest dates
    const hasAnyMultipleInterest = loan.loanInvestors.some(
      (li) =>
        li.hasMultipleInterest &&
        li.interestPeriods &&
        li.interestPeriods.length > 0
    );

    if (hasAnyMultipleInterest) {
      // Create interest due events for each investor with multiple interest periods
      for (const li of loan.loanInvestors) {
        if (
          li.hasMultipleInterest &&
          li.interestPeriods &&
          li.interestPeriods.length > 0
        ) {
          // Sort periods by due date to find the last one
          const sortedPeriods = [...li.interestPeriods].sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          );

          for (let i = 0; i < sortedPeriods.length; i++) {
            const period = sortedPeriods[i];
            const isLastPeriod = i === sortedPeriods.length - 1;
            const principal = parseFloat(li.amount);
            let interest = 0;

            if (period.interestType === 'rate') {
              const rate = parseFloat(period.interestRate) / 100;
              interest = principal * rate;
            } else {
              interest = parseFloat(period.interestRate);
            }

            let eventId;
            if (isLastPeriod) {
              // Last period: create a "due" event with principal + interest
              eventId = await createCalendarEvent({
                type: 'due',
                date: new Date(period.dueDate),
                loan,
                investorName: li.investor.name,
                totalPrincipal: principal,
                totalInterest: interest,
                totalAmount: principal + interest,
                loanInvestorId: li.id,
                interestPeriodId: period.id,
              });
            } else {
              // Other periods: create "interest_due" event with interest only
              eventId = await createCalendarEvent({
                type: 'interest_due',
                date: new Date(period.dueDate),
                loan,
                investorName: li.investor.name,
                interest,
                loanInvestorId: li.id,
                interestPeriodId: period.id,
              });
            }

            if (eventId) {
              eventIds.push(eventId);
            }
          }
        }
      }
    } else {
      // Create traditional due date event for one-time due date loans
      // Create separate due date events for each investor
      for (const li of loan.loanInvestors) {
        const principal = parseFloat(li.amount);
        let interest = 0;

        if (li.interestType === 'rate') {
          const rate = parseFloat(li.interestRate) / 100;
          interest = principal * rate;
        } else {
          interest = parseFloat(li.interestRate);
        }

        const eventId = await createCalendarEvent({
          type: 'due',
          date: new Date(loan.dueDate),
          loan,
          investorName: li.investor.name,
          totalPrincipal: principal,
          totalInterest: interest,
          totalAmount: principal + interest,
        });

        if (eventId) {
          eventIds.push(eventId);
        }
      }
    }
  } catch (error) {
    console.error('Error generating loan calendar events:', error);
  }

  return eventIds;
}

// Generate calendar events for multiple loans with daily summaries
export async function generateAllLoansCalendarEvents(
  loans: LoanWithInvestors[]
): Promise<Map<number, string[]>> {
  const loanEventIds = new Map<number, string[]>();

  try {
    // First, generate individual loan events
    for (const loan of loans) {
      const eventIds = await generateLoanCalendarEvents(loan);
      loanEventIds.set(loan.id, eventIds);
    }

    // Now generate daily summaries
    // Group all events by date and track amounts per loan per day
    const dailyEvents = new Map<
      string,
      {
        out: { loans: LoanWithInvestors[]; amount: number };
        in: { loans: LoanWithInvestors[]; amount: number };
        loanAmounts: Map<number, { amount: number; isOut: boolean }>;
      }
    >();

    for (const loan of loans) {
      // Process sent dates (OUT)
      const sentDateMap = new Map<string, number>();
      loan.loanInvestors.forEach((li) => {
        const dateKey = toLocalDateString(li.sentDate);
        const amount = parseFloat(li.amount);
        sentDateMap.set(dateKey, (sentDateMap.get(dateKey) || 0) + amount);
      });

      for (const [dateKey, amount] of sentDateMap.entries()) {
        if (!dailyEvents.has(dateKey)) {
          dailyEvents.set(dateKey, {
            out: { loans: [], amount: 0 },
            in: { loans: [], amount: 0 },
            loanAmounts: new Map(),
          });
        }
        const dayData = dailyEvents.get(dateKey)!;
        if (!dayData.out.loans.find((l) => l.id === loan.id)) {
          dayData.out.loans.push(loan);
        }
        dayData.out.amount += amount;

        // Track this loan's OUT amount for this day
        const existing = dayData.loanAmounts.get(loan.id);
        if (existing) {
          existing.amount -= amount; // Subtract OUT amount
        } else {
          dayData.loanAmounts.set(loan.id, { amount: -amount, isOut: true });
        }
      }

      // Process due dates (IN)
      const hasAnyMultipleInterest = loan.loanInvestors.some(
        (li) =>
          li.hasMultipleInterest &&
          li.interestPeriods &&
          li.interestPeriods.length > 0
      );

      if (hasAnyMultipleInterest) {
        // Process interest periods
        for (const li of loan.loanInvestors) {
          if (
            li.hasMultipleInterest &&
            li.interestPeriods &&
            li.interestPeriods.length > 0
          ) {
            // Sort periods by due date to find the last one
            const sortedPeriods = [...li.interestPeriods].sort(
              (a, b) =>
                new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
            );

            for (let i = 0; i < sortedPeriods.length; i++) {
              const period = sortedPeriods[i];
              const isLastPeriod = i === sortedPeriods.length - 1;
              const dateKey = toLocalDateString(period.dueDate);
              const principal = parseFloat(li.amount);
              let interest = 0;
              if (period.interestType === 'rate') {
                const rate = parseFloat(period.interestRate) / 100;
                interest = principal * rate;
              } else {
                interest = parseFloat(period.interestRate);
              }

              // Last period: principal + interest, Other periods: interest only
              const totalAmount = isLastPeriod
                ? principal + interest
                : interest;

              if (!dailyEvents.has(dateKey)) {
                dailyEvents.set(dateKey, {
                  out: { loans: [], amount: 0 },
                  in: { loans: [], amount: 0 },
                  loanAmounts: new Map(),
                });
              }
              const dayData = dailyEvents.get(dateKey)!;
              if (!dayData.in.loans.find((l) => l.id === loan.id)) {
                dayData.in.loans.push(loan);
              }
              dayData.in.amount += totalAmount;

              // Track this loan's IN amount for this day
              const existing = dayData.loanAmounts.get(loan.id);
              if (existing) {
                existing.amount += totalAmount; // Add IN amount
                existing.isOut = existing.amount < 0;
              } else {
                dayData.loanAmounts.set(loan.id, {
                  amount: totalAmount,
                  isOut: false,
                });
              }
            }
          }
        }
      } else {
        // Process single due date
        const dateKey = toLocalDateString(loan.dueDate);
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
        const totalAmount = totalPrincipal + totalInterest;

        if (!dailyEvents.has(dateKey)) {
          dailyEvents.set(dateKey, {
            out: { loans: [], amount: 0 },
            in: { loans: [], amount: 0 },
            loanAmounts: new Map(),
          });
        }
        const dayData = dailyEvents.get(dateKey)!;
        if (!dayData.in.loans.find((l) => l.id === loan.id)) {
          dayData.in.loans.push(loan);
        }
        dayData.in.amount += totalAmount;

        // Track this loan's IN amount for this day
        const existing = dayData.loanAmounts.get(loan.id);
        if (existing) {
          existing.amount += totalAmount; // Add IN amount
          existing.isOut = existing.amount < 0;
        } else {
          dayData.loanAmounts.set(loan.id, {
            amount: totalAmount,
            isOut: false,
          });
        }
      }
    }

    // Create summary events for ALL days (even single events for consistency)
    for (const [dateKey, dayData] of dailyEvents.entries()) {
      const date = new Date(dateKey + 'T00:00:00');

      // Combine IN and OUT into one summary
      const allLoans = [...dayData.out.loans, ...dayData.in.loans];
      // Remove duplicates
      const uniqueLoans = Array.from(
        new Map(allLoans.map((l) => [l.id, l])).values()
      );

      // Calculate net total (IN - OUT, or just total if only one direction)
      let totalAmount = 0;
      if (dayData.in.amount > 0 && dayData.out.amount > 0) {
        // Both IN and OUT on same day - show net
        totalAmount = dayData.in.amount - dayData.out.amount;
      } else if (dayData.in.amount > 0) {
        // Only IN
        totalAmount = dayData.in.amount;
      } else {
        // Only OUT
        totalAmount = dayData.out.amount;
      }

      // Always create summary (even for single event)
      if (uniqueLoans.length > 0) {
        const eventId = await createCalendarEvent({
          type: 'summary',
          date,
          loans: uniqueLoans,
          loanAmounts: dayData.loanAmounts,
          totalAmount,
          loanCount: uniqueLoans.length,
        });

        if (eventId) {
          // Add this summary event ID to all affected loans
          for (const loan of uniqueLoans) {
            const existingIds = loanEventIds.get(loan.id) || [];
            // Push to the end so summary appears last
            existingIds.push(eventId);
            loanEventIds.set(loan.id, existingIds);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating all loans calendar events:', error);
  }

  return loanEventIds;
}
