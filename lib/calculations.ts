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
  loanInvestors: Array<{ amount: string }>,
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
  }>,
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
        t.interestPeriods.length > 0,
    );

    if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
      // Calculate total capital for this investor
      const investorTotalCapital = transactions.reduce(
        (sum, t) => sum + parseFloat(t.amount),
        0,
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
        0,
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
  }>,
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
  }>,
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
  interestType?: string,
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
  }>,
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
      0,
    );

    // Find if any transaction has multiple interest periods
    const transactionWithPeriods = transactions.find(
      (t) =>
        t.hasMultipleInterest &&
        t.interestPeriods &&
        t.interestPeriods.length > 0,
    );

    if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
      // Multiple interest periods - only calculate final period interest
      const periods = transactionWithPeriods.interestPeriods;
      const finalPeriod = periods[periods.length - 1];

      const finalPeriodInterest = calculateInterest(
        investorTotalCapital,
        parseFloat(finalPeriod.interestRate),
        finalPeriod.interestType,
      );

      // Capital + final period interest only
      totalAmount += investorTotalCapital + finalPeriodInterest;
    } else {
      // No multiple interest - calculate capital + total interest
      const interest = transactions.reduce((sum, li) => {
        const capital = parseFloat(li.amount);
        return (
          sum + calculateInterest(capital, li.interestRate, li.interestType)
        );
      }, 0);

      totalAmount += investorTotalCapital + interest;
    }
  });

  return totalAmount;
}

/**
 * Calculate the amount due for overdue loans (unpaid overdue items only).
 * - Multiple interest periods: sum of interest for periods with status 'Overdue' only;
 *   capital is included only if the final period is overdue. Future pending balances are not included.
 * - Single interest: capital + total interest (one due date; when overdue, full amount is overdue).
 */
export function calculateOverdueAmount(
  loanInvestors: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
      dueDate?: Date | string;
      status?: string;
    }>;
    investor?: { id: number };
    investorId?: number;
  }>,
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
      0,
    );

    // Find if any transaction has multiple interest periods
    const transactionWithPeriods = transactions.find(
      (t) =>
        t.hasMultipleInterest &&
        t.interestPeriods &&
        t.interestPeriods.length > 0,
    );

    if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
      // Multiple interest periods - calculate based on overdue periods
      const periods = [...transactionWithPeriods.interestPeriods].sort(
        (a, b) =>
          new Date(a.dueDate || 0).getTime() -
          new Date(b.dueDate || 0).getTime(),
      );
      const overduePeriods = periods.filter((p) => p.status === 'Overdue');

      if (overduePeriods.length > 0) {
        // Check if the final period (by due date) is overdue
        const finalPeriod = periods[periods.length - 1];
        const isFinalPeriodOverdue = finalPeriod.status === 'Overdue';

        // Sum up interest for all overdue periods
        const overdueInterest = overduePeriods.reduce((sum, period) => {
          return (
            sum +
            calculateInterest(
              investorTotalCapital,
              parseFloat(period.interestRate),
              period.interestType,
            )
          );
        }, 0);

        // If final period is overdue, add capital; otherwise just the interest
        totalAmount += isFinalPeriodOverdue
          ? investorTotalCapital + overdueInterest
          : overdueInterest;
      } else {
        // No overdue periods: only include amounts for periods with status 'Overdue'.
        // Do not include future pending balances or full principal + interest.
      }
    } else {
      // No multiple interest - calculate capital + total interest
      const interest = transactions.reduce((sum, li) => {
        const capital = parseFloat(li.amount);
        return (
          sum + calculateInterest(capital, li.interestRate, li.interestType)
        );
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
  interestType?: string,
): number {
  const capital = typeof amount === 'string' ? parseFloat(amount) : amount;
  const interest = calculateInterest(amount, interestRate, interestType);
  return capital + interest;
}

/**
 * Count unique investors in a loan
 */
export function countUniqueInvestors(
  loanInvestors: Array<{ investor: { id: number } }>,
): number {
  return new Set(loanInvestors.map((li) => li.investor.id)).size;
}

/**
 * Group loan investors by investor ID
 */
export function groupByInvestor<
  T extends { investor: Investor; amount: string; interestRate: string },
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
  }>,
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
  }>,
): {
  totalPrincipal: number;
  totalInterest: number;
  averageRate: number;
  total: number;
} {
  return calculateTransactionStats(transactions);
}

/**
 * Calculate loan duration from start date to due date
 */
export function calculateLoanDuration(
  dueDate: Date | string,
  startDate?: Date | string,
): string {
  // If no start date provided, use today's date (for backward compatibility)
  const start = startDate
    ? typeof startDate === 'string'
      ? new Date(startDate)
      : new Date(startDate)
    : new Date();
  start.setHours(0, 0, 0, 0); // Normalize to midnight

  const due =
    typeof dueDate === 'string' ? new Date(dueDate) : new Date(dueDate);
  due.setHours(0, 0, 0, 0); // Normalize to midnight

  // Calculate the difference in months using calendar months
  let months = 0;
  let tempDate = new Date(start);

  // Count full months
  while (tempDate < due) {
    const nextMonth = new Date(tempDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (nextMonth <= due) {
      months++;
      tempDate = nextMonth;
    } else {
      break;
    }
  }

  // Calculate remaining days after full months
  const remainingTime = due.getTime() - tempDate.getTime();
  const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));

  const weeks = Math.floor(remainingDays / 7);
  const days = remainingDays % 7;

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
  loanInvestors: Array<{ amount: string; isPaid: boolean }>,
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
  loanInvestors: Array<{ isPaid: boolean }>,
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
 * Calculate paid and pending amounts for loans with multiple interest periods
 * Returns amounts based on period status (Completed vs Pending/Overdue)
 */
export function calculateMultipleInterestPaymentStatus(
  loanInvestors: Array<{
    amount: string;
    interestRate: string;
    interestType?: string;
    hasMultipleInterest?: boolean;
    interestPeriods?: Array<{
      interestRate: string;
      interestType?: string;
      dueDate?: Date | string;
      status?: string;
    }>;
    investor?: { id: number };
    investorId?: number;
  }>,
): {
  hasMultipleDueDates: boolean;
  totalPeriods: number;
  completedPeriods: number;
  pendingPeriods: number;
  paidAmount: number;
  pendingAmount: number;
} {
  // Check if loan has multiple interest periods
  const hasMultipleDueDates = loanInvestors.some(
    (li) =>
      li.hasMultipleInterest &&
      li.interestPeriods &&
      li.interestPeriods.length > 1,
  );

  if (!hasMultipleDueDates) {
    return {
      hasMultipleDueDates: false,
      totalPeriods: 0,
      completedPeriods: 0,
      pendingPeriods: 0,
      paidAmount: 0,
      pendingAmount: 0,
    };
  }

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

  let paidAmount = 0;
  let pendingAmount = 0;
  let totalPeriods = 0;
  let completedPeriods = 0;
  let pendingPeriods = 0;

  investorGroups.forEach((transactions) => {
    // Calculate total capital for this investor
    const investorTotalCapital = transactions.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0,
    );

    // Find the transaction with multiple interest periods
    const transactionWithPeriods = transactions.find(
      (t) =>
        t.hasMultipleInterest &&
        t.interestPeriods &&
        t.interestPeriods.length > 0,
    );

    if (transactionWithPeriods && transactionWithPeriods.interestPeriods) {
      const periods = [...transactionWithPeriods.interestPeriods].sort(
        (a, b) =>
          new Date(a.dueDate || 0).getTime() -
          new Date(b.dueDate || 0).getTime(),
      );

      totalPeriods += periods.length;

      periods.forEach((period, index) => {
        const periodInterest = calculateInterest(
          investorTotalCapital,
          parseFloat(period.interestRate),
          period.interestType,
        );

        const isLastPeriod = index === periods.length - 1;

        if (period.status === 'Completed') {
          completedPeriods++;
          // For completed periods: add interest only (except last period which includes capital)
          if (isLastPeriod) {
            paidAmount += investorTotalCapital + periodInterest;
          } else {
            paidAmount += periodInterest;
          }
        } else {
          // Pending or Overdue
          pendingPeriods++;
          // For pending periods: add interest only (except last period which includes capital)
          if (isLastPeriod) {
            pendingAmount += investorTotalCapital + periodInterest;
          } else {
            pendingAmount += periodInterest;
          }
        }
      });
    }
  });

  return {
    hasMultipleDueDates,
    totalPeriods,
    completedPeriods,
    pendingPeriods,
    paidAmount,
    pendingAmount,
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
      li.loan.status === 'Fully Funded' ||
      li.loan.status === 'Partially Funded',
  ).length;

  const completedLoans = investor.loanInvestors.filter(
    (li) => li.loan.status === 'Completed',
  ).length;

  const overdueLoans = investor.loanInvestors.filter(
    (li) => li.loan.status === 'Overdue',
  ).length;

  // Get latest balance from transactions
  const latestTransaction =
    investor.transactions.length > 0
      ? investor.transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
