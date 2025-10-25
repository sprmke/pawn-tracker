import { db } from '@/db';
import { investors } from '@/db/schema';
import { LoanForm } from '@/components/loans/loan-form';

async function getInvestors() {
  try {
    const allInvestors = await db.select().from(investors);
    // Convert null to undefined for contactNumber to match Investor type
    return allInvestors.map((investor) => ({
      ...investor,
      contactNumber: investor.contactNumber ?? undefined,
    }));
  } catch (error) {
    console.error('Error fetching investors:', error);
    return [];
  }
}

interface NewLoanPageProps {
  searchParams: Promise<{ investorId?: string }>;
}

export default async function NewLoanPage({ searchParams }: NewLoanPageProps) {
  const params = await searchParams;
  const allInvestors = await getInvestors();
  const preselectedInvestorId = params.investorId
    ? parseInt(params.investorId)
    : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <LoanForm
        investors={allInvestors}
        preselectedInvestorId={preselectedInvestorId}
      />
    </div>
  );
}
