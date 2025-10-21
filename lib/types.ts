export type LoanType = 'Lot Title' | 'OR/CR' | 'Agent';
export type LoanStatus =
  | 'Partially Funded'
  | 'Fully Funded'
  | 'Overdue'
  | 'Completed';
export type TransactionType =
  | 'Pawn'
  | 'Salary'
  | 'Credit Card'
  | 'Debt'
  | 'Others';
export type TransactionDirection = 'In' | 'Out';

export interface Investor {
  id: number;
  name: string;
  email: string;
  contactNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loan {
  id: number;
  loanName: string;
  type: LoanType;
  status: LoanStatus;
  dueDate: Date;
  freeLotSqm?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanInvestor {
  id: number;
  loanId: number;
  investorId: number;
  amount: string;
  interestRate: string;
  sentDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: number;
  investorId: number;
  date: Date;
  type: TransactionType;
  direction: TransactionDirection;
  name: string;
  amount: string;
  balance: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanWithInvestors extends Loan {
  loanInvestors: (LoanInvestor & { investor: Investor })[];
}

export interface InvestorWithLoans extends Investor {
  loanInvestors: (LoanInvestor & { loan: Loan })[];
  transactions: Transaction[];
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
