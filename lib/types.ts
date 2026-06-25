export type LoanType = 'Lot Title' | 'OR/CR' | 'Agent';
export type LoanStatus =
  | 'Partially Funded'
  | 'Fully Funded'
  | 'Overdue'
  | 'Completed';
export type TransactionType = 'Investment';
export type TransactionDirection = 'In' | 'Out';
export type InterestType = 'rate' | 'fixed';
export type InterestPeriodStatus =
  | 'Pending'
  | 'Incomplete'
  | 'Completed'
  | 'Overdue';
export type DebtInterestInterval = 'Daily' | 'Weekly' | 'Monthly' | 'Annually';

export interface DebtAdditionalFee {
  label: string;
  amount: string;
}

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

export interface ReceivedPayment {
  id: number;
  loanInvestorId: number;
  interestPeriodId?: number | null;
  amount: string;
  receivedDate: Date;
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
  receivedPayments?: ReceivedPayment[];
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
  debts?: DebtWithPeriods[];
}

export type DebtWithPeriods = Debt & {
  interestPeriods?: DebtInterestPeriodWithPayments[];
};

export interface TransactionWithInvestor extends Transaction {
  investor: Investor;
}

export interface Debt {
  id: number;
  investorId: number;
  name: string;
  amount: string;
  date: Date;
  interestRate: string;
  interestInterval: DebtInterestInterval;
  durationMonths: number;
  additionalFees: DebtAdditionalFee[] | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtWithInvestor extends Debt {
  investor: Investor;
}

export interface DebtReceivedPayment {
  id: number;
  debtInterestPeriodId: number;
  amount: string;
  receivedDate: Date | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtInterestPeriod {
  id: number;
  debtId: number;
  periodNumber: number;
  dueDate: Date | string;
  expectedInterest: string;
  status: InterestPeriodStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtInterestPeriodWithPayments extends DebtInterestPeriod {
  receivedPayments: DebtReceivedPayment[];
}

export interface DebtWithInvestorAndPeriods extends DebtWithInvestor {
  interestPeriods?: DebtInterestPeriodWithPayments[];
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
