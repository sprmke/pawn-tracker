import { db } from '@/db';
import { investors } from '@/db/schema';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { auth } from '@/auth';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

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

interface NewTransactionPageProps {
  searchParams: Promise<{ investorId?: string }>;
}

export default async function NewTransactionPage({
  searchParams,
}: NewTransactionPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const params = await searchParams;
  const allInvestors = await getInvestors(session.user.id);
  const preselectedInvestorId = params.investorId
    ? parseInt(params.investorId)
    : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <TransactionForm
        investors={allInvestors}
        preselectedInvestorId={preselectedInvestorId}
      />
    </div>
  );
}
