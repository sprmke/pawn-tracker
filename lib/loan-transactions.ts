import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq, and, gte, or } from 'drizzle-orm';

interface LoanInvestorData {
  investorId: number;
  amount: string;
  sentDate: Date;
  interestRate: string;
  interestType: 'rate' | 'fixed';
  hasMultipleInterest: boolean;
  interestPeriods?: {
    dueDate: Date;
    interestRate: string;
    interestType: 'rate' | 'fixed';
  }[];
}

interface LoanData {
  loanName: string;
  dueDate: Date;
}

/**
 * Calculate interest amount based on principal, rate, and type
 */
function calculateInterest(
  principal: number,
  interestRate: number,
  interestType: 'rate' | 'fixed'
): number {
  if (interestType === 'fixed') {
    return interestRate;
  } else {
    // rate type - calculate percentage of principal
    return principal * (interestRate / 100);
  }
}

/**
 * Generate transactions for a loan
 * - OUT transactions for sent dates (principal amount)
 * - IN transactions for due dates (principal + interest)
 */
export async function generateLoanTransactions(
  loanData: LoanData,
  investorData: LoanInvestorData[],
  loanId: number,
  userId: string
): Promise<void> {
  const transactionsToCreate: any[] = [];
  const affectedInvestorIds = new Set<number>();
  let earliestDate: Date | null = null;

  // Group investor data by investorId to count per-investor transactions
  const investorGroups = new Map<number, LoanInvestorData[]>();
  for (const investor of investorData) {
    if (!investorGroups.has(investor.investorId)) {
      investorGroups.set(investor.investorId, []);
    }
    investorGroups.get(investor.investorId)!.push(investor);
  }

  // Process each investor's transactions
  for (const [investorId, investorTransactions] of investorGroups) {
    affectedInvestorIds.add(investorId);

    // Count principal payments and due payments for this specific investor
    const principalPaymentCount = investorTransactions.length;
    let duePaymentCount = 0;
    for (const inv of investorTransactions) {
      if (
        inv.hasMultipleInterest &&
        inv.interestPeriods &&
        inv.interestPeriods.length > 0
      ) {
        duePaymentCount += inv.interestPeriods.length;
      } else {
        duePaymentCount++;
      }
    }

    // Create transactions for this investor
    let principalPaymentIndex = 0;
    let duePaymentIndex = 0;

    for (const investor of investorTransactions) {
      const principal = parseFloat(investor.amount);

      // Track earliest date for recalculation
      if (!earliestDate || investor.sentDate < earliestDate) {
        earliestDate = investor.sentDate;
      }

      // Create OUT transaction for sent date (investor sends money)
      principalPaymentIndex++;
      const principalSentName =
        principalPaymentCount > 1
          ? `${loanData.loanName} - Principal Payment (${principalPaymentIndex}/${principalPaymentCount})`
          : `${loanData.loanName} - Principal Payment`;

      transactionsToCreate.push({
        userId,
        investorId: investor.investorId,
        loanId: loanId || null,
        date: investor.sentDate,
        type: 'Loan',
        direction: 'Out',
        name: principalSentName,
        amount: principal.toFixed(2),
        balance: '0.00', // Will be recalculated
        notes: null,
        transactionIndex:
          principalPaymentCount > 1 ? principalPaymentIndex : null,
        transactionTotal:
          principalPaymentCount > 1 ? principalPaymentCount : null,
      });

      // Create IN transaction(s) for due date(s)
      if (
        investor.hasMultipleInterest &&
        investor.interestPeriods &&
        investor.interestPeriods.length > 0
      ) {
        // Multiple interest periods - create separate IN transactions for each period
        for (let i = 0; i < investor.interestPeriods.length; i++) {
          const period = investor.interestPeriods[i];
          const isLastPeriod = i === investor.interestPeriods.length - 1;

          const interestAmount = calculateInterest(
            principal,
            parseFloat(period.interestRate),
            period.interestType
          );

          // Only add principal to the last period's payment
          const totalAmount = isLastPeriod
            ? principal + interestAmount
            : interestAmount;

          if (!earliestDate || period.dueDate < earliestDate) {
            earliestDate = period.dueDate;
          }

          duePaymentIndex++;
          const paymentDueName =
            duePaymentCount > 1
              ? `${loanData.loanName} - Due Payment (${duePaymentIndex}/${duePaymentCount})`
              : `${loanData.loanName} - Due Payment`;

          transactionsToCreate.push({
            userId,
            investorId: investor.investorId,
            loanId: loanId || null,
            date: period.dueDate,
            type: 'Loan',
            direction: 'In',
            name: paymentDueName,
            amount: totalAmount.toFixed(2),
            balance: '0.00', // Will be recalculated
            notes: null,
            transactionIndex: duePaymentCount > 1 ? duePaymentIndex : null,
            transactionTotal: duePaymentCount > 1 ? duePaymentCount : null,
          });
        }
      } else {
        // Single due date - create one IN transaction
        const interestAmount = calculateInterest(
          principal,
          parseFloat(investor.interestRate),
          investor.interestType
        );
        const totalAmount = principal + interestAmount;

        if (!earliestDate || loanData.dueDate < earliestDate) {
          earliestDate = loanData.dueDate;
        }

        duePaymentIndex++;
        const paymentDueName =
          duePaymentCount > 1
            ? `${loanData.loanName} - Due Payment (${duePaymentIndex}/${duePaymentCount})`
            : `${loanData.loanName} - Due Payment`;

        transactionsToCreate.push({
          userId,
          investorId: investor.investorId,
          loanId: loanId || null,
          date: loanData.dueDate,
          type: 'Loan',
          direction: 'In',
          name: paymentDueName,
          amount: totalAmount.toFixed(2),
          balance: '0.00', // Will be recalculated
          notes: null,
          transactionIndex: duePaymentCount > 1 ? duePaymentIndex : null,
          transactionTotal: duePaymentCount > 1 ? duePaymentCount : null,
        });
      }
    }
  }

  // Insert all transactions
  if (transactionsToCreate.length > 0) {
    await db.insert(transactions).values(transactionsToCreate);
    console.log(`Created ${transactionsToCreate.length} transactions for loan`);

    // Recalculate balances for all affected investors from the earliest transaction date
    await recalculateInvestorBalances(
      Array.from(affectedInvestorIds),
      earliestDate || undefined
    );
    console.log(
      `Recalculated balances for ${affectedInvestorIds.size} investors`
    );
  }
}

/**
 * Recalculate balances for all transactions of specific investors from a certain date onwards
 */
export async function recalculateInvestorBalances(
  investorIds: number[],
  fromDate?: Date
): Promise<void> {
  for (const investorId of investorIds) {
    // Get all transactions for this investor, ordered by date and id
    const allTransactions = await db.query.transactions.findMany({
      where: eq(transactions.investorId, investorId),
      orderBy: (transactions, { asc }) => [
        asc(transactions.date),
        asc(transactions.id),
      ],
    });

    if (allTransactions.length === 0) continue;

    // Calculate running balance
    let runningBalance = 0;
    let needsUpdate = false;

    for (const transaction of allTransactions) {
      const amount = parseFloat(transaction.amount);

      // Update balance based on direction
      if (transaction.direction === 'Out') {
        runningBalance -= amount;
      } else {
        runningBalance += amount;
      }

      const expectedBalance = runningBalance.toFixed(2);
      const currentBalance = transaction.balance;

      // If we've reached the fromDate, start updating
      if (fromDate && new Date(transaction.date) >= fromDate) {
        needsUpdate = true;
      }

      // Update if balance is different and we're past the fromDate (or no fromDate specified)
      if ((!fromDate || needsUpdate) && currentBalance !== expectedBalance) {
        await db
          .update(transactions)
          .set({ balance: expectedBalance })
          .where(eq(transactions.id, transaction.id));

        console.log(
          `Updated transaction ${transaction.id} balance from ${currentBalance} to ${expectedBalance}`
        );
      }
    }
  }
}

/**
 * Update transaction counters for a loan after modifications
 * This recalculates and updates the transactionIndex and transactionTotal for all loan transactions
 * Counters are applied per-investor (not across all investors)
 */
export async function updateLoanTransactionCounters(
  loanId: number
): Promise<void> {
  // Get all transactions for this loan
  const loanTransactions = await db.query.transactions.findMany({
    where: eq(transactions.loanId, loanId),
    orderBy: (transactions, { asc }) => [
      asc(transactions.date),
      asc(transactions.id),
    ],
  });

  if (loanTransactions.length === 0) return;

  // Get the base loan name (remove existing counter if present)
  const baseLoanName = loanTransactions[0].name
    .replace(/ - Principal Sent.*$/, '')
    .replace(/ - Principal Payment.*$/, '')
    .replace(/ - Payment Due.*$/, '')
    .replace(/ - Due Payment.*$/, '');

  // Group transactions by investor
  const investorTransactions = new Map<
    number,
    { principal: any[]; due: any[] }
  >();

  for (const transaction of loanTransactions) {
    if (!investorTransactions.has(transaction.investorId)) {
      investorTransactions.set(transaction.investorId, {
        principal: [],
        due: [],
      });
    }

    const group = investorTransactions.get(transaction.investorId)!;
    if (
      transaction.direction === 'Out' &&
      (transaction.name.includes('Principal Sent') ||
        transaction.name.includes('Principal Payment'))
    ) {
      group.principal.push(transaction);
    } else if (
      transaction.direction === 'In' &&
      (transaction.name.includes('Payment Due') ||
        transaction.name.includes('Due Payment'))
    ) {
      group.due.push(transaction);
    }
  }

  // Update transactions for each investor
  for (const [investorId, { principal, due }] of investorTransactions) {
    const principalCount = principal.length;
    const dueCount = due.length;

    // Update Principal Payment transactions for this investor
    for (let i = 0; i < principal.length; i++) {
      const transaction = principal[i];
      const index = i + 1;
      const newName =
        principalCount > 1
          ? `${baseLoanName} - Principal Payment (${index}/${principalCount})`
          : `${baseLoanName} - Principal Payment`;

      await db
        .update(transactions)
        .set({
          name: newName,
          transactionIndex: principalCount > 1 ? index : null,
          transactionTotal: principalCount > 1 ? principalCount : null,
        })
        .where(eq(transactions.id, transaction.id));
    }

    // Update Due Payment transactions for this investor
    for (let i = 0; i < due.length; i++) {
      const transaction = due[i];
      const index = i + 1;
      const newName =
        dueCount > 1
          ? `${baseLoanName} - Due Payment (${index}/${dueCount})`
          : `${baseLoanName} - Due Payment`;

      await db
        .update(transactions)
        .set({
          name: newName,
          transactionIndex: dueCount > 1 ? index : null,
          transactionTotal: dueCount > 1 ? dueCount : null,
        })
        .where(eq(transactions.id, transaction.id));
    }
  }

  console.log(
    `Updated transaction counters for loan ${loanId} (${investorTransactions.size} investors)`
  );
}

/**
 * Delete all transactions associated with a loan and return affected investor IDs and earliest date
 */
export async function deleteLoanTransactions(
  loanId: number
): Promise<{ investorIds: number[]; earliestDate: Date | null }> {
  // Find all transactions that reference this loan ID
  const loanTransactions = await db.query.transactions.findMany({
    where: eq(transactions.loanId, loanId),
  });

  if (loanTransactions.length === 0) {
    return { investorIds: [], earliestDate: null };
  }

  // Track affected investors and earliest date
  const investorIds = new Set<number>();
  let earliestDate: Date | null = null;

  for (const transaction of loanTransactions) {
    investorIds.add(transaction.investorId);
    const transactionDate = new Date(transaction.date);
    if (!earliestDate || transactionDate < earliestDate) {
      earliestDate = transactionDate;
    }
  }

  // Delete transactions
  for (const transaction of loanTransactions) {
    await db.delete(transactions).where(eq(transactions.id, transaction.id));
  }

  console.log(
    `Deleted ${loanTransactions.length} transactions for loan ${loanId}`
  );

  return {
    investorIds: Array.from(investorIds),
    earliestDate,
  };
}
