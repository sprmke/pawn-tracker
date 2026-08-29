import { db } from '@/db';
import { loans, loanInvestors, investors, transactions, debts } from '@/db/schema';
import { eq, and, or, isNotNull } from 'drizzle-orm';

/**
 * Check if a user has access to a loan (either owns it or is an investor in it)
 */
export async function hasLoanAccess(loanId: number, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: loans.id })
    .from(loans)
    .leftJoin(investors, eq(investors.investorUserId, userId))
    .leftJoin(
      loanInvestors,
      and(
        eq(loanInvestors.loanId, loans.id),
        eq(loanInvestors.investorId, investors.id),
      ),
    )
    .where(
      and(
        eq(loans.id, loanId),
        or(eq(loans.userId, userId), isNotNull(loanInvestors.id)),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Check if a user has access to a transaction (either owns it or is the investor)
 */
export async function hasTransactionAccess(transactionId: number, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .leftJoin(
      investors,
      and(
        eq(investors.id, transactions.investorId),
        eq(investors.investorUserId, userId),
      ),
    )
    .where(
      and(
        eq(transactions.id, transactionId),
        or(eq(transactions.userId, userId), isNotNull(investors.id)),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

/**
 * Check if a user has access to a debt (either owns it or is the investor)
 */
export async function hasDebtAccess(debtId: number, userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: debts.id })
    .from(debts)
    .leftJoin(
      investors,
      and(
        eq(investors.id, debts.investorId),
        eq(investors.investorUserId, userId),
      ),
    )
    .where(
      and(
        eq(debts.id, debtId),
        or(eq(debts.userId, userId), isNotNull(investors.id)),
      ),
    )
    .limit(1);

  return rows.length > 0;
}


