import { db } from '@/db';
import { investors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InvestorDetailClient } from './investor-detail-client';
import { getCachedAuth } from '@/auth';

async function getInvestor(id: number, userId: string) {
  try {
    const investor = await db.query.investors.findFirst({
      where: and(eq(investors.id, id), eq(investors.userId, userId)),
      with: {
        loanInvestors: {
          columns: { id: true },
        },
        transactions: {
          columns: { id: true },
        },
        debts: {
          columns: { id: true },
        },
      },
    });
    return investor;
  } catch (error) {
    console.error('Error fetching investor:', error);
    return null;
  }
}

export default async function InvestorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCachedAuth();
  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const investorId = parseInt(resolvedParams.id, 10);

  if (Number.isNaN(investorId)) {
    notFound();
  }

  const investor = await getInvestor(investorId, session.user.id);

  if (!investor) {
    notFound();
  }

  return <InvestorDetailClient investor={investor} />;
}
