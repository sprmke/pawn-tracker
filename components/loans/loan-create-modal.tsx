'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { LoanForm } from './loan-form';
import { useLoanDuplicateStore, DuplicateLoanData } from '@/stores/loan-duplicate-store';

interface LoanCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  duplicateData?: DuplicateLoanData;
  preselectedInvestorId?: number;
}

export function LoanCreateModal({
  open,
  onOpenChange,
  onSuccess,
  duplicateData: propDuplicateData,
  preselectedInvestorId,
}: LoanCreateModalProps) {
  // Get duplicate data from store if not provided via props
  const storeDuplicateData = useLoanDuplicateStore((state) => state.duplicateData);
  const clearDuplicateData = useLoanDuplicateStore((state) => state.clearDuplicateData);
  
  const duplicateData = propDuplicateData || storeDuplicateData;

  // Clear duplicate data when modal closes
  useEffect(() => {
    if (!open) {
      clearDuplicateData();
    }
  }, [open, clearDuplicateData]);

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        hideClose
      >
        <VisuallyHidden>
          <DialogTitle>
            {duplicateData ? 'Duplicate Loan' : 'Create New Loan'}
          </DialogTitle>
        </VisuallyHidden>

        <LoanForm
          key={`loan-form-create-${duplicateData ? 'dup' : 'new'}`}
          duplicateData={duplicateData || undefined}
          preselectedInvestorId={preselectedInvestorId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
