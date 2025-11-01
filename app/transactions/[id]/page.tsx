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

  const transaction = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.userId, session.user.id)),
    with: {
      investor: true,
    },
  });

  if (!transaction) {
    notFound();
  }

  // Fetch all investors for the edit form (filtered by userId)
  const allInvestors = await db.query.investors.findMany({
    where: eq(investors.userId, session.user.id),
    orderBy: (investors, { asc }) => [asc(investors.name)],
  });

  return (
    <TransactionDetailClient transaction={transaction} investors={allInvestors} />
  );
}
