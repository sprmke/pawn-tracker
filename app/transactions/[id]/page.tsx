import { notFound } from 'next/navigation';
import { db } from '@/db';
import { transactions, investors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { TransactionDetailClient } from './transaction-detail-client';
import { auth } from '@/auth';

interface TransactionPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getTransaction(id: number, userId: string) {
  // First try to get transaction if user owns it
  let transaction = await db.query.transactions.findFirst({
    where: and(
      eq(transactions.id, id),
      eq(transactions.userId, userId)
    ),
    with: {
      investor: true,
      loan: true,
    },
  });

  // If not found, check if user is the investor for this transaction
  if (!transaction) {
    const investorRecord = await db.query.investors.findFirst({
      where: eq(investors.investorUserId, userId),
    });

    if (investorRecord) {
      transaction = await db.query.transactions.findFirst({
        where: and(
          eq(transactions.id, id),
          eq(transactions.investorId, investorRecord.id)
        ),
        with: {
          investor: true,
          loan: true,
        },
      });
    }
  }

  return transaction;
}

export default async function TransactionPage({
  params,
}: TransactionPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) {
    notFound();
  }

  const transaction = await getTransaction(id, session.user.id);

  if (!transaction) {
    notFound();
  }

  // Fetch all investors for the edit form (filtered by userId)
  const allInvestors = await db.query.investors.findMany({
    where: eq(investors.userId, session.user.id),
    orderBy: (investors, { asc }) => [asc(investors.name)],
  });

  return (
    <TransactionDetailClient
      transaction={transaction}
      investors={allInvestors}
    />
  );
}
