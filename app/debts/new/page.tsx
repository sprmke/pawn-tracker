import { db } from '@/db';
import { investors } from '@/db/schema';
import { DebtForm } from '@/components/debts';
import { getCachedAuth } from '@/auth';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';

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

interface NewDebtPageProps {
  searchParams: Promise<{ investorId?: string }>;
}

export default async function NewDebtPage({ searchParams }: NewDebtPageProps) {
  const session = await getCachedAuth();
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
      <DebtForm
        investors={allInvestors}
        preselectedInvestorId={preselectedInvestorId}
      />
    </div>
  );
}
