/**
 * Business logic calculations for loans and investments
 */

import {
  LoanWithInvestors,
  InvestorWithLoans,
  LoanInvestor,
  Investor,
  Loan,
} from './types';

/**
 * Calculate total principal amount for a loan
 */
export function calculateTotalPrincipal(
  loanInvestors: Array<{ amount: string }>
): number {
  return loanInvestors.reduce((sum, li) => sum + parseFloat(li.amount), 0);
}

/**
 * Calculate total interest for a loan
 */
export function calculateTotalInterest(
  loanInvestors: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
    }>;
    investor?: { id: number };
    investorId?: number;
  }>
): number {
  // Group by investor to handle multiple interest correctly
  const investorGroups = new Map<number, typeof loanInvestors>();

  loanInvestors.forEach((li) => {
    const investorId = li.investor?.id || li.investorId;
    if (investorId) {
      const existing = investorGroups.get(investorId) || [];
      existing.push(li);
      investorGroups.set(investorId, existing);
    }
  });

  let totalInterest = 0;

  investorGroups.forEach((transactions) => {
    // Find if any transaction has multiple interest periods
    const transactionWithPeriods = transactions.find(
      (t) =>
        t.hasMultipleInterest &&
        t.interestPeriods &&
        t.interestPeriods.length > 0
    );

    if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
      // Calculate total capital for this investor
      const investorTotalCapital = transactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0
      );

      // Apply interest periods to total investor capital
      const investorInterest = transactionWithPeriods.interestPeriods.reduce(
        (periodSum, period) => {
          const rateValue = parseFloat(period.interestRate);
          const interest =
            period.interestType === 'fixed'
              ? rateValue
              : investorTotalCapital * (rateValue / 100);
          return periodSum + interest;
        },
        0
      );

      totalInterest += investorInterest;
    } else {
      // No multiple interest - sum up individual transaction interests
      transactions.forEach((li) => {
        const capital = parseFloat(li.amount);
        const rateValue = parseFloat(li.interestRate);
        const interest =
          li.interestType === 'fixed' ? rateValue : capital * (rateValue / 100);
        totalInterest += interest;
      });
    }
  });

  return totalInterest;
}

/**
 * Calculate total amount (principal + interest) for a loan
 */
export function calculateTotalAmount(
  loanInvestors: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
    }>;
  }>
): number {
  const principal = calculateTotalPrincipal(loanInvestors);
  const interest = calculateTotalInterest(loanInvestors);
  return principal + interest;
}

/**
 * Calculate weighted average interest rate for a loan
 */
export function calculateAverageRate(
  loanInvestors: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
    }>;
    investor?: { id: number };
    investorId?: number;
  }>
): number {
  const totalPrincipal = calculateTotalPrincipal(loanInvestors);
  if (totalPrincipal === 0) return 0;

  const totalInterest = calculateTotalInterest(loanInvestors);
  return (totalInterest / totalPrincipal) * 100;
}

/**
 * Calculate interest for a single investment
 */
export function calculateInterest(
  amount: string | number,
  interestRate: string | number,
  interestType?: string
): number {
  const capital = typeof amount === 'string' ? parseFloat(amount) : amount;
  const rateValue =
    typeof interestRate === 'string' ? parseFloat(interestRate) : interestRate;

  // If interestType is 'fixed', interestRate contains the fixed amount
  // If interestType is 'rate' or undefined (backward compatibility), it's a percentage
  return interestType === 'fixed' ? rateValue : capital * (rateValue / 100);
}

/**
 * Calculate the amount due on the loan's final due date
 * For multiple interest periods: capital + final period interest only
 * For single interest: capital + total interest
 */
export function calculateAmountDueOnDate(
  loanInvestors: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
      dueDate?: Date | string;
    }>;
    investor?: { id: number };
    investorId?: number;
  }>
): number {
  // Group by investor to handle multiple interest correctly
  const investorGroups = new Map<number, typeof loanInvestors>();

  loanInvestors.forEach((li) => {
    const investorId = li.investor?.id || li.investorId;
    if (investorId) {
      const existing = investorGroups.get(investorId) || [];
      existing.push(li);
      investorGroups.set(investorId, existing);
    }
  });

  let totalAmount = 0;

  investorGroups.forEach((transactions) => {
    // Calculate total capital for this investor
    const investorTotalCapital = transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0
    );

    // Find if any transaction has multiple interest periods
    const transactionWithPeriods = transactions.find(
      (t) =>
        t.hasMultipleInterest &&
        t.interestPeriods &&
        t.interestPeriods.length > 0
    );

    if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
      // Multiple interest periods - only calculate final period interest
      const periods = transactionWithPeriods.interestPeriods;
      const finalPeriod = periods[periods.length - 1];

      const finalPeriodInterest = calculateInterest(
        investorTotalCapital,
        parseFloat(finalPeriod.interestRate),
        finalPeriod.interestType
      );

      // Capital + final period interest only
      totalAmount += investorTotalCapital + finalPeriodInterest;
    } else {
      // No multiple interest - calculate capital + total interest
      const interest = transactions.reduce((sum, li) => {
        const capital = parseFloat(li.amount);
        return sum + calculateInterest(capital, li.interestRate, li.interestType);
      }, 0);

      totalAmount += investorTotalCapital + interest;
    }
  });

  return totalAmount;
}

/**
 * Calculate total for a single investment (amount + interest)
 */
export function calculateInvestmentTotal(
  amount: string | number,
  interestRate: string | number,
  interestType?: string
): number {
  const capital = typeof amount === 'string' ? parseFloat(amount) : amount;
  const interest = calculateInterest(amount, interestRate, interestType);
  return capital + interest;
}

/**
 * Count unique investors in a loan
 */
export function countUniqueInvestors(
  loanInvestors: Array<{ investor: { id: number } }>
): number {
  return new Set(loanInvestors.map((li) => li.investor.id)).size;
}

/**
 * Group loan investors by investor ID
 */
export function groupByInvestor<
  T extends { investor: Investor; amount: string; interestRate: string }
>(loanInvestors: T[]): Map<number, T[]> {
  const investorMap = new Map<number, T[]>();

  loanInvestors.forEach((li) => {
    const existing = investorMap.get(li.investor.id) || [];
    existing.push(li);
    investorMap.set(li.investor.id, existing);
  });

  return investorMap;
}

/**
 * Calculate aggregated stats for grouped investor transactions
 */
export function calculateTransactionStats(
  transactions: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
    }>;
  }>
): {
  totalPrincipal: number;
  totalInterest: number;
  averageRate: number;
  total: number;
} {
  const totalPrincipal = calculateTotalPrincipal(transactions);
  const totalInterest = calculateTotalInterest(transactions);
  const averageRate =
    totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0;
  const total = totalPrincipal + totalInterest;

  return {
    totalPrincipal,
    totalInterest,
    averageRate,
    total,
  };
}

/**
 * Calculate stats for grouped loan investor transactions (for a single investor within a loan)
 */
export function calculateGroupedLoanInvestorStats(
  transactions: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
    }>;
  }>
): {
  totalPrincipal: number;
  totalInterest: number;
  averageRate: number;
  total: number;
} {
  return calculateTransactionStats(transactions);
}

/**
 * Calculate loan duration from today to due date
 */
export function calculateLoanDuration(dueDate: Date | string): string {
  const today = new Date();
  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const diffTime = Math.abs(due.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const remainingAfterMonths = diffDays % 30;
  const weeks = Math.floor(remainingAfterMonths / 7);
  const days = remainingAfterMonths % 7;

  const parts = [];
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? 'Month' : 'Months'}`);
  }
  if (weeks > 0) {
    parts.push(`${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`);
  }
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'Day' : 'Days'}`);
  }

  return parts.length > 0 ? parts.join(', ') : '0 Days';
}

/**
 * Get balance status based on amount
 */
export function getBalanceStatus(balance: number): {
  status: string;
  variant: 'default' | 'secondary' | 'destructive';
} {
  if (balance > 100000) {
    return { status: 'Can invest', variant: 'default' };
  }
  if (balance > 50000) {
    return { status: 'Low funds', variant: 'secondary' };
  }
  return { status: 'No funds', variant: 'destructive' };
}

/**
 * Calculate the pending balance for a loan
 * Balance = Total Principal - Funded Capital (where isPaid is true)
 */
export function calculateLoanBalance(
  loanInvestors: Array<{ amount: string; isPaid: boolean }>
): number {
  const totalPrincipal = calculateTotalPrincipal(loanInvestors);

  const fundedCapital = loanInvestors.reduce((sum, li) => {
    return li.isPaid ? sum + parseFloat(li.amount) : sum;
  }, 0);

  return totalPrincipal - fundedCapital;
}

/**
 * Check if a loan has any unpaid transactions
 */
export function hasUnpaidTransactions(
  loanInvestors: Array<{ isPaid: boolean }>
): boolean {
  return loanInvestors.some((li) => !li.isPaid);
}

/**
 * Calculate comprehensive stats for a loan
 */
export function calculateLoanStats(loan: LoanWithInvestors): {
  totalPrincipal: number;
  totalInterest: number;
  avgRate: number;
  totalAmount: number;
  uniqueInvestors: number;
} {
  const totalPrincipal = calculateTotalPrincipal(loan.loanInvestors);
  const totalInterest = calculateTotalInterest(loan.loanInvestors);
  const avgRate = calculateAverageRate(loan.loanInvestors);
  const totalAmount = totalPrincipal + totalInterest;
  const uniqueInvestors = countUniqueInvestors(loan.loanInvestors);

  return {
    totalPrincipal,
    totalInterest,
    avgRate,
    totalAmount,
    uniqueInvestors,
  };
}

/**
 * Calculate comprehensive stats for an investor
 */
export function calculateInvestorStats(investor: InvestorWithLoans): {
  totalCapital: number;
  totalInterest: number;
  activeLoans: number;
  currentBalance: number;
  totalLoans: number;
  completedLoans: number;
  overdueLoans: number;
  totalGain: number;
} {
  const totalCapital = calculateTotalPrincipal(investor.loanInvestors);
  const totalInterest = calculateTotalInterest(investor.loanInvestors);

  const activeLoans = investor.loanInvestors.filter(
    (li) =>
      li.loan.status === 'Fully Funded' || li.loan.status === 'Partially Funded'
  ).length;

  const completedLoans = investor.loanInvestors.filter(
    (li) => li.loan.status === 'Completed'
  ).length;

  const overdueLoans = investor.loanInvestors.filter(
    (li) => li.loan.status === 'Overdue'
  ).length;

  // Get latest balance from transactions
  const latestTransaction =
    investor.transactions.length > 0
      ? investor.transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0]
      : null;

  const currentBalance = latestTransaction
    ? parseFloat(latestTransaction.balance)
    : 0;

  const totalGain = totalCapital + totalInterest;

  return {
    totalCapital,
    totalInterest,
    activeLoans,
    currentBalance,
    totalLoans: investor.loanInvestors.length,
    completedLoans,
    overdueLoans,
    totalGain,
  };
}
