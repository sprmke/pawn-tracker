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
  formatTextForCSV,
  formatRateForCSV,
  formatCountForCSV,
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
    accessor: (loan) => formatTextForCSV(loan.loanName),
  },
  {
    header: 'Type',
    accessor: (loan) => formatTextForCSV(loan.type),
  },
  {
    header: 'Status',
    accessor: (loan) => formatTextForCSV(loan.status),
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
    summable: true,
  },
  {
    header: 'Average Rate (%)',
    accessor: (loan) => {
      const stats = calculateLoanStats(loan);
      return formatRateForCSV(stats.avgRate);
    },
  },
  {
    header: 'Total Interest',
    accessor: (loan) => {
      const stats = calculateLoanStats(loan);
      return formatCurrencyForCSV(stats.totalInterest);
    },
    summable: true,
  },
  {
    header: 'Total Amount',
    accessor: (loan) => {
      const stats = calculateLoanStats(loan);
      return formatCurrencyForCSV(stats.totalAmount);
    },
    summable: true,
  },
  {
    header: 'Free Lot (sqm)',
    accessor: (loan) =>
      loan.freeLotSqm != null ? formatCountForCSV(loan.freeLotSqm) : '',
    summable: true,
  },
  {
    header: 'Investors',
    accessor: (loan) => {
      // Get unique investor names
      const uniqueInvestors = Array.from(
        new Set(loan.loanInvestors.map((li) => li.investor.name)),
      ).sort();
      return formatTextForCSV(uniqueInvestors.join(', '));
    },
  },
  {
    header: 'Sent Dates',
    accessor: (loan) => {
      const uniqueDates = Array.from(
        new Set(loan.loanInvestors.map((li) => formatDateForCSV(li.sentDate))),
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
    accessor: (loan) => formatTextForCSV(loan.notes || ''),
  },
];

/**
 * CSV columns for Investors export
 */
export const investorsCSVColumns: CSVColumn<InvestorWithLoans>[] = [
  {
    header: 'Name',
    accessor: (investor) => formatTextForCSV(investor.name),
  },
  {
    header: 'Email',
    accessor: (investor) => formatTextForCSV(investor.email),
  },
  {
    header: 'Contact Number',
    accessor: (investor) => formatTextForCSV(investor.contactNumber || ''),
  },
  {
    header: 'Total Capital',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalCapital);
    },
    summable: true,
  },
  {
    header: 'Average Rate (%)',
    accessor: (investor) => {
      const avgRate = calculateAverageRate(investor.loanInvestors);
      return formatRateForCSV(avgRate);
    },
  },
  {
    header: 'Total Interest',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalInterest);
    },
    summable: true,
  },
  {
    header: 'Total Amount',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalCapital + stats.totalInterest);
    },
    summable: true,
  },
  {
    header: 'Current Balance',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.currentBalance);
    },
    summable: true,
  },
  {
    header: 'Total Gain',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCurrencyForCSV(stats.totalGain);
    },
    summable: true,
  },
  {
    header: 'Active Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCountForCSV(stats.activeLoans);
    },
    summable: true,
  },
  {
    header: 'Completed Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCountForCSV(stats.completedLoans);
    },
    summable: true,
  },
  {
    header: 'Overdue Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCountForCSV(stats.overdueLoans);
    },
    summable: true,
  },
  {
    header: 'Total Loans',
    accessor: (investor) => {
      const stats = calculateInvestorStats(investor);
      return formatCountForCSV(stats.totalLoans);
    },
    summable: true,
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
    accessor: (transaction) => formatTextForCSV(transaction.name),
  },
  {
    header: 'Investor',
    accessor: (transaction) => formatTextForCSV(transaction.investor.name),
  },
  {
    header: 'Type',
    accessor: (transaction) => formatTextForCSV(transaction.type),
  },
  {
    header: 'Direction',
    accessor: (transaction) => formatTextForCSV(transaction.direction),
  },
  {
    header: 'Amount',
    accessor: (transaction) => formatCurrencyForCSV(transaction.amount),
    summable: true,
  },
  {
    header: 'Notes',
    accessor: (transaction) => formatTextForCSV(transaction.notes || ''),
  },
];
