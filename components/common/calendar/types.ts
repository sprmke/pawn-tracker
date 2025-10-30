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
  hasUnpaidTransactions: boolean;
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

export interface CalendarEventTransaction extends CalendarEventBase {
  type: 'transaction';
  transaction: any;
  amount: number;
  direction: 'In' | 'Out';
}

export type CalendarEvent =
  | CalendarEventSent
  | CalendarEventDue
  | CalendarEventInterestDue
  | CalendarEventTransaction;

export interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  events: CalendarEvent[];
}

export interface LegendItem {
  label: string;
  color: string;
}

export interface LegendGroup {
  title: string;
  items: LegendItem[];
}

export interface CalendarConfig {
  formatCurrency: (amount: number) => string;
  onEventClick: (event: CalendarEvent) => void;
  renderEventCard?: (
    event: CalendarEvent,
    eventIndex: number
  ) => React.ReactNode;
  alwaysShowSummary?: boolean;
  allEvents?: CalendarEvent[];
  legendGroups?: LegendGroup[];
}
