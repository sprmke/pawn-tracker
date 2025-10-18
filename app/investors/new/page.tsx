import { InvestorForm } from '@/components/investors/investor-form';

export default function NewInvestorPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Add New Investor
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Create a new investor profile
        </p>
      </div>

      <InvestorForm />
    </div>
  );
}
