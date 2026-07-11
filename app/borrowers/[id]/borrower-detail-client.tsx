'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ContactInfoCard, DetailHeader } from '@/components/common';
import { BorrowerForm } from '@/components/borrowers/borrower-form';
import type { Borrower } from '@/lib/types';

interface BorrowerWithLoanCount extends Borrower {
  loans: Array<{ id: number }>;
}

interface BorrowerDetailClientProps {
  borrower: BorrowerWithLoanCount;
}

export function BorrowerDetailClient({ borrower }: BorrowerDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  const canDelete = borrower.loans.length === 0;

  const handleDelete = async () => {
    const response = await fetch(`/api/borrowers/${borrower.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete borrower');
    }

    router.back();
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
          Back to Borrower
        </Button>
        <BorrowerForm
          existingBorrower={borrower}
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
        title={borrower.name}
        description="Borrower profile"
        backLabel="Back"
        onBack={() => router.back()}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleteTitle="Delete Borrower"
        deleteDescription={`Are you sure you want to delete ${borrower.name}? This action cannot be undone.`}
        canDelete={canDelete}
        deleteWarning={`Cannot delete this borrower because they have ${borrower.loans.length} loan(s). Remove or reassign those loans first.`}
        showPriceToggle={false}
      />

      <ContactInfoCard
        name={borrower.name}
        email={borrower.email}
        contactNumber={borrower.contactNumber}
        address={borrower.address}
      />
    </div>
  );
}
