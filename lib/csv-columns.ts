/**
 * CSV Column Definitions for different data types
 */

import {
  LoanWithInvestors,
  InvestorWithLoans,
  TransactionWithInvestor,
} from './types';
import {
  formatDateForCSV,
  formatCurrencyForCSV,
  CSVColumn,
} from './csv-export';
import {
  calculateLoanStats,
  calculateInvestorStats,
  calculateAverageRate,
} from './calculations';

/**
 * CSV columns for Loans export
 */
export const loansCSVColumns: CSVColumn<LoanWithInvestors>[] = [
  {
    header: 'Loan Name',
    accessor: (loan) => loan.loanName,
  },
  {
    header: 'Type',
    accessor: (loan) => loan.type,
  },
  {
    header: 'Status',
    accessor: (loan) => loan.status,
  },
  {
    header: 'Due Date',
    accessor: (loan) => formatDateForCSV(loan.dueDate),
  },
  {
    header: 'Total Principal',
    accessor: (loan) => {
      const stats = calculateLoanStats(loan);
      return formatCurrencyForCSV(stats.totalPrincipal);
    },
  },
  {
    header: 'Average Rate (%)',
    accessor: (loan) => {
      const stats = calculateLoanStats(loan);
      return stats.avgRate.toFixed(2);
    },
  },
  {
    header: 'Total Interest',
    accessor: (loan) => {
      const stats = calculateLoanStats(loan);
      return formatCurrencyForCSV(stats.totalInterest);
    },
  },
  {
    header: 'Total Amount',
    accessor: (loan) => {
      const stats = calculateLoanStats(loan);
      return formatCurrencyForCSV(stats.totalAmount);
    },
  },
  {
    header: 'Free Lot (sqm)',
    accessor: (loan) => loan.freeLotSqm || '',
  },
  {
    header: 'Investors',
    accessor: (loan) => {
      // Get unique investor names
      const uniqueInvestors = Array.from(
        new Set(loan.loanInvestors.map((li) => li.investor.name))
      ).sort();
      return uniqueInvestors.join(', ');
    },
  },
  {
    header: 'Sent Dates',
    accessor: (loan) => {
      const uniqueDates = Array.from(
        new Set(
          loan.loanInvestors.map((li) =>
            formatDateForCSV(li.sentDate)
          )
        )
      ).sort();
      return uniqueDates.join('; ');
    },
  },
  {
    header: 'All Due Dates',
    accessor: (loan) => {
      const dueDateSet = new Set<string>();
      
      // Add main loan due date
      dueDateSet.add(formatDateForCSV(loan.dueDate));
      
      // Add interest period due dates
      loan.loanInvestors.forEach((li) => {
        if (li.hasMultipleInterest && li.interestPeriods) {
          li.interestPeriods.forEach((period) => {
            dueDateSet.add(formatDateForCSV(period.dueDate));
          });
        }
      });
      
      return Array.from(dueDateSet).sort().join('; ');
    },
  },
  {
    header: 'Notes',
    accessor: (loan) => loan.notes || '',
  },
];

/**
 * CSV columns for Investors export
 */
export const investorsCSVColumns: CSVColumn<InvestorWithLoans>[] = [
  {
    header: 'Name',
    accessor: (investor) => investor.name,
  },
  {
    header: 'Email',
    accessor: (investor) => investor.email,
  },
  {
    header: 'Contact Number',
    accessor: (investor) => investor.contactNumber || '',
  },
  {
    header: 'Total Capital',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalCapital);
    },
  },
  {
    header: 'Average Rate (%)',
    accessor: (investor) => {
      const avgRate = calculateAverageRate(investor.loanInvestors);
      return avgRate.toFixed(2);
    },
  },
  {
    header: 'Total Interest',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalInterest);
    },
  },
  {
    header: 'Total Amount',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalCapital + stats.totalInterest);
    },
  },
  {
    header: 'Current Balance',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.currentBalance);
    },
  },
  {
    header: 'Total Gain',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalGain);
    },
  },
  {
    header: 'Active Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return stats.activeLoans;
    },
  },
  {
    header: 'Completed Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return stats.completedLoans;
    },
  },
  {
    header: 'Overdue Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return stats.overdueLoans;
    },
  },
  {
    header: 'Total Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return stats.totalLoans;
    },
  },
];

/**
 * CSV columns for Transactions export
 */
export const transactionsCSVColumns: CSVColumn<TransactionWithInvestor>[] = [
  {
    header: 'Date',
    accessor: (transaction) => formatDateForCSV(transaction.date),
  },
  {
    header: 'Name',
    accessor: (transaction) => transaction.name,
  },
  {
    header: 'Investor',
    accessor: (transaction) => transaction.investor.name,
  },
  {
    header: 'Type',
    accessor: (transaction) => transaction.type,
  },
  {
    header: 'Direction',
    accessor: (transaction) => transaction.direction,
  },
  {
    header: 'Amount',
    accessor: (transaction) => formatCurrencyForCSV(transaction.amount),
  },
  {
    header: 'Investor Balance',
    accessor: (transaction) => formatCurrencyForCSV(transaction.balance),
  },
  {
    header: 'Notes',
    accessor: (transaction) => transaction.notes || '',
  },
];

/**
 * Helper function to calculate overall balance for transactions export
 */
export function createTransactionsCSVColumnsWithOverallBalance(
  allTransactions: TransactionWithInvestor[]
): CSVColumn<TransactionWithInvestor>[] {
  const calculateOverallBalance = (
    currentTransaction: TransactionWithInvestor
  ): number => {
    // Get all transactions up to and including the current transaction
    const transactionsUpTo = allTransactions.filter((tx) => {
      const txDate = new Date(tx.date);
      const currentDate = new Date(currentTransaction.date);

      return (
        txDate < currentDate ||
        (txDate.getTime() === currentDate.getTime() &&
          tx.id <= currentTransaction.id)
      );
    });

    // Group by investor and get the latest transaction for each
    const latestByInvestor = new Map<number, TransactionWithInvestor>();

    transactionsUpTo.forEach((tx) => {
      const investorId = tx.investor.id;
      const existing = latestByInvestor.get(investorId);

      if (!existing) {
        latestByInvestor.set(investorId, tx);
      } else {
        const existingDate = new Date(existing.date);
        const txDate = new Date(tx.date);

        if (
          txDate > existingDate ||
          (txDate.getTime() === existingDate.getTime() && tx.id > existing.id)
        ) {
          latestByInvestor.set(investorId, tx);
        }
      }
    });

    return Array.from(latestByInvestor.values()).reduce(
      (sum, tx) => sum + parseFloat(tx.balance),
      0
    );
  };

  return [
    ...transactionsCSVColumns.slice(0, 7), // Include all columns up to Investor Balance
    {
      header: 'Overall Balance',
      accessor: (transaction) => {
        const balance = calculateOverallBalance(transaction);
        return formatCurrencyForCSV(balance);
      },
    },
    ...transactionsCSVColumns.slice(7), // Include remaining columns (Notes)
  ];
}

