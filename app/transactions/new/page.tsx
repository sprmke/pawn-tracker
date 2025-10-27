import { db } from '@/db';
import { investors } from '@/db/schema';
import { TransactionForm } from '@/components/transactions/transaction-form';

async function getInvestors() {
  try {
    const allInvestors = await db.select().from(investors);
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
  const params = await searchParams;
  const allInvestors = await getInvestors();
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
