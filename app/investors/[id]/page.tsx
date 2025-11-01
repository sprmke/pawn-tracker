import { db } from '@/db';
import { investors } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InvestorDetailClient } from './investor-detail-client';
import { auth } from '@/auth';

async function getInvestor(id: number, userId: string) {
  try {
    const investor = await db.query.investors.findFirst({
      where: and(eq(investors.id, id), eq(investors.userId, userId)),
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
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const resolvedParams = await params;
  const investorId = parseInt(resolvedParams.id);

  if (isNaN(investorId)) {
    notFound();
  }

  const investor = await getInvestor(investorId, session.user.id);

  if (!investor) {
    notFound();
  }

  return <InvestorDetailClient investor={investor as any} />;
}
