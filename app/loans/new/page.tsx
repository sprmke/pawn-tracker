import { db } from '@/db';
import { investors } from '@/db/schema';
import { LoanForm } from '@/components/loans/loan-form';
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

interface NewLoanPageProps {
  searchParams: Promise<{ investorId?: string; duplicate?: string }>;
}

export default async function NewLoanPage({ searchParams }: NewLoanPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const params = await searchParams;
  const allInvestors = await getInvestors(session.user.id);
  const preselectedInvestorId = params.investorId
    ? parseInt(params.investorId)
    : undefined;

  // Parse duplicate data if present
  let duplicateData = undefined;
  if (params.duplicate) {
    try {
      duplicateData = JSON.parse(atob(params.duplicate));
    } catch (e) {
      console.error('Failed to parse duplicate data:', e);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <LoanForm
        investors={allInvestors}
        preselectedInvestorId={preselectedInvestorId}
        duplicateData={duplicateData}
      />
    </div>
  );
}
