export type LoanType = 'Lot Title' | 'OR/CR' | 'Agent';
export type LoanStatus =
  | 'Partially Funded'
  | 'Fully Funded'
  | 'Overdue'
  | 'Completed';
export type TransactionType = 'Loan' | 'Investment';
export type TransactionDirection = 'In' | 'Out';
export type InterestType = 'rate' | 'fixed';
export type InterestPeriodStatus = 'Pending' | 'Completed' | 'Overdue';

export interface Investor {
  id: number;
  name: string;
  email: string;
  contactNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: number;
  loanName: string;
  type: LoanType;
  status: LoanStatus;
  dueDate: Date;
  freeLotSqm: number | null;
  notes: string | null;
  googleCalendarEventIds?: unknown; // JSON array of event IDs
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InterestPeriod {
  id: number;
  loanInvestorId: number;
  dueDate: Date;
  interestRate: string;
  interestType: InterestType;
  status: InterestPeriodStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanInvestor {
  id: number;
  loanId: number;
  investorId: number;
  amount: string;
  interestRate: string;
  interestType: InterestType;
  sentDate: Date;
  isPaid: boolean;
  hasMultipleInterest: boolean;
  createdAt: Date;
  updatedAt: Date;
  interestPeriods?: InterestPeriod[];
}

export interface Transaction {
  id: number;
  investorId: number;
  loanId: number | null;
  date: Date;
  type: TransactionType;
  direction: TransactionDirection;
  name: string;
  amount: string;
  balance: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanWithInvestors extends Loan {
  loanInvestors: (LoanInvestor & { investor: Investor })[];
  transactions?: Transaction[];
}

export interface InvestorWithLoans extends Investor {
  loanInvestors: (LoanInvestor & { loan: Loan })[];
  transactions: Transaction[];
}

export interface TransactionWithInvestor extends Transaction {
  investor: Investor;
}

export interface LoanPreview {
  investor: Investor;
  sentDate: Date;
  capital: number;
  interest: number;
  total: number;
}

export interface LoanSummary {
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
}
