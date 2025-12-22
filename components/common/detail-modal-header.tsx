'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2, CheckCircle, Wallet, Eye, X } from 'lucide-react';

interface DetailModalHeaderProps {
  onEdit: () => void;
  onDelete: () => void;
  onClose?: () => void;
  canEdit?: boolean;
  editDisabledReason?: string;
  onComplete?: () => void;
  showComplete?: boolean;
  onPayBalance?: () => void;
  showPayBalance?: boolean;
  onViewLoan?: () => void;
  showViewLoan?: boolean;
}

export function DetailModalHeader({
  onEdit,
  onDelete,
  onClose,
  canEdit = true,
  editDisabledReason,
  onComplete,
  showComplete = false,
  onPayBalance,
  showPayBalance = false,
  onViewLoan,
  showViewLoan = false,
}: DetailModalHeaderProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {canEdit && (
        <Button variant="outline" size="sm" onClick={onEdit} className="flex-shrink-0">
          <Pencil className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Edit</span>
        </Button>
      )}
      {showPayBalance && onPayBalance && (
        <Button
          variant="default"
          size="sm"
          onClick={onPayBalance}
          className="bg-yellow-500 hover:bg-yellow-600 flex-shrink-0"
        >
          <Wallet className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Pay Balance</span>
        </Button>
      )}
      {showComplete && onComplete && (
        <Button
          variant="default"
          size="sm"
          onClick={onComplete}
          className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
        >
          <CheckCircle className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Complete</span>
        </Button>
      )}
      {showViewLoan && onViewLoan && (
        <Button variant="outline" size="sm" onClick={onViewLoan} className="flex-shrink-0">
          <Eye className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">View Loan</span>
        </Button>
      )}
      <Button variant="destructive" size="sm" onClick={onDelete} className="flex-shrink-0">
        <Trash2 className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Delete</span>
      </Button>
      {onClose && (
        <Button variant="outline" size="sm" onClick={onClose} className="flex-shrink-0">
          <X className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Close</span>
        </Button>
      )}
    </div>
  );
}
