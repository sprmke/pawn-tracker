'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CompletedLoansCard } from './completed-loans-card';
import { PastDueLoansCard } from './past-due-loans-card';
import { PendingDisbursementsCard } from './pending-disbursements-card';
import { MaturingLoansCard } from './maturing-loans-card';
import { LoanDetailModal } from '@/components/loans/loan-detail-modal';
import type { LoanWithInvestors, LoanType, LoanStatus } from '@/lib/types';

interface PendingDisbursement {
  id: number;
  loanId: number;
  loanName: string;
  loanType: LoanType;
  investorName: string;
  amount: string;
  sentDate: Date;
}

interface DashboardActivityCardsProps {
  completedLoans: LoanWithInvestors[];
  overdueLoans: LoanWithInvestors[];
  pendingDisbursements: PendingDisbursement[];
  upcomingPaymentsDue: LoanWithInvestors[];
}

export function DashboardActivityCards({
  completedLoans,
  overdueLoans,
  pendingDisbursements,
  upcomingPaymentsDue,
}: DashboardActivityCardsProps) {
  const router = useRouter();
  const [selectedLoan, setSelectedLoan] = useState<LoanWithInvestors | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingLoan, setIsLoadingLoan] = useState(false);

  // Handle direct loan click (when we have the full loan data)
  const handleLoanClick = useCallback((loan: LoanWithInvestors) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  }, []);

  // Handle disbursement click (when we only have loanId)
  const handleDisbursementClick = useCallback(async (loanId: number) => {
    setIsLoadingLoan(true);
    try {
      const response = await fetch(`/api/loans/${loanId}`);
      if (!response.ok) throw new Error('Failed to fetch loan');
      const loan = await response.json();
      setSelectedLoan(loan);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching loan:', error);
    } finally {
      setIsLoadingLoan(false);
    }
  }, []);

  // Handle type filter click - navigate to loans page with filters
  const handleTypeFilterClick = useCallback(
    (type: LoanType, status: LoanStatus | LoanStatus[]) => {
      const params = new URLSearchParams();
      params.set('view', 'table');
      params.set('type', type);
      if (Array.isArray(status)) {
        status.forEach((s) => params.append('status', s));
      } else {
        params.set('status', status);
      }
      router.push(`/loans?${params.toString()}`);
    },
    [router],
  );

  // Handle view all click - navigate to loans page with status filter only (no type filter)
  const handleViewAllClick = useCallback(
    (status: LoanStatus | LoanStatus[]) => {
      const params = new URLSearchParams();
      params.set('view', 'table');
      if (Array.isArray(status)) {
        status.forEach((s) => params.append('status', s));
      } else {
        params.set('status', status);
      }
      router.push(`/loans?${params.toString()}`);
    },
    [router],
  );

  // Refresh data when loan is updated
  const handleUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <MaturingLoansCard
          loans={upcomingPaymentsDue}
          onLoanClick={handleLoanClick}
          onTypeFilterClick={(type) =>
            handleTypeFilterClick(type, ['Fully Funded', 'Partially Funded'])
          }
          onViewAllClick={() =>
            handleViewAllClick(['Fully Funded', 'Partially Funded'])
          }
        />
        <PastDueLoansCard
          loans={overdueLoans}
          onLoanClick={handleLoanClick}
          onTypeFilterClick={(type) => handleTypeFilterClick(type, 'Overdue')}
          onViewAllClick={() => handleViewAllClick('Overdue')}
        />
        <PendingDisbursementsCard
          disbursements={pendingDisbursements}
          onDisbursementClick={handleDisbursementClick}
          onTypeFilterClick={(type) =>
            handleTypeFilterClick(type, ['Fully Funded', 'Partially Funded'])
          }
          onViewAllClick={() =>
            handleViewAllClick(['Fully Funded', 'Partially Funded'])
          }
        />
        <CompletedLoansCard
          loans={completedLoans}
          onLoanClick={handleLoanClick}
          onTypeFilterClick={(type) => handleTypeFilterClick(type, 'Completed')}
          onViewAllClick={() => handleViewAllClick('Completed')}
        />
      </div>

      <LoanDetailModal
        loan={selectedLoan}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onUpdate={handleUpdate}
      />
    </>
  );
}
