import { db } from '@/db';
import { investors, loans } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { LoanDetailClient } from './loan-detail-client';
import { auth } from '@/auth';

async function getInvestors(userId: string) {
  try {
    const allInvestors = await db.query.investors.findMany({
      where: eq(investors.userId, userId),
    });
    return allInvestors;
  } catch (error) {
    console.error('Error fetching investors:', error);
    return [];
  }
}

async function getLoan(id: number, userId: string) {
  try {
    const loan = await db.query.loans.findFirst({
      where: and(eq(loans.id, id), eq(loans.userId, userId)),
      with: {
        loanInvestors: {
          with: {
            investor: true,
            interestPeriods: true,
          },
        },
        transactions: {
          orderBy: (transactions, { asc }) => [asc(transactions.date)],
        },
      },
    });
    return loan;
  } catch (error) {
    console.error('Error fetching loan:', error);
    return null;
  }
}

export default async function LoanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const loanId = parseInt(resolvedParams.id);

  if (isNaN(loanId)) {
    notFound();
  }

  const [loan, allInvestors] = await Promise.all([
    getLoan(loanId, session.user.id),
    getInvestors(session.user.id),
  ]);

  if (!loan) {
    notFound();
  }

  return <LoanDetailClient loan={loan} investors={allInvestors} />;
}
