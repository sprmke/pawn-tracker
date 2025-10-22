export type ViewMode = 'day' | 'week' | 'month';

export interface CalendarEventBase {
  date: Date;
}

export interface CalendarEventSent extends CalendarEventBase {
  type: 'sent';
  loan: any;
  investors: Array<{
    name: string;
    amount: number;
  }>;
  totalAmount: number;
}

export interface CalendarEventDue extends CalendarEventBase {
  type: 'due';
  loan: any;
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
}

export interface CalendarEventInterestDue extends CalendarEventBase {
  type: 'interest_due';
  loan: any;
  loanInvestor: any;
  interestPeriod: any;
  principal: number;
  interest: number;
  totalAmount: number;
}

export type CalendarEvent =
  | CalendarEventSent
  | CalendarEventDue
  | CalendarEventInterestDue;

export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

export interface CalendarConfig {
  formatCurrency: (amount: number) => string;
  onEventClick: (event: CalendarEvent) => void;
  renderEventCard?: (
    event: CalendarEvent,
    eventIndex: number
  ) => React.ReactNode;
}
