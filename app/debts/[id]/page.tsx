import { notFound } from 'next/navigation';
import { db } from '@/db';
import { debts, investors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { DebtDetailClient } from './debt-detail-client';
import { getCachedAuth } from '@/auth';
import {
  markOverdueDebtInterestPeriods,
  syncDebtInterestPeriods,
} from '@/lib/debt-interest-period-sync';

interface DebtPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

async function getDebt(id: number, userId: string) {
  let debt = await db.query.debts.findFirst({
    where: and(eq(debts.id, id), eq(debts.userId, userId)),
    with: {
      investor: true,
      interestPeriods: {
        with: { receivedPayments: true },
        orderBy: (periods, { asc }) => [asc(periods.periodNumber)],
      },
    },
  });

  if (!debt) {
    const investorRecord = await db.query.investors.findFirst({
      where: eq(investors.investorUserId, userId),
    });

    if (investorRecord) {
      debt = await db.query.debts.findFirst({
        where: and(
          eq(debts.id, id),
          eq(debts.investorId, investorRecord.id),
        ),
        with: {
          investor: true,
          interestPeriods: {
            with: { receivedPayments: true },
            orderBy: (periods, { asc }) => [asc(periods.periodNumber)],
          },
        },
      });
    }
  }

  if (debt) {
    if (!debt.interestPeriods?.length) {
      await syncDebtInterestPeriods(debt.id);
    } else {
      await markOverdueDebtInterestPeriods(debt.id);
    }

    debt = await db.query.debts.findFirst({
      where: eq(debts.id, id),
      with: {
        investor: true,
        interestPeriods: {
          with: { receivedPayments: true },
          orderBy: (periods, { asc }) => [asc(periods.periodNumber)],
        },
      },
    });
  }

  return debt;
}

async function getInvestors(userId: string) {
  try {
    return await db.query.investors.findMany({
      where: eq(investors.userId, userId),
    });
  } catch (error) {
    console.error('Error fetching investors:', error);
    return [];
  }
}

export default async function DebtPage({ params, searchParams }: DebtPageProps) {
  const session = await getCachedAuth();
  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const id = parseInt(resolvedParams.id);
  const initialEditMode =
    resolvedSearchParams.edit === '1' || resolvedSearchParams.edit === 'true';

  if (isNaN(id)) {
    notFound();
  }

  const [debt, allInvestors] = await Promise.all([
    getDebt(id, session.user.id),
    getInvestors(session.user.id),
  ]);

  if (!debt) {
    notFound();
  }

  return (
    <DebtDetailClient
      debt={debt}
      investors={allInvestors}
      initialEditMode={initialEditMode}
    />
  );
}
