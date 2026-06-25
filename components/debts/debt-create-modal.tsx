'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { DebtForm } from './debt-form';
import { Investor } from '@/lib/types';
import { InlineLoader } from '@/components/common';

interface DebtCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedInvestorId?: number;
}

export function DebtCreateModal({
  open,
  onOpenChange,
  onSuccess,
  preselectedInvestorId,
}: DebtCreateModalProps) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchInvestors();
    }
  }, [open]);

  const fetchInvestors = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/investors?simple=true');
      const data = await response.json();
      setInvestors(data);
    } catch (error) {
      console.error('Error fetching investors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = () => {
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        hideClose
      >
        <VisuallyHidden>
          <DialogTitle>Create Borrowing</DialogTitle>
        </VisuallyHidden>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <InlineLoader size="lg" />
          </div>
        ) : (
          <DebtForm
            investors={investors}
            preselectedInvestorId={preselectedInvestorId}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
