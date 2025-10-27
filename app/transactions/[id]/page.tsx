import { notFound } from 'next/navigation';
import { db } from '@/db';
import { transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { TransactionDetailClient } from './transaction-detail-client';

interface TransactionPageProps {
  params: {
    id: string;
  };
}

export default async function TransactionPage({
  params,
}: TransactionPageProps) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  const transaction = await db.query.transactions.findFirst({
    where: eq(transactions.id, id),
    with: {
      investor: true,
    },
  });

  if (!transaction) {
    notFound();
  }

  // Fetch all investors for the edit form
  const investors = await db.query.investors.findMany({
    orderBy: (investors, { asc }) => [asc(investors.name)],
  });

  return (
    <TransactionDetailClient transaction={transaction} investors={investors} />
  );
}
