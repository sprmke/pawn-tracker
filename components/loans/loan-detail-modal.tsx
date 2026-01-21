'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { LoanWithInvestors, Investor } from '@/lib/types';
import { LoanDetailContent } from './loan-detail-content';
import { LoanForm } from './loan-form';
import { DetailModalHeader } from '@/components/common';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLoanDuplicateStore, createDuplicateDataFromLoan } from '@/stores/loan-duplicate-store';

interface LoanDetailModalProps {
  loan: LoanWithInvestors | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function LoanDetailModal({
  loan: initialLoan,
  open,
  onOpenChange,
  onUpdate,
}: LoanDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = useState(false);
  const [loan, setLoan] = useState<LoanWithInvestors | null>(initialLoan);

  // Store for duplicate functionality
  const openCreateModal = useLoanDuplicateStore((state) => state.openCreateModal);

  // Update local loan state when prop changes
  useEffect(() => {
    setLoan(initialLoan);
  }, [initialLoan]);

  // Fetch fresh loan data
  const fetchLoan = async () => {
    if (!loan?.id) return;

    try {
      const response = await fetch(`/api/loans/${loan.id}`);
      if (!response.ok) throw new Error('Failed to fetch loan');
      const data = await response.json();
      setLoan(data);
      onUpdate?.(); // Notify parent to refresh as well
    } catch (error) {
      console.error('Error fetching loan:', error);
    }
  };

  useEffect(() => {
    // Only fetch when entering edit mode AND modal is open
    if (open && isEditing) {
      fetchInvestors();
    }
  }, [isEditing]);

  useEffect(() => {
    // Reset editing state when modal closes
    if (!open) {
      setIsEditing(false);
    }
  }, [open]);

  const fetchInvestors = async () => {
    try {
      const response = await fetch('/api/investors');
      const data = await response.json();
      setInvestors(data);
    } catch (error) {
      console.error('Error fetching investors:', error);
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  if (!loan) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete loan');

      setShowDeleteDialog(false);
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting loan:', error);
      toast.error('Failed to delete loan');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const response = await fetch(`/api/loans/${loan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loanData: {
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

      setShowCompleteDialog(false);
      await fetchLoan(); // Refetch loan data
    } catch (error) {
      console.error('Error completing loan:', error);
      toast.error('Failed to complete loan');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSuccess = async () => {
    setIsEditing(false);
    await fetchLoan(); // Refetch loan data
  };

  const handlePayBalance = () => {
    const investorsSection = document.getElementById('investors-section');
    if (investorsSection) {
      investorsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDuplicate = () => {
    // Create duplicate data and store it
    const duplicateData = createDuplicateDataFromLoan(loan);
    
    // Close this modal first
    onOpenChange(false);
    
    // Then open the create modal via store (with a small delay for smoother transition)
    setTimeout(() => {
      openCreateModal(duplicateData);
    }, 150);
  };

  const isOverdue = loan.status === 'Overdue';
  const isPartiallyFunded = loan.status === 'Partially Funded';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          hideClose
        >
          {isEditing ? (
            <VisuallyHidden>
              <DialogTitle>Edit Loan - {loan.loanName}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <DialogHeader>
              <div className="flex md:flex-row flex-col items-start justify-between gap-3 md:gap-4">
                <DialogTitle className="text-lg md:text-xl font-semibold line-clamp-2 md:line-clamp-none">
                  {loan.loanName}
                </DialogTitle>
                <DetailModalHeader
                  onEdit={() => {
                    setIsLoadingInvestors(true);
                    setIsEditing(true);
                  }}
                  onDelete={() => setShowDeleteDialog(true)}
                  onClose={() => onOpenChange(false)}
                  onPayBalance={handlePayBalance}
                  showPayBalance={isPartiallyFunded}
                  onComplete={() => setShowCompleteDialog(true)}
                  showComplete={isOverdue}
                  onDuplicate={handleDuplicate}
                  showDuplicate={true}
                />
              </div>
            </DialogHeader>
          )}

          <div className={isEditing ? '' : 'mt-4'}>
            {isEditing ? (
              <LoanForm
                key={`loan-form-edit-${investors.length}`}
                investors={investors}
                existingLoan={loan}
                onSuccess={handleSuccess}
                onCancel={() => setIsEditing(false)}
                isLoadingInvestors={isLoadingInvestors}
              />
            ) : (
              <LoanDetailContent
                loan={loan}
                showHeader={false}
                onRefresh={fetchLoan}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent showClose>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan? This action cannot be
              undone and will remove all associated investor allocations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
      >
        <AlertDialogContent showClose>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this loan as completed? This will
              change the loan status to &apos;Completed&apos;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? 'Completing...' : 'Yes, Complete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
