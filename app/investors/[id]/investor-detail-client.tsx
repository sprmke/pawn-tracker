'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactInfoCard, DetailHeader } from '@/components/common';
import { InvestorForm } from '@/components/investors/investor-form';
import type { Investor } from '@/lib/types';

interface InvestorWithCounts extends Investor {
  loanInvestors: Array<{ id: number }>;
  transactions: Array<{ id: number }>;
  debts?: Array<{ id: number }>;
}

interface InvestorDetailClientProps {
  investor: InvestorWithCounts;
}

export function InvestorDetailClient({ investor }: InvestorDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const debtCount = investor.debts?.length ?? 0;
  const canDelete =
    investor.loanInvestors.length === 0 &&
    investor.transactions.length === 0 &&
    debtCount === 0;

  const handleDelete = async () => {
    const response = await fetch(`/api/investors/${investor.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete investor');
    }

    router.push('/investors');
    router.refresh();
  };

  if (isEditing) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(false)}
          className="-ml-2 mb-4 w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Investor
        </Button>
        <InvestorForm
          existingInvestor={investor}
          onSuccess={() => {
            setIsEditing(false);
            router.refresh();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <DetailHeader
        title={investor.name}
        description="Investor profile"
        backLabel="Back to Investors"
        onBack={() => router.push('/investors')}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleteTitle="Delete Investor"
        deleteDescription={`Are you sure you want to delete ${investor.name}? This action cannot be undone.`}
        canDelete={canDelete}
        deleteWarning={`Cannot delete this investor because they have ${investor.loanInvestors.length} loan(s), ${investor.transactions.length} transaction(s), and ${debtCount} borrowing(s).`}
        showPriceToggle={false}
      />

      <ContactInfoCard
        name={investor.name}
        email={investor.email}
        contactNumber={investor.contactNumber}
        address={investor.address}
      />
    </div>
  );
}
