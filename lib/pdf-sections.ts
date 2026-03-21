/**
 * PDF Section definitions for each entity type.
 * These control what sections appear in the column-selection modal
 * and which sections are rendered in the PDF.
 */

import { PDFSection } from './pdf-export';
import { LoanWithInvestors, InvestorWithLoans, TransactionWithInvestor } from './types';

/**
 * Sections for the Loans PDF export.
 * The loan header (name, type, status, due date) is always shown.
 * These sections are optional and configurable by the user.
 */
export const loanPDFSections: PDFSection<LoanWithInvestors>[] = [
  {
    key: 'financial_summary',
    header: 'Financial Summary',
    description: 'Total principal, interest, and combined amount',
  },
  {
    key: 'investors',
    header: 'Investor Breakdown',
    description: 'Per-investor disbursement amounts, rates, and interests',
  },
  {
    key: 'interest_periods',
    header: 'Interest Periods',
    description: 'Multiple interest period schedule and statuses',
  },
  {
    key: 'received_payments',
    header: 'Received Payments',
    description: 'Payment history and received amounts',
  },
  {
    key: 'free_lot',
    header: 'Free Lot',
    description: 'Free lot square meters collateral (if applicable)',
  },
  {
    key: 'notes',
    header: 'Notes',
    description: 'Loan remarks and notes (formatting preserved)',
  },
];

/**
 * Sections for the Investors PDF export.
 */
export const investorPDFSections: PDFSection<InvestorWithLoans>[] = [
  {
    key: 'contact',
    header: 'Contact Info',
    description: 'Email address and contact number',
  },
  {
    key: 'financial_stats',
    header: 'Financial Stats',
    description: 'Total capital, interest, current balance, and gain',
  },
  {
    key: 'loan_counts',
    header: 'Loan Summary',
    description: 'Active, completed, overdue, and total loan counts',
  },
];

/**
 * Sections for the Transactions PDF export.
 */
export const transactionPDFSections: PDFSection<TransactionWithInvestor>[] = [
  {
    key: 'investor',
    header: 'Investor',
    description: 'Investor associated with the transaction',
  },
  {
    key: 'type_direction',
    header: 'Type & Direction',
    description: 'Transaction type (Loan/Investment) and direction (In/Out)',
  },
  {
    key: 'amount',
    header: 'Amount',
    description: 'Transaction amount',
  },
  {
    key: 'notes',
    header: 'Notes',
    description: 'Transaction notes and remarks (formatting preserved)',
  },
];
