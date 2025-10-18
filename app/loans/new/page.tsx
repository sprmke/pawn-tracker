import { db } from '@/db';
import { investors } from '@/db/schema';
import { LoanForm } from '@/components/loans/loan-form';

async function getInvestors() {
  try {
    const allInvestors = await db.select().from(investors);
    return allInvestors;
  } catch (error) {
    console.error('Error fetching investors:', error);
    return [];
  }
}

export default async function NewLoanPage() {
  const allInvestors = await getInvestors();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Create New Loan
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Add a new loan and assign investors
        </p>
      </div>

      <LoanForm investors={allInvestors} />
    </div>
  );
}
