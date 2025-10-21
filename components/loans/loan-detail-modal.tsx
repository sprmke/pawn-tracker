'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { LoanWithInvestors } from '@/lib/types';
import { LoanDetailContent } from './loan-detail-content';
import Link from 'next/link';

interface LoanDetailModalProps {
  loan: LoanWithInvestors | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoanDetailModal({
  loan,
  open,
  onOpenChange,
}: LoanDetailModalProps) {
  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl font-bold">
              {loan.loanName}
            </DialogTitle>
            <Link href={`/loans/${loan.id}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Full Page
              </Button>
            </Link>
          </div>
        </DialogHeader>

        <div className="mt-4">
          <LoanDetailContent loan={loan} showHeader={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
