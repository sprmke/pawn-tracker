/**
 * Utility functions to detect if loan/transaction updates require recalculation
 */

interface LoanData {
  loanName: string;
  type: string;
  status: string;
  dueDate: Date;
  freeLotSqm: number | null;
  notes: string | null;
}

interface InvestorData {
  investorId: number;
  amount: string;
  sentDate: Date;
  interestRate: string;
  interestType: string;
  hasMultipleInterest: boolean;
  interestPeriods?: Array<{
    dueDate: Date;
    interestRate: string;
    interestType: string;
  }>;
}

/**
 * Fields that don't affect transaction calculations
 * Changing these fields should NOT trigger transaction regeneration
 */
const NON_COMPUTATIONAL_LOAN_FIELDS = [
  'loanName',
  'notes',
  'freeLotSqm',
  'status',
] as const;

/**
 * Fields that affect transaction calculations
 * Changing these fields SHOULD trigger transaction regeneration
 */
const COMPUTATIONAL_LOAN_FIELDS = ['type', 'dueDate'] as const;

/**
 * Check if loan data changes require transaction regeneration
 * Returns true if transactions need to be regenerated, false otherwise
 */
export function requiresTransactionRegeneration(
  existingLoan: LoanData,
  newLoanData: LoanData,
  existingInvestors: InvestorData[],
  newInvestors: InvestorData[]
): boolean {
  // Check if computational loan fields changed
  for (const field of COMPUTATIONAL_LOAN_FIELDS) {
    const existingValue = existingLoan[field];
    const newValue = newLoanData[field];

    // Special handling for Date objects
    if (existingValue instanceof Date && newValue instanceof Date) {
      if (existingValue.getTime() !== newValue.getTime()) {
        console.log(`Computational field changed: ${field}`);
        return true;
      }
    } else if (existingValue !== newValue) {
      console.log(`Computational field changed: ${field}`);
      return true;
    }
  }

  // Check if number of investors changed
  if (existingInvestors.length !== newInvestors.length) {
    console.log('Number of investors changed');
    return true;
  }

  // Check if any investor data changed (amounts, rates, dates, etc.)
  // Create a map of existing investors for easier comparison
  const existingInvestorMap = new Map(
    existingInvestors.map((inv) => [inv.investorId, inv])
  );

  for (const newInv of newInvestors) {
    const existingInv = existingInvestorMap.get(newInv.investorId);

    // New investor added
    if (!existingInv) {
      console.log(`New investor added: ${newInv.investorId}`);
      return true;
    }

    // Check computational investor fields
    if (
      existingInv.amount !== newInv.amount ||
      existingInv.interestRate !== newInv.interestRate ||
      existingInv.interestType !== newInv.interestType ||
      existingInv.hasMultipleInterest !== newInv.hasMultipleInterest
    ) {
      console.log(`Investor ${newInv.investorId} computational data changed`);
      return true;
    }

    // Check sent date
    if (existingInv.sentDate.getTime() !== newInv.sentDate.getTime()) {
      console.log(`Investor ${newInv.investorId} sent date changed`);
      return true;
    }

    // Check interest periods if they exist
    const existingPeriods = existingInv.interestPeriods || [];
    const newPeriods = newInv.interestPeriods || [];

    if (existingPeriods.length !== newPeriods.length) {
      console.log(
        `Investor ${newInv.investorId} interest periods count changed`
      );
      return true;
    }

    // Compare interest periods (sorted by date for consistent comparison)
    const sortedExisting = [...existingPeriods].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );
    const sortedNew = [...newPeriods].sort(
      (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
    );

    for (let i = 0; i < sortedExisting.length; i++) {
      const existingPeriod = sortedExisting[i];
      const newPeriod = sortedNew[i];

      if (
        existingPeriod.dueDate.getTime() !== newPeriod.dueDate.getTime() ||
        existingPeriod.interestRate !== newPeriod.interestRate ||
        existingPeriod.interestType !== newPeriod.interestType
      ) {
        console.log(
          `Investor ${newInv.investorId} interest period ${i} changed`
        );
        return true;
      }
    }
  }

  // Check if any existing investor was removed
  for (const existingInv of existingInvestors) {
    const stillExists = newInvestors.some(
      (inv) => inv.investorId === existingInv.investorId
    );
    if (!stillExists) {
      console.log(`Investor removed: ${existingInv.investorId}`);
      return true;
    }
  }

  console.log(
    'No computational changes detected - skipping transaction regeneration'
  );
  return false;
}

/**
 * Fields that don't affect balance calculations in transactions
 * Changing these fields should NOT trigger balance recalculation
 */
const NON_COMPUTATIONAL_TRANSACTION_FIELDS = ['name', 'notes'] as const;

/**
 * Check if transaction data changes require balance recalculation
 * Returns true if balances need to be recalculated, false otherwise
 */
export function requiresBalanceRecalculation(
  existingTransaction: {
    date: Date;
    amount: string;
    direction: string;
    investorId: number;
  },
  newTransactionData: {
    date: Date;
    amount: string;
    direction: string;
    investorId: number;
  }
): boolean {
  // Check if date changed
  if (
    existingTransaction.date.getTime() !== newTransactionData.date.getTime()
  ) {
    console.log('Transaction date changed - requires balance recalculation');
    return true;
  }

  // Check if amount changed
  if (existingTransaction.amount !== newTransactionData.amount) {
    console.log('Transaction amount changed - requires balance recalculation');
    return true;
  }

  // Check if direction changed
  if (existingTransaction.direction !== newTransactionData.direction) {
    console.log(
      'Transaction direction changed - requires balance recalculation'
    );
    return true;
  }

  // Check if investor changed
  if (existingTransaction.investorId !== newTransactionData.investorId) {
    console.log(
      'Transaction investor changed - requires balance recalculation'
    );
    return true;
  }

  console.log(
    'No computational transaction changes - skipping balance recalculation'
  );
  return false;
}
