'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useRegisterDialogFormState,
} from '@/components/ui/dialog';
import { DebtWithInvestorAndPeriods } from '@/lib/types';
import { DetailModalHeader } from '@/components/common';
import { InlineLoader } from '@/components/common';
import { formatCurrency, formatDateShort, formatText } from '@/lib/format';
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
import { Badge } from '@/components/ui/badge';
import { DebtSummaryPreview } from './debt-summary-preview';

interface DebtDetailModalProps {
  debt: DebtWithInvestorAndPeriods | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function DebtDetailModal({
  debt: initialDebt,
  open,
  onOpenChange,
  onUpdate,
}: DebtDetailModalProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [debt, setDebt] = useState<DebtWithInvestorAndPeriods | null>(
    initialDebt,
  );
  const [isLoading, setIsLoading] = useState(false);

  const fetchDebt = useCallback(async (debtId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/debts/${debtId}`);
      if (!response.ok) throw new Error('Failed to fetch borrowing');
      const data = await response.json();
      setDebt(data);
    } catch (error) {
      console.error('Error fetching debt:', error);
      toast.error('Failed to load borrowing details');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && initialDebt?.id) {
      fetchDebt(initialDebt.id);
    } else if (!open) {
      setDebt(initialDebt);
    }
  }, [open, initialDebt, fetchDebt]);

  useRegisterDialogFormState(false, isDeleting);

  const handlePaymentsChange = () => {
    if (debt?.id) {
      fetchDebt(debt.id);
    }
    onUpdate?.();
  };

  const handleDelete = async () => {
    if (!debt?.id) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/debts/${debt.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Borrowing deleted successfully');
      setShowDeleteDialog(false);
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error('Failed to delete borrowing');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!debt) return null;

  const fees = debt.additionalFees ?? [];
  const debtDate =
    debt.date instanceof Date
      ? debt.date.toISOString().split('T')[0]
      : String(debt.date).split('T')[0];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto" hideClose>
          <DialogHeader>
            <div className="flex md:flex-row flex-col items-start justify-between gap-3 md:gap-4">
              <div>
                <DialogTitle className="text-lg md:text-xl font-semibold line-clamp-2">
                  {formatText(debt.name)}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatText(debt.investor.name)}
                </p>
              </div>
              <DetailModalHeader
                onEdit={() => {
                  onOpenChange(false);
                  router.push(`/debts/${debt.id}?edit=1`);
                }}
                onDelete={() => setShowDeleteDialog(true)}
                onClose={() => onOpenChange(false)}
              />
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <InlineLoader size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Principal</p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(debt.amount)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                  <p className="text-sm font-semibold">
                    {formatDateShort(debt.date)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">
                    Interest Rate
                  </p>
                  <p className="text-sm font-semibold">{debt.interestRate}%</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Period</p>
                  <Badge variant="secondary">{debt.interestInterval}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Duration</p>
                  <p className="text-sm font-semibold">
                    {debt.durationMonths} months
                  </p>
                </div>
              </div>

              {fees.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Additional Fees
                  </p>
                  {fees.map((fee, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-sm p-2 border rounded"
                    >
                      <span>{fee.label}</span>
                      <span className="font-medium">
                        {formatCurrency(fee.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {debt.notes && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Notes
                  </p>
                  <p className="text-sm text-muted-foreground">{debt.notes}</p>
                </div>
              )}

              <DebtSummaryPreview
                principal={debt.amount}
                interestRate={debt.interestRate}
                interestInterval={debt.interestInterval}
                debtDate={debtDate}
                durationMonths={debt.durationMonths}
                additionalFees={fees}
                interestPeriods={debt.interestPeriods}
                onPaymentsChange={handlePaymentsChange}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete borrowing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{formatText(debt.name)}&quot;.
              This action cannot be undone.
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
    </>
  );
}
