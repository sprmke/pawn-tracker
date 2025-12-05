import { db } from '@/db';
import { loans, loanInvestors, investors, transactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if a user has access to a loan (either owns it or is an investor in it)
 */
export async function hasLoanAccess(loanId: number, userId: string): Promise<boolean> {
  // Check if user owns the loan
  const ownedLoan = await db.query.loans.findFirst({
    where: and(eq(loans.id, loanId), eq(loans.userId, userId)),
  });

  if (ownedLoan) {
    return true;
  }

  // Check if user is an investor in this loan
  const investorRecord = await db.query.investors.findFirst({
    where: eq(investors.investorUserId, userId),
  });

  if (investorRecord) {
    const loanInvestment = await db.query.loanInvestors.findFirst({
      where: and(
        eq(loanInvestors.loanId, loanId),
        eq(loanInvestors.investorId, investorRecord.id)
      ),
    });

    if (loanInvestment) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a user has access to a transaction (either owns it or is the investor)
 */
export async function hasTransactionAccess(transactionId: number, userId: string): Promise<boolean> {
  // Check if user owns the transaction
  const ownedTransaction = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
  });

  if (ownedTransaction) {
    return true;
  }

  // Check if user is the investor for this transaction
  const investorRecord = await db.query.investors.findFirst({
    where: eq(investors.investorUserId, userId),
  });

  if (investorRecord) {
    const investorTransaction = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, transactionId),
        eq(transactions.investorId, investorRecord.id)
      ),
    });

    if (investorTransaction) {
      return true;
    }
  }

  return false;
}

