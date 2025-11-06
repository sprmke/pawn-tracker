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

interface LoanDetailModalProps {
  loan: LoanWithInvestors | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function LoanDetailModal({
  loan,
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

  useEffect(() => {
    if (open && isEditing) {
      fetchInvestors();
    }
    // Reset editing state when modal closes
    if (!open) {
      setIsEditing(false);
    }
  }, [open, isEditing]);

  const fetchInvestors = async () => {
    try {
      const response = await fetch('/api/investors');
      const data = await response.json();
      setInvestors(data);
    } catch (error) {
      console.error('Error fetching investors:', error);
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
      onUpdate?.();
    } catch (error) {
      console.error('Error completing loan:', error);
      toast.error('Failed to complete loan');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSuccess = () => {
    setIsEditing(false);
    onUpdate?.();
  };

  const handlePayBalance = () => {
    const investorsSection = document.getElementById('investors-section');
    if (investorsSection) {
      investorsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-2xl font-bold">
                  {loan.loanName}
                </DialogTitle>
                <DetailModalHeader
                  onEdit={() => setIsEditing(true)}
                  onDelete={() => setShowDeleteDialog(true)}
                  onPayBalance={handlePayBalance}
                  showPayBalance={isPartiallyFunded}
                  onComplete={() => setShowCompleteDialog(true)}
                  showComplete={isOverdue}
                />
              </div>
            </DialogHeader>
          )}

          <div className={isEditing ? '' : 'mt-4'}>
            {isEditing ? (
              <LoanForm
                investors={investors}
                existingLoan={loan}
                onSuccess={handleSuccess}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <LoanDetailContent
                loan={loan}
                showHeader={false}
                onRefresh={onUpdate}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
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
        <AlertDialogContent>
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
