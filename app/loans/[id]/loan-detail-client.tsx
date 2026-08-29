'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { LoanWithInvestors, Investor } from '@/lib/types';
import { LoanForm } from '@/components/loans/loan-form';
import { LoanDetailContent } from '@/components/loans/loan-detail-content';
import { LoanSigningSection } from '@/components/loans/loan-signing-section';
import { DetailHeader } from '@/components/common';
import { useSensitiveDataHidden } from '@/hooks';
import { createDuplicateDataFromLoan } from '@/stores/loan-duplicate-store';
import { downloadLoanContract } from '@/components/loans/download-loan-contract';
import {
  LoanQuickPaymentDialog,
  type LoanQuickPaymentKind,
} from '@/components/loans/loan-quick-payment-dialog';

interface LoanDetailClientProps {
  loan: LoanWithInvestors;
  investors: Investor[];
}

export function LoanDetailClient({ loan, investors }: LoanDetailClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightSigning = searchParams.get('signing') === '1';
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloadingContract, setIsDownloadingContract] = useState(false);
  const [quickPaymentKind, setQuickPaymentKind] =
    useState<LoanQuickPaymentKind | null>(null);
  useSensitiveDataHidden();

  useEffect(() => {
    if (!highlightSigning) return;
    const section = document.getElementById('contract-signing-section');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [highlightSigning]);

  const handlePayBalance = () => {
    const investorsSection = document.getElementById('investors-section');
    if (investorsSection) {
      investorsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDuplicate = () => {
    // Create duplicate data using the shared helper
    const duplicateData = createDuplicateDataFromLoan(loan);

    // For page view, navigate to the create page with encoded data
    const encodedData = btoa(JSON.stringify(duplicateData));
    router.push(`/loans/new?duplicate=${encodedData}`);
  };

  const handleDownloadContract = async () => {
    setIsDownloadingContract(true);
    try {
      await downloadLoanContract(loan);
    } finally {
      setIsDownloadingContract(false);
    }
  };

  const handleDelete = async () => {
    const response = await fetch(`/api/loans/${loan.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete loan');

    router.push('/loans');
    router.refresh();
  };

  const handleComplete = async () => {
    const response = await fetch(`/api/loans/${loan.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        loanData: {
          borrowerId: loan.borrowerId,
          loanName: loan.loanName,
          type: loan.type,
          status: 'Completed',
          dueDate: loan.dueDate,
          freeLotSqm: loan.freeLotSqm,
          notes: loan.notes,
        },
        investorData: loan.loanInvestors.map((li) => ({
          investorId: li.investorId,
          amount: li.amount,
          interestRate: li.interestRate,
          sentDate: li.sentDate,
        })),
      }),
    });

    if (!response.ok) throw new Error('Failed to complete loan');

    router.refresh();
  };

  const isOverdue = loan.status === 'Overdue';
  const isPartiallyFunded = loan.status === 'Partially Funded';

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/loans')}
          className="-ml-2 w-fit mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Loans
        </Button>
        <LoanForm
          investors={investors}
          existingLoan={loan}
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
    <div className="max-w-4xl mx-auto space-y-6">
      <DetailHeader
        title={loan.loanName}
        description="View and manage loan details"
        backLabel="Back to Loans"
        onBack={() => router.push('/loans')}
        onEdit={() => setIsEditing(true)}
        onDelete={handleDelete}
        deleteTitle="Delete Loan"
        deleteDescription="Are you sure you want to delete this loan? This action cannot be undone and will remove all associated investor allocations."
        showPayBalance={isPartiallyFunded}
        onPayBalance={handlePayBalance}
        showComplete={isOverdue}
        onComplete={handleComplete}
        completeTitle="Complete Loan"
        completeDescription="Are you sure you want to mark this loan as completed? This will change the loan status to 'Completed'."
        showDuplicate={true}
        onDuplicate={handleDuplicate}
        showDownloadContract={true}
        onDownloadContract={handleDownloadContract}
        isDownloadingContract={isDownloadingContract}
        onAddPayment={() => setQuickPaymentKind('payment')}
        onAddReceivedPayment={() => setQuickPaymentKind('received')}
      />

      <LoanSigningSection loanId={loan.id} highlight={highlightSigning} />

      <LoanDetailContent
        loan={loan}
        showHeader={false}
        onRefresh={() => router.refresh()}
      />

      <LoanQuickPaymentDialog
        loan={loan}
        kind={quickPaymentKind}
        open={quickPaymentKind !== null}
        onOpenChange={(open) => {
          if (!open) setQuickPaymentKind(null);
        }}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
