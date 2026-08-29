import 'server-only';

import { unstable_cache } from 'next/cache';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import {
  borrowers,
  debts,
  investors,
  loanInvestors,
  loans,
  transactions,
  witnesses,
} from '@/db/schema';
import { CACHE_TAGS } from '@/lib/cache-invalidation';

const CACHE_TTL_SECONDS = 300;

export const getCachedLoans = unstable_cache(
  async (userId: string) => {
    const [ownedLoans, investorRecord] = await Promise.all([
      db.query.loans.findMany({
        where: eq(loans.userId, userId),
        with: {
          borrower: true,
          loanInvestors: {
            with: {
              investor: true,
              interestPeriods: true,
              receivedPayments: true,
            },
          },
        },
      }),
      db.query.investors.findFirst({
        where: eq(investors.investorUserId, userId),
        columns: { id: true },
      }),
    ]);

    if (!investorRecord) {
      return ownedLoans.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
    }

    const loanInvestments = await db.query.loanInvestors.findMany({
      where: eq(loanInvestors.investorId, investorRecord.id),
      columns: {},
      with: {
        loan: {
          with: {
            borrower: true,
            loanInvestors: {
              with: {
                investor: true,
                interestPeriods: true,
                receivedPayments: true,
              },
            },
          },
        },
      },
    });

    const allLoans = new Map(ownedLoans.map((loan) => [loan.id, loan]));
    for (const investment of loanInvestments) {
      allLoans.set(investment.loan.id, investment.loan);
    }

    return Array.from(allLoans.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  },
  ['user-loans'],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: [CACHE_TAGS.loans],
  },
);

export const getCachedInvestors = unstable_cache(
  async (userId: string, simple: boolean) => {
    const columns = simple
      ? {
          id: true,
          name: true,
          email: true,
          contactNumber: true,
          address: true,
          validIdUrl: true,
          eSignatureUrl: true,
        }
      : undefined;

    const [ownedInvestors, userAsInvestor] = await Promise.all([
      db.query.investors.findMany({
        where: eq(investors.userId, userId),
        ...(columns ? { columns } : {}),
        ...(simple
          ? {}
          : {
              with: {
                loanInvestors: { with: { loan: true } },
                transactions: true,
              },
            }),
      }),
      db.query.investors.findFirst({
        where: eq(investors.investorUserId, userId),
        columns: { id: true },
      }),
    ]);

    if (!userAsInvestor) return ownedInvestors;

    const shared = await db.query.loanInvestors.findMany({
      where: eq(loanInvestors.investorId, userAsInvestor.id),
      columns: {},
      with: {
        loan: {
          columns: {},
          with: {
            loanInvestors: {
              columns: {},
              with: {
                investor: simple
                  ? { columns }
                  : {
                      with: {
                        loanInvestors: { with: { loan: true } },
                        transactions: true,
                      },
                    },
              },
            },
          },
        },
      },
    });

    const allInvestors = new Map(
      ownedInvestors.map((investor) => [investor.id, investor]),
    );
    for (const investment of shared) {
      for (const loanInvestor of investment.loan.loanInvestors) {
        if (!allInvestors.has(loanInvestor.investor.id)) {
          allInvestors.set(
            loanInvestor.investor.id,
            loanInvestor.investor as (typeof ownedInvestors)[number],
          );
        }
      }
    }
    return Array.from(allInvestors.values());
  },
  ['user-investors'],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: [CACHE_TAGS.investors],
  },
);

export const getCachedBorrowers = unstable_cache(
  async (userId: string) =>
    db.query.borrowers.findMany({
      where: eq(borrowers.userId, userId),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ['user-borrowers'],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: [CACHE_TAGS.borrowers],
  },
);

export const getCachedWitnesses = unstable_cache(
  async (userId: string) =>
    db.query.witnesses.findMany({
      where: eq(witnesses.userId, userId),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ['user-witnesses'],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: [CACHE_TAGS.witnesses],
  },
);

export const getCachedDebts = unstable_cache(
  async (userId: string, investorId: number | null) => {
    const investorRecord = await db.query.investors.findFirst({
      where: eq(investors.investorUserId, userId),
      columns: { id: true },
    });

    return db.query.debts.findMany({
      where: investorId
        ? and(eq(debts.userId, userId), eq(debts.investorId, investorId))
        : investorRecord
          ? or(
              eq(debts.userId, userId),
              eq(debts.investorId, investorRecord.id),
            )
          : eq(debts.userId, userId),
      orderBy: (table, { desc }) => [desc(table.date)],
      with: { investor: true },
    });
  },
  ['user-debts'],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: [CACHE_TAGS.debts],
  },
);

export const getCachedTransactions = unstable_cache(
  async (userId: string, investorId: number | null) => {
    const investorRecord = await db.query.investors.findFirst({
      where: eq(investors.investorUserId, userId),
      columns: { id: true },
    });

    return db.query.transactions.findMany({
      where: investorId
        ? and(
            eq(transactions.userId, userId),
            eq(transactions.investorId, investorId),
          )
        : investorRecord
          ? or(
              eq(transactions.userId, userId),
              eq(transactions.investorId, investorRecord.id),
            )
          : eq(transactions.userId, userId),
      orderBy: (table, { desc }) => [desc(table.date)],
      with: { investor: true },
    });
  },
  ['user-transactions'],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: [CACHE_TAGS.transactions],
  },
);
