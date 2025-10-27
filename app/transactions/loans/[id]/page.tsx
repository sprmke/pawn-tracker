import { db } from '@/db';
import { investors, loans } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { LoanDetailClient } from './loan-detail-client';

async function getInvestors() {
  try {
    const allInvestors = await db.select().from(investors);
    return allInvestors;
  } catch (error) {
    console.error('Error fetching investors:', error);
    return [];
  }
}

async function getLoan(id: number) {
  try {
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, id),
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
  const resolvedParams = await params;
  const loanId = parseInt(resolvedParams.id);

  if (isNaN(loanId)) {
    notFound();
  }

  const [loan, allInvestors] = await Promise.all([
    getLoan(loanId),
    getInvestors(),
  ]);

  if (!loan) {
    notFound();
  }

  return <LoanDetailClient loan={loan} investors={allInvestors} />;
}
