/**
 * Full business-data backup for a user (admin or investor).
 * Mirrors dashboard / loans API scope: owned + shared loans, merged investors, all visible transactions.
 *
 * Does NOT include auth tables (user, account, session, verificationToken) — those are managed by
 * NextAuth / OAuth; use Neon PITR or DB-level backup for a literal full-database snapshot.
 */

import { db } from '@/db';
import { loans, investors, transactions, loanInvestors } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface BackupData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  /** What this export includes (for documentation / restore tools) */
  includes: {
    investors: boolean;
    loans: boolean;
    loanInvestors: boolean;
    interestPeriods: boolean;
    receivedPayments: boolean;
    transactions: boolean;
  };
  /** Tables intentionally not in this JSON export */
  excludedFromExport: string[];
  data: {
    investors: unknown[];
    loans: unknown[];
    transactions: unknown[];
  };
  summary: {
    totalInvestors: number;
    totalLoans: number;
    totalTransactions: number;
    totalLoanInvestors: number;
    totalInterestPeriods: number;
    totalReceivedPayments: number;
  };
}

const LOAN_INVESTOR_NESTED = {
  with: {
    investor: true,
    interestPeriods: true,
    receivedPayments: true,
  },
} as const;

/**
 * Fetches all pawn business data visible to this user (same scope as dashboard).
 */
export async function fetchBackupDataForUser(options: {
  userId: string;
  exportedByLabel: string;
}): Promise<BackupData> {
  const { userId, exportedByLabel } = options;

  const [ownedLoans, investorRecord, ownedInvestors] = await Promise.all([
    db.query.loans.findMany({
      where: eq(loans.userId, userId),
      with: {
        loanInvestors: LOAN_INVESTOR_NESTED,
        transactions: {
          orderBy: (t, { desc }) => [desc(t.date)],
        },
      },
    }),
    db.query.investors.findFirst({
      where: eq(investors.investorUserId, userId),
    }),
    db.query.investors.findMany({
      where: eq(investors.userId, userId),
      with: {
        loanInvestors: {
          with: {
            loan: true,
            interestPeriods: true,
            receivedPayments: true,
          },
        },
        transactions: {
          orderBy: (t, { desc }) => [desc(t.date)],
        },
      },
    }),
  ]);

  let sharedLoans: unknown[] = [];
  let sharedInvestors: unknown[] = [];
  let allTransactions: Awaited<
    ReturnType<typeof db.query.transactions.findMany>
  >;

  if (investorRecord) {
    const [sharedLoanInvestments, sharedInvestorLoanInvestments, txns] =
      await Promise.all([
        db.query.loanInvestors.findMany({
          where: eq(loanInvestors.investorId, investorRecord.id),
          with: {
            loan: {
              with: {
                loanInvestors: LOAN_INVESTOR_NESTED,
                transactions: {
                  orderBy: (t, { desc }) => [desc(t.date)],
                },
              },
            },
          },
        }),
        db.query.loanInvestors.findMany({
          where: eq(loanInvestors.investorId, investorRecord.id),
          with: {
            loan: {
              with: {
                loanInvestors: {
                  with: {
                    investor: {
                      with: {
                        loanInvestors: {
                          with: {
                            loan: true,
                            interestPeriods: true,
                            receivedPayments: true,
                          },
                        },
                        transactions: {
                          orderBy: (t, { desc }) => [desc(t.date)],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        db.query.transactions.findMany({
          where: (txn, { eq, or }) =>
            or(
              eq(txn.userId, userId),
              eq(txn.investorId, investorRecord.id),
            ),
          with: {
            investor: true,
            loan: true,
          },
          orderBy: (t, { desc }) => [desc(t.date)],
        }),
      ]);

    sharedLoans = sharedLoanInvestments.map((li) => li.loan);
    allTransactions = txns;

    const investorSet = new Set<number>();
    sharedInvestorLoanInvestments.forEach((li) => {
      li.loan.loanInvestors.forEach((loanInv) => {
        if (!investorSet.has(loanInv.investor.id)) {
          investorSet.add(loanInv.investor.id);
          sharedInvestors.push(loanInv.investor);
        }
      });
    });
  } else {
    allTransactions = await db.query.transactions.findMany({
      where: eq(transactions.userId, userId),
      with: {
        investor: true,
        loan: true,
      },
      orderBy: (t, { desc }) => [desc(t.date)],
    });
  }

  const loansMap = new Map<number, unknown>();
  [...ownedLoans, ...sharedLoans].forEach((loan: any) => {
    loansMap.set(loan.id, loan);
  });
  const allLoans = Array.from(loansMap.values()).sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const investorsMap = new Map<number, unknown>();
  [...ownedInvestors, ...sharedInvestors].forEach((inv: any) => {
    investorsMap.set(inv.id, inv);
  });
  const allInvestors = Array.from(investorsMap.values());

  let totalLoanInvestors = 0;
  let totalInterestPeriods = 0;
  let totalReceivedPayments = 0;

  for (const loan of allLoans as any[]) {
    for (const li of loan.loanInvestors || []) {
      totalLoanInvestors += 1;
      totalInterestPeriods += (li.interestPeriods || []).length;
      totalReceivedPayments += (li.receivedPayments || []).length;
    }
  }

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: exportedByLabel,
    includes: {
      investors: true,
      loans: true,
      loanInvestors: true,
      interestPeriods: true,
      receivedPayments: true,
      transactions: true,
    },
    excludedFromExport: [
      'user (auth)',
      'account (OAuth tokens)',
      'session',
      'verificationToken',
    ],
    data: {
      investors: allInvestors,
      loans: allLoans,
      transactions: allTransactions,
    },
    summary: {
      totalInvestors: allInvestors.length,
      totalLoans: allLoans.length,
      totalTransactions: allTransactions.length,
      totalLoanInvestors,
      totalInterestPeriods,
      totalReceivedPayments,
    },
  };
}
