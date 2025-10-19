import { db } from '@/db';
import { investors } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InvestorDetailClient } from './investor-detail-client';

async function getInvestor(id: number) {
  try {
    const investor = await db.query.investors.findFirst({
      where: eq(investors.id, id),
      with: {
        loanInvestors: {
          with: {
            loan: true,
          },
        },
        transactions: {
          orderBy: (transactions, { desc }) => [desc(transactions.date)],
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
  const resolvedParams = await params;
  const investorId = parseInt(resolvedParams.id);

  if (isNaN(investorId)) {
    notFound();
  }

  const investor = await getInvestor(investorId);

  if (!investor) {
    notFound();
  }

  return <InvestorDetailClient investor={investor as any} />;
}
